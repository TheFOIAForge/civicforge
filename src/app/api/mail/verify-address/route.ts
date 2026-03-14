import { NextRequest, NextResponse } from "next/server";
import { verifyAddressSchema, parseBody } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

export async function POST(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  try {
    const raw = await request.json();
    const parsed = parseBody(verifyAddressSchema, raw);
    if (!parsed.success) return parsed.response;

    const { address_line1, address_line2, address_city, address_state, address_zip } = parsed.data;

    const lobKey = process.env.LOB_API_KEY;
    if (!lobKey) {
      return NextResponse.json(
        { error: "Mail service not configured" },
        { status: 503 }
      );
    }

    // Lob US Verifications API (REST)
    const res = await fetch("https://api.lob.com/v1/us_verifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${lobKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        primary_line: address_line1,
        secondary_line: address_line2 || "",
        city: address_city,
        state: address_state,
        zip_code: address_zip,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || `Lob verification failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      deliverability: data.deliverability,
      primary_line: data.primary_line,
      secondary_line: data.secondary_line,
      city: data.components?.city,
      state: data.components?.state,
      zip_code: data.components?.zip_code,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
