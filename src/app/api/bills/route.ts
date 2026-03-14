import { NextRequest, NextResponse } from "next/server";
import { cache, TTL } from "@/lib/cache";
import { transformBillsToIssueLegislation } from "@/lib/transformers/congress-gov";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;
  const query = request.nextUrl.searchParams.get("query") || "";
  const congress = request.nextUrl.searchParams.get("congress") || "119";
  const billNumber = request.nextUrl.searchParams.get("billNumber") || "";
  const status = request.nextUrl.searchParams.get("status") || "";
  const sort = request.nextUrl.searchParams.get("sort") || "date";

  if (!query && !billNumber) {
    return NextResponse.json({ error: "query or billNumber parameter required" }, { status: 400 });
  }

  const cacheKey = `bills:${query}:${billNumber}:${congress}:${status}:${sort}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "CONGRESS_GOV_API_KEY not configured" }, { status: 500 });
  }

  try {
    let url: string;

    if (billNumber) {
      // Parse bill number like "hr1234", "s500", "HR 1234", "S. 500"
      const cleaned = billNumber.replace(/[.\s]/g, "").toLowerCase();
      const match = cleaned.match(/^(hr|s|hjres|sjres|hconres|sconres|hres|sres)(\d+)$/);

      if (match) {
        const [, type, number] = match;
        url = `https://api.congress.gov/v3/bill/${congress}/${type}/${number}?api_key=${apiKey}&format=json`;

        const res = await fetch(url);
        if (!res.ok) {
          // If direct lookup fails, fall back to search
          url = `https://api.congress.gov/v3/bill?api_key=${apiKey}&format=json&limit=25&query=${encodeURIComponent(billNumber)}&congress=${congress}`;
        } else {
          const data = await res.json();
          if (data.bill) {
            // Wrap single bill result in array format for transformer
            const bills = transformBillsToIssueLegislation([data.bill]);
            const filtered = filterAndSort(bills, status, sort);
            cache.set(cacheKey, filtered, TTL.BILLS);
            return NextResponse.json(filtered);
          }
        }
      } else {
        // Not a recognized format, use as search query
        url = `https://api.congress.gov/v3/bill?api_key=${apiKey}&format=json&limit=25&query=${encodeURIComponent(billNumber)}&congress=${congress}`;
      }
    } else {
      url = `https://api.congress.gov/v3/bill?api_key=${apiKey}&format=json&limit=25&query=${encodeURIComponent(query)}&congress=${congress}`;
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Congress.gov API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const bills = transformBillsToIssueLegislation(data.bills || []);
    const filtered = filterAndSort(bills, status, sort);

    cache.set(cacheKey, filtered, TTL.BILLS);
    return NextResponse.json(filtered);
  } catch (err) {
    console.error("Bills API error:", err);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}

function filterAndSort(
  bills: { id: string; billNumber: string; title: string; sponsor: string; date: string; status: string; summary: string }[],
  status: string,
  sort: string
) {
  let result = [...bills];

  if (status) {
    result = result.filter((b) => b.status === status);
  }

  if (sort === "title") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // Default: sort by date descending
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return result;
}
