import { NextResponse } from "next/server";
import { cache } from "@/lib/cache";

interface FeedItem {
  id: string;
  type: "comment_closing" | "gao_report" | "new_rule" | "bill_action";
  title: string;
  subtitle: string;
  date: string;
  urgency: "high" | "medium" | "low";
  url?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export async function GET() {
  const cacheKey = "feed:homepage";
  const cached = cache.get<FeedItem[]>(cacheKey);
  if (cached && cached.length > 0) return NextResponse.json(cached);

  const items: FeedItem[] = [];

  // 1. Closing comment periods (Federal Register) — wider 90-day window
  try {
    const today = new Date().toISOString().split("T")[0];
    const frRes = await fetch(
      `https://www.federalregister.gov/api/v1/documents.json?conditions%5Btype%5D%5B%5D=PRORULE&conditions%5Bcomment_date%5D%5Bgte%5D=${today}&per_page=10&order=comment_date&fields%5B%5D=title&fields%5B%5D=comment_end_date&fields%5B%5D=html_url&fields%5B%5D=agencies&fields%5B%5D=document_number`
    );
    if (frRes.ok) {
      const data = await frRes.json();
      for (const doc of data.results || []) {
        const endDate = doc.comment_end_date;
        if (!endDate) continue;
        const daysLeft = Math.ceil(
          (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft < 0 || daysLeft > 90) continue;
        const agencies = (doc.agencies || [])
          .map((a: { name?: string }) => a.name || "")
          .filter(Boolean)
          .join(", ");
        items.push({
          id: `fr-${doc.document_number}`,
          type: "comment_closing",
          title: (doc.title || "").slice(0, 120),
          subtitle: `${agencies} — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left to comment`,
          date: endDate,
          urgency: daysLeft <= 7 ? "high" : daysLeft <= 14 ? "medium" : "low",
          url: doc.html_url,
          actionLabel: "SUBMIT COMMENT",
          actionUrl: `/federal-register`,
        });
      }
    }
  } catch {
    // Continue without FR data
  }

  // 2. Recent final rules (Federal Register) — new regulations taking effect
  try {
    const frRulesRes = await fetch(
      `https://www.federalregister.gov/api/v1/documents.json?conditions%5Btype%5D%5B%5D=RULE&per_page=5&order=newest&fields%5B%5D=title&fields%5B%5D=publication_date&fields%5B%5D=html_url&fields%5B%5D=agencies&fields%5B%5D=document_number`
    );
    if (frRulesRes.ok) {
      const data = await frRulesRes.json();
      for (const doc of (data.results || []).slice(0, 3)) {
        const agencies = (doc.agencies || [])
          .map((a: { name?: string }) => a.name || "")
          .filter(Boolean)
          .join(", ");
        items.push({
          id: `rule-${doc.document_number}`,
          type: "new_rule",
          title: (doc.title || "").slice(0, 120),
          subtitle: `${agencies} — New final rule published`,
          date: doc.publication_date || "",
          urgency: "low",
          url: doc.html_url,
          actionLabel: "READ RULE",
          actionUrl: `/federal-register`,
        });
      }
    }
  } catch {
    // Continue
  }

  // 3. Recent GAO reports — wider 3-month window
  try {
    const govInfoKey = process.env.GOVINFO_API_KEY || "DEMO_KEY";
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const startDate = threeMonthsAgo.toISOString().split(".")[0] + "Z";
    const gaoRes = await fetch(
      `https://api.govinfo.gov/collections/GAOREPORTS/${startDate}?pageSize=10&api_key=${govInfoKey}&offsetMark=*`
    );
    if (gaoRes.ok) {
      const data = await gaoRes.json();
      for (const pkg of (data.packages || []).slice(0, 5)) {
        const dateIssued = pkg.dateIssued || "";
        const year = new Date(dateIssued).getFullYear();
        if (year < 2024) continue;
        items.push({
          id: `gao-${pkg.packageId}`,
          type: "gao_report",
          title: (pkg.title || "").slice(0, 120),
          subtitle: "New GAO oversight report",
          date: dateIssued,
          urgency: "low",
          url: `https://www.govinfo.gov/app/details/${pkg.packageId}`,
          actionLabel: "READ REPORT",
          actionUrl: `/gao-reports`,
        });
      }
    }
  } catch {
    // Continue
  }

  // 4. Recent legislation from Congress.gov
  try {
    const congressKey = process.env.CONGRESS_GOV_API_KEY;
    if (congressKey) {
      const billRes = await fetch(
        `https://api.congress.gov/v3/bill?api_key=${congressKey}&limit=5&sort=updateDate+desc&format=json`
      );
      if (billRes.ok) {
        const data = await billRes.json();
        for (const bill of (data.bills || []).slice(0, 3)) {
          const actionDate = bill.latestAction?.actionDate || bill.updateDate || "";
          items.push({
            id: `bill-${bill.number}-${bill.congress}`,
            type: "bill_action",
            title: (bill.title || "").slice(0, 120),
            subtitle: bill.latestAction?.text
              ? `${bill.type?.toUpperCase() || ""} ${bill.number} — ${(bill.latestAction.text || "").slice(0, 80)}`
              : `${bill.type?.toUpperCase() || ""} ${bill.number} — Legislative action`,
            date: actionDate,
            urgency: "low",
            url: bill.url || "",
            actionLabel: "VIEW BILL",
            actionUrl: `/bills`,
          });
        }
      }
    }
  } catch {
    // Continue
  }

  // Sort by date descending, take top 8
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const result = items.slice(0, 8);

  // Only cache if we got results; cache empty results for just 5 min
  cache.set(cacheKey, result, result.length > 0 ? 1800 : 300);
  return NextResponse.json(result);
}
