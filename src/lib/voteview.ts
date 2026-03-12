import { cache, TTL } from "./cache";

const CONGRESS = 119;

interface VotingStats {
  votesCast: number;
  missedVotes: number;
  partyLoyalty: number; // 0-100
}

interface VoteviewMember {
  icpsr: number;
  bioguideId: string;
  partyCode: number; // 100=Democrat, 200=Republican
}

interface VoteRecord {
  rollNumber: number;
  icpsr: number;
  castCode: number; // 1=Yea, 6=Nay, 9=Not Voting, 7=Present
}

// Parse CSV handling quoted fields (e.g. "CRUZ, Rafael Edward (Ted)")
function parseCSV(csv: string): string[][] {
  const lines = csv.trim().split("\n");
  return lines.slice(1).map((line) => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current);
    return fields;
  });
}

// Fetch and cache Voteview data for a chamber
async function fetchVoteviewData(chamber: "Senate" | "House"): Promise<{
  members: VoteviewMember[];
  votes: VoteRecord[];
}> {
  const prefix = chamber === "Senate" ? "S" : "H";
  const cacheKey = `voteview:${prefix}${CONGRESS}`;
  const cached = cache.get<{ members: VoteviewMember[]; votes: VoteRecord[] }>(cacheKey);
  if (cached) return cached;

  try {
    const [membersRes, votesRes] = await Promise.all([
      fetch(`https://voteview.com/static/data/out/members/${prefix}${CONGRESS}_members.csv`),
      fetch(`https://voteview.com/static/data/out/votes/${prefix}${CONGRESS}_votes.csv`),
    ]);

    if (!membersRes.ok || !votesRes.ok) {
      return { members: [], votes: [] };
    }

    const [membersCSV, votesCSV] = await Promise.all([
      membersRes.text(),
      votesRes.text(),
    ]);

    // Parse members: congress,chamber,icpsr,state_icpsr,district_code,state_abbrev,party_code,...,bioguide_id,...
    const memberRows = parseCSV(membersCSV);
    const members: VoteviewMember[] = memberRows
      .filter((row) => row[10]) // has bioguide_id
      .map((row) => ({
        icpsr: parseInt(row[2], 10),
        bioguideId: row[10],
        partyCode: parseInt(row[6], 10),
      }));

    // Parse votes: congress,chamber,rollnumber,icpsr,cast_code,prob
    const voteRows = parseCSV(votesCSV);
    const votes: VoteRecord[] = voteRows.map((row) => ({
      rollNumber: parseInt(row[2], 10),
      icpsr: parseInt(row[3], 10),
      castCode: parseInt(row[4], 10),
    }));

    const result = { members, votes };
    cache.set(cacheKey, result, 86400); // 24h cache
    return result;
  } catch (err) {
    console.error(`Voteview fetch error for ${chamber}:`, err);
    return { members: [], votes: [] };
  }
}

// Compute party majority for each roll call
function computePartyMajorities(
  votes: VoteRecord[],
  memberPartyMap: Map<number, number>
): Map<number, Map<number, "yea" | "nay">> {
  // rollNumber → partyCode → majority vote
  const rollPartyVotes = new Map<number, Map<number, { yea: number; nay: number }>>();

  for (const v of votes) {
    const party = memberPartyMap.get(v.icpsr);
    if (!party || v.castCode === 9 || v.castCode === 0) continue;

    if (!rollPartyVotes.has(v.rollNumber)) {
      rollPartyVotes.set(v.rollNumber, new Map());
    }
    const partyMap = rollPartyVotes.get(v.rollNumber)!;
    if (!partyMap.has(party)) {
      partyMap.set(party, { yea: 0, nay: 0 });
    }
    const counts = partyMap.get(party)!;
    if (v.castCode === 1 || v.castCode === 2 || v.castCode === 3) {
      counts.yea++;
    } else if (v.castCode === 4 || v.castCode === 5 || v.castCode === 6) {
      counts.nay++;
    }
  }

  // Convert to majority direction
  const result = new Map<number, Map<number, "yea" | "nay">>();
  for (const [roll, partyMap] of rollPartyVotes) {
    const majorityMap = new Map<number, "yea" | "nay">();
    for (const [party, counts] of partyMap) {
      majorityMap.set(party, counts.yea >= counts.nay ? "yea" : "nay");
    }
    result.set(roll, majorityMap);
  }
  return result;
}

// Compute stats for a single member given pre-computed data
function computeMemberStats(
  member: VoteviewMember,
  votes: VoteRecord[],
  memberPartyMap: Map<number, number>,
  partyMajorities: Map<number, Map<number, "yea" | "nay">>
): VotingStats {
  const myVotes = votes.filter((v) => v.icpsr === member.icpsr);

  let votesCast = 0;
  let missedVotes = 0;

  for (const v of myVotes) {
    if (v.castCode === 9) {
      missedVotes++;
    } else if (v.castCode >= 1 && v.castCode <= 7) {
      votesCast++;
    }
  }

  let withParty = 0;
  let totalPartyVotes = 0;

  for (const v of myVotes) {
    if (v.castCode === 9 || v.castCode === 0) continue;
    const rollMajority = partyMajorities.get(v.rollNumber);
    if (!rollMajority) continue;
    const partyDirection = rollMajority.get(member.partyCode);
    if (!partyDirection) continue;

    totalPartyVotes++;
    const memberVotedYea = v.castCode >= 1 && v.castCode <= 3;
    const partyVotedYea = partyDirection === "yea";
    if (memberVotedYea === partyVotedYea) {
      withParty++;
    }
  }

  const partyLoyalty = totalPartyVotes > 0 ? Math.round((withParty / totalPartyVotes) * 100) : 0;
  return { votesCast, missedVotes, partyLoyalty };
}

export async function getVotingStats(
  bioguideId: string,
  chamber: "Senate" | "House"
): Promise<VotingStats> {
  const statsCacheKey = `voteview:stats:${bioguideId}`;
  const cached = cache.get<VotingStats>(statsCacheKey);
  if (cached) return cached;

  const { members, votes } = await fetchVoteviewData(chamber);
  if (members.length === 0) return { votesCast: 0, missedVotes: 0, partyLoyalty: 0 };

  const member = members.find((m) => m.bioguideId === bioguideId);
  if (!member) return { votesCast: 0, missedVotes: 0, partyLoyalty: 0 };

  const memberPartyMap = new Map<number, number>();
  for (const m of members) {
    memberPartyMap.set(m.icpsr, m.partyCode);
  }

  const partyMajorities = computePartyMajorities(votes, memberPartyMap);
  const stats = computeMemberStats(member, votes, memberPartyMap, partyMajorities);
  cache.set(statsCacheKey, stats, 86400);
  return stats;
}

// Bulk compute stats for ALL members in a chamber (reuses same CSV fetch)
export async function getAllVotingStats(
  chamber: "Senate" | "House"
): Promise<Map<string, VotingStats>> {
  const bulkCacheKey = `voteview:bulk:${chamber}`;
  const cached = cache.get<Map<string, VotingStats>>(bulkCacheKey);
  if (cached) return cached;

  const { members, votes } = await fetchVoteviewData(chamber);
  if (members.length === 0) return new Map();

  const memberPartyMap = new Map<number, number>();
  for (const m of members) {
    memberPartyMap.set(m.icpsr, m.partyCode);
  }

  const partyMajorities = computePartyMajorities(votes, memberPartyMap);
  const result = new Map<string, VotingStats>();

  for (const member of members) {
    const stats = computeMemberStats(member, votes, memberPartyMap, partyMajorities);
    result.set(member.bioguideId, stats);
    // Also cache individually
    cache.set(`voteview:stats:${member.bioguideId}`, stats, 86400);
  }

  cache.set(bulkCacheKey, result, 86400);
  return result;
}
