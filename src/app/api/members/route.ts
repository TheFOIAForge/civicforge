import { NextRequest, NextResponse } from "next/server";
import { getAllMembers, searchMembers, getLeadershipMembers, getFeaturedMembers } from "@/lib/members";
import { getAllVotingStats } from "@/lib/voteview";

// Enrich base member data with Voteview voting stats (bulk, single CSV fetch per chamber)
async function enrichWithVotingStats<T extends { id: string; chamber: string; partyLoyalty: number; votesCast: number; missedVotes: number }>(members: T[]): Promise<T[]> {
  const [senateStats, houseStats] = await Promise.all([
    getAllVotingStats("Senate"),
    getAllVotingStats("House"),
  ]);

  return members.map((m) => {
    const stats = m.chamber === "Senate" ? senateStats.get(m.id) : houseStats.get(m.id);
    if (!stats) return m;
    return {
      ...m,
      partyLoyalty: stats.partyLoyalty || m.partyLoyalty,
      votesCast: stats.votesCast || m.votesCast,
      missedVotes: stats.missedVotes || m.missedVotes,
    };
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("search") || "";
  const state = params.get("state") || undefined;
  const chamber = params.get("chamber") || undefined;
  const party = params.get("party") || undefined;
  const leadership = params.get("leadership");
  const featured = params.get("featured");

  if (leadership === "true") {
    return NextResponse.json(await enrichWithVotingStats(getLeadershipMembers()));
  }

  if (featured === "true") {
    return NextResponse.json(await enrichWithVotingStats(getFeaturedMembers()));
  }

  if (search || state || chamber || party) {
    return NextResponse.json(await enrichWithVotingStats(searchMembers(search, { state, chamber, party })));
  }

  return NextResponse.json(await enrichWithVotingStats(getAllMembers()));
}
