import { NextRequest, NextResponse } from "next/server";
import { getLobbyingForMember } from "@/lib/lda";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;
  return NextResponse.json(await getLobbyingForMember(bioguideId));
}
