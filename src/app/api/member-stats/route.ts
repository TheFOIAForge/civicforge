import { NextRequest, NextResponse } from "next/server";
import { HARDCODED_MEMBER_STATS, type MemberStatsPayload } from "@/data/member-stats";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

/**
 * GET /api/member-stats
 *
 * Returns the current member statistics payload.
 * Today: serves hardcoded data.
 * Future: will serve cached live data if available,
 *         falling back to hardcoded data.
 */

// In-memory cache for live data (populated by /api/member-stats/update)
// In production, this would be a file or database.
let cachedLiveData: MemberStatsPayload | null = null;

export function setCachedStats(data: MemberStatsPayload) {
  cachedLiveData = data;
}

export function getCachedStats(): MemberStatsPayload {
  return cachedLiveData ?? HARDCODED_MEMBER_STATS;
}

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const data = getCachedStats();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
