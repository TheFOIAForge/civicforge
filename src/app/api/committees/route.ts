import { NextRequest, NextResponse } from "next/server";
import { getAllCommittees } from "@/lib/congress-committees";

export async function GET(req: NextRequest) {
  const chamber = req.nextUrl.searchParams.get("chamber") || "";
  let committees = await getAllCommittees();

  if (chamber) {
    const c = chamber.toLowerCase();
    committees = committees.filter(
      (cm) => cm.chamber.toLowerCase() === c
    );
  }

  return NextResponse.json(committees);
}
