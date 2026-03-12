import { NextRequest, NextResponse } from "next/server";
import { cache, TTL } from "@/lib/cache";
import { transformBillsToIssueLegislation } from "@/lib/transformers/congress-gov";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query") || "";
  const congress = request.nextUrl.searchParams.get("congress") || "119";

  if (!query) {
    return NextResponse.json({ error: "query parameter required" }, { status: 400 });
  }

  const cacheKey = `bills:${query}:${congress}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "CONGRESS_GOV_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.congress.gov/v3/bill?api_key=${apiKey}&format=json&limit=10&query=${encodeURIComponent(query)}&congress=${congress}`
    );
    if (!res.ok) {
      return NextResponse.json({ error: `Congress.gov API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const bills = transformBillsToIssueLegislation(data.bills || []);

    cache.set(cacheKey, bills, TTL.BILLS);
    return NextResponse.json(bills);
  } catch (err) {
    console.error("Bills API error:", err);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}
