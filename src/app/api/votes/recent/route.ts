import { NextRequest, NextResponse } from "next/server";
import { cache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import type { RecentRollCallVote } from "@/data/types";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const cacheKey = "votes:recent";
  const cached = cache.get<RecentRollCallVote[]>(cacheKey);
  if (cached && cached.length > 0) return NextResponse.json(cached);

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CONGRESS_GOV_API_KEY not configured" },
      { status: 500 }
    );
  }

  const votes: RecentRollCallVote[] = [];

  // Fetch recent bills and look for those with recorded vote actions
  try {
    const billRes = await fetch(
      `https://api.congress.gov/v3/bill?api_key=${apiKey}&format=json&limit=40&sort=updateDate+desc`
    );
    if (billRes.ok) {
      const data = await billRes.json();
      const bills = data.bills || [];

      // For each bill, check for recorded votes via actions endpoint
      // Process in batches to avoid hammering the API
      const billsToCheck = bills.slice(0, 20);

      for (const bill of billsToCheck) {
        if (votes.length >= 15) break;

        try {
          const actionsUrl = bill.latestAction?.actionDate
            ? `https://api.congress.gov/v3/bill/${bill.congress}/${bill.type?.toLowerCase()}/${bill.number}/actions?api_key=${apiKey}&format=json&limit=20`
            : null;

          if (!actionsUrl) continue;

          const actRes = await fetch(actionsUrl);
          if (!actRes.ok) continue;
          const actData = await actRes.json();
          const actions = actData.actions || [];

          for (const action of actions) {
            if (action.recordedVotes && action.recordedVotes.length > 0) {
              for (const rv of action.recordedVotes) {
                // Parse vote totals from the roll call URL
                let yea = 0, nay = 0, notVoting = 0;

                try {
                  const voteRes = await fetch(rv.url);
                  if (voteRes.ok) {
                    const xml = await voteRes.text();

                    // Senate XML
                    if (xml.includes("<roll_call_vote")) {
                      const yeaMatch = xml.match(/<yeas>(\d+)<\/yeas>/);
                      const nayMatch = xml.match(/<nays>(\d+)<\/nays>/);
                      if (yeaMatch) yea = parseInt(yeaMatch[1]);
                      if (nayMatch) nay = parseInt(nayMatch[1]);

                      // Count not voting
                      const nvMatches = xml.match(/Not Voting/g);
                      notVoting = nvMatches ? nvMatches.length : 0;
                    }

                    // House XML
                    if (xml.includes("<rollcall-vote")) {
                      const yeaTotal = xml.match(/<yea-total>(\d+)<\/yea-total>/);
                      const nayTotal = xml.match(/<nay-total>(\d+)<\/nay-total>/);
                      const nvTotal = xml.match(/<not-voting-total>(\d+)<\/not-voting-total>/);
                      const presentTotal = xml.match(/<present-total>(\d+)<\/present-total>/);
                      if (yeaTotal) yea = parseInt(yeaTotal[1]);
                      if (nayTotal) nay = parseInt(nayTotal[1]);
                      if (nvTotal) notVoting = parseInt(nvTotal[1]);
                      if (presentTotal) notVoting += parseInt(presentTotal[1]);
                    }
                  }
                } catch {
                  // Skip vote total parsing on error
                }

                const resultText = yea > nay ? "Passed" : nay > yea ? "Failed" : "Unknown";

                votes.push({
                  congress: rv.congress || bill.congress,
                  chamber: rv.chamber === "Senate" ? "Senate" : "House",
                  date: rv.date || action.actionDate || "",
                  question: action.text || "Roll Call Vote",
                  result: resultText,
                  billNumber: `${(bill.type || "").toUpperCase()} ${bill.number}`,
                  billTitle: (bill.title || "").slice(0, 150),
                  yea,
                  nay,
                  notVoting,
                  url: rv.url,
                });
              }
              break; // Only get the first recorded vote per bill
            }
          }
        } catch {
          continue;
        }
      }
    }
  } catch (err) {
    console.error("Recent votes API error:", err);
  }

  // Sort by date descending
  votes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const result = votes.slice(0, 15);

  // Cache for 30 minutes
  cache.set(cacheKey, result, 1800);
  return NextResponse.json(result);
}
