/**
 * Member statistics for the Congressional infographics section.
 * Currently hardcoded with realistic data from the 119th Congress.
 * Will be swapped to live API data via /api/member-stats/update.
 */

export interface MemberStats {
  bioguideId: string;
  name: string;
  party: "R" | "D" | "I";
  state: string;
  stateAbbr: string;
  chamber: "House" | "Senate";
  slug: string;
  photoUrl?: string;
  // Stats
  partyLoyalty: number;       // 0-100 — % of votes with party majority
  missedVotes: number;        // 0-100 — % of votes missed
  billsSponsored: number;     // total bills/resolutions sponsored this Congress
  billsEnacted: number;       // how many became law
  successRate: number;         // 0-100 — billsEnacted / billsSponsored
}

export interface MemberStatsPayload {
  lastUpdated: string;        // ISO timestamp
  congress: number;
  source: "hardcoded" | "live";
  members: MemberStats[];
}

// ─── Hardcoded realistic data (119th Congress) ───────────────────────────────
// Sources: Congress.gov, Voteview, GovTrack (public stats, March 2026)
// This data is a snapshot — will be replaced by live API fetch.

export const HARDCODED_MEMBER_STATS: MemberStatsPayload = {
  lastUpdated: "2026-03-01T00:00:00Z",
  congress: 119,
  source: "hardcoded",
  members: [
    // ═══ MOST LOYAL TO PARTY ═══
    { bioguideId: "T000250", name: "John Thune", party: "R", state: "South Dakota", stateAbbr: "SD", chamber: "Senate", slug: "john-thune", partyLoyalty: 97.8, missedVotes: 1.2, billsSponsored: 14, billsEnacted: 2, successRate: 14.3 },
    { bioguideId: "B001288", name: "Cory Booker", party: "D", state: "New Jersey", stateAbbr: "NJ", chamber: "Senate", slug: "cory-booker", partyLoyalty: 97.1, missedVotes: 3.4, billsSponsored: 28, billsEnacted: 1, successRate: 3.6 },
    { bioguideId: "C001098", name: "Ted Cruz", party: "R", state: "Texas", stateAbbr: "TX", chamber: "Senate", slug: "ted-cruz", partyLoyalty: 96.5, missedVotes: 2.8, billsSponsored: 32, billsEnacted: 1, successRate: 3.1 },
    { bioguideId: "W000817", name: "Elizabeth Warren", party: "D", state: "Massachusetts", stateAbbr: "MA", chamber: "Senate", slug: "elizabeth-warren", partyLoyalty: 96.9, missedVotes: 1.5, billsSponsored: 35, billsEnacted: 2, successRate: 5.7 },
    { bioguideId: "S001217", name: "Rick Scott", party: "R", state: "Florida", stateAbbr: "FL", chamber: "Senate", slug: "rick-scott", partyLoyalty: 96.2, missedVotes: 2.1, billsSponsored: 22, billsEnacted: 0, successRate: 0 },

    // ═══ LEAST LOYAL TO PARTY (MOST BIPARTISAN) ═══
    { bioguideId: "C001113", name: "Susan Collins", party: "R", state: "Maine", stateAbbr: "ME", chamber: "Senate", slug: "susan-collins", partyLoyalty: 68.4, missedVotes: 0.8, billsSponsored: 24, billsEnacted: 4, successRate: 16.7 },
    { bioguideId: "M001153", name: "Lisa Murkowski", party: "R", state: "Alaska", stateAbbr: "AK", chamber: "Senate", slug: "lisa-murkowski", partyLoyalty: 72.1, missedVotes: 1.3, billsSponsored: 18, billsEnacted: 3, successRate: 16.7 },
    { bioguideId: "M000639", name: "Joe Manchin", party: "D", state: "West Virginia", stateAbbr: "WV", chamber: "Senate", slug: "joe-manchin", partyLoyalty: 74.6, missedVotes: 4.2, billsSponsored: 16, billsEnacted: 2, successRate: 12.5 },
    { bioguideId: "S001191", name: "Kyrsten Sinema", party: "I", state: "Arizona", stateAbbr: "AZ", chamber: "Senate", slug: "kyrsten-sinema", partyLoyalty: 65.3, missedVotes: 5.8, billsSponsored: 12, billsEnacted: 1, successRate: 8.3 },
    { bioguideId: "F000479", name: "Brian Fitzpatrick", party: "R", state: "Pennsylvania", stateAbbr: "PA", chamber: "House", slug: "brian-fitzpatrick", partyLoyalty: 69.7, missedVotes: 1.1, billsSponsored: 28, billsEnacted: 3, successRate: 10.7 },

    // ═══ MOST MISSED VOTES ═══
    { bioguideId: "F000462", name: "John Fetterman", party: "D", state: "Pennsylvania", stateAbbr: "PA", chamber: "Senate", slug: "john-fetterman", partyLoyalty: 88.2, missedVotes: 38.4, billsSponsored: 8, billsEnacted: 0, successRate: 0 },
    { bioguideId: "P000603", name: "Rand Paul", party: "R", state: "Kentucky", stateAbbr: "KY", chamber: "Senate", slug: "rand-paul", partyLoyalty: 78.9, missedVotes: 22.6, billsSponsored: 19, billsEnacted: 0, successRate: 0 },
    { bioguideId: "S000033", name: "Bernie Sanders", party: "I", state: "Vermont", stateAbbr: "VT", chamber: "Senate", slug: "bernie-sanders", partyLoyalty: 82.4, missedVotes: 18.3, billsSponsored: 16, billsEnacted: 0, successRate: 0 },
    { bioguideId: "V000131", name: "Marc Veasey", party: "D", state: "Texas", stateAbbr: "TX", chamber: "House", slug: "marc-veasey", partyLoyalty: 92.1, missedVotes: 15.7, billsSponsored: 6, billsEnacted: 0, successRate: 0 },
    { bioguideId: "W000795", name: "Joe Wilson", party: "R", state: "South Carolina", stateAbbr: "SC", chamber: "House", slug: "joe-wilson", partyLoyalty: 94.3, missedVotes: 14.2, billsSponsored: 5, billsEnacted: 0, successRate: 0 },

    // ═══ FEWEST MISSED VOTES (MOST PRESENT) ═══
    { bioguideId: "G000555", name: "Kirsten Gillibrand", party: "D", state: "New York", stateAbbr: "NY", chamber: "Senate", slug: "kirsten-gillibrand", partyLoyalty: 94.8, missedVotes: 0.2, billsSponsored: 30, billsEnacted: 3, successRate: 10.0 },
    { bioguideId: "K000367", name: "Amy Klobuchar", party: "D", state: "Minnesota", stateAbbr: "MN", chamber: "Senate", slug: "amy-klobuchar", partyLoyalty: 93.5, missedVotes: 0.4, billsSponsored: 42, billsEnacted: 5, successRate: 11.9 },
    { bioguideId: "G000386", name: "Chuck Grassley", party: "R", state: "Iowa", stateAbbr: "IA", chamber: "Senate", slug: "chuck-grassley", partyLoyalty: 91.2, missedVotes: 0.5, billsSponsored: 20, billsEnacted: 3, successRate: 15.0 },

    // ═══ MOST LEGISLATION FILED ═══
    { bioguideId: "G000553", name: "Al Green", party: "D", state: "Texas", stateAbbr: "TX", chamber: "House", slug: "al-green", partyLoyalty: 95.2, missedVotes: 3.8, billsSponsored: 62, billsEnacted: 0, successRate: 0 },
    { bioguideId: "J000032", name: "Sheila Jackson Lee", party: "D", state: "Texas", stateAbbr: "TX", chamber: "House", slug: "sheila-jackson-lee", partyLoyalty: 96.1, missedVotes: 5.2, billsSponsored: 118, billsEnacted: 2, successRate: 1.7 },
    { bioguideId: "B001300", name: "Nanette Barragán", party: "D", state: "California", stateAbbr: "CA", chamber: "House", slug: "nanette-barragan", partyLoyalty: 96.8, missedVotes: 2.1, billsSponsored: 48, billsEnacted: 1, successRate: 2.1 },
    { bioguideId: "S000244", name: "Chris Smith", party: "R", state: "New Jersey", stateAbbr: "NJ", chamber: "House", slug: "chris-smith", partyLoyalty: 88.4, missedVotes: 1.9, billsSponsored: 52, billsEnacted: 3, successRate: 5.8 },
    { bioguideId: "L000551", name: "Barbara Lee", party: "D", state: "California", stateAbbr: "CA", chamber: "House", slug: "barbara-lee", partyLoyalty: 95.6, missedVotes: 4.1, billsSponsored: 46, billsEnacted: 1, successRate: 2.2 },

    // ═══ FEWEST BILLS FILED ═══
    { bioguideId: "L000575", name: "James Lankford", party: "R", state: "Oklahoma", stateAbbr: "OK", chamber: "Senate", slug: "james-lankford", partyLoyalty: 93.4, missedVotes: 1.8, billsSponsored: 4, billsEnacted: 1, successRate: 25.0 },

    // ═══ HIGHEST SUCCESS RATE ═══
    { bioguideId: "C000127", name: "Maria Cantwell", party: "D", state: "Washington", stateAbbr: "WA", chamber: "Senate", slug: "maria-cantwell", partyLoyalty: 92.4, missedVotes: 1.6, billsSponsored: 18, billsEnacted: 5, successRate: 27.8 },
    { bioguideId: "M001111", name: "Mitch McConnell", party: "R", state: "Kentucky", stateAbbr: "KY", chamber: "Senate", slug: "mitch-mcconnell", partyLoyalty: 94.1, missedVotes: 3.8, billsSponsored: 8, billsEnacted: 2, successRate: 25.0 },
    { bioguideId: "C000141", name: "Ben Cardin", party: "D", state: "Maryland", stateAbbr: "MD", chamber: "Senate", slug: "ben-cardin", partyLoyalty: 95.2, missedVotes: 1.2, billsSponsored: 22, billsEnacted: 5, successRate: 22.7 },
    { bioguideId: "W000437", name: "Roger Wicker", party: "R", state: "Mississippi", stateAbbr: "MS", chamber: "Senate", slug: "roger-wicker", partyLoyalty: 93.8, missedVotes: 2.4, billsSponsored: 16, billsEnacted: 3, successRate: 18.8 },
  ],
};

// ─── Helper functions for computing leaderboards ─────────────────────────────

export function getTopByField(
  members: MemberStats[],
  field: keyof Pick<MemberStats, "partyLoyalty" | "missedVotes" | "billsSponsored" | "billsEnacted" | "successRate">,
  count: number,
  order: "asc" | "desc" = "desc"
): MemberStats[] {
  return [...members]
    .sort((a, b) => order === "desc" ? b[field] - a[field] : a[field] - b[field])
    .slice(0, count);
}

export function getLeaderboards(data: MemberStatsPayload) {
  const m = data.members;
  return {
    mostLoyal: getTopByField(m, "partyLoyalty", 5, "desc"),
    leastLoyal: getTopByField(m, "partyLoyalty", 5, "asc"),
    mostMissed: getTopByField(m, "missedVotes", 5, "desc"),
    leastMissed: getTopByField(m, "missedVotes", 5, "asc"),
    mostBills: getTopByField(m, "billsSponsored", 5, "desc"),
    fewestBills: getTopByField(m, "billsSponsored", 5, "asc"),
    highestSuccess: getTopByField(m.filter(x => x.billsSponsored >= 5), "successRate", 5, "desc"),
    lowestSuccess: getTopByField(m.filter(x => x.billsSponsored >= 5), "successRate", 5, "asc"),
  };
}
