import { NextRequest, NextResponse } from "next/server";
import { getAllMembers, searchMembers, getLeadershipMembers, getFeaturedMembers } from "@/lib/members";
import { getAllVotingStats } from "@/lib/voteview";
import { rateLimit } from "@/lib/rate-limit";
import type { Representative } from "@/data/types";

const limiter = rateLimit({ windowMs: 60_000, max: 60 });

// Light fields for list views — ~80 KB instead of ~1 MB
const LIGHT_FIELDS: (keyof Representative)[] = [
  "id", "slug", "firstName", "lastName", "fullName", "title", "chamber",
  "party", "state", "stateAbbr", "district", "inOffice", "photoUrl",
  "partyLoyalty", "votesCast", "missedVotes", "committees",
  "leadershipRole", "featured", "isLeadership",
];

function toLightPayload(members: Representative[]): Partial<Representative>[] {
  return members.map((m) => {
    const light: Record<string, unknown> = {};
    for (const k of LIGHT_FIELDS) {
      if (m[k] !== undefined) light[k] = m[k];
    }
    return light as Partial<Representative>;
  });
}

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
  const limited = limiter.check(request);
  if (limited) return limited;

  const params = request.nextUrl.searchParams;
  const search = params.get("search") || "";
  const state = params.get("state") || undefined;
  const chamber = params.get("chamber") || undefined;
  const party = params.get("party") || undefined;
  const leadership = params.get("leadership");
  const featured = params.get("featured");
  const fields = params.get("fields");

  if (leadership === "true") {
    const data = await enrichWithVotingStats(getLeadershipMembers());
    return NextResponse.json(fields === "light" ? toLightPayload(data) : data);
  }

  if (featured === "true") {
    const data = await enrichWithVotingStats(getFeaturedMembers());
    return NextResponse.json(fields === "light" ? toLightPayload(data) : data);
  }

  if (search || state || chamber || party) {
    const data = await enrichWithVotingStats(searchMembers(search, { state, chamber, party }));
    return NextResponse.json(fields === "light" ? toLightPayload(data) : data);
  }

  const data = await enrichWithVotingStats(getAllMembers());
  return NextResponse.json(fields === "light" ? toLightPayload(data) : data);
}
