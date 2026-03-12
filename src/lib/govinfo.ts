import { cache, TTL } from "./cache";
import type { GAOReport } from "@/data/types";

// Map common keywords in GAO report titles to topic categories
function categorizeReport(title: string): string | undefined {
  const t = title.toLowerCase();
  if (t.includes("defense") || t.includes("military") || t.includes("dod") || t.includes("army") || t.includes("navy")) return "Defense";
  if (t.includes("health") || t.includes("medicare") || t.includes("medicaid") || t.includes("hospital")) return "Healthcare";
  if (t.includes("cyber") || t.includes("information security") || t.includes("data breach")) return "Cybersecurity";
  if (t.includes("education") || t.includes("student") || t.includes("school")) return "Education";
  if (t.includes("environment") || t.includes("epa") || t.includes("climate") || t.includes("pollution")) return "Environment";
  if (t.includes("financial") || t.includes("banking") || t.includes("treasury") || t.includes("irs") || t.includes("tax")) return "Financial";
  if (t.includes("technology") || t.includes("it ") || t.includes("artificial intelligence") || t.includes("software")) return "Technology";
  if (t.includes("transport") || t.includes("faa") || t.includes("aviation") || t.includes("highway") || t.includes("rail")) return "Transportation";
  if (t.includes("veteran") || t.includes("va ")) return "Veterans";
  if (t.includes("homeland") || t.includes("border") || t.includes("immigration") || t.includes("fema")) return "Homeland Security";
  if (t.includes("energy") || t.includes("nuclear") || t.includes("oil") || t.includes("gas")) return "Energy";
  if (t.includes("housing") || t.includes("hud")) return "Housing";
  return undefined;
}

export async function getGAOReports(
  options?: { keyword?: string; limit?: number }
): Promise<GAOReport[]> {
  const keyword = options?.keyword || "";
  const limit = options?.limit || 100;
  const cacheKey = `gao:${keyword}:${limit}`;
  const cached = cache.get<GAOReport[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.GOVINFO_API_KEY || "DEMO_KEY";

  try {
    // Fetch recent GAO reports — use 2 years ago as the modification date threshold
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const startDate = twoYearsAgo.toISOString().split(".")[0] + "Z";

    const collectionUrl = `https://api.govinfo.gov/collections/GAOREPORTS/${startDate}?pageSize=${limit}&api_key=${apiKey}&offsetMark=*`;
    let res = await fetch(collectionUrl);

    // If the configured key fails, retry with DEMO_KEY
    if (!res.ok && apiKey !== "DEMO_KEY") {
      const fallbackUrl = collectionUrl.replace(`api_key=${apiKey}`, "api_key=DEMO_KEY");
      res = await fetch(fallbackUrl);
    }

    if (!res.ok) {
      console.error(`GovInfo API returned ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const packages = data.packages || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reports: GAOReport[] = packages.map((pkg: any) => {
      const pkgId = pkg.packageId || "";
      // Extract report number: "GAOREPORTS-GAO-24-106155" → "GAO-24-106155"
      const reportNumber = pkgId.replace(/^GAOREPORTS-/, "") || pkgId;
      const title = pkg.title || "";
      return {
        packageId: pkgId,
        reportNumber,
        title,
        dateIssued: pkg.dateIssued || pkg.lastModified || "",
        summary: title,
        pdfUrl: pkgId
          ? `https://www.govinfo.gov/content/pkg/${pkgId}/pdf/${pkgId}.pdf`
          : "",
        govInfoUrl: `https://www.govinfo.gov/app/details/${pkgId}`,
        category: categorizeReport(title),
      };
    });

    // ── KEY FIX: Filter out old re-indexed reports ──
    // The GovInfo collections endpoint returns packages *modified* since startDate,
    // not necessarily *published* since then. Old reports get re-indexed regularly.
    // Only keep reports actually issued in the last ~2 years.
    const cutoffYear = new Date().getFullYear() - 2;
    reports = reports.filter((r) => {
      if (!r.dateIssued) return false;
      const year = new Date(r.dateIssued).getFullYear();
      return year >= cutoffYear && !isNaN(year);
    });

    // Sort by date descending (newest first)
    reports.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());

    // Filter by keyword if provided
    if (keyword) {
      const kw = keyword.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.title.toLowerCase().includes(kw) ||
          r.summary.toLowerCase().includes(kw) ||
          (r.category || "").toLowerCase().includes(kw)
      );
    }

    cache.set(cacheKey, reports, TTL.GAO);
    return reports;
  } catch (err) {
    console.error("GovInfo GAO API error:", err);
    return [];
  }
}
