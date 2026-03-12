import { NextRequest, NextResponse } from "next/server";
import { getDarkMoneyConnections } from "@/lib/propublica-nonprofits";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;
  return NextResponse.json(await getDarkMoneyConnections(bioguideId));
}
