import { NextRequest, NextResponse } from "next/server";
import { getEnrichedMember } from "@/lib/members";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;

  const member = await getEnrichedMember(bioguideId);
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}
