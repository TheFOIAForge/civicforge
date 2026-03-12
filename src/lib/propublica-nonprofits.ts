import { cache, TTL } from "./cache";
import type { DarkMoneyConnection, NonprofitInfo, Representative } from "@/data/types";
import { fuzzyNameMatch } from "./utils/string-match";
import { getMemberById } from "./members";

async function searchNonprofit(name: string): Promise<NonprofitInfo[]> {
  const cacheKey = `nonprofit:${name}`;
  const cached = cache.get<NonprofitInfo[]>(cacheKey);
  if (cached) return cached;

  try {
    // Strip common PAC/committee suffixes before searching
    const cleanName = name
      .replace(/\b(pac|super pac|political action committee|committee)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleanName.length < 3) return [];

    const res = await fetch(
      `https://projects.propublica.org/nonprofits/api/v2/search.json?q=${encodeURIComponent(cleanName)}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    const orgs = data.organizations || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: NonprofitInfo[] = orgs.slice(0, 5).map((org: any) => ({
      ein: String(org.ein || ""),
      name: org.name || "",
      city: org.city || "",
      state: org.state || "",
      totalRevenue: org.total_revenue || 0,
      totalExpenses: org.total_expenses || 0,
      totalAssets: org.total_assets || 0,
      taxPeriod: org.tax_period ? String(org.tax_period) : "",
    }));

    cache.set(cacheKey, results, TTL.NONPROFITS);
    return results;
  } catch (err) {
    console.error(`ProPublica Nonprofit search error for "${name}":`, err);
    return [];
  }
}

export async function getDarkMoneyConnections(
  bioguideId: string
): Promise<DarkMoneyConnection[]> {
  const cacheKey = `darkmoney:${bioguideId}`;
  const cached = cache.get<DarkMoneyConnection[]>(cacheKey);
  if (cached) return cached;

  const member = getMemberById(bioguideId);
  if (!member?.outsideSpending?.length) return [];

  try {
    // For each outside spender, search for connected nonprofits
    const connections: DarkMoneyConnection[] = [];

    // Limit to top 10 outside spenders to avoid rate limiting
    const spenders = member.outsideSpending.slice(0, 10);

    for (const spender of spenders) {
      const nonprofits = await searchNonprofit(spender.name);

      // Filter to nonprofits that fuzzy-match the spender name
      const matched = nonprofits.filter((np) =>
        fuzzyNameMatch(spender.name, np.name)
      );

      if (matched.length > 0) {
        connections.push({
          spenderName: spender.name,
          spenderAmount: spender.amount,
          support: spender.support,
          connectedNonprofits: matched,
        });
      }

      // Small delay to be polite to ProPublica
      await new Promise((r) => setTimeout(r, 100));
    }

    cache.set(cacheKey, connections, TTL.NONPROFITS);
    return connections;
  } catch (err) {
    console.error(`Dark money lookup error for ${bioguideId}:`, err);
    return [];
  }
}
