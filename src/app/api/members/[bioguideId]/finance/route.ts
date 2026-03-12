import { NextRequest, NextResponse } from "next/server";
import { getMemberFinance } from "@/lib/members";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bioguideId: string }> }
) {
  const { bioguideId } = await params;
  const finance = await getMemberFinance(bioguideId);
  return NextResponse.json(finance);
}
