import type { VotingCategory, KeyVote } from "@/data/types";

// LegiScan roll call vote response
interface LegiScanRollCall {
  roll_call_id: number;
  bill_id: number;
  date: string;
  desc: string;
  yea: number;
  nay: number;
  nv: number;
  absent: number;
  passed: number;
  chamber: string;
  votes: Array<{
    people_id: number;
    vote_id: number;
    vote_text: "Yea" | "Nay" | "NV" | "Absent";
  }>;
}

interface LegiScanBill {
  bill_id: number;
  bill_number: string;
  title: string;
  description: string;
  state: string;
  session: { session_id: number; session_name: string };
  subjects?: Array<{ subject_name: string }>;
}

interface LegiScanPersonVote {
  roll_call_id: number;
  bill: {
    bill_id: number;
    bill_number: string;
    title: string;
  };
  date: string;
  desc: string;
  vote_text: "Yea" | "Nay" | "NV" | "Absent";
  chamber: string;
}

// Map LegiScan subjects to our voting categories
const CATEGORY_MAP: Record<string, string> = {
  Health: "Healthcare",
  "Health Care": "Healthcare",
  Medicare: "Healthcare",
  Medicaid: "Healthcare",
  Environment: "Environment",
  "Climate Change": "Environment",
  Energy: "Environment",
  Housing: "Housing",
  Immigration: "Immigration",
  Education: "Education",
  Employment: "Economy",
  Taxes: "Economy",
  "Trade Policy": "Economy",
  Budget: "Economy",
  "Civil Rights": "Civil Rights",
  "Criminal Justice": "Civil Rights",
  Defense: "Defense",
  "Foreign Policy": "Defense",
  "National Security": "Defense",
  "Gun Control": "Gun Policy",
  Firearms: "Gun Policy",
  Technology: "Technology",
  Transportation: "Transportation",
  Agriculture: "Agriculture",
};

function categorizeVote(description: string, subjects: string[]): string {
  // Try to match from subjects first
  for (const subject of subjects) {
    if (CATEGORY_MAP[subject]) return CATEGORY_MAP[subject];
  }
  // Fallback: keyword match on description
  const desc = description.toLowerCase();
  if (desc.includes("health") || desc.includes("medic")) return "Healthcare";
  if (desc.includes("climate") || desc.includes("environment") || desc.includes("energy"))
    return "Environment";
  if (desc.includes("immigra") || desc.includes("border")) return "Immigration";
  if (desc.includes("education") || desc.includes("school")) return "Education";
  if (desc.includes("tax") || desc.includes("budget") || desc.includes("appropriation"))
    return "Economy";
  if (desc.includes("defense") || desc.includes("military") || desc.includes("foreign"))
    return "Defense";
  return "Other";
}

export function transformVotesToCategories(
  votes: LegiScanPersonVote[],
  subjects: Map<number, string[]>
): VotingCategory[] {
  const categoryYeaNay = new Map<string, { yea: number; nay: number }>();

  for (const vote of votes) {
    if (vote.vote_text !== "Yea" && vote.vote_text !== "Nay") continue;
    const billSubjects = subjects.get(vote.bill.bill_id) || [];
    const category = categorizeVote(vote.desc, billSubjects);

    const counts = categoryYeaNay.get(category) || { yea: 0, nay: 0 };
    if (vote.vote_text === "Yea") counts.yea++;
    else counts.nay++;
    categoryYeaNay.set(category, counts);
  }

  return Array.from(categoryYeaNay.entries())
    .map(([category, counts]) => ({ category, ...counts }))
    .sort((a, b) => (b.yea + b.nay) - (a.yea + a.nay));
}

export function transformKeyVotes(
  votes: LegiScanPersonVote[],
  partyMajorityVotes: Map<number, "Yea" | "Nay">
): KeyVote[] {
  return votes
    .filter((v) => v.vote_text === "Yea" || v.vote_text === "Nay")
    .slice(0, 20)
    .map((v) => {
      const partyMajority = partyMajorityVotes.get(v.roll_call_id);
      return {
        bill: v.bill.bill_number,
        title: v.bill.title.slice(0, 100),
        date: v.date,
        vote: v.vote_text === "Yea" ? "YEA" as const : "NAY" as const,
        brokeWithParty: partyMajority ? v.vote_text !== partyMajority : false,
      };
    });
}
