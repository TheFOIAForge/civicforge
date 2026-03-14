import { NextRequest, NextResponse } from "next/server";
import { cache, TTL } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({ windowMs: 60_000, max: 30 });

interface CongressAction {
  actionDate: string;
  text: string;
  type: string;
  actionCode?: string;
  sourceSystem?: { code: number; name: string };
  recordedVotes?: Array<{
    rollNumber: number;
    url: string;
    chamber: string;
    congress: number;
    date: string;
    sessionNumber: number;
  }>;
}

interface RollCallVote {
  memberName: string;
  party: string;
  state: string;
  vote: string;
}

interface BillResult {
  bill: {
    number: string;
    title: string;
    type: string;
    congress: string;
    latestActionDate: string;
    latestActionText: string;
    introducedDate: string;
    sponsors: string[];
  };
  actions: Array<{
    date: string;
    text: string;
    type: string;
  }>;
  rollCallVotes: RollCallVote[];
  voteTotals: {
    yea: number;
    nay: number;
    notVoting: number;
    present: number;
  } | null;
}

function parseBillInput(input: string): { type: string; number: string } | null {
  const cleaned = input.trim().replace(/\s+/g, "").toLowerCase();
  // Match patterns like hr1234, s500, hjres100, sres50, sconres10, hconres20
  const match = cleaned.match(
    /^(hr|s|hjres|sjres|hres|sres|hconres|sconres)(\d+)$/
  );
  if (match) {
    return { type: match[1], number: match[2] };
  }
  return null;
}

async function fetchBillActions(
  congress: string,
  billType: string,
  billNumber: string,
  apiKey: string
): Promise<CongressAction[]> {
  const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}/actions?api_key=${apiKey}&format=json&limit=250`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.actions || [];
}

async function fetchBillInfo(
  congress: string,
  billType: string,
  billNumber: string,
  apiKey: string
) {
  const url = `https://api.congress.gov/v3/bill/${congress}/${billType}/${billNumber}?api_key=${apiKey}&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.bill || null;
}

async function fetchRollCallVotes(
  voteUrl: string
): Promise<{ votes: RollCallVote[]; totals: BillResult["voteTotals"] }> {
  // Congress.gov roll call URLs point to XML endpoints
  // We try to fetch and parse them
  try {
    // House roll call votes: clerk.house.gov
    // Senate roll call votes: senate.gov
    const res = await fetch(voteUrl);
    if (!res.ok) return { votes: [], totals: null };
    const text = await res.text();

    const votes: RollCallVote[] = [];
    let yea = 0;
    let nay = 0;
    let notVoting = 0;
    let present = 0;

    // Parse Senate XML format
    if (text.includes("<roll_call_vote")) {
      const memberRegex =
        /<member>\s*<member_full>(.*?)<\/member_full>[\s\S]*?<party>(.*?)<\/party>[\s\S]*?<state>(.*?)<\/state>[\s\S]*?<vote_cast>(.*?)<\/vote_cast>/g;
      let match;
      while ((match = memberRegex.exec(text)) !== null) {
        const vote = match[4].trim();
        votes.push({
          memberName: match[1].trim(),
          party: match[2].trim(),
          state: match[3].trim(),
          vote: vote,
        });
        const voteUpper = vote.toUpperCase();
        if (voteUpper === "YEA" || voteUpper === "AYE") yea++;
        else if (voteUpper === "NAY" || voteUpper === "NO") nay++;
        else if (voteUpper === "NOT VOTING") notVoting++;
        else if (voteUpper === "PRESENT") present++;
      }

      // Also try to get totals from the summary section
      const yeaMatch = text.match(/<yeas>(\d+)<\/yeas>/);
      const nayMatch = text.match(/<nays>(\d+)<\/nays>/);
      if (yeaMatch) yea = parseInt(yeaMatch[1]);
      if (nayMatch) nay = parseInt(nayMatch[1]);
    }

    // Parse House XML format
    if (text.includes("<rollcall-vote")) {
      const memberRegex =
        /<recorded-vote>\s*<legislator[^>]*party="([^"]*)"[^>]*state="([^"]*)"[^>]*>([\s\S]*?)<\/legislator>\s*<vote>([\s\S]*?)<\/vote>/g;
      let match;
      while ((match = memberRegex.exec(text)) !== null) {
        const vote = match[4].trim();
        votes.push({
          memberName: match[3].trim(),
          party: match[1].trim(),
          state: match[2].trim(),
          vote: vote,
        });
        const voteUpper = vote.toUpperCase();
        if (voteUpper === "YEA" || voteUpper === "AYE") yea++;
        else if (voteUpper === "NAY" || voteUpper === "NO" || voteUpper === "NAYE") nay++;
        else if (voteUpper === "NOT VOTING") notVoting++;
        else if (voteUpper === "PRESENT") present++;
      }

      const totalYea = text.match(/<yea-total>(\d+)<\/yea-total>/);
      const totalNay = text.match(/<nay-total>(\d+)<\/nay-total>/);
      if (totalYea) yea = parseInt(totalYea[1]);
      if (totalNay) nay = parseInt(totalNay[1]);
    }

    return {
      votes,
      totals: votes.length > 0 ? { yea, nay, notVoting, present } : null,
    };
  } catch {
    return { votes: [], totals: null };
  }
}

export async function GET(request: NextRequest) {
  const limited = limiter.check(request);
  if (limited) return limited;

  const billNumber = request.nextUrl.searchParams.get("billNumber") || "";
  const congress = request.nextUrl.searchParams.get("congress") || "119";

  if (!billNumber) {
    return NextResponse.json(
      { error: "billNumber parameter required (e.g., hr1234, s500)" },
      { status: 400 }
    );
  }

  const parsed = parseBillInput(billNumber);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "Invalid bill number format. Use formats like: HR 1234, S 500, HJRes 100",
      },
      { status: 400 }
    );
  }

  const cacheKey = `votes:${congress}:${parsed.type}:${parsed.number}`;
  const cached = cache.get<BillResult>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const apiKey = process.env.CONGRESS_GOV_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CONGRESS_GOV_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const [billInfo, actions] = await Promise.all([
      fetchBillInfo(congress, parsed.type, parsed.number, apiKey),
      fetchBillActions(congress, parsed.type, parsed.number, apiKey),
    ]);

    if (!billInfo) {
      return NextResponse.json(
        { error: "Bill not found. Check the bill number and congress session." },
        { status: 404 }
      );
    }

    // Find any recorded votes in the actions
    let rollCallVotes: RollCallVote[] = [];
    let voteTotals: BillResult["voteTotals"] = null;

    for (const action of actions) {
      if (action.recordedVotes && action.recordedVotes.length > 0) {
        // Fetch the most recent recorded vote
        const latestVote = action.recordedVotes[action.recordedVotes.length - 1];
        if (latestVote.url) {
          const result = await fetchRollCallVotes(latestVote.url);
          if (result.votes.length > 0) {
            rollCallVotes = result.votes;
            voteTotals = result.totals;
            break;
          }
        }
      }
    }

    const sponsors: string[] = [];
    if (billInfo.sponsors) {
      for (const s of billInfo.sponsors) {
        const name = [s.firstName, s.lastName].filter(Boolean).join(" ");
        sponsors.push(name || s.fullName || "Unknown");
      }
    }

    const result: BillResult = {
      bill: {
        number: `${parsed.type.toUpperCase()} ${parsed.number}`,
        title: billInfo.title || "Untitled",
        type: parsed.type.toUpperCase(),
        congress,
        latestActionDate: billInfo.latestAction?.actionDate || "",
        latestActionText: billInfo.latestAction?.text || "",
        introducedDate: billInfo.introducedDate || "",
        sponsors,
      },
      actions: actions
        .map((a: CongressAction) => ({
          date: a.actionDate,
          text: a.text,
          type: a.type || "",
        }))
        .sort(
          (a: { date: string }, b: { date: string }) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      rollCallVotes,
      voteTotals,
    };

    cache.set(cacheKey, result, TTL.VOTES);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Votes API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bill data" },
      { status: 500 }
    );
  }
}
