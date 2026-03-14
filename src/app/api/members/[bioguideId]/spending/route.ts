import { NextRequest, NextResponse } from "next/server";
import { getDistrictSpendingForMember } from "@/lib/usaspending";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const { bioguideId } = await params;
  const result = await getDistrictSpendingForMember(bioguideId);
  return NextResponse.json(result || { totalObligated: 0, contractCount: 0, grantCount: 0, topRecipients: [], topAgencies: [], awards: [], donorContractorOverlaps: [] });
}
