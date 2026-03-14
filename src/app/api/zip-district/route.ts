import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

/**
 * GET /api/zip-district?q=02019
 * GET /api/zip-district?q=02019-4817
 * GET /api/zip-district?q=123 Main St, Boston MA 02019
 *
 * Looks up the congressional district for a zip, zip+4, or full address.
 *  - Plain 5-digit zip  → whoismyrepresentative.com (may return multiple districts)
 *  - Zip+4 or address   → Census Geocoder → precise single district
 */

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH", Oklahoma: "OK",
  Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", Tennessee: "TN", Texas: "TX", Utah: "UT",
  Vermont: "VT", Virginia: "VA", Washington: "WA", "West Virginia": "WV",
  Wisconsin: "WI", Wyoming: "WY", "District of Columbia": "DC",
};

// Reverse lookup: abbreviation → full name
const ABBR_TO_STATE: Record<string, string> = {};
for (const [full, abbr] of Object.entries(STATE_ABBR)) ABBR_TO_STATE[abbr] = full;

interface WIMRResult {
  name: string;
  party: string;
  state: string;
  district: string;
}

// --- Census Geocoder for full addresses / zip+4 ---
async function lookupViaCensus(address: string): Promise<{ state: string | null; districts: string[] }> {
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return { state: null, districts: [] };

  const data = await res.json();
  const matches = data?.result?.addressMatches;
  if (!matches || matches.length === 0) return { state: null, districts: [] };

  const match = matches[0];
  const stateAbbr = match?.addressComponents?.state || null;
  const geographies = match?.geographies;

  // Congressional district is under "Congressional Districts 119th"
  // or similar key — find the first key containing "Congressional"
  let district: string | null = null;
  if (geographies) {
    for (const key of Object.keys(geographies)) {
      if (key.toLowerCase().includes("congressional")) {
        const cdArr = geographies[key];
        if (cdArr && cdArr.length > 0) {
          // The district code is in "CD119FP" or "CDSESSN" or similar — grab last 2 digits
          const cd = cdArr[0];
          const cdCode = cd.CD119FP || cd.CD118FP || cd.CDSESSN || cd.BASENAME || null;
          if (cdCode) {
            district = String(parseInt(cdCode, 10)); // remove leading zeros
          }
        }
        break;
      }
    }
  }

  return {
    state: stateAbbr,
    districts: district ? [district] : [],
  };
}

// --- WIMR for plain 5-digit zip ---
async function lookupViaWIMR(zip: string): Promise<{ state: string | null; districts: string[] }> {
  const url = `https://whoismyrepresentative.com/getall_mems.php?zip=${zip}&output=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return { state: null, districts: [] };

  const text = await res.text();
  if (text.trim().startsWith("<")) return { state: null, districts: [] };

  const data: { results: WIMRResult[] } = JSON.parse(text);
  if (!data.results || data.results.length === 0) return { state: null, districts: [] };

  const firstResult = data.results[0];
  const state = STATE_ABBR[firstResult.state] || firstResult.state;

  const districts = [
    ...new Set(
      data.results
        .filter((r) => r.district && r.district.trim() !== "")
        .map((r) => r.district.trim())
    ),
  ];

  return { state, districts };
}

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    const isPlainZip = /^\d{5}$/.test(q);
    const isZipPlus4 = /^\d{5}[- ]?\d{4}$/.test(q);

    let result: { state: string | null; districts: string[] };

    if (isPlainZip) {
      // Plain 5-digit zip: use WIMR (may return multiple districts)
      result = await lookupViaWIMR(q);
    } else if (isZipPlus4) {
      // Zip+4: use Census Geocoder for precise single district
      result = await lookupViaCensus(q);
      // Fallback to WIMR with just the 5-digit part if Census fails
      if (!result.state) {
        result = await lookupViaWIMR(q.slice(0, 5));
      }
    } else {
      // Full address: use Census Geocoder
      result = await lookupViaCensus(q);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Zip district lookup error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
