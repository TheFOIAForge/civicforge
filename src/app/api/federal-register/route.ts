import { NextRequest, NextResponse } from "next/server";
import { getOpenCommentPeriods, getRecentRules } from "@/lib/federal-register";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword") || undefined;
  const mode = request.nextUrl.searchParams.get("mode") || "comments";

  if (mode === "rules") {
    return NextResponse.json(await getRecentRules(20));
  }

  return NextResponse.json(await getOpenCommentPeriods(keyword));
}
