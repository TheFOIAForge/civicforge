import type { Representative } from "@/data/types";

export interface RawLegislatorEntry {
  bioguideId: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: "Senator" | "Representative";
  chamber: "Senate" | "House";
  party: "D" | "R" | "I";
  state: string;
  stateAbbr: string;
  district?: string;
  inOffice: boolean;
  termEnd: string;
  website: string;
  contactForm: string;
  offices: Array<{
    label: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  }>;
  social: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  committees: string[];
  externalIds: {
    govtrack?: number;
    votesmart?: number;
    fec: string[];
    opensecrets: string;
    ballotpedia: string;
    wikipedia: string;
  };
}

// Known congressional leadership — update when leadership changes
const LEADERSHIP: Record<string, string> = {
  J000299: "Speaker of the House",       // Mike Johnson
  T000250: "Senate Majority Leader",      // John Thune
  S000148: "Senate Minority Leader",      // Chuck Schumer
  J000294: "House Minority Leader",       // Hakeem Jeffries
};

const FEATURED_IDS = new Set([
  "S000033", // Bernie Sanders
  "W000817", // Elizabeth Warren
  "C001098", // Ted Cruz
  "O000172", // AOC
  "J000289", // Jim Jordan
  "M000355", // Mitch McConnell
  "P000197", // Nancy Pelosi
  "F000479", // John Fetterman
  "M001153", // Lisa Murkowski
  "C001130", // Jasmine Crockett
  "W000790", // Raphael Warnock
  "L000583", // Barry Loudermilk
]);

export function transformLegislator(raw: RawLegislatorEntry): Representative {
  const bioId = raw.bioguideId;
  const govtrackId = raw.externalIds.govtrack;

  return {
    id: bioId,
    slug: raw.slug,
    firstName: raw.firstName,
    lastName: raw.lastName,
    fullName: raw.fullName,
    title: raw.title,
    chamber: raw.chamber,
    party: raw.party as "D" | "R" | "I",
    state: raw.state,
    stateAbbr: raw.stateAbbr,
    district: raw.district === "0" ? "At-Large" : raw.district,
    inOffice: raw.inOffice,

    leadershipRole: LEADERSHIP[bioId],
    committees: raw.committees,
    photoUrl: `https://www.congress.gov/img/member/${bioId.toLowerCase()}_200.jpg`,

    offices: raw.offices,
    email: undefined,
    contactForm: raw.contactForm || undefined,
    website: raw.website,
    social: raw.social,
    staff: [],

    // Stats — defaults, enriched later by LegiScan/Congress.gov
    partyLoyalty: 0,
    votesCast: 0,
    missedVotes: 0,
    billsIntroduced: 0,
    billsEnacted: 0,

    // Dossier — defaults, enriched later
    bio: "",
    notableLegislation: [],
    topDonors: [],
    topIndustries: [],
    outsideSpending: [],
    financeCycles: [],
    totalFundraising: "$0",
    smallDollarPct: 0,
    opensecrets: raw.externalIds.opensecrets
      ? `https://www.opensecrets.org/members-of-congress/summary?cid=${raw.externalIds.opensecrets}`
      : "",
    controversies: [],
    votingRecord: [],
    keyVotes: [],

    // External links
    bioguide: `https://bioguide.congress.gov/search/bio/${bioId}`,
    govtrack: govtrackId
      ? `https://www.govtrack.us/congress/members/${govtrackId}`
      : "",
    votesmart: raw.externalIds.votesmart
      ? `https://justfacts.votesmart.org/candidate/${raw.externalIds.votesmart}`
      : "",
    ballotpedia: raw.externalIds.ballotpedia
      ? `https://ballotpedia.org/${raw.externalIds.ballotpedia.replace(/ /g, "_")}`
      : "",
    congressGov: `https://www.congress.gov/member/${raw.slug}/${bioId}`,

    featured: FEATURED_IDS.has(bioId),
    isLeadership: bioId in LEADERSHIP,
  };
}

export function transformAllLegislators(raw: RawLegislatorEntry[]): Representative[] {
  return raw.map(transformLegislator);
}
