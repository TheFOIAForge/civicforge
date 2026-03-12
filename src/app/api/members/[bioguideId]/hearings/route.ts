import { NextRequest, NextResponse } from "next/server";
import { getHearingsForMember } from "@/lib/congress-hearings";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;
  return NextResponse.json(await getHearingsForMember(bioguideId));
}
