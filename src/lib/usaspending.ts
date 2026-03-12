import { cache, TTL } from "./cache";
import type { DistrictSpendingSummary, DistrictSpending, Representative } from "@/data/types";
import { fuzzyNameMatch, formatMoney } from "./utils/string-match";
import { getMemberById } from "./members";

export async function getDistrictSpending(
  stateAbbr: string,
  district?: string
): Promise<DistrictSpendingSummary | null> {
  const cacheKey = `spending:${stateAbbr}:${district || "statewide"}`;
  const cached = cache.get<DistrictSpendingSummary>(cacheKey);
  if (cached) return cached;

  try {
    // Build location filter
    const location: Record<string, string> = {
      country: "USA",
      state: stateAbbr,
    };
    if (district) {
      // USAspending uses 2-digit district codes
      location.congressional_code = district.replace(/\D/g, "").padStart(2, "0");
    }

    // Current fiscal year
    const now = new Date();
    const fy = now.getMonth() >= 9 ? now.getFullYear() + 1 : now.getFullYear();
    const startDate = `${fy - 1}-10-01`;
    const endDate = `${fy}-09-30`;

    const body = {
      filters: {
        place_of_performance_locations: [location],
        time_period: [{ start_date: startDate, end_date: endDate }],
      },
      fields: [
        "Award ID",
        "Recipient Name",
        "Award Amount",
        "Awarding Agency",
        "Description",
        "Award Type",
      ],
      limit: 100,
      order: "desc",
      sort: "Award Amount",
    };

    const res = await fetch(
      "https://api.usaspending.gov/api/v2/search/spending_by_award/",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const results = data.results || [];

    // Process awards
    let totalObligated = 0;
    let contractCount = 0;
    let grantCount = 0;
    const recipientTotals = new Map<string, number>();
    const agencyTotals = new Map<string, number>();
    const awards: DistrictSpending[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of results) {
      const amount = r["Award Amount"] || 0;
      const recipient = r["Recipient Name"] || "Unknown";
      const agency = r["Awarding Agency"] || "Unknown";
      const awardType = (r["Award Type"] || "").toLowerCase();

      totalObligated += amount;
      if (awardType.includes("contract") || awardType.includes("idv")) {
        contractCount++;
      } else {
        grantCount++;
      }

      recipientTotals.set(recipient, (recipientTotals.get(recipient) || 0) + amount);
      agencyTotals.set(agency, (agencyTotals.get(agency) || 0) + amount);

      awards.push({
        recipientName: recipient,
        awardAmount: amount,
        awardingAgency: agency,
        description: r.Description || "",
        awardType: awardType.includes("contract") ? "contract" : "grant",
      });
    }

    // Top 10 recipients and agencies
    const topRecipients = [...recipientTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, total]) => ({ name, total }));

    const topAgencies = [...agencyTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, total]) => ({ name, total }));

    const summary: DistrictSpendingSummary = {
      totalObligated,
      contractCount,
      grantCount,
      topRecipients,
      topAgencies,
      awards: awards.slice(0, 20),
      donorContractorOverlaps: [], // populated later when cross-referencing
    };

    cache.set(cacheKey, summary, TTL.SPENDING);
    return summary;
  } catch (err) {
    console.error(`USAspending API error for ${stateAbbr}-${district}:`, err);
    return null;
  }
}

export async function getDistrictSpendingForMember(
  bioguideId: string
): Promise<DistrictSpendingSummary | null> {
  const member = getMemberById(bioguideId);
  if (!member) return null;

  const spending = await getDistrictSpending(
    member.stateAbbr,
    member.chamber === "House" ? member.district : undefined
  );

  if (!spending) return null;

  // Cross-reference top recipients against member's top donors
  const donorNames = (member.topDonors || []).map((d) => d.name);
  const overlaps = spending.topRecipients
    .filter((r) => donorNames.some((d) => fuzzyNameMatch(d, r.name)))
    .map((r) => r.name);

  return { ...spending, donorContractorOverlaps: overlaps };
}
