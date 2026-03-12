import { NextRequest, NextResponse } from "next/server";
import { getDistrictSpendingForMember } from "@/lib/usaspending";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;
  const result = await getDistrictSpendingForMember(bioguideId);
  return NextResponse.json(result || { totalObligated: 0, contractCount: 0, grantCount: 0, topRecipients: [], topAgencies: [], awards: [], donorContractorOverlaps: [] });
}
