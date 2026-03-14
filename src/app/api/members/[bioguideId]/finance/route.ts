import { NextRequest, NextResponse } from "next/server";
import { getMemberFinance } from "@/lib/members";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const { bioguideId } = await params;
  const finance = await getMemberFinance(bioguideId);
  return NextResponse.json(finance);
}
