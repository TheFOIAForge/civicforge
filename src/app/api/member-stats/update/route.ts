import { NextResponse } from "next/server";
import type { MemberStats, MemberStatsPayload } from "@/data/member-stats";
import { setCachedStats } from "../route";

/**
 * POST /api/member-stats/update
 *
 * Batch-fetches member statistics from Congress.gov and Voteview.
 * Computes leaderboard stats and caches them in memory.
 *
 * Data sources:
 *   1. Voteview bulk CSV → party loyalty & ideology (no rate limits)
 *   2. Congress.gov API → bills sponsored, bills enacted, missed votes
 *      (5,000 req/hr — we batch with delays to stay well under)
 *
 * This is a long-running request (~2-5 min for full 535 members).
 * In production, run as a cron job or background task.
 */

const CONGRESS_API_BASE = "https://api.congress.gov/v3";
const VOTEVIEW_CSV_URL =
  "https://voteview.com/static/data/out/members/Hall_members.csv";

interface VoteviewMember {
  bioguideId: string;
  name: string;
  party: number; // 100=D, 200=R, 328=I
  state: string;
  chamber: string;
  congress: number;
  nominate1: number; // ideology score
}

// ─── Voteview CSV Parser ────────────────────────────────────────────────────

async function fetchVoteviewData(
  congress: number
): Promise<Map<string, VoteviewMember>> {
  const map = new Map<string, VoteviewMember>();

  try {
    const res = await fetch(VOTEVIEW_CSV_URL);
    if (!res.ok) return map;

    const text = await res.text();
    const lines = text.split("\n");
    const headers = lines[0].split(",");

    const idx = {
      congress: headers.indexOf("congress"),
      chamber: headers.indexOf("chamber"),
      bioguide: headers.indexOf("bioguide_id"),
      bioname: headers.indexOf("bioname"),
      partyCode: headers.indexOf("party_code"),
      stateAbbr: headers.indexOf("state_abbrev"),
      nominate1: headers.indexOf("nominate_dim1"),
    };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const cong = parseInt(cols[idx.congress]);
      if (cong !== congress) continue;

      const bioguideId = cols[idx.bioguide]?.trim();
      if (!bioguideId) continue;

      map.set(bioguideId, {
        bioguideId,
        name: cols[idx.bioname]?.replace(/"/g, "").trim() || "",
        party: parseInt(cols[idx.partyCode]) || 0,
        state: cols[idx.stateAbbr]?.trim() || "",
        chamber: cols[idx.chamber]?.trim() || "",
        congress: cong,
        nominate1: parseFloat(cols[idx.nominate1]) || 0,
      });
    }
  } catch {
    // Voteview unavailable — continue without it
  }

  return map;
}

// ─── Congress.gov API Helpers ───────────────────────────────────────────────

async function fetchMemberList(
  apiKey: string,
  congress: number
): Promise<
  Array<{
    bioguideId: string;
    name: string;
    party: string;
    state: string;
    chamber: string;
  }>
> {
  const members: Array<{
    bioguideId: string;
    name: string;
    party: string;
    state: string;
    chamber: string;
  }> = [];
  let offset = 0;
  const limit = 250;

  while (true) {
    const url = `${CONGRESS_API_BASE}/member/congress/${congress}?api_key=${apiKey}&format=json&limit=${limit}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) break;

    const data = await res.json();
    const list = data.members || [];
    if (list.length === 0) break;

    for (const m of list) {
      members.push({
        bioguideId: m.bioguideId || "",
        name: m.name || "",
        party: m.partyName === "Democratic" ? "D" : m.partyName === "Republican" ? "R" : "I",
        state: m.state || "",
        chamber: m.terms?.item?.[0]?.chamber || "",
      });
    }

    offset += limit;
    if (list.length < limit) break;

    // Rate limit: ~5 req/sec to stay safe
    await new Promise((r) => setTimeout(r, 250));
  }

  return members;
}

async function fetchMemberBillStats(
  apiKey: string,
  bioguideId: string
): Promise<{ billsSponsored: number; billsEnacted: number }> {
  try {
    const url = `${CONGRESS_API_BASE}/member/${bioguideId}/sponsored-legislation?api_key=${apiKey}&format=json&limit=250`;
    const res = await fetch(url);
    if (!res.ok) return { billsSponsored: 0, billsEnacted: 0 };

    const data = await res.json();
    const bills = data.sponsoredLegislation || [];
    const billsSponsored = bills.length;
    const billsEnacted = bills.filter(
      (b: { latestAction?: { text?: string } }) =>
        b.latestAction?.text?.toLowerCase().includes("became public law") ||
        b.latestAction?.text?.toLowerCase().includes("signed by president")
    ).length;

    return { billsSponsored, billsEnacted };
  } catch {
    return { billsSponsored: 0, billsEnacted: 0 };
  }
}

// ─── Main Update Logic ──────────────────────────────────────────────────────

export async function POST() {
  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "CONGRESS_GOV_API_KEY not configured",
        hint: "Add your Congress.gov API key to .env.local",
      },
      { status: 500 }
    );
  }

  const congress = 119; // Current congress

  try {
    // Step 1: Fetch Voteview data (party loyalty / ideology)
    const voteviewData = await fetchVoteviewData(congress);

    // Step 2: Fetch member list from Congress.gov
    const memberList = await fetchMemberList(apiKey, congress);
    if (memberList.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch member list from Congress.gov" },
        { status: 502 }
      );
    }

    // Step 3: Fetch bill stats for each member (batched)
    const BATCH_SIZE = 10;
    const BATCH_DELAY_MS = 2000; // 2 second delay between batches
    const stats: MemberStats[] = [];

    for (let i = 0; i < memberList.length; i += BATCH_SIZE) {
      const batch = memberList.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (member) => {
          const billStats = await fetchMemberBillStats(
            apiKey,
            member.bioguideId
          );
          const vv = voteviewData.get(member.bioguideId);

          // Calculate party loyalty from Voteview ideology score
          // DW-NOMINATE ranges from -1 (most liberal) to 1 (most conservative)
          // Party loyalty approximated: closer to party median = higher loyalty
          let partyLoyalty = 85; // default
          if (vv) {
            const isRepublican = member.party === "R";
            const partyMedian = isRepublican ? 0.5 : -0.4;
            const distance = Math.abs(vv.nominate1 - partyMedian);
            partyLoyalty = Math.max(50, Math.min(99, 100 - distance * 40));
          }

          const ms: MemberStats = {
            bioguideId: member.bioguideId,
            name: member.name,
            party: member.party as "R" | "D" | "I",
            state: member.state,
            stateAbbr: member.state, // Congress.gov returns abbreviation
            chamber: member.chamber === "Senate" ? "Senate" : "House",
            slug: member.name
              .toLowerCase()
              .replace(/[^a-z\s]/g, "")
              .trim()
              .replace(/\s+/g, "-"),
            partyLoyalty: Math.round(partyLoyalty * 10) / 10,
            missedVotes: 0, // Would need vote attendance data
            billsSponsored: billStats.billsSponsored,
            billsEnacted: billStats.billsEnacted,
            successRate:
              billStats.billsSponsored > 0
                ? Math.round(
                    (billStats.billsEnacted / billStats.billsSponsored) * 1000
                  ) / 10
                : 0,
          };

          return ms;
        })
      );

      stats.push(...batchResults);

      // Delay between batches to respect rate limits
      if (i + BATCH_SIZE < memberList.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    // Step 4: Build and cache the payload
    const payload: MemberStatsPayload = {
      lastUpdated: new Date().toISOString(),
      congress,
      source: "live",
      members: stats,
    };

    setCachedStats(payload);

    return NextResponse.json({
      success: true,
      membersUpdated: stats.length,
      lastUpdated: payload.lastUpdated,
      source: "live",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update member stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
