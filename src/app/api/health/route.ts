import { NextResponse } from "next/server";

interface ApiCheck {
  name: string;
  status: "up" | "down" | "no_key";
  latencyMs: number;
}

async function checkApi(
  name: string,
  url: string,
  apiKey: string | undefined,
  timeout = 8000
): Promise<ApiCheck> {
  if (!apiKey && url !== "NOKEY") {
    return { name, status: "no_key", latencyMs: 0 };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    const up = res.ok || res.status === 401 || res.status === 403;
    return { name, status: up ? "up" : "down", latencyMs };
  } catch {
    return { name, status: "down", latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkApi(
      "Congress.gov",
      `https://api.congress.gov/v3/bill?api_key=${process.env.CONGRESS_GOV_API_KEY}&format=json&limit=1`,
      process.env.CONGRESS_GOV_API_KEY
    ),
    checkApi(
      "OpenFEC",
      `https://api.open.fec.gov/v1/candidates/?api_key=${process.env.OPENFEC_API_KEY}&per_page=1`,
      process.env.OPENFEC_API_KEY
    ),
    checkApi(
      "Voteview (UCLA)",
      "https://voteview.com/static/data/out/members/S119_members.csv",
      "NOKEY" // no key needed, pass sentinel
    ),
    checkApi(
      "GovInfo",
      `https://api.govinfo.gov/collections?api_key=${process.env.GOVINFO_API_KEY}&pageSize=1&offsetMark=*`,
      process.env.GOVINFO_API_KEY
    ),
    checkApi(
      "LegiScan",
      `https://api.legiscan.com/?key=${process.env.LEGISCAN_API_KEY}&op=getSessionList&state=US`,
      process.env.LEGISCAN_API_KEY
    ),
    checkApi(
      "OpenStates",
      `https://v3.openstates.org/jurisdictions?apikey=${process.env.OPENSTATES_API_KEY}&per_page=1`,
      process.env.OPENSTATES_API_KEY
    ),
    checkApi(
      "Google Civic",
      `https://www.googleapis.com/civicinfo/v2/elections?key=${process.env.GOOGLE_CIVIC_API_KEY}`,
      process.env.GOOGLE_CIVIC_API_KEY
    ),
    checkApi(
      "Senate LDA",
      `https://lda.senate.gov/api/v1/filings/?filing_year=2024&page_size=1`,
      process.env.LDA_API_KEY
    ),
    checkApi(
      "Federal Register",
      "https://www.federalregister.gov/api/v1/documents.json?per_page=1",
      "NOKEY"
    ),
    checkApi(
      "ProPublica Nonprofits",
      "https://projects.propublica.org/nonprofits/api/v2/search.json?q=test",
      "NOKEY"
    ),
    checkApi(
      "USAspending",
      "https://api.usaspending.gov/api/v2/references/toptier_agencies/",
      "NOKEY"
    ),
  ]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    apis: checks,
  });
}
