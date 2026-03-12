import type { Donor, OutsideSpender, CycleFinance } from "@/data/types";

// OpenFEC candidate financial totals (field names match the API response)
interface FECFinancials {
  candidate_id: string;
  cycle: number | null;
  receipts: number;
  individual_contributions: number;
  individual_itemized_contributions: number;
  individual_unitemized_contributions: number;
  other_political_committee_contributions: number;
  disbursements: number;
}

interface AggregateEntry {
  name: string;
  total: number;
}

export interface IndependentExpenditure {
  committee_name: string;
  total: number;
  support_oppose_indicator: "S" | "O";
  cycle: number;
}

export interface FECFinanceResult {
  cycles: CycleFinance[];       // "all" first, then newest cycle first
  topDonors: Donor[];           // All-time
  topIndustries: Donor[];       // All-time
  // Convenience fields for backward compat (derived from "all" cycle)
  totalFundraising: string;
  smallDollarPct: number;
  outsideSpending: OutsideSpender[];
}

// Entries to filter out — these are self-reported junk in FEC filings
const JUNK_NAMES = new Set([
  "NOT EMPLOYED", "NONE", "NULL", "N/A", "NA", "N/A/RETIRED", "SELF", "SELF-EMPLOYED",
  "SELF EMPLOYED", "INFORMATION REQUESTED", "INFORMATION REQUESTED PER BEST EFFORTS",
  "INFORMATION REQUESTED PER BEST EFFO", "INFORMATION REQUESTED PER BEST EFF",
  "INFO REQUESTED", "INFO REQUESTED PER BEST EFFORTS",
  "REFUSED", "NOT APPLICABLE", "UNKNOWN", "", "RETIRED", "HOMEMAKER",
  "STUDENT", "DISABLED", "UNEMPLOYED",
]);

function isJunk(name: string): boolean {
  return JUNK_NAMES.has(name.toUpperCase().trim());
}

// For occupations, allow Retired/Homemaker since they're real categories
const OCCUPATION_JUNK = new Set([
  "NOT EMPLOYED", "NONE", "NULL", "N/A", "NA", "SELF", "SELF-EMPLOYED",
  "SELF EMPLOYED", "INFORMATION REQUESTED", "INFORMATION REQUESTED PER BEST EFFORTS",
  "INFORMATION REQUESTED PER BEST EFFO", "INFORMATION REQUESTED PER BEST EFF",
  "REFUSED", "NOT APPLICABLE", "UNKNOWN", "",
]);

function isOccupationJunk(name: string): boolean {
  return OCCUPATION_JUNK.has(name.toUpperCase().trim());
}

export function formatMoney(amount: number | undefined | null): string {
  if (!amount && amount !== 0) return "$0";
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

/** Title-case a string */
function titleCase(s: string): string {
  return s.split(" ").map(w => {
    if (w.length <= 2) return w.toUpperCase(); // Keep acronyms like "OF", "PAC"
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");
}

/** Consolidate duplicate names and filter junk, returning top N */
function consolidate(entries: AggregateEntry[], limit: number, junkFilter: (n: string) => boolean): Donor[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (junkFilter(e.name)) continue;
    const key = e.name.toUpperCase().trim();
    map.set(key, (map.get(key) || 0) + e.total);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, amount]) => ({
      name: titleCase(name),
      amount: formatMoney(amount),
    }));
}

/** Transform independent expenditure data into outside spenders, optionally filtered by cycle */
function transformOutsideSpending(expenditures: IndependentExpenditure[], filterCycle?: number): OutsideSpender[] {
  const filtered = filterCycle ? expenditures.filter(e => e.cycle === filterCycle) : expenditures;
  const map = new Map<string, { total: number; support: boolean; name: string }>();
  for (const e of filtered) {
    const key = `${e.committee_name}|${e.support_oppose_indicator}`;
    const existing = map.get(key);
    if (existing) {
      existing.total += e.total;
    } else {
      map.set(key, { total: e.total, support: e.support_oppose_indicator === "S", name: e.committee_name });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((entry) => ({
      name: titleCase(entry.name),
      amount: formatMoney(entry.total),
      support: entry.support,
    }));
}

/** Build a CycleFinance object from a single FEC totals row + matching IE data */
function buildCycleFinance(
  f: FECFinancials,
  ieData: IndependentExpenditure[],
  cycleLabel: number | "all"
): CycleFinance {
  const total = f.receipts || 0;
  const unitemized = f.individual_unitemized_contributions || 0;
  return {
    cycle: cycleLabel,
    totalFundraising: formatMoney(total),
    smallDollarPct: total > 0 ? Math.round((unitemized / total) * 100) : 0,
    outsideSpending: cycleLabel === "all"
      ? transformOutsideSpending(ieData)
      : transformOutsideSpending(ieData, cycleLabel as number),
  };
}

export function transformFinancials(
  allCycleTotals: FECFinancials[],
  employers: AggregateEntry[],
  occupations: AggregateEntry[],
  independentExpenditures: IndependentExpenditure[] = []
): FECFinanceResult {
  const empty: FECFinanceResult = {
    cycles: [],
    topDonors: [],
    topIndustries: [],
    totalFundraising: "$0",
    smallDollarPct: 0,
    outsideSpending: [],
  };

  if (allCycleTotals.length === 0) return empty;

  // Build per-cycle entries (sorted newest first)
  const perCycle: CycleFinance[] = allCycleTotals
    .filter(f => f.cycle != null)
    .sort((a, b) => (b.cycle || 0) - (a.cycle || 0))
    .map(f => buildCycleFinance(f, independentExpenditures, f.cycle!));

  // Build "all" aggregate
  const allTotalReceipts = allCycleTotals.reduce((sum, f) => sum + (f.receipts || 0), 0);
  const allUnitemized = allCycleTotals.reduce((sum, f) => sum + (f.individual_unitemized_contributions || 0), 0);
  const allCycle: CycleFinance = {
    cycle: "all",
    totalFundraising: formatMoney(allTotalReceipts),
    smallDollarPct: allTotalReceipts > 0 ? Math.round((allUnitemized / allTotalReceipts) * 100) : 0,
    outsideSpending: transformOutsideSpending(independentExpenditures),
  };

  const cycles = [allCycle, ...perCycle];

  return {
    cycles,
    topDonors: consolidate(employers, 10, isJunk),
    topIndustries: consolidate(occupations, 10, isOccupationJunk),
    // Backward compat — use "all" aggregate
    totalFundraising: allCycle.totalFundraising,
    smallDollarPct: allCycle.smallDollarPct,
    outsideSpending: allCycle.outsideSpending,
  };
}
