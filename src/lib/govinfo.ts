import { cache, TTL } from "./cache";
import type { GAOReport } from "@/data/types";

export async function getGAOReports(
  options?: { keyword?: string; limit?: number }
): Promise<GAOReport[]> {
  const keyword = options?.keyword || "";
  const limit = options?.limit || 50;
  const cacheKey = `gao:${keyword}:${limit}`;
  const cached = cache.get<GAOReport[]>(cacheKey);
  if (cached) return cached;

  // GovInfo uses its own key system (govinfo.gov/api-signup), not api.data.gov
  // Fall back to DEMO_KEY which is rate-limited but functional
  const apiKey = process.env.GOVINFO_API_KEY || "DEMO_KEY";

  try {
    // Fetch recent GAO reports (last 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const startDate = twoYearsAgo.toISOString().split(".")[0] + "Z";

    const collectionUrl = `https://api.govinfo.gov/collections/GAOREPORTS/${startDate}?pageSize=${limit}&api_key=${apiKey}&offsetMark=*`;
    let res = await fetch(collectionUrl);

    // If the configured key fails (403/401), retry with DEMO_KEY
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

    // Use collection data directly — individual summary fetches are unreliable with DEMO_KEY
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reports: GAOReport[] = packages.map((pkg: any) => ({
      packageId: pkg.packageId || "",
      title: pkg.title || "",
      dateIssued: pkg.dateIssued || pkg.lastModified || "",
      summary: pkg.title || "",
      pdfUrl: "",
      govInfoUrl: `https://www.govinfo.gov/app/details/${pkg.packageId}`,
    }));

    // Sort by date descending (newest first)
    reports.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());

    // Filter by keyword if provided
    if (keyword) {
      const kw = keyword.toLowerCase();
      reports = reports.filter(
        (r) => r.title.toLowerCase().includes(kw) || r.summary.toLowerCase().includes(kw)
      );
    }

    cache.set(cacheKey, reports, TTL.GAO);
    return reports;
  } catch (err) {
    console.error("GovInfo GAO API error:", err);
    return [];
  }
}
