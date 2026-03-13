/**
 * Compare Representatives — Verdict Engine
 * Pure functions that compute template-driven verdicts from rep data.
 * No API calls — works entirely from the Representative type.
 */

import type { Representative } from "@/data/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type Winner = "A" | "B" | "tie";
export type Margin = "decisive" | "moderate" | "slight" | "negligible";

export interface CategoryVerdict {
  winner: Winner;
  winnerName: string;
  loserName: string;
  margin: Margin;
  summary: string;
  detail?: string;
  labelA: string;
  labelB: string;
  valueA: number;
  valueB: number;
}

export interface OverallVerdict {
  winsA: number;
  winsB: number;
  ties: number;
  characterizationA: string;
  characterizationB: string;
  overallSummary: string;
}

export interface ComparisonVerdicts {
  partyLoyalty: CategoryVerdict;
  attendance: CategoryVerdict;
  legislative: CategoryVerdict;
  finance: CategoryVerdict;
  votingRecord: CategoryVerdict;
  committees: CategoryVerdict;
  keyVotes: CategoryVerdict;
  ethics: CategoryVerdict;
  overall: OverallVerdict;
  categories: { key: string; label: string; icon: string; verdict: CategoryVerdict }[];
}

// ─── Thresholds (tunable) ────────────────────────────────────────────────────

const THRESHOLDS = {
  decisive: 20,
  moderate: 10,
  slight: 3,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMargin(diff: number): Margin {
  const abs = Math.abs(diff);
  if (abs >= THRESHOLDS.decisive) return "decisive";
  if (abs >= THRESHOLDS.moderate) return "moderate";
  if (abs >= THRESHOLDS.slight) return "slight";
  return "negligible";
}

function shortName(rep: Representative): string {
  const prefix = rep.chamber === "Senate" ? "Sen." : "Rep.";
  return `${prefix} ${rep.lastName}`;
}

function partyName(party: string): string {
  return party === "R" ? "Republican" : party === "D" ? "Democrat" : "Independent";
}

function parseDollars(s: string): number {
  return Number(s.replace(/[$,]/g, "")) || 0;
}

function pct(n: number): string {
  return n.toFixed(1) + "%";
}

function attendance(rep: Representative): number {
  const total = rep.votesCast + rep.missedVotes;
  return total > 0 ? (rep.votesCast / total) * 100 : 100;
}

function successRate(rep: Representative): number {
  return rep.billsIntroduced > 0
    ? (rep.billsEnacted / rep.billsIntroduced) * 100
    : 0;
}

// ─── Category Verdicts ───────────────────────────────────────────────────────

function partyLoyaltyVerdict(a: Representative, b: Representative): CategoryVerdict {
  const diff = a.partyLoyalty - b.partyLoyalty;
  const margin = getMargin(diff);
  // Winner = more INDEPENDENT (lower loyalty)
  const moreIndependent = a.partyLoyalty < b.partyLoyalty ? "A" : a.partyLoyalty > b.partyLoyalty ? "B" : "tie";
  const winner = margin === "negligible" ? "tie" : moreIndependent;

  const wRep = winner === "A" ? a : b;
  const lRep = winner === "A" ? b : a;

  let summary: string;
  if (winner === "tie") {
    summary = `Both ${shortName(a)} and ${shortName(b)} vote with their parties at nearly identical rates (${pct(a.partyLoyalty)} vs ${pct(b.partyLoyalty)}).`;
  } else {
    summary = `${shortName(wRep)} votes with their party ${pct(wRep.partyLoyalty)} of the time vs. ${shortName(lRep)} at ${pct(lRep.partyLoyalty)}. ${shortName(wRep)} is more willing to break with the ${partyName(wRep.party)} party line.`;
  }

  return {
    winner, margin, summary,
    winnerName: winner === "tie" ? "Tie" : wRep.fullName,
    loserName: winner === "tie" ? "" : lRep.fullName,
    labelA: pct(a.partyLoyalty), labelB: pct(b.partyLoyalty),
    valueA: a.partyLoyalty, valueB: b.partyLoyalty,
  };
}

function attendanceVerdict(a: Representative, b: Representative): CategoryVerdict {
  const attA = attendance(a);
  const attB = attendance(b);
  const diff = attA - attB;
  const margin = getMargin(diff);
  const better = attA > attB ? "A" : attA < attB ? "B" : "tie";
  const winner = margin === "negligible" ? "tie" : better;

  const wRep = winner === "A" ? a : b;
  const lRep = winner === "A" ? b : a;
  const wAtt = winner === "A" ? attA : attB;
  const lAtt = winner === "A" ? attB : attA;

  let summary: string;
  if (winner === "tie") {
    summary = `Both representatives have comparable attendance records, showing up for approximately ${pct(attA)} of votes.`;
  } else {
    summary = `${shortName(wRep)} has attended ${pct(wAtt)} of votes compared to ${shortName(lRep)}'s ${pct(lAtt)}.`;
    if (lAtt < 85) {
      summary += ` ${shortName(lRep)} has a notably poor attendance record, missing more than 1 in 7 votes.`;
    }
  }

  return {
    winner, margin, summary,
    winnerName: winner === "tie" ? "Tie" : wRep.fullName,
    loserName: winner === "tie" ? "" : lRep.fullName,
    labelA: pct(attA), labelB: pct(attB),
    valueA: attA, valueB: attB,
  };
}

function legislativeVerdict(a: Representative, b: Representative): CategoryVerdict {
  const srA = successRate(a);
  const srB = successRate(b);
  // If both have fewer than 3 bills, compare by enactment count
  const useEnacted = a.billsIntroduced < 3 && b.billsIntroduced < 3;
  const valA = useEnacted ? a.billsEnacted : srA;
  const valB = useEnacted ? b.billsEnacted : srB;
  const diff = valA - valB;
  const margin = useEnacted ? (Math.abs(diff) >= 2 ? "moderate" : diff !== 0 ? "slight" : "negligible") : getMargin(diff);
  const better = valA > valB ? "A" : valA < valB ? "B" : "tie";
  const winner = margin === "negligible" ? "tie" : better;

  const wRep = winner === "A" ? a : b;
  const lRep = winner === "A" ? b : a;

  let summary: string;
  if (winner === "tie") {
    summary = `Both legislators have comparable legislative records with similar success rates.`;
  } else {
    summary = `${shortName(wRep)} has enacted ${wRep.billsEnacted} of ${wRep.billsIntroduced} bills (${pct(successRate(wRep))} success rate) vs. ${shortName(lRep)}'s ${lRep.billsEnacted} of ${lRep.billsIntroduced} (${pct(successRate(lRep))}).`;
    if (lRep.billsIntroduced > wRep.billsIntroduced * 2) {
      summary += ` While ${shortName(lRep)} introduces more bills, ${shortName(wRep)} is far more effective at getting them signed into law.`;
    }
  }

  return {
    winner, margin, summary,
    winnerName: winner === "tie" ? "Tie" : wRep.fullName,
    loserName: winner === "tie" ? "" : lRep.fullName,
    labelA: `${a.billsEnacted}/${a.billsIntroduced}`, labelB: `${b.billsEnacted}/${b.billsIntroduced}`,
    valueA: srA, valueB: srB,
  };
}

function financeVerdict(a: Representative, b: Representative): CategoryVerdict {
  // Winner = higher small dollar %
  const diff = a.smallDollarPct - b.smallDollarPct;
  const margin = getMargin(diff);
  const better = a.smallDollarPct > b.smallDollarPct ? "A" : a.smallDollarPct < b.smallDollarPct ? "B" : "tie";
  const winner = margin === "negligible" ? "tie" : better;

  const wRep = winner === "A" ? a : b;
  const lRep = winner === "A" ? b : a;

  const totalA = parseDollars(a.totalFundraising);
  const totalB = parseDollars(b.totalFundraising);

  let summary: string;
  if (winner === "tie") {
    summary = `Both representatives have similar grassroots funding profiles.`;
  } else {
    summary = `${shortName(wRep)} receives ${wRep.smallDollarPct}% of funding from small-dollar donors vs. ${shortName(lRep)}'s ${lRep.smallDollarPct}%, indicating a more grassroots-funded operation.`;
    if (totalA !== totalB) {
      const biggerRaiser = totalA > totalB ? a : b;
      summary += ` ${shortName(biggerRaiser)} has raised more overall ($${(Math.max(totalA, totalB) / 1e6).toFixed(1)}M vs. $${(Math.min(totalA, totalB) / 1e6).toFixed(1)}M).`;
    }
  }

  return {
    winner, margin, summary,
    winnerName: winner === "tie" ? "Tie" : wRep.fullName,
    loserName: winner === "tie" ? "" : lRep.fullName,
    labelA: `${a.smallDollarPct}%`, labelB: `${b.smallDollarPct}%`,
    valueA: a.smallDollarPct, valueB: b.smallDollarPct,
  };
}

function votingRecordVerdict(a: Representative, b: Representative): CategoryVerdict {
  // Compare shared issue categories — find biggest divergences
  const catMapA = new Map(a.votingRecord.map(v => [v.category, v]));
  const catMapB = new Map(b.votingRecord.map(v => [v.category, v]));

  let totalDivergence = 0;
  let sharedCount = 0;
  const divergences: { cat: string; pctA: number; pctB: number; diff: number }[] = [];

  for (const [cat, vA] of catMapA) {
    const vB = catMapB.get(cat);
    if (vB) {
      sharedCount++;
      const totalA = vA.yea + vA.nay;
      const totalB = vB.yea + vB.nay;
      const pctA = totalA > 0 ? (vA.yea / totalA) * 100 : 50;
      const pctB = totalB > 0 ? (vB.yea / totalB) * 100 : 50;
      const diff = Math.abs(pctA - pctB);
      totalDivergence += diff;
      divergences.push({ cat, pctA, pctB, diff });
    }
  }

  const avgDivergence = sharedCount > 0 ? totalDivergence / sharedCount : 0;
  divergences.sort((x, y) => y.diff - x.diff);

  // No clear "winner" for issue voting — frame as similarity/difference
  const margin: Margin = sharedCount === 0 ? "negligible" : avgDivergence > 30 ? "decisive" : avgDivergence > 15 ? "moderate" : avgDivergence > 5 ? "slight" : "negligible";

  let summary: string;
  if (sharedCount === 0) {
    summary = `Issue-by-issue voting data is not yet available for ${shortName(a)} and ${shortName(b)}. This will be populated when live vote data is connected.`;
  } else if (avgDivergence <= 5) {
    summary = `${shortName(a)} and ${shortName(b)} vote remarkably similarly across issue categories, with minimal divergence.`;
  } else if (divergences.length > 0) {
    const top = divergences[0];
    summary = `These representatives diverge most on ${top.cat}, where ${shortName(a)} voted yes ${pct(top.pctA)} of the time vs. ${shortName(b)} at ${pct(top.pctB)}.`;
    if (divergences.length > 1) {
      summary += ` They also split on ${divergences[1].cat}.`;
    }
  } else {
    summary = `Insufficient shared voting data to compare issue-by-issue records.`;
  }

  return {
    winner: "tie", margin, summary,
    winnerName: sharedCount === 0 ? "No Data" : "Different Priorities",
    loserName: "",
    labelA: sharedCount === 0 ? "No data" : `${sharedCount} shared categories`,
    labelB: sharedCount === 0 ? "" : `${pct(avgDivergence)} avg divergence`,
    valueA: 100 - avgDivergence, valueB: avgDivergence,
  };
}

function committeesVerdict(a: Representative, b: Representative): CategoryVerdict {
  const countA = a.committees.length;
  const countB = b.committees.length;
  const leadershipA = a.leadershipRole ? 3 : 0;
  const leadershipB = b.leadershipRole ? 3 : 0;
  const scoreA = countA + leadershipA;
  const scoreB = countB + leadershipB;

  const shared = a.committees.filter(c => b.committees.includes(c));

  const diff = scoreA - scoreB;
  const margin: Margin = Math.abs(diff) >= 4 ? "decisive" : Math.abs(diff) >= 2 ? "moderate" : Math.abs(diff) >= 1 ? "slight" : "negligible";
  const better = scoreA > scoreB ? "A" : scoreA < scoreB ? "B" : "tie";
  const winner = margin === "negligible" ? "tie" : better;

  const wRep = winner === "A" ? a : b;
  const lRep = winner === "A" ? b : a;

  let summary: string;
  if (winner === "tie") {
    summary = `Both serve on ${countA} and ${countB} committees respectively with comparable influence.`;
  } else {
    summary = `${shortName(wRep)} serves on ${winner === "A" ? countA : countB} committees vs. ${shortName(lRep)}'s ${winner === "A" ? countB : countA}.`;
    if (wRep.leadershipRole) {
      summary += ` ${shortName(wRep)} also holds a leadership role as ${wRep.leadershipRole}.`;
    }
  }
  if (shared.length > 0) {
    summary += ` They share ${shared.length} committee${shared.length > 1 ? "s" : ""}.`;
  }

  return {
    winner, margin, summary,
    winnerName: winner === "tie" ? "Tie" : wRep.fullName,
    loserName: winner === "tie" ? "" : lRep.fullName,
    labelA: `${countA} committees`, labelB: `${countB} committees`,
    valueA: scoreA, valueB: scoreB,
  };
}

function keyVotesVerdict(a: Representative, b: Representative): CategoryVerdict {
  // Find shared bill votes
  const votesA = new Map(a.keyVotes.map(v => [v.bill, v]));
  const agreements: string[] = [];
  const disagreements: string[] = [];
  let brokeRanksA = 0;
  let brokeRanksB = 0;

  for (const vB of b.keyVotes) {
    const vA = votesA.get(vB.bill);
    if (vA) {
      if (vA.vote === vB.vote) {
        agreements.push(vA.bill);
      } else {
        disagreements.push(vA.bill);
      }
      if (vA.brokeWithParty) brokeRanksA++;
      if (vB.brokeWithParty) brokeRanksB++;
    }
  }

  const total = agreements.length + disagreements.length;
  const agreePct = total > 0 ? (agreements.length / total) * 100 : 0;
  const moreBipartisan = brokeRanksA > brokeRanksB ? "A" : brokeRanksA < brokeRanksB ? "B" : "tie";
  const margin: Margin = total === 0 ? "negligible" : Math.abs(brokeRanksA - brokeRanksB) >= 3 ? "decisive" : Math.abs(brokeRanksA - brokeRanksB) >= 1 ? "slight" : "negligible";
  const winner = margin === "negligible" ? "tie" : moreBipartisan;

  const wRep = winner === "A" ? a : b;

  let summary: string;
  if (total === 0) {
    summary = `No shared key votes found to compare between ${shortName(a)} and ${shortName(b)}.`;
  } else {
    summary = `On ${total} shared key votes, they agreed ${pct(agreePct)} of the time (${agreements.length} agreements, ${disagreements.length} disagreements).`;
    if (winner !== "tie") {
      summary += ` ${shortName(wRep)} broke with their party more often, showing greater independence.`;
    }
  }

  return {
    winner, margin, summary,
    winnerName: winner === "tie" ? "Tie" : wRep.fullName,
    loserName: winner === "tie" ? "" : (winner === "A" ? b : a).fullName,
    labelA: `${brokeRanksA} broke ranks`, labelB: `${brokeRanksB} broke ranks`,
    valueA: brokeRanksA, valueB: brokeRanksB,
  };
}

function ethicsVerdict(a: Representative, b: Representative): CategoryVerdict {
  const countA = a.controversies.length;
  const countB = b.controversies.length;
  // Winner = FEWER controversies
  const cleaner = countA < countB ? "A" : countA > countB ? "B" : "tie";
  const diff = Math.abs(countA - countB);
  const margin: Margin = diff >= 3 ? "decisive" : diff >= 2 ? "moderate" : diff >= 1 ? "slight" : "negligible";
  const winner = margin === "negligible" ? "tie" : cleaner;

  const wRep = winner === "A" ? a : b;
  const lRep = winner === "A" ? b : a;
  const wCount = winner === "A" ? countA : countB;
  const lCount = winner === "A" ? countB : countA;

  let summary: string;
  if (winner === "tie") {
    summary = countA === 0
      ? `Neither representative has notable controversies on record.`
      : `Both have ${countA} documented controvers${countA === 1 ? "y" : "ies"}.`;
  } else {
    summary = `${shortName(wRep)} has ${wCount} documented controvers${wCount === 1 ? "y" : "ies"} vs. ${shortName(lRep)}'s ${lCount}, indicating a cleaner ethics record.`;
  }

  return {
    winner, margin, summary,
    winnerName: winner === "tie" ? "Tie" : wRep.fullName,
    loserName: winner === "tie" ? "" : lRep.fullName,
    labelA: `${countA}`, labelB: `${countB}`,
    valueA: countA, valueB: countB,
  };
}

// ─── Characterization ────────────────────────────────────────────────────────

function characterize(rep: Representative): string {
  const traits: string[] = [];

  // Party loyalty
  if (rep.partyLoyalty > 95) traits.push("a strict party loyalist");
  else if (rep.partyLoyalty > 90) traits.push("a reliable party voter");
  else if (rep.partyLoyalty < 75) traits.push("a bipartisan independent");
  else if (rep.partyLoyalty < 82) traits.push("a moderate willing to cross party lines");

  // Attendance
  const att = attendance(rep);
  if (att < 85) traits.push("frequently absent from votes");
  else if (att < 92) traits.push("with a mixed attendance record");
  else if (att > 99) traits.push("who almost never misses a vote");

  // Legislative effectiveness
  const sr = successRate(rep);
  if (sr > 20) traits.push("highly effective at passing legislation");
  else if (sr > 10) traits.push("with a solid legislative track record");
  else if (rep.billsEnacted === 0 && rep.billsIntroduced > 10) traits.push("who introduces many bills but struggles to pass them");

  // Finance
  if (rep.smallDollarPct > 40) traits.push("with strong grassroots funding");
  else if (rep.smallDollarPct < 15) traits.push("heavily reliant on big-dollar donors");

  if (traits.length === 0) return `A ${partyName(rep.party)} member of the ${rep.chamber}.`;

  // Capitalize first trait
  const first = traits[0].charAt(0).toUpperCase() + traits[0].slice(1);
  if (traits.length === 1) return `${first}.`;
  if (traits.length === 2) return `${first} ${traits[1]}.`;
  return `${first}, ${traits.slice(1).join(", ")}.`;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function generateVerdicts(a: Representative, b: Representative): ComparisonVerdicts {
  const verdicts = {
    partyLoyalty: partyLoyaltyVerdict(a, b),
    attendance: attendanceVerdict(a, b),
    legislative: legislativeVerdict(a, b),
    finance: financeVerdict(a, b),
    votingRecord: votingRecordVerdict(a, b),
    committees: committeesVerdict(a, b),
    keyVotes: keyVotesVerdict(a, b),
    ethics: ethicsVerdict(a, b),
  };

  const cats = [
    { key: "partyLoyalty", label: "Independence", icon: "⚖️", verdict: verdicts.partyLoyalty },
    { key: "attendance", label: "Attendance", icon: "📋", verdict: verdicts.attendance },
    { key: "legislative", label: "Legislation", icon: "📜", verdict: verdicts.legislative },
    { key: "finance", label: "Funding", icon: "💰", verdict: verdicts.finance },
    { key: "votingRecord", label: "Issue Votes", icon: "🗳️", verdict: verdicts.votingRecord },
    { key: "committees", label: "Committees", icon: "🏛️", verdict: verdicts.committees },
    { key: "keyVotes", label: "Key Votes", icon: "⭐", verdict: verdicts.keyVotes },
    { key: "ethics", label: "Ethics", icon: "🔍", verdict: verdicts.ethics },
  ];

  const winsA = cats.filter(c => c.verdict.winner === "A").length;
  const winsB = cats.filter(c => c.verdict.winner === "B").length;
  const ties = cats.filter(c => c.verdict.winner === "tie").length;

  let overallSummary: string;
  if (winsA > winsB) {
    overallSummary = `${shortName(a)} edges out ${shortName(b)} across most comparison categories, winning ${winsA} of 8.`;
  } else if (winsB > winsA) {
    overallSummary = `${shortName(b)} edges out ${shortName(a)} across most comparison categories, winning ${winsB} of 8.`;
  } else {
    overallSummary = `${shortName(a)} and ${shortName(b)} are closely matched, each winning ${winsA} categories with ${ties} ties.`;
  }

  return {
    ...verdicts,
    categories: cats,
    overall: {
      winsA,
      winsB,
      ties,
      characterizationA: characterize(a),
      characterizationB: characterize(b),
      overallSummary,
    },
  };
}
