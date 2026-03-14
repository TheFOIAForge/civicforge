import { NextRequest, NextResponse } from "next/server";
import { lookupByAddress } from "@/lib/members";
import { lookupSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 15 });

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const address = request.nextUrl.searchParams.get("address");
  const validated = parseBody(lookupSchema, { address });
  if (!validated.success) return validated.response;

  try {
    const members = await lookupByAddress(validated.data.address);
    return NextResponse.json(members);
  } catch (err) {
    console.error("Lookup error:", err);
    return NextResponse.json({ error: "Failed to look up representatives" }, { status: 500 });
  }
}
