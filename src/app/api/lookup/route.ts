import { NextRequest, NextResponse } from "next/server";
import { lookupByAddress } from "@/lib/members";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address parameter required" }, { status: 400 });
  }

  const members = await lookupByAddress(address);
  return NextResponse.json(members);
}
