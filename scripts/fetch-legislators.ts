import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

const BASE =
  "https://raw.githubusercontent.com/unitedstates/congress-legislators/main";

async function fetchYAML<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const text = await res.text();
  return parse(text) as T;
}

interface LegislatorName {
  first: string;
  last: string;
  official_full?: string;
}

interface LegislatorTerm {
  type: "sen" | "rep";
  start: string;
  end: string;
  state: string;
  district?: number;
  party: string;
  url?: string;
  contact_form?: string;
  address?: string;
  phone?: string;
}

interface LegislatorId {
  bioguide: string;
  thomas?: string;
  govtrack?: number;
  votesmart?: number;
  fec?: string[];
  opensecrets?: string;
  ballotpedia?: string;
  wikipedia?: string;
}

interface RawLegislator {
  id: LegislatorId;
  name: LegislatorName;
  bio: { birthday: string; gender: string };
  terms: LegislatorTerm[];
}

interface SocialEntry {
  id: { bioguide: string };
  social: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    youtube_id?: string;
  };
}

interface CommitteeInfo {
  name: string;
  thomas_id: string;
  type: string;
}

interface DistrictOffice {
  id: { bioguide: string };
  offices?: Array<{
    city?: string;
    state?: string;
    address?: string;
    phone?: string;
    suite?: string;
    building?: string;
    zip?: string;
  }>;
}

async function main() {
  console.log("Fetching legislators data from GitHub (YAML)...");
  const [legislators, social, committeeMembership, committees, districtOffices] =
    await Promise.all([
      fetchYAML<RawLegislator[]>(`${BASE}/legislators-current.yaml`),
      fetchYAML<SocialEntry[]>(`${BASE}/legislators-social-media.yaml`),
      fetchYAML<Record<string, Array<{ bioguide: string; rank?: number }>>>(
        `${BASE}/committee-membership-current.yaml`
      ),
      fetchYAML<CommitteeInfo[]>(`${BASE}/committees-current.yaml`),
      fetchYAML<DistrictOffice[]>(`${BASE}/legislators-district-offices.yaml`),
    ]);

  console.log(`  ${legislators.length} legislators`);
  console.log(`  ${social.length} social media entries`);
  console.log(`  ${Object.keys(committeeMembership).length} committee entries`);
  console.log(`  ${districtOffices.length} district office entries`);

  // Build social media lookup by bioguide
  const socialMap = new Map<string, SocialEntry["social"]>();
  for (const entry of social) {
    socialMap.set(entry.id.bioguide, entry.social);
  }

  // Build committee name lookup
  const committeeNameMap = new Map<string, string>();
  for (const c of committees) {
    committeeNameMap.set(c.thomas_id, c.name);
  }

  // Build committee membership by bioguide
  const memberCommittees = new Map<string, string[]>();
  for (const [committeeId, members] of Object.entries(committeeMembership)) {
    // Committee IDs like "SSAP" or "HSAG" — get parent for subcommittees like "SSAP01"
    const parentId = committeeId.length <= 4 ? committeeId : committeeId.slice(0, 4);
    const name = committeeNameMap.get(parentId);
    if (!name) continue;

    for (const member of members) {
      const existing = memberCommittees.get(member.bioguide) || [];
      if (!existing.includes(name)) {
        existing.push(name);
        memberCommittees.set(member.bioguide, existing);
      }
    }
  }

  // Build district offices lookup by bioguide
  const officesMap = new Map<string, DistrictOffice["offices"]>();
  for (const entry of districtOffices) {
    if (entry.offices) {
      officesMap.set(entry.id.bioguide, entry.offices);
    }
  }

  // State abbreviation to full name
  const stateNames: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
    CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
    FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
    IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
    MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
    VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
    WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
    AS: "American Samoa", GU: "Guam", MP: "Northern Mariana Islands",
    PR: "Puerto Rico", VI: "Virgin Islands",
  };

  // Transform legislators
  const merged = legislators.map((leg) => {
    const currentTerm = leg.terms[leg.terms.length - 1];
    const bioguideId = leg.id.bioguide;
    const s = socialMap.get(bioguideId);
    const comms = memberCommittees.get(bioguideId) || [];
    const distOffices = officesMap.get(bioguideId) || [];

    const partyMap: Record<string, string> = {
      Democrat: "D",
      Republican: "R",
      Independent: "I",
    };

    const firstName = leg.name.first;
    const lastName = leg.name.last;
    const fullName = leg.name.official_full || `${firstName} ${lastName}`;
    const slug = fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Build offices array: DC office first, then district offices
    const offices = [];
    if (currentTerm.address || currentTerm.phone) {
      offices.push({
        label: "Washington, DC",
        street: currentTerm.address || "",
        city: "Washington",
        state: "DC",
        zip: "",
        phone: currentTerm.phone || "",
      });
    }
    for (const o of distOffices) {
      const street = [o.building, o.address, o.suite].filter(Boolean).join(", ");
      offices.push({
        label: `${o.city || ""}, ${o.state || ""}`.replace(/^, |, $/g, ""),
        street,
        city: o.city || "",
        state: o.state || "",
        zip: o.zip || "",
        phone: o.phone || "",
      });
    }

    return {
      bioguideId,
      slug,
      firstName,
      lastName,
      fullName,
      title: currentTerm.type === "sen" ? "Senator" : "Representative",
      chamber: currentTerm.type === "sen" ? "Senate" : "House",
      party: partyMap[currentTerm.party] || "I",
      state: stateNames[currentTerm.state] || currentTerm.state,
      stateAbbr: currentTerm.state,
      district: currentTerm.district?.toString(),
      inOffice: true,
      termEnd: currentTerm.end,
      website: currentTerm.url || "",
      contactForm: currentTerm.contact_form || "",
      offices,
      social: {
        twitter: s?.twitter || undefined,
        facebook: s?.facebook || undefined,
        instagram: s?.instagram || undefined,
        youtube: s?.youtube || undefined,
      },
      committees: comms,
      externalIds: {
        govtrack: leg.id.govtrack,
        votesmart: leg.id.votesmart,
        fec: leg.id.fec || [],
        opensecrets: leg.id.opensecrets || "",
        ballotpedia: leg.id.ballotpedia || "",
        wikipedia: leg.id.wikipedia || "",
      },
    };
  });

  // Write the merged file
  const outDir = join(__dirname, "..", "src", "data");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "congress-legislators.json"), JSON.stringify(merged, null, 2));

  console.log(`\nWrote ${merged.length} legislators to src/data/congress-legislators.json`);

  const senators = merged.filter((m) => m.chamber === "Senate").length;
  const reps = merged.filter((m) => m.chamber === "House").length;
  const dems = merged.filter((m) => m.party === "D").length;
  const repubs = merged.filter((m) => m.party === "R").length;
  const indeps = merged.filter((m) => m.party === "I").length;
  const withSocial = merged.filter((m) => m.social.twitter).length;
  const withOffices = merged.filter((m) => m.offices.length > 1).length;
  console.log(`  Senate: ${senators} | House: ${reps}`);
  console.log(`  D: ${dems} | R: ${repubs} | I: ${indeps}`);
  console.log(`  ${withSocial} have Twitter | ${withOffices} have district offices`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
