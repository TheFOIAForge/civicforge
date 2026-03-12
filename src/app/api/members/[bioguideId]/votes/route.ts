import { NextRequest, NextResponse } from "next/server";
import { getMemberVotes } from "@/lib/members";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;
  const votes = await getMemberVotes(bioguideId);
  return NextResponse.json(votes);
}
