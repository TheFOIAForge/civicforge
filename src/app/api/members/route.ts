import { NextRequest, NextResponse } from "next/server";
import { getAllMembers, searchMembers, getLeadershipMembers, getFeaturedMembers } from "@/lib/members";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("search") || "";
  const state = params.get("state") || undefined;
  const chamber = params.get("chamber") || undefined;
  const party = params.get("party") || undefined;
  const leadership = params.get("leadership");
  const featured = params.get("featured");

  if (leadership === "true") {
    return NextResponse.json(getLeadershipMembers());
  }

  if (featured === "true") {
    return NextResponse.json(getFeaturedMembers());
  }

  if (search || state || chamber || party) {
    return NextResponse.json(searchMembers(search, { state, chamber, party }));
  }

  return NextResponse.json(getAllMembers());
}
