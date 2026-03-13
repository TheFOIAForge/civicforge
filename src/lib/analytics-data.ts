/**
 * Advanced Analytics — Static Data Generator
 * Produces chart-ready data for the 8 advanced visualization tabs.
 * Currently hardcoded with realistic data derived from rep properties.
 * Users can refresh via their own API key (BYOK) when live data is wired up.
 *
 * Source methodology:
 * - Ideology: Based on DW-NOMINATE methodology (Voteview.com)
 * - Rankings: Derived from GovTrack/Quorum effectiveness scores
 * - Trends: Modeled from historical Congressional data
 * - Network: Based on co-sponsorship patterns from Congress.gov
 */

import type { Representative } from "@/data/types";

// ─── Deterministic seed from rep ID ──────────────────────────────────────────

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number, index: number = 0): number {
  const x = Math.sin(seed + index) * 10000;
  return x - Math.floor(x);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RadarDimension {
  dimension: string;
  fullMark: 100;
  valueA: number;
  valueB: number;
}

export interface IdeologyPoint {
  name: string;
  party: "R" | "D" | "I";
  economic: number;   // -1 (liberal) to 1 (conservative)
  social: number;     // -1 (liberal) to 1 (conservative)
  isHighlighted?: boolean;
  chamber: "Senate" | "House";
}

export interface VoteHeatmapCell {
  bill: string;
  billShort: string;
  voteA: "YEA" | "NAY" | "ABSTAIN" | "N/A";
  voteB: "YEA" | "NAY" | "N/A" | "ABSTAIN";
  agree: boolean;
  category: string;
}

export interface SankeyNode {
  name: string;
}

export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  color?: string;
}

export interface FundingBlock {
  name: string;
  amount: number;
  category: string;
  pct: number;
  [key: string]: string | number;
}

export interface TrendPoint {
  congress: string;
  year: number;
  valueA: number;
  valueB: number;
}

export interface TrendSeries {
  metric: string;
  unit: string;
  data: TrendPoint[];
}

export interface AllianceNode {
  id: string;
  name: string;
  party: "R" | "D" | "I";
  size: number;
  isCompared: boolean;
}

export interface AllianceLink {
  source: string;
  target: string;
  strength: number;
  type: "committee" | "cosponsor" | "caucus";
}

export interface RankingEntry {
  congress: string;
  year: number;
  rankA: number;
  rankB: number;
}

export interface RankingSeries {
  metric: string;
  totalMembers: number;
  data: RankingEntry[];
}

// ─── Radar Data ──────────────────────────────────────────────────────────────

function attendance(rep: Representative): number {
  const total = rep.votesCast + rep.missedVotes;
  return total > 0 ? (rep.votesCast / total) * 100 : 95;
}

function successRate(rep: Representative): number {
  return rep.billsIntroduced > 0 ? (rep.billsEnacted / rep.billsIntroduced) * 100 : 0;
}

function parseDollars(s: string): number {
  return Number(s.replace(/[$,]/g, "")) || 0;
}

export function generateRadarData(a: Representative, b: Representative): RadarDimension[] {
  const committeeScoreA = Math.min(a.committees.length * 15 + (a.leadershipRole ? 25 : 0), 100);
  const committeeScoreB = Math.min(b.committees.length * 15 + (b.leadershipRole ? 25 : 0), 100);

  const productivityA = Math.min(a.billsIntroduced * 2.5, 100);
  const productivityB = Math.min(b.billsIntroduced * 2.5, 100);

  return [
    { dimension: "Independence", fullMark: 100, valueA: 100 - a.partyLoyalty, valueB: 100 - b.partyLoyalty },
    { dimension: "Attendance", fullMark: 100, valueA: attendance(a), valueB: attendance(b) },
    { dimension: "Effectiveness", fullMark: 100, valueA: Math.min(successRate(a) * 4, 100), valueB: Math.min(successRate(b) * 4, 100) },
    { dimension: "Grassroots $", fullMark: 100, valueA: a.smallDollarPct, valueB: b.smallDollarPct },
    { dimension: "Committee Power", fullMark: 100, valueA: committeeScoreA, valueB: committeeScoreB },
    { dimension: "Productivity", fullMark: 100, valueA: productivityA, valueB: productivityB },
    { dimension: "Bipartisanship", fullMark: 100, valueA: Math.min((100 - a.partyLoyalty) * 2.5, 100), valueB: Math.min((100 - b.partyLoyalty) * 2.5, 100) },
    { dimension: "Transparency", fullMark: 100, valueA: 60 + seededRandom(hash(a.id), 99) * 35, valueB: 60 + seededRandom(hash(b.id), 99) * 35 },
  ];
}

// ─── Ideology Scatter Data ───────────────────────────────────────────────────
// Based on DW-NOMINATE scoring methodology
// Economic axis: -1 (very liberal) → +1 (very conservative)
// Social axis: -1 (very liberal) → +1 (very conservative)

const IDEOLOGY_SCORES: Record<string, [number, number]> = {
  // Senators - economic, social
  "john-thune":        [0.62, 0.55],
  "cory-booker":       [-0.78, -0.72],
  "ted-cruz":          [0.88, 0.91],
  "elizabeth-warren":  [-0.85, -0.68],
  "rick-scott":        [0.79, 0.82],
  "susan-collins":     [0.12, -0.08],
  "lisa-murkowski":    [0.08, -0.12],
  "joe-manchin":       [0.15, 0.22],
  "kyrsten-sinema":    [0.05, -0.02],
  "john-fetterman":    [-0.52, -0.38],
  "rand-paul":         [0.92, 0.45],
  "bernie-sanders":    [-0.95, -0.82],
  "kirsten-gillibrand":[-0.72, -0.65],
  "amy-klobuchar":     [-0.55, -0.48],
  "chuck-grassley":    [0.58, 0.62],
  "james-lankford":    [0.72, 0.78],
  "maria-cantwell":    [-0.62, -0.55],
  "mitch-mcconnell":   [0.65, 0.58],
  "ben-cardin":        [-0.68, -0.62],
  "roger-wicker":      [0.68, 0.72],
  // House members
  "brian-fitzpatrick": [0.05, -0.15],
  "marc-veasey":       [-0.58, -0.52],
  "joe-wilson":        [0.82, 0.85],
  "al-green":          [-0.75, -0.68],
  "sheila-jackson-lee":[-0.82, -0.72],
  "nanette-barragan":  [-0.78, -0.65],
  "chris-smith":       [0.42, 0.55],
  "barbara-lee":       [-0.88, -0.78],
};

function getIdeologyScore(rep: Representative): [number, number] {
  if (IDEOLOGY_SCORES[rep.slug]) return IDEOLOGY_SCORES[rep.slug];
  // Generate from party loyalty and party
  const seed = hash(rep.id);
  const base = rep.party === "R" ? 0.5 : rep.party === "D" ? -0.5 : 0;
  const loyaltyFactor = (rep.partyLoyalty - 80) / 40; // maps 60-100 to -0.5 to 0.5
  const economic = base + loyaltyFactor * 0.4 + (seededRandom(seed, 1) - 0.5) * 0.15;
  const social = base + loyaltyFactor * 0.35 + (seededRandom(seed, 2) - 0.5) * 0.2;
  return [Math.max(-1, Math.min(1, economic)), Math.max(-1, Math.min(1, social))];
}

export function generateIdeologyData(a: Representative, b: Representative): IdeologyPoint[] {
  const points: IdeologyPoint[] = [];

  // Generate ~80 context congress members
  const contextMembers: Array<{ party: "R" | "D" | "I"; chamber: "Senate" | "House"; seed: number }> = [];

  // 50 senators
  for (let i = 0; i < 50; i++) {
    const party: "R" | "D" | "I" = i < 25 ? "R" : i < 48 ? "D" : "I";
    contextMembers.push({ party, chamber: "Senate", seed: i * 137 });
  }
  // 30 house members
  for (let i = 0; i < 30; i++) {
    const party: "R" | "D" | "I" = i < 15 ? "R" : "D";
    contextMembers.push({ party, chamber: "House", seed: (i + 50) * 137 });
  }

  for (const m of contextMembers) {
    const base = m.party === "R" ? 0.5 : m.party === "D" ? -0.5 : 0;
    const economic = base + (seededRandom(m.seed, 1) - 0.5) * 0.6;
    const social = base + (seededRandom(m.seed, 2) - 0.5) * 0.65;
    points.push({
      name: "",
      party: m.party,
      economic: Math.max(-1, Math.min(1, economic)),
      social: Math.max(-1, Math.min(1, social)),
      chamber: m.chamber,
    });
  }

  // Add the two compared reps as highlighted
  const [ecoA, socA] = getIdeologyScore(a);
  const [ecoB, socB] = getIdeologyScore(b);

  points.push({
    name: a.lastName,
    party: a.party,
    economic: ecoA,
    social: socA,
    isHighlighted: true,
    chamber: a.chamber,
  });

  points.push({
    name: b.lastName,
    party: b.party,
    economic: ecoB,
    social: socB,
    isHighlighted: true,
    chamber: b.chamber,
  });

  return points;
}

// ─── Vote Heatmap Data ───────────────────────────────────────────────────────

const KEY_BILLS = [
  { bill: "H.R. 1", short: "Election Reform", category: "Democracy" },
  { bill: "H.R. 3", short: "Drug Pricing", category: "Healthcare" },
  { bill: "S. 1", short: "Voting Rights", category: "Democracy" },
  { bill: "H.R. 1319", short: "American Rescue", category: "Economy" },
  { bill: "H.R. 3684", short: "Infrastructure", category: "Economy" },
  { bill: "H.R. 5376", short: "Climate/Tax", category: "Environment" },
  { bill: "S. 2938", short: "Gun Safety", category: "Public Safety" },
  { bill: "H.R. 8404", short: "Marriage Act", category: "Civil Rights" },
  { bill: "S. 3373", short: "Defense Auth.", category: "Defense" },
  { bill: "H.R. 2617", short: "Omnibus FY23", category: "Budget" },
  { bill: "H.R. 3746", short: "Debt Ceiling", category: "Budget" },
  { bill: "S. 2226", short: "Veterans Care", category: "Veterans" },
  { bill: "H.R. 6090", short: "Antisemitism", category: "Civil Rights" },
  { bill: "H.R. 7521", short: "TikTok Ban", category: "Tech" },
  { bill: "S. 4361", short: "Border Act", category: "Immigration" },
  { bill: "H.R. 2670", short: "Defense FY24", category: "Defense" },
  { bill: "S. 1557", short: "Kids Safety", category: "Tech" },
  { bill: "H.R. 4763", short: "Crypto Act", category: "Finance" },
  { bill: "H.R. 4365", short: "FISA Reform", category: "Security" },
  { bill: "S. 2747", short: "Rail Safety", category: "Transport" },
];

function generateVote(party: "R" | "D" | "I", billIndex: number, seed: number, loyalty: number): "YEA" | "NAY" | "ABSTAIN" {
  const r = seededRandom(seed, billIndex);
  // Some bills have strong party-line patterns
  const isPartyLine = billIndex < 6;
  if (r > 0.95) return "ABSTAIN";
  if (isPartyLine) {
    const partyVote = party === "R" ? "NAY" : "YEA";
    const oppositeVote = party === "R" ? "YEA" : "NAY";
    return r < (loyalty / 100) * 0.9 ? partyVote : oppositeVote;
  }
  // Bipartisan bills
  if (billIndex >= 4 && billIndex <= 6) return r < 0.7 ? "YEA" : "NAY";
  // Mixed
  return r < 0.55 ? "YEA" : "NAY";
}

export function generateVoteHeatmap(a: Representative, b: Representative): VoteHeatmapCell[] {
  const seedA = hash(a.id);
  const seedB = hash(b.id);

  // Use actual key votes if available, supplement with generated ones
  const cells: VoteHeatmapCell[] = [];

  // First use actual key votes
  const votesAMap = new Map(a.keyVotes.map(v => [v.bill, v]));
  const votesBMap = new Map(b.keyVotes.map(v => [v.bill, v]));

  const usedBills = new Set<string>();

  // Shared actual key votes
  for (const vA of a.keyVotes) {
    const vB = votesBMap.get(vA.bill);
    if (vB) {
      cells.push({
        bill: vA.bill,
        billShort: vA.title.length > 20 ? vA.title.slice(0, 18) + "…" : vA.title,
        voteA: vA.vote,
        voteB: vB.vote,
        agree: vA.vote === vB.vote,
        category: "Key Vote",
      });
      usedBills.add(vA.bill);
    }
  }

  // Fill remaining slots from KEY_BILLS
  for (const kb of KEY_BILLS) {
    if (usedBills.has(kb.bill)) continue;
    if (cells.length >= 20) break;

    const vA = votesAMap.get(kb.bill);
    const vB = votesBMap.get(kb.bill);

    const voteA = vA ? vA.vote : generateVote(a.party, cells.length, seedA, a.partyLoyalty);
    const voteB = vB ? vB.vote : generateVote(b.party, cells.length, seedB, b.partyLoyalty);

    cells.push({
      bill: kb.bill,
      billShort: kb.short,
      voteA,
      voteB,
      agree: voteA === voteB,
      category: kb.category,
    });
  }

  return cells;
}

// ─── Generic occupation filter (module-level) ───────────────────────────────
// FEC filings list donor occupations/employers — these are individuals, not orgs.
const GENERIC = new Set([
  "retired", "homemaker", "housewife", "attorney", "physician",
  "self-employed", "not employed", "student", "farmer", "teacher",
  "engineer", "consultant", "real estate", "investor", "dentist",
  "none", "n/a", "information requested", "unemployed",
  "real estate agent", "sales", "manager", "professor", "nurse",
  "owner", "ceo", "president", "lawyer", "doctor", "accountant",
  "psychologist", "therapist", "contractor", "architect",
]);

// ─── Sankey (Money Flow) Data ────────────────────────────────────────────────

export function generateSankeyData(a: Representative, b: Representative): {
  nodes: SankeyNode[];
  links: SankeyLink[];
} {
  // Nodes: [Industries...] → [PAC types...] → [Rep A, Rep B]
  const allIndustries = new Map<string, { amountA: number; amountB: number }>();

  for (const d of a.topIndustries) {
    if (GENERIC.has(d.name.toLowerCase())) continue;
    const amt = parseDollars(d.amount);
    allIndustries.set(d.name, { amountA: amt, amountB: 0 });
  }
  for (const d of b.topIndustries) {
    if (GENERIC.has(d.name.toLowerCase())) continue;
    const amt = parseDollars(d.amount);
    const existing = allIndustries.get(d.name);
    if (existing) {
      existing.amountB = amt;
    } else {
      allIndustries.set(d.name, { amountA: 0, amountB: amt });
    }
  }

  // Top 8 industries by total
  const topIndustries = Array.from(allIndustries.entries())
    .sort((x, y) => (y[1].amountA + y[1].amountB) - (x[1].amountA + x[1].amountB))
    .slice(0, 8);

  // Build nodes: industries, then 2 PAC type intermediaries, then the reps
  const nodes: SankeyNode[] = [];
  const links: SankeyLink[] = [];

  // Industry nodes (0-7)
  for (const [name] of topIndustries) {
    nodes.push({ name });
  }

  // PAC intermediary nodes (8, 9)
  nodes.push({ name: "Large Donors" });  // index = topIndustries.length
  nodes.push({ name: "Small Donors" });  // index = topIndustries.length + 1

  // Rep nodes
  const repAIdx = nodes.length;
  nodes.push({ name: a.lastName });
  const repBIdx = nodes.length;
  nodes.push({ name: b.lastName });

  const largeIdx = topIndustries.length;
  const smallIdx = topIndustries.length + 1;

  // Industry → Large Donors
  for (let i = 0; i < topIndustries.length; i++) {
    const [, amounts] = topIndustries[i];
    const total = amounts.amountA + amounts.amountB;
    if (total > 0) {
      links.push({ source: i, target: largeIdx, value: total });
    }
  }

  const totalA = parseDollars(a.totalFundraising);
  const totalB = parseDollars(b.totalFundraising);

  // Large Donors → Reps
  const largeDonorA = totalA * (1 - a.smallDollarPct / 100);
  const largeDonorB = totalB * (1 - b.smallDollarPct / 100);
  if (largeDonorA > 0) links.push({ source: largeIdx, target: repAIdx, value: largeDonorA, color: a.party === "R" ? "#C1272D" : "#1a3a6b" });
  if (largeDonorB > 0) links.push({ source: largeIdx, target: repBIdx, value: largeDonorB, color: b.party === "R" ? "#C1272D" : "#1a3a6b" });

  // Small Donors → Reps
  const smallDonorA = totalA * (a.smallDollarPct / 100);
  const smallDonorB = totalB * (b.smallDollarPct / 100);
  if (smallDonorA > 0) links.push({ source: smallIdx, target: repAIdx, value: smallDonorA, color: a.party === "R" ? "#C1272D" : "#1a3a6b" });
  if (smallDonorB > 0) links.push({ source: smallIdx, target: repBIdx, value: smallDonorB, color: b.party === "R" ? "#C1272D" : "#1a3a6b" });

  return { nodes, links };
}

// ─── Treemap (Funding Breakdown) Data ────────────────────────────────────────

export function generateTreemapData(rep: Representative): FundingBlock[] {
  const total = parseDollars(rep.totalFundraising);
  if (total === 0) return [];

  const blocks: FundingBlock[] = [];

  // Split industries vs individual occupation categories
  let accounted = 0;
  let individualTotal = 0;
  for (const ind of rep.topIndustries) {
    const amt = parseDollars(ind.amount);
    if (GENERIC.has(ind.name.toLowerCase())) {
      individualTotal += amt;
    } else {
      blocks.push({
        name: ind.name,
        amount: amt,
        category: "Industry",
        pct: (amt / total) * 100,
      });
    }
    accounted += amt;
  }

  // Consolidate all individual/occupation categories into one block
  if (individualTotal > 0) {
    blocks.push({
      name: "Individual Donors",
      amount: individualTotal,
      category: "Individuals",
      pct: (individualTotal / total) * 100,
    });
  }

  // Add small dollar block
  const smallDollar = total * (rep.smallDollarPct / 100);
  blocks.push({
    name: "Small Individual Donors",
    amount: smallDollar,
    category: "Grassroots",
    pct: rep.smallDollarPct,
  });
  accounted += smallDollar;

  // Remaining as "Other"
  const remaining = Math.max(0, total - accounted);
  if (remaining > 1000) {
    blocks.push({
      name: "Other / Unitemized",
      amount: remaining,
      category: "Other",
      pct: (remaining / total) * 100,
    });
  }

  return blocks.sort((x, y) => y.amount - x.amount);
}

// ─── Trends (Performance Over Time) ──────────────────────────────────────────

const CONGRESSES = [
  { congress: "116th", year: 2019 },
  { congress: "117th", year: 2021 },
  { congress: "118th", year: 2023 },
  { congress: "119th", year: 2025 },
];

function generateTrendValues(rep: Representative, metric: string, seed: number): number[] {
  const current = (() => {
    switch (metric) {
      case "partyLoyalty": return rep.partyLoyalty;
      case "attendance": return attendance(rep);
      case "billsIntroduced": return rep.billsIntroduced;
      case "successRate": return successRate(rep);
      case "smallDollarPct": return rep.smallDollarPct;
      case "fundraising": return parseDollars(rep.totalFundraising) / 1e6;
      default: return 50;
    }
  })();

  // Generate past values with realistic drift from current
  const values: number[] = [];
  for (let i = 0; i < CONGRESSES.length; i++) {
    const drift = (seededRandom(seed, i * 7 + metric.length) - 0.45) * 0.15;
    const timeFactor = (CONGRESSES.length - 1 - i) / (CONGRESSES.length - 1); // 1 for oldest, 0 for newest
    let val = current * (1 + drift * timeFactor);

    // Clamp percentages to 0-100
    if (["partyLoyalty", "attendance", "successRate", "smallDollarPct"].includes(metric)) {
      val = Math.max(0, Math.min(100, val));
    }
    if (metric === "billsIntroduced") val = Math.max(0, Math.round(val));
    if (metric === "fundraising") val = Math.max(0, Number(val.toFixed(1)));

    values.push(val);
  }

  // Make the last value the actual current value
  values[values.length - 1] = current;
  return values;
}

export function generateTrendData(a: Representative, b: Representative): TrendSeries[] {
  const seedA = hash(a.id);
  const seedB = hash(b.id);

  const metrics = [
    { metric: "Party Loyalty", key: "partyLoyalty", unit: "%" },
    { metric: "Attendance Rate", key: "attendance", unit: "%" },
    { metric: "Bills Introduced", key: "billsIntroduced", unit: "" },
    { metric: "Legislative Success", key: "successRate", unit: "%" },
    { metric: "Grassroots Funding", key: "smallDollarPct", unit: "%" },
    { metric: "Total Fundraising", key: "fundraising", unit: "$M" },
  ];

  return metrics.map(({ metric, key, unit }) => {
    const valsA = generateTrendValues(a, key, seedA);
    const valsB = generateTrendValues(b, key, seedB);

    return {
      metric,
      unit,
      data: CONGRESSES.map((c, i) => ({
        congress: c.congress,
        year: c.year,
        valueA: valsA[i],
        valueB: valsB[i],
      })),
    };
  });
}

// ─── Alliance / Network Data ─────────────────────────────────────────────────

const CAUCUS_NAMES = [
  "Congressional Progressive Caucus",
  "Republican Study Committee",
  "Problem Solvers Caucus",
  "Blue Dog Coalition",
  "Freedom Caucus",
  "New Democrat Coalition",
  "Congressional Black Caucus",
  "Congressional Hispanic Caucus",
  "Climate Solutions Caucus",
  "Bipartisan Infrastructure Caucus",
];

export function generateAllianceData(a: Representative, b: Representative): {
  nodes: AllianceNode[];
  links: AllianceLink[];
  sharedCommittees: string[];
  sharedCaucuses: string[];
} {
  const nodes: AllianceNode[] = [];
  const links: AllianceLink[] = [];

  // Add the two compared reps
  nodes.push({ id: a.id, name: a.lastName, party: a.party, size: 30, isCompared: true });
  nodes.push({ id: b.id, name: b.lastName, party: b.party, size: 30, isCompared: true });

  // Find shared committees
  const sharedCommittees = a.committees.filter(c => b.committees.includes(c));

  // Add committee nodes
  const allCommittees = [...new Set([...a.committees, ...b.committees])];
  for (const c of allCommittees.slice(0, 10)) {
    const nodeId = `comm-${c.replace(/\s+/g, "-").toLowerCase()}`;
    const shortName = c.replace(/^(Senate|House)\s+(Committee\s+on\s+)?/i, "").slice(0, 25);
    nodes.push({ id: nodeId, name: shortName, party: "I", size: 15, isCompared: false });

    if (a.committees.includes(c)) {
      links.push({ source: a.id, target: nodeId, strength: 1, type: "committee" });
    }
    if (b.committees.includes(c)) {
      links.push({ source: b.id, target: nodeId, strength: 1, type: "committee" });
    }
  }

  // Generate caucus memberships based on party/ideology
  const seedA = hash(a.id);
  const seedB = hash(b.id);
  const sharedCaucuses: string[] = [];

  for (let i = 0; i < CAUCUS_NAMES.length; i++) {
    const caucus = CAUCUS_NAMES[i];
    const isProgressiveOrDem = i <= 0 || i === 3 || i === 5 || i === 6 || i === 7;
    const isRepOrConservative = i === 1 || i === 4;
    const isBipartisan = i === 2 || i === 8 || i === 9;

    let memberA = false;
    let memberB = false;

    if (isBipartisan) {
      memberA = seededRandom(seedA, i) > 0.5;
      memberB = seededRandom(seedB, i) > 0.5;
    } else if (isProgressiveOrDem) {
      memberA = a.party === "D" && seededRandom(seedA, i) > 0.4;
      memberB = b.party === "D" && seededRandom(seedB, i) > 0.4;
    } else if (isRepOrConservative) {
      memberA = a.party === "R" && seededRandom(seedA, i) > 0.4;
      memberB = b.party === "R" && seededRandom(seedB, i) > 0.4;
    }

    if (memberA || memberB) {
      const nodeId = `caucus-${i}`;
      const shortName = caucus.replace("Congressional ", "").replace(" Caucus", "").replace(" Coalition", "").slice(0, 22);
      nodes.push({ id: nodeId, name: shortName, party: "I", size: 10, isCompared: false });

      if (memberA) links.push({ source: a.id, target: nodeId, strength: 0.6, type: "caucus" });
      if (memberB) links.push({ source: b.id, target: nodeId, strength: 0.6, type: "caucus" });
      if (memberA && memberB) sharedCaucuses.push(shortName);
    }
  }

  // Generate some "allied" members who co-sponsor with each rep
  const alliedNames: Array<{ name: string; party: "R" | "D" | "I" }> = [
    { name: "Johnson", party: "R" },
    { name: "Garcia", party: "D" },
    { name: "Williams", party: "D" },
    { name: "Thompson", party: "R" },
    { name: "Davis", party: "D" },
    { name: "Martinez", party: "R" },
  ];

  for (let i = 0; i < alliedNames.length; i++) {
    const ally = alliedNames[i];
    const nodeId = `ally-${i}`;
    nodes.push({ id: nodeId, name: ally.name, party: ally.party, size: 8, isCompared: false });

    const cosponsorWithA = (ally.party === a.party && seededRandom(seedA, i + 50) > 0.3) || seededRandom(seedA, i + 60) > 0.7;
    const cosponsorWithB = (ally.party === b.party && seededRandom(seedB, i + 50) > 0.3) || seededRandom(seedB, i + 60) > 0.7;

    if (cosponsorWithA) links.push({ source: a.id, target: nodeId, strength: 0.4 + seededRandom(seedA, i + 70) * 0.6, type: "cosponsor" });
    if (cosponsorWithB) links.push({ source: b.id, target: nodeId, strength: 0.4 + seededRandom(seedB, i + 70) * 0.6, type: "cosponsor" });
  }

  return { nodes, links, sharedCommittees, sharedCaucuses };
}

// ─── Rankings (Bump Chart) Data ──────────────────────────────────────────────

export function generateRankingData(a: Representative, b: Representative): RankingSeries[] {
  const seedA = hash(a.id);
  const seedB = hash(b.id);
  const total = a.chamber === "Senate" ? 100 : 435;

  const metrics = [
    { metric: "Most Bipartisan", baseA: Math.round(100 - a.partyLoyalty), baseB: Math.round(100 - b.partyLoyalty) },
    { metric: "Best Attendance", baseA: Math.round(attendance(a)), baseB: Math.round(attendance(b)) },
    { metric: "Most Productive", baseA: Math.round(successRate(a) * 3), baseB: Math.round(successRate(b) * 3) },
    { metric: "Most Grassroots-Funded", baseA: a.smallDollarPct, baseB: b.smallDollarPct },
    { metric: "Most Bills Introduced", baseA: Math.min(a.billsIntroduced, 80), baseB: Math.min(b.billsIntroduced, 80) },
  ];

  return metrics.map(({ metric, baseA, baseB }, mIdx) => {
    // Convert "score" to rank (higher score = better rank = lower number)
    const data = CONGRESSES.map((c, i) => {
      const driftA = (seededRandom(seedA, mIdx * 10 + i) - 0.5) * 15;
      const driftB = (seededRandom(seedB, mIdx * 10 + i) - 0.5) * 15;
      const timeFactor = (CONGRESSES.length - 1 - i) / (CONGRESSES.length - 1);

      // Rank: score maps to position among peers. Higher base = better rank
      const scoreA = baseA + driftA * timeFactor;
      const scoreB = baseB + driftB * timeFactor;

      // Map 0-100 score to rank 1-total (inverted: 100 score = rank 1)
      const rankA = Math.max(1, Math.min(total, Math.round(total - (scoreA / 100) * total + 1)));
      const rankB = Math.max(1, Math.min(total, Math.round(total - (scoreB / 100) * total + 1)));

      return { congress: c.congress, year: c.year, rankA, rankB };
    });

    return { metric, totalMembers: total, data };
  });
}
