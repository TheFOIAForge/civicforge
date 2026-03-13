import type { Representative, InterestGroupRating } from "@/data/types";
import { cache, TTL } from "./cache";
import {
  transformAllLegislators,
  type RawLegislatorEntry,
} from "./transformers/github-legislators";

import { transformFinancials, type FECFinanceResult, type IndependentExpenditure } from "./transformers/openfec";
import { getVotingStats } from "./voteview";
import { getLobbyingForMember } from "./lda";
import { getDarkMoneyConnections } from "./propublica-nonprofits";
import { getHearingsForMember } from "./congress-hearings";
import { getDistrictSpendingForMember } from "./usaspending";
import congressLegislatorsData from "@/data/congress-legislators.json";
import interestGroupRatingsData from "@/data/interest-group-ratings.json";

// Cast the imported JSON to our expected type
const rawLegislators = congressLegislatorsData as unknown as RawLegislatorEntry[];

// Pre-transform all legislators at module load (static data, fast)
let allMembers: Representative[] | null = null;

function getAll(): Representative[] {
  if (allMembers) return allMembers;
  allMembers = transformAllLegislators(rawLegislators);
  return allMembers;
}

// ── Public API ──────────────────────────────────────────────────────────

export function getAllMembers(): Representative[] {
  return getAll();
}

export function getMemberBySlug(slug: string): Representative | undefined {
  return getAll().find((m) => m.slug === slug);
}

export function getMemberById(bioguideId: string): Representative | undefined {
  return getAll().find((m) => m.id === bioguideId);
}

export function getLeadershipMembers(): Representative[] {
  return getAll().filter((m) => m.isLeadership);
}

export function getFeaturedMembers(): Representative[] {
  return getAll().filter((m) => m.featured);
}

export function searchMembers(
  query: string,
  filters?: { state?: string; chamber?: string; party?: string }
): Representative[] {
  let results = getAll();

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q) ||
        m.stateAbbr.toLowerCase() === q
    );
  }

  if (filters?.state) {
    results = results.filter((m) => m.stateAbbr === filters.state);
  }
  if (filters?.chamber) {
    results = results.filter((m) => m.chamber === filters.chamber);
  }
  if (filters?.party) {
    results = results.filter((m) => m.party === filters.party);
  }

  return results;
}

// ── FIPS state code → state abbreviation mapping ────────────────────────

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "60": "AS", "66": "GU", "69": "MP", "72": "PR",
  "78": "VI",
};

// ── Census Geocoder: address → state + congressional district ────────

export async function lookupByAddress(address: string): Promise<Representative[]> {
  const cacheKey = `lookup:${address}`;
  const cached = cache.get<Representative[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Census Geocoder error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const matches = data?.result?.addressMatches;
    if (!matches || matches.length === 0) return [];

    const match = matches[0];
    const geos = match.geographies || {};

    // Find the congressional district info
    let stateFips = "";
    let districtNum = "";
    for (const key of Object.keys(geos)) {
      if (key.includes("Congressional")) {
        const cdInfo = geos[key]?.[0];
        if (cdInfo) {
          stateFips = cdInfo.STATE || "";
          // CD field is named CD119, CD118, etc. — find the right one
          for (const k of Object.keys(cdInfo)) {
            if (k.startsWith("CD") && k !== "CDSESSN") {
              districtNum = cdInfo[k];
              break;
            }
          }
        }
        break;
      }
    }

    const stateAbbr = FIPS_TO_STATE[stateFips];
    if (!stateAbbr) return [];

    const members = getAll();
    const matched: Representative[] = [];

    // Find senators for this state
    const senators = members.filter(
      (m) => m.stateAbbr === stateAbbr && m.chamber === "Senate"
    );
    matched.push(...senators);

    // Find the House rep for this district
    if (districtNum) {
      const districtInt = parseInt(districtNum, 10);
      // At-large districts use 00 or 98
      const isAtLarge = districtInt === 0 || districtInt === 98;

      const rep = members.find((m) => {
        if (m.stateAbbr !== stateAbbr || m.chamber !== "House") return false;
        if (isAtLarge) {
          // At-large: match any House member from this state (there's only one)
          return true;
        }
        // Match by district number in the district field
        const mDistrict = m.district?.replace(/\D/g, "");
        return mDistrict === String(districtInt);
      });
      if (rep) matched.push(rep);
    }

    cache.set(cacheKey, matched, TTL.ADDRESS_LOOKUP);
    return matched;
  } catch (err) {
    console.error("Address lookup error:", err);
    return [];
  }
}

// ── Congress.gov API: member detail enrichment ──────────────────────────

// Build a congress.gov bill URL from type, congress number, and bill number
function buildBillUrl(type: string, congress: number, number: string | number): string {
  const typeMap: Record<string, string> = {
    HR: "house-bill", S: "senate-bill",
    HRES: "house-resolution", SRES: "senate-resolution",
    HJRES: "house-joint-resolution", SJRES: "senate-joint-resolution",
    HCONRES: "house-concurrent-resolution", SCONRES: "senate-concurrent-resolution",
  };
  const slug = typeMap[type.toUpperCase()] || "house-bill";
  const ordinal = congress === 1 ? "1st" : congress === 2 ? "2nd" : congress === 3 ? "3rd" : `${congress}th`;
  return `https://www.congress.gov/bill/${ordinal}-congress/${slug}/${number}`;
}

// Build a rich biography from Congress.gov structured data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildBio(member: any): string {
  if (!member?.directOrderName) return "";
  const parts: string[] = [];
  const party = member.partyHistory?.[0]?.partyName || "";
  const birthYear = member.birthYear ? `Born in ${member.birthYear}, ` : "";
  parts.push(`${birthYear}${member.directOrderName} is a ${party} member of Congress representing ${member.state || ""}.`);

  const terms = member.terms || [];
  if (terms.length > 0) {
    const firstTerm = terms[0];
    const chamberName = firstTerm.chamber === "Senate" ? "the Senate" : "the House of Representatives";
    const startYear = firstTerm.startYear || 0;
    const yearsServing = new Date().getFullYear() - startYear;
    if (startYear) {
      parts.push(`First elected in ${startYear}, they have served in ${chamberName} for ${yearsServing} years across ${terms.length} terms.`);
    }
  }

  const leadership = member.leadership || [];
  if (leadership.length > 0) {
    const roles = [...new Set(leadership.map((l: { type?: string }) => l.type).filter(Boolean))];
    if (roles.length > 0) {
      parts.push(`Leadership roles include: ${roles.join(", ")}.`);
    }
  }

  const cosponsoredCount = member.cosponsoredLegislation?.count;
  const sponsoredCount = member.sponsoredLegislation?.count;
  if (sponsoredCount || cosponsoredCount) {
    const sponsorPart = sponsoredCount ? `sponsored ${sponsoredCount} bills` : "";
    const cosponsorPart = cosponsoredCount ? `cosponsored ${cosponsoredCount}` : "";
    const combined = [sponsorPart, cosponsorPart].filter(Boolean).join(" and ");
    if (combined) parts.push(`They have ${combined} during their career in Congress.`);
  }

  return parts.join(" ");
}

export async function enrichMemberFromCongress(
  bioguideId: string
): Promise<Partial<Representative>> {
  const cacheKey = `congress:${bioguideId}`;
  const cached = cache.get<Partial<Representative>>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) return {};

  try {
    // Fetch member detail
    const memberRes = await fetch(
      `https://api.congress.gov/v3/member/${bioguideId}?api_key=${apiKey}&format=json`
    );
    if (!memberRes.ok) return {};
    const memberData = await memberRes.json();
    const member = memberData.member;

    // Fetch ALL sponsored legislation (paginate through all pages)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allBills: any[] = [];
    let offset = 0;
    const pageSize = 250;
    while (true) {
      const billsRes = await fetch(
        `https://api.congress.gov/v3/member/${bioguideId}/sponsored-legislation?api_key=${apiKey}&format=json&limit=${pageSize}&offset=${offset}`
      );
      if (!billsRes.ok) break;
      const billsData = await billsRes.json();
      const page = billsData.sponsoredLegislation || [];
      allBills.push(...page);
      if (page.length < pageSize) break; // last page
      offset += pageSize;
    }

    // Photo URL from depiction
    const photoUrl = member?.depiction?.imageUrl || undefined;

    // Rich biography from structured data
    const bio = buildBio(member);

    // Count bills that became law (scan all pages)
    const enactedCount = allBills.filter(
      (b: { latestAction?: { text?: string } | null }) => {
        const text = b.latestAction?.text?.toLowerCase() || "";
        return text.includes("became public law") || text.includes("signed by president");
      }
    ).length;

    const enrichment: Partial<Representative> = {
      photoUrl,
      bio,
      billsIntroduced: member?.sponsoredLegislation?.count || 0,
      billsEnacted: enactedCount,
      notableLegislation: allBills
        .filter((b: { title?: string; type?: string; number?: string | number }) => b.title && b.type && b.number)
        .slice(0, 10)
        .map((bill: { type?: string; number?: string | number; congress?: number; title?: string; introducedDate?: string; latestAction?: { text?: string } }) => ({
          title: (bill.title || "").slice(0, 150),
          billNumber: `${(bill.type || "").toUpperCase()} ${bill.number || ""}`,
          year: bill.introducedDate ? new Date(bill.introducedDate).getFullYear() : 0,
          role: "Sponsor" as const,
          description: bill.latestAction?.text || "",
          url: bill.congress && bill.type && bill.number
            ? buildBillUrl(bill.type, bill.congress, String(bill.number))
            : undefined,
        })),
    };

    cache.set(cacheKey, enrichment, TTL.MEMBER_DETAIL);
    return enrichment;
  } catch (err) {
    console.error(`Congress.gov API error for ${bioguideId}:`, err);
    return {};
  }
}

// ── OpenFEC API: campaign finance ───────────────────────────────────────

export async function getMemberFinance(bioguideId: string): Promise<FECFinanceResult> {
  const cacheKey = `fec:${bioguideId}`;
  const cached = cache.get<FECFinanceResult>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.OPENFEC_API_KEY;
  const emptyResult: FECFinanceResult = { cycles: [], totalFundraising: "$0", smallDollarPct: 0, topDonors: [], topIndustries: [], outsideSpending: [] };
  if (!apiKey) return emptyResult;

  // Find FEC candidate ID from our static data
  const raw = rawLegislators.find((l) => l.bioguideId === bioguideId);
  const fecIds = raw?.externalIds.fec || [];
  if (fecIds.length === 0) return emptyResult;

  // Use the most recent FEC ID (last in the array)
  const fecId = fecIds[fecIds.length - 1];

  try {
    // Fetch all cycle totals + independent expenditures (all cycles) + committee in parallel
    const [totalsRes, ieRes, committeesRes] = await Promise.all([
      fetch(`https://api.open.fec.gov/v1/candidate/${fecId}/totals/?api_key=${apiKey}&sort=-cycle&per_page=10`),
      fetch(`https://api.open.fec.gov/v1/schedules/schedule_e/by_candidate/?api_key=${apiKey}&candidate_id=${fecId}&per_page=50&sort=-total`),
      fetch(`https://api.open.fec.gov/v1/candidate/${fecId}/committees/?api_key=${apiKey}&designation=P&per_page=1`),
    ]);

    const totalsData = totalsRes.ok ? await totalsRes.json() : { results: [] };
    const allCycleTotals = totalsData.results || [];

    // Parse independent expenditures (Super PAC spending for/against this candidate, all cycles)
    let ieData: IndependentExpenditure[] = [];
    if (ieRes.ok) {
      const ieJson = await ieRes.json();
      ieData = (ieJson.results || []).map((r: { committee_name: string; total: number; support_oppose_indicator: string; cycle: number }) => ({
        committee_name: r.committee_name || "Unknown",
        total: r.total || 0,
        support_oppose_indicator: r.support_oppose_indicator as "S" | "O",
        cycle: r.cycle || 0,
      }));
    }

    // Find the principal committee ID for employer/occupation data
    let employerData: Array<{ name: string; total: number }> = [];
    let occupationData: Array<{ name: string; total: number }> = [];
    if (committeesRes.ok) {
      const committeesData = await committeesRes.json();
      const committeeId = committeesData.results?.[0]?.committee_id;
      if (committeeId) {
        const [empRes, occRes] = await Promise.all([
          fetch(`https://api.open.fec.gov/v1/schedules/schedule_a/by_employer/?api_key=${apiKey}&committee_id=${committeeId}&per_page=50&sort=-total`),
          fetch(`https://api.open.fec.gov/v1/schedules/schedule_a/by_occupation/?api_key=${apiKey}&committee_id=${committeeId}&per_page=50&sort=-total`),
        ]);
        if (empRes.ok) {
          const empData = await empRes.json();
          employerData = (empData.results || []).map((r: { employer: string; total: number }) => ({
            name: r.employer || "Unknown",
            total: r.total || 0,
          }));
        }
        if (occRes.ok) {
          const occData = await occRes.json();
          occupationData = (occData.results || []).map((r: { occupation: string; total: number }) => ({
            name: r.occupation || "Unknown",
            total: r.total || 0,
          }));
        }
      }
    }

    const result = transformFinancials(allCycleTotals, employerData, occupationData, ieData);
    cache.set(cacheKey, result, TTL.FINANCE);
    return result;
  } catch (err) {
    console.error(`OpenFEC API error for ${bioguideId}:`, err);
    return emptyResult;
  }
}

// ── LegiScan API: voting records ────────────────────────────────────────

export async function getMemberVotes(
  bioguideId: string
): Promise<{ votingRecord: Representative["votingRecord"]; keyVotes: Representative["keyVotes"]; partyLoyalty: number; votesCast: number; missedVotes: number }> {
  const cacheKey = `legiscan:${bioguideId}`;
  const cached = cache.get<ReturnType<typeof getMemberVotes> extends Promise<infer T> ? T : never>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.LEGISCAN_API_KEY;
  if (!apiKey) {
    return { votingRecord: [], keyVotes: [], partyLoyalty: 0, votesCast: 0, missedVotes: 0 };
  }

  try {
    // LegiScan uses its own people_id, we need to search by name
    const member = getMemberById(bioguideId);
    if (!member) {
      return { votingRecord: [], keyVotes: [], partyLoyalty: 0, votesCast: 0, missedVotes: 0 };
    }

    // Search for the person in LegiScan
    const searchRes = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getSearch&state=US&query=${encodeURIComponent(member.lastName)}`
    );
    if (!searchRes.ok) {
      return { votingRecord: [], keyVotes: [], partyLoyalty: 0, votesCast: 0, missedVotes: 0 };
    }

    // LegiScan's free tier is limited — return defaults for now
    // Full implementation would use getSponsoredList and getRollCall endpoints
    const result = {
      votingRecord: [],
      keyVotes: [],
      partyLoyalty: 0,
      votesCast: 0,
      missedVotes: 0,
    };

    cache.set(cacheKey, result, TTL.VOTES);
    return result;
  } catch (err) {
    console.error(`LegiScan API error for ${bioguideId}:`, err);
    return { votingRecord: [], keyVotes: [], partyLoyalty: 0, votesCast: 0, missedVotes: 0 };
  }
}

// ── Full enriched profile ───────────────────────────────────────────────

export async function getEnrichedMember(
  slugOrId: string
): Promise<Representative | null> {
  const base =
    getMemberBySlug(slugOrId) || getMemberById(slugOrId);
  if (!base) return null;

  // Extract bioguide ID from the bioguide URL (e.g. ".../P000197" → "P000197")
  const bioguideId = base.bioguide?.split("/").pop() || base.id;

  // Fetch enrichments in parallel (core + deep data)
  const [congressData, financeData, votingStats, lobbyData, darkMoneyData, hearingsData, spendingData] = await Promise.all([
    enrichMemberFromCongress(bioguideId),
    getMemberFinance(bioguideId),
    getVotingStats(bioguideId, base.chamber),
    getLobbyingForMember(bioguideId).catch(() => []),
    getDarkMoneyConnections(bioguideId).catch(() => []),
    getHearingsForMember(bioguideId).catch(() => []),
    getDistrictSpendingForMember(bioguideId).catch(() => null),
  ]);

  // Interest group ratings lookup
  const ratingsEntry = (interestGroupRatingsData as Record<string, { ratings: InterestGroupRating[] }>)[bioguideId];
  const interestGroupRatings = ratingsEntry?.ratings || [];

  return {
    ...base,
    // Congress.gov enrichment
    photoUrl: congressData.photoUrl || base.photoUrl,
    bio: congressData.bio || base.bio,
    billsIntroduced: congressData.billsIntroduced || base.billsIntroduced,
    billsEnacted: congressData.billsEnacted || base.billsEnacted,
    notableLegislation:
      congressData.notableLegislation?.length
        ? congressData.notableLegislation
        : base.notableLegislation,
    // OpenFEC enrichment
    financeCycles: financeData.cycles,
    totalFundraising: financeData.totalFundraising,
    smallDollarPct: financeData.smallDollarPct,
    topDonors: financeData.topDonors,
    topIndustries: financeData.topIndustries,
    outsideSpending: financeData.outsideSpending,
    // Voteview enrichment
    partyLoyalty: votingStats.partyLoyalty || base.partyLoyalty,
    votesCast: votingStats.votesCast || base.votesCast,
    missedVotes: votingStats.missedVotes || base.missedVotes,
    // Deep data enrichment
    lobbyingFilings: lobbyData,
    darkMoneyConnections: darkMoneyData,
    committeeHearings: hearingsData,
    districtSpending: spendingData || undefined,
    // Interest group ratings
    interestGroupRatings: interestGroupRatings.length > 0 ? interestGroupRatings : base.interestGroupRatings,
  };
}
