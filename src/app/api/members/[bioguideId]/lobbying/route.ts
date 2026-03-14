import { NextRequest, NextResponse } from "next/server";
import { getLobbyingForMember } from "@/lib/lda";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const { bioguideId } = await params;
  return NextResponse.json(await getLobbyingForMember(bioguideId));
}
