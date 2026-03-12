import { NextRequest, NextResponse } from "next/server";
import { getGAOReports } from "@/lib/govinfo";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword") || undefined;
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "100", 10);

  return NextResponse.json(await getGAOReports({ keyword, limit }));
}
