import { NextRequest, NextResponse } from "next/server";
import { getCommitteeBySlug } from "@/lib/congress-committees";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const committee = await getCommitteeBySlug(slug);

  if (!committee) {
    return NextResponse.json({ error: "Committee not found" }, { status: 404 });
  }

  return NextResponse.json(committee);
}
