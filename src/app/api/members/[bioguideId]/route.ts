import { NextRequest, NextResponse } from "next/server";
import { getEnrichedMember } from "@/lib/members";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const { bioguideId } = await params;

  const member = await getEnrichedMember(bioguideId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}
