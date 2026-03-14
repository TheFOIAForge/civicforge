"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useMyReps } from "@/lib/my-reps-context";
import { useScorecard } from "@/lib/scorecard-context";
import type { RecentRollCallVote } from "@/data/types";

/* ── Interfaces ── */
interface BillInfo {
  number: string;
  title: string;
  type: string;
  congress: string;
  latestActionDate: string;
  latestActionText: string;
  introducedDate: string;
  sponsors: string[];
}

interface ActionItem {
  date: string;
  text: string;
  type: string;
}

interface RollCallVote {
  memberName: string;
  party: string;
  state: string;
  vote: string;
}

interface VoteTotals {
  yea: number;
  nay: number;
  notVoting: number;
  present: number;
}

interface BillResult {
  bill: BillInfo;
  actions: ActionItem[];
  rollCallVotes: RollCallVote[];
  voteTotals: VoteTotals | null;
}

type SortField = "memberName" | "party" | "state" | "vote";
type SortDir = "asc" | "desc";

/* ── Notable bills for quick access ── */
const NOTABLE_BILLS = [
  { label: "HR 1", congress: "119", chamber: "House", desc: "Major tax reform and fiscal policy overhaul for the 119th Congress" },
  { label: "S 1", congress: "119", chamber: "Senate", desc: "Top Senate priority legislation — often signals the majority's agenda" },
  { label: "HR 2", congress: "119", chamber: "House", desc: "Comprehensive border security and immigration enforcement package" },
  { label: "HR 1", congress: "118", chamber: "House", desc: "Opening bill of the 118th Congress — sets the tone for the session" },
  { label: "S 2226", congress: "118", chamber: "Senate", desc: "Bipartisan legislation that crossed party lines in the Senate" },
  { label: "HR 3746", congress: "118", chamber: "House", desc: "Fiscal Responsibility Act — raised the debt ceiling with spending cuts" },
];

/* ── Helper functions ── */
function voteColor(vote: string): string {
  const v = vote.toUpperCase();
  if (v === "YEA" || v === "AYE") return "text-green font-bold";
  if (v === "NAY" || v === "NO") return "text-status-red font-bold";
  return "text-gray-mid";
}

function voteBadgeBg(vote: string): string {
  const v = vote.toUpperCase();
  if (v === "YEA" || v === "AYE") return "bg-green-light border-green";
  if (v === "NAY" || v === "NO") return "bg-status-red-light border-status-red";
  return "bg-cream-dark border-border-light";
}

function partyLabel(p: string): string {
  if (p === "D" || p === "Democrat" || p === "Democratic") return "DEM";
  if (p === "R" || p === "Republican") return "GOP";
  if (p === "I" || p === "Independent") return "IND";
  return p;
}

function partyColorClass(p: string): string {
  const label = partyLabel(p);
  if (label === "DEM") return "bg-dem text-white";
  if (label === "GOP") return "bg-rep text-white";
  if (label === "IND") return "bg-ind text-white";
  return "bg-gray-mid text-white";
}

function actionIcon(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("introduced")) return "I";
  if (t.includes("committee")) return "C";
  if (t.includes("passed") || t.includes("agreed")) return "P";
  if (t.includes("signed") || t.includes("became public law")) return "L";
  if (t.includes("vetoed")) return "V";
  if (t.includes("vote") || t.includes("roll")) return "R";
  return "A";
}

function actionAccent(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("signed") || t.includes("became public law")) return "bg-green";
  if (t.includes("passed") || t.includes("agreed")) return "bg-blue";
  if (t.includes("vetoed")) return "bg-status-red";
  if (t.includes("vote") || t.includes("roll")) return "bg-red";
  return "bg-border";
}

/* ── Party analytics ── */
interface PartySplit {
  dems: { yea: number; nay: number; notVoting: number };
  reps: { yea: number; nay: number; notVoting: number };
  inds: { yea: number; nay: number; notVoting: number };
}

function calculatePartySplit(votes: RollCallVote[]): PartySplit {
  const split: PartySplit = {
    dems: { yea: 0, nay: 0, notVoting: 0 },
    reps: { yea: 0, nay: 0, notVoting: 0 },
    inds: { yea: 0, nay: 0, notVoting: 0 },
  };

  for (const v of votes) {
    const label = partyLabel(v.party);
    const bucket = label === "DEM" ? split.dems : label === "GOP" ? split.reps : split.inds;
    const vote = v.vote.toUpperCase();
    if (vote === "YEA" || vote === "AYE") bucket.yea++;
    else if (vote === "NAY" || vote === "NO") bucket.nay++;
    else bucket.notVoting++;
  }

  return split;
}

function isPartyLineVote(split: PartySplit): boolean {
  const demTotal = split.dems.yea + split.dems.nay;
  const repTotal = split.reps.yea + split.reps.nay;
  if (demTotal === 0 || repTotal === 0) return false;
  const demMajorityPct = Math.max(split.dems.yea, split.dems.nay) / demTotal;
  const repMajorityPct = Math.max(split.reps.yea, split.reps.nay) / repTotal;
  const demMajorityYea = split.dems.yea > split.dems.nay;
  const repMajorityYea = split.reps.yea > split.reps.nay;
  return demMajorityPct >= 0.9 && repMajorityPct >= 0.9 && demMajorityYea !== repMajorityYea;
}

function getCrossPartyVoters(votes: RollCallVote[]): RollCallVote[] {
  const split = calculatePartySplit(votes);
  const demMajorityYea = split.dems.yea >= split.dems.nay;
  const repMajorityYea = split.reps.yea >= split.reps.nay;

  return votes.filter((v) => {
    const vote = v.vote.toUpperCase();
    if (vote === "NOT VOTING" || vote === "PRESENT") return false;
    const label = partyLabel(v.party);
    const votedYea = vote === "YEA" || vote === "AYE";
    if (label === "DEM") return votedYea !== demMajorityYea;
    if (label === "GOP") return votedYea !== repMajorityYea;
    return false;
  });
}

export default function VotesPage() {
  const { myReps } = useMyReps();
  const { addVote, removeVote, hasVoted } = useScorecard();
  const [billInput, setBillInput] = useState("");
  const [congress, setCongress] = useState("119");
  const [result, setResult] = useState<BillResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partyFilter, setPartyFilter] = useState("ALL");
  const [sortField, setSortField] = useState<SortField>("memberName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searched, setSearched] = useState(false);

  // Recent votes
  const [recentVotes, setRecentVotes] = useState<RecentRollCallVote[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [chamberFilter, setChamberFilter] = useState<"ALL" | "House" | "Senate">("ALL");
  // Comparison
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");

  // Fetch recent votes on mount
  useEffect(() => {
    setRecentLoading(true);
    fetch("/api/votes/recent")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentVotes(data);
      })
      .catch(() => {})
      .finally(() => setRecentLoading(false));
  }, []);

  async function handleSearch(billStr?: string, congressStr?: string) {
    const bill = billStr || billInput;
    const cong = congressStr || congress;
    if (!bill.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    setPartyFilter("ALL");
    setCompareA("");
    setCompareB("");

    const cleaned = bill.replace(/\s+/g, "").toLowerCase();

    try {
      const res = await fetch(
        `/api/votes?billNumber=${encodeURIComponent(cleaned)}&congress=${cong}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch bill data");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const filteredVotes = useMemo(() => {
    if (!result?.rollCallVotes) return [];
    let votes = [...result.rollCallVotes];

    if (partyFilter !== "ALL") {
      votes = votes.filter((v) => partyLabel(v.party) === partyFilter);
    }

    votes.sort((a, b) => {
      const cmp = a[sortField].localeCompare(b[sortField]);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return votes;
  }, [result, partyFilter, sortField, sortDir]);

  const sortArrow = (field: SortField) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  // Party split data
  const partySplit = useMemo(
    () => (result?.rollCallVotes ? calculatePartySplit(result.rollCallVotes) : null),
    [result]
  );
  const partyLine = useMemo(
    () => (partySplit ? isPartyLineVote(partySplit) : false),
    [partySplit]
  );
  const crossPartyVoters = useMemo(
    () => (result?.rollCallVotes ? getCrossPartyVoters(result.rollCallVotes) : []),
    [result]
  );

  // Comparison
  const comparisonResult = useMemo(() => {
    if (!compareA && !compareB) return null;
    if (!result?.rollCallVotes) return null;
    const aLower = compareA.toLowerCase();
    const bLower = compareB.toLowerCase();
    const voteA = compareA ? result.rollCallVotes.find((v) => v.memberName.toLowerCase().includes(aLower)) : null;
    const voteB = compareB ? result.rollCallVotes.find((v) => v.memberName.toLowerCase().includes(bLower)) : null;
    return { voteA: voteA || null, voteB: voteB || null };
  }, [compareA, compareB, result]);

  // Saved rep names for highlighting
  const savedRepNames = useMemo(
    () => myReps.map((r) => r.fullName.toLowerCase()),
    [myReps]
  );

  const filteredRecentVotes = useMemo(
    () =>
      chamberFilter === "ALL"
        ? recentVotes
        : recentVotes.filter((v) => v.chamber === chamberFilter),
    [recentVotes, chamberFilter]
  );

  // suppress unused var warning
  void searched;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ═══════════════════════════════════════════ */}
      {/* SECTION A: Educational Header              */}
      {/* ═══════════════════════════════════════════ */}
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Vote Lookup</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        HOW DID YOUR REPRESENTATIVE VOTE? FIND OUT.
      </p>

      {/* What are congressional votes? */}
      <section className="border-3 border-border bg-surface p-6 md:p-8 mb-6">
        <h2 className="font-headline text-2xl mb-2">Understanding Congressional Votes</h2>
        <p className="font-body text-base text-gray-mid leading-relaxed mb-5">
          Congress decides the fate of legislation through several types of votes.
          Not all votes are created equal — some record every member&apos;s position while
          others leave no individual trace.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-2 border-border p-4 bg-cream-dark">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-green flex items-center justify-center text-white font-headline text-sm shrink-0">R</span>
              <h3 className="font-headline text-lg normal-case">Roll Call Votes</h3>
            </div>
            <p className="font-body text-sm text-gray-mid leading-relaxed">
              Every member&apos;s position is recorded and made public. This is the most
              transparent type of vote and the primary tool for holding representatives
              accountable. Roll call votes are what this page tracks.
            </p>
          </div>
          <div className="border-2 border-border p-4 bg-cream-dark">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-gray-mid flex items-center justify-center text-white font-headline text-sm shrink-0">V</span>
              <h3 className="font-headline text-lg normal-case">Voice Votes</h3>
            </div>
            <p className="font-body text-sm text-gray-mid leading-relaxed">
              Members say &quot;aye&quot; or &quot;no&quot; aloud and the presiding officer
              judges which side prevails. No individual positions are recorded — making
              it impossible to know how your representative voted.
            </p>
          </div>
          <div className="border-2 border-border p-4 bg-cream-dark">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-blue flex items-center justify-center text-white font-headline text-sm shrink-0">U</span>
              <h3 className="font-headline text-lg normal-case">Unanimous Consent</h3>
            </div>
            <p className="font-body text-sm text-gray-mid leading-relaxed">
              Passed without formal objection. Often used for routine or non-controversial
              matters. A single member can block unanimous consent by objecting — but
              most routine legislation passes this way.
            </p>
          </div>
        </div>
      </section>

      {/* Why votes matter callout */}
      <div className="border-3 border-red bg-cream-dark p-5 mb-8 flex gap-4 items-start">
        <div className="w-12 h-12 bg-red flex items-center justify-center text-white shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-headline text-lg normal-case mb-1">Why Votes Matter</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed">
            A representative&apos;s voting record is the most concrete, verifiable measure of
            their priorities. Campaign promises are rhetoric — votes are action. Use this
            tool to see if your elected officials vote the way they promised.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION B: Recent Votes Feed               */}
      {/* ═══════════════════════════════════════════ */}
      <section className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="font-headline text-3xl">Recent Roll Call Votes</h2>
            <p className="font-mono text-xs text-gray-mid font-bold mt-1">
              LIVE FROM CONGRESS.GOV — CLICK ANY VOTE TO SEE FULL DETAILS
            </p>
          </div>
          <div className="flex gap-2">
            {(["ALL", "House", "Senate"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChamberFilter(ch)}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase cursor-pointer border-2 transition-colors ${
                  chamberFilter === ch
                    ? "bg-black text-cream border-black"
                    : "bg-surface text-gray-mid border-border hover:border-black"
                }`}
              >
                {ch === "ALL" ? "All Chambers" : ch}
              </button>
            ))}
          </div>
        </div>

        {recentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 motion-safe:animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border-3 border-border-light p-5 bg-surface">
                <div className="h-4 bg-cream-dark w-1/3 mb-3" />
                <div className="h-5 bg-cream-dark w-full mb-2" />
                <div className="h-4 bg-cream-dark w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredRecentVotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecentVotes.map((rv, i) => (
              <button
                key={`${rv.billNumber}-${rv.date}-${i}`}
                onClick={() => {
                  if (rv.billNumber) {
                    const cleaned = rv.billNumber.replace(/\s+/g, "").toLowerCase();
                    setBillInput(rv.billNumber);
                    setCongress(String(rv.congress));
                    handleSearch(cleaned, String(rv.congress));
                  }
                }}
                className="text-left border-3 border-border bg-surface p-5 hover:bg-hover transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {rv.billNumber && (
                    <span className="px-2 py-1 bg-black text-cream font-mono text-[10px] font-bold">
                      {rv.billNumber}
                    </span>
                  )}
                  <span className={`px-2 py-1 font-mono text-[10px] font-bold text-white ${
                    rv.chamber === "Senate" ? "bg-navy" : "bg-red"
                  }`}>
                    {rv.chamber.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 font-mono text-[10px] font-bold border ${
                    rv.result === "Passed"
                      ? "border-green text-green bg-green-light"
                      : rv.result === "Failed"
                        ? "border-status-red text-status-red bg-status-red-light"
                        : "border-border text-gray-mid bg-cream-dark"
                  }`}>
                    {rv.result.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-body text-sm font-bold leading-snug mb-2 line-clamp-2 group-hover:text-red transition-colors">
                  {rv.billTitle || rv.question}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-gray-mid">
                    {rv.date ? new Date(rv.date).toLocaleDateString() : ""}
                  </span>
                  {rv.yea + rv.nay > 0 && (
                    <span className="font-mono text-[10px] font-bold">
                      <span className="text-green">{rv.yea}Y</span>
                      <span className="text-gray-mid mx-1">—</span>
                      <span className="text-status-red">{rv.nay}N</span>
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="border-3 border-border-light p-8 bg-surface text-center">
            <p className="font-body text-base text-gray-mid">
              No recent roll call votes found. Try searching for a specific bill below.
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION C: Bill Search                     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="font-headline text-3xl mb-4">Look Up a Bill</h2>
        <div className="border-3 border-border p-5 bg-cream-dark" role="search" aria-label="Look up bill votes">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-end">
            <div>
              <label htmlFor="vote-bill" className="font-mono text-sm text-gray-mid block mb-2 font-bold">
                BILL NUMBER
              </label>
              <input
                id="vote-bill"
                type="search"
                value={billInput}
                onChange={(e) => setBillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g., HR 1234, S 500, HJRes 100"
                className="w-full px-4 py-3 border-2 border-border bg-surface font-mono text-base focus:outline-none focus:border-red"
              />
            </div>
            <div>
              <label htmlFor="vote-congress" className="font-mono text-sm text-gray-mid block mb-2 font-bold">
                CONGRESS
              </label>
              <select
                id="vote-congress"
                value={congress}
                onChange={(e) => setCongress(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border bg-surface font-mono text-base focus:outline-none focus:border-red"
              >
                <option value="119">119th (2025-2027)</option>
                <option value="118">118th (2023-2025)</option>
                <option value="117">117th (2021-2023)</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => handleSearch()}
                disabled={loading || !billInput.trim()}
                className="w-full px-8 py-3 bg-red text-cream font-mono text-sm uppercase cursor-pointer hover:bg-red-dark transition-colors font-bold disabled:opacity-40 disabled:cursor-not-allowed border-3 border-black"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        {/* Notable bills */}
        <div className="mt-6 border-3 border-border bg-surface p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-black flex items-center justify-center text-cream shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-headline text-xl normal-case">Notable Bills to Explore</h3>
              <p className="font-mono text-[10px] text-gray-mid font-bold">CLICK ANY BILL TO SEE ITS FULL VOTE RECORD</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {NOTABLE_BILLS.map((bill) => (
              <button
                key={`${bill.label}-${bill.congress}`}
                onClick={() => {
                  const cleaned = bill.label.replace(/\s+/g, "").toLowerCase();
                  setBillInput(bill.label);
                  setCongress(bill.congress);
                  handleSearch(cleaned, bill.congress);
                }}
                className="text-left border-2 border-border-light bg-cream-dark p-4 hover:border-red hover:bg-hover transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-black text-cream font-mono text-xs font-bold">
                    {bill.label}
                  </span>
                  <span className={`px-2 py-1 font-mono text-[10px] font-bold text-white ${
                    bill.chamber === "Senate" ? "bg-navy" : "bg-red"
                  }`}>
                    {bill.chamber.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] text-gray-mid font-bold">
                    {bill.congress}th
                  </span>
                </div>
                <p className="font-body text-sm text-gray-mid leading-relaxed mb-2">{bill.desc}</p>
                <span className="font-mono text-xs font-bold text-gray-mid group-hover:text-red transition-colors">
                  LOOK UP VOTES &rarr;
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4 motion-safe:animate-pulse">
          <div className="border-3 border-border-light p-6 bg-surface">
            <div className="h-6 bg-cream-dark w-1/3 mb-3" />
            <div className="h-4 bg-cream-dark w-2/3 mb-2" />
            <div className="h-4 bg-cream-dark w-1/2" />
          </div>
          <div className="border-3 border-border-light p-6 bg-surface">
            <div className="h-6 bg-cream-dark w-1/4 mb-4" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-cream-dark w-full mb-2" />
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="border-3 border-status-red p-8 bg-status-red-light text-center mb-8" role="alert">
          <div className="w-14 h-14 bg-status-red flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-headline text-2xl mb-2">Bill Not Found</p>
          <p className="font-body text-base text-gray-mid mb-4">{error}</p>
          <div className="border-2 border-border-light p-4 bg-surface inline-block text-left">
            <p className="font-mono text-xs font-bold text-gray-mid mb-2">TRY THESE FORMATS:</p>
            <ul className="font-mono text-sm space-y-1">
              <li><span className="font-bold">HR 1234</span> — House bill</li>
              <li><span className="font-bold">S 500</span> — Senate bill</li>
              <li><span className="font-bold">HJRes 100</span> — House joint resolution</li>
              <li><span className="font-bold">SRes 50</span> — Senate resolution</li>
            </ul>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION D: Vote Results                    */}
      {/* ═══════════════════════════════════════════ */}
      {result && !loading && (
        <div className="space-y-6 mb-8">
          {/* Bill info card */}
          <div className="border-3 border-border bg-surface">
            <div className="h-2 w-full bg-red" />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="px-3 py-1.5 bg-black text-cream font-mono text-sm font-bold shrink-0">
                  {result.bill.number}
                </span>
                <div>
                  <h2 className="font-headline text-2xl normal-case mb-2">{result.bill.title}</h2>
                  {result.bill.sponsors.length > 0 && (
                    <p className="font-mono text-sm text-gray-mid">
                      <span className="font-bold">SPONSOR:</span> {result.bill.sponsors.join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-border-light">
                <span className="font-mono text-xs font-bold uppercase px-2 py-1 border border-border bg-cream-dark">
                  {result.bill.congress}th Congress
                </span>
                {result.bill.introducedDate && (
                  <span className="font-mono text-xs font-bold uppercase px-2 py-1 border border-border bg-cream-dark">
                    Introduced: {result.bill.introducedDate}
                  </span>
                )}
                {result.bill.latestActionDate && (
                  <span className="font-mono text-xs font-bold uppercase px-2 py-1 border border-border bg-cream-dark">
                    Latest: {result.bill.latestActionDate}
                  </span>
                )}
              </div>
              {result.bill.latestActionText && (
                <p className="font-body text-base text-gray-mid mt-3 italic">
                  {result.bill.latestActionText}
                </p>
              )}

              {/* Write about this bill CTA */}
              <div className="mt-4 pt-4 border-t-2 border-border-light flex flex-wrap items-center gap-4">
                <Link
                  href={`/draft?issue=${encodeURIComponent(`${result.bill.number}: ${result.bill.title}`)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red text-cream font-mono text-xs font-bold no-underline hover:bg-red-dark transition-colors border border-black"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  WRITE TO CONGRESS ABOUT THIS BILL
                </Link>

                {/* Scorecard YEA/NAY buttons */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-gray-mid font-bold">YOUR POSITION:</span>
                  <button
                    onClick={() => {
                      if (hasVoted(result.bill.number) === "YEA") {
                        removeVote(result.bill.number);
                      } else {
                        addVote(result.bill.number, result.bill.title, "YEA");
                      }
                    }}
                    className={`px-3 py-1.5 font-mono text-xs font-bold border-2 cursor-pointer transition-colors ${
                      hasVoted(result.bill.number) === "YEA"
                        ? "bg-green text-white border-green"
                        : "bg-surface text-green border-green hover:bg-green-light"
                    }`}
                  >
                    YEA
                  </button>
                  <button
                    onClick={() => {
                      if (hasVoted(result.bill.number) === "NAY") {
                        removeVote(result.bill.number);
                      } else {
                        addVote(result.bill.number, result.bill.title, "NAY");
                      }
                    }}
                    className={`px-3 py-1.5 font-mono text-xs font-bold border-2 cursor-pointer transition-colors ${
                      hasVoted(result.bill.number) === "NAY"
                        ? "bg-status-red text-white border-status-red"
                        : "bg-surface text-status-red border-status-red hover:bg-status-red-light"
                    }`}
                  >
                    NAY
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Party Split Visualization ── */}
          {result.rollCallVotes.length > 0 && partySplit && result.voteTotals && (
            <div className="border-3 border-border bg-surface p-6">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h3 className="font-headline text-2xl">Party Breakdown</h3>
                <span className={`px-3 py-1 font-mono text-xs font-bold ${
                  partyLine
                    ? "bg-status-red text-white"
                    : "bg-green text-white"
                }`}>
                  {partyLine ? "PARTY-LINE VOTE" : "BIPARTISAN VOTE"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Democrats */}
                <div className="border-2 border-blue-900 p-4">
                  <h4 className="font-mono text-sm font-bold text-blue-900 mb-3">DEMOCRATS</h4>
                  <div className="flex gap-4 items-center">
                    <div className="text-center">
                      <span className="block font-headline text-2xl text-green">{partySplit.dems.yea}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-mid">YEA</span>
                    </div>
                    <div className="text-center">
                      <span className="block font-headline text-2xl text-status-red">{partySplit.dems.nay}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-mid">NAY</span>
                    </div>
                    {partySplit.dems.notVoting > 0 && (
                      <div className="text-center">
                        <span className="block font-headline text-2xl text-gray-mid">{partySplit.dems.notVoting}</span>
                        <span className="font-mono text-[10px] font-bold text-gray-mid">NV</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex h-3 border border-blue-900 overflow-hidden">
                    <div className="bg-green h-full" style={{ width: `${(partySplit.dems.yea / Math.max(1, partySplit.dems.yea + partySplit.dems.nay + partySplit.dems.notVoting)) * 100}%` }} />
                    <div className="bg-status-red h-full" style={{ width: `${(partySplit.dems.nay / Math.max(1, partySplit.dems.yea + partySplit.dems.nay + partySplit.dems.notVoting)) * 100}%` }} />
                    <div className="bg-gray-light h-full flex-1" />
                  </div>
                </div>

                {/* Republicans */}
                <div className="border-2 border-red p-4">
                  <h4 className="font-mono text-sm font-bold text-red mb-3">REPUBLICANS</h4>
                  <div className="flex gap-4 items-center">
                    <div className="text-center">
                      <span className="block font-headline text-2xl text-green">{partySplit.reps.yea}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-mid">YEA</span>
                    </div>
                    <div className="text-center">
                      <span className="block font-headline text-2xl text-status-red">{partySplit.reps.nay}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-mid">NAY</span>
                    </div>
                    {partySplit.reps.notVoting > 0 && (
                      <div className="text-center">
                        <span className="block font-headline text-2xl text-gray-mid">{partySplit.reps.notVoting}</span>
                        <span className="font-mono text-[10px] font-bold text-gray-mid">NV</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex h-3 border border-red overflow-hidden">
                    <div className="bg-green h-full" style={{ width: `${(partySplit.reps.yea / Math.max(1, partySplit.reps.yea + partySplit.reps.nay + partySplit.reps.notVoting)) * 100}%` }} />
                    <div className="bg-status-red h-full" style={{ width: `${(partySplit.reps.nay / Math.max(1, partySplit.reps.yea + partySplit.reps.nay + partySplit.reps.notVoting)) * 100}%` }} />
                    <div className="bg-gray-light h-full flex-1" />
                  </div>
                </div>
              </div>

              {/* Independents */}
              {partySplit.inds.yea + partySplit.inds.nay + partySplit.inds.notVoting > 0 && (
                <div className="border-2 border-gray-mid p-4 mb-4">
                  <h4 className="font-mono text-sm font-bold text-gray-mid mb-2">INDEPENDENTS</h4>
                  <div className="flex gap-4 items-center">
                    <div className="text-center">
                      <span className="block font-headline text-xl text-green">{partySplit.inds.yea}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-mid">YEA</span>
                    </div>
                    <div className="text-center">
                      <span className="block font-headline text-xl text-status-red">{partySplit.inds.nay}</span>
                      <span className="font-mono text-[10px] font-bold text-gray-mid">NAY</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Crossed party lines */}
              {crossPartyVoters.length > 0 && (
                <div className="border-2 border-border p-4 bg-cream-dark">
                  <h4 className="font-mono text-sm font-bold text-gray-mid mb-2">
                    CROSSED PARTY LINES ({crossPartyVoters.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {crossPartyVoters.map((v, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 border font-mono text-[10px] font-bold ${
                          partyLabel(v.party) === "DEM"
                            ? "border-blue-900 text-blue-900"
                            : "border-red text-red"
                        }`}
                      >
                        <span className={`w-3 h-3 flex items-center justify-center text-white text-[8px] ${
                          partyLabel(v.party) === "DEM" ? "bg-navy" : "bg-red"
                        }`}>
                          {v.party.charAt(0)}
                        </span>
                        {v.memberName} ({v.state}) — {v.vote}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Overall Vote Totals ── */}
          {result.rollCallVotes.length > 0 && result.voteTotals && (
            <div className="border-3 border-border bg-surface p-6">
              <h3 className="font-headline text-2xl mb-4">Roll Call Vote Results</h3>

              {/* Totals bar */}
              <div className="border-2 border-border p-4 bg-cream-dark mb-6">
                <div className="flex flex-wrap gap-6 items-center justify-center">
                  <div className="text-center">
                    <span className="block font-headline text-3xl text-green">{result.voteTotals.yea}</span>
                    <span className="font-mono text-xs font-bold text-gray-mid">YEA</span>
                  </div>
                  <div className="w-px h-10 bg-border-light hidden sm:block" />
                  <div className="text-center">
                    <span className="block font-headline text-3xl text-status-red">{result.voteTotals.nay}</span>
                    <span className="font-mono text-xs font-bold text-gray-mid">NAY</span>
                  </div>
                  {result.voteTotals.notVoting > 0 && (
                    <>
                      <div className="w-px h-10 bg-border-light hidden sm:block" />
                      <div className="text-center">
                        <span className="block font-headline text-3xl text-gray-mid">{result.voteTotals.notVoting}</span>
                        <span className="font-mono text-xs font-bold text-gray-mid">NOT VOTING</span>
                      </div>
                    </>
                  )}
                  {result.voteTotals.present > 0 && (
                    <>
                      <div className="w-px h-10 bg-border-light hidden sm:block" />
                      <div className="text-center">
                        <span className="block font-headline text-3xl text-gray-mid">{result.voteTotals.present}</span>
                        <span className="font-mono text-xs font-bold text-gray-mid">PRESENT</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 flex h-4 border border-border overflow-hidden">
                  <div className="bg-green h-full" style={{ width: `${(result.voteTotals.yea / (result.voteTotals.yea + result.voteTotals.nay + result.voteTotals.notVoting + result.voteTotals.present)) * 100}%` }} />
                  <div className="bg-status-red h-full" style={{ width: `${(result.voteTotals.nay / (result.voteTotals.yea + result.voteTotals.nay + result.voteTotals.notVoting + result.voteTotals.present)) * 100}%` }} />
                  <div className="bg-gray-light h-full flex-1" />
                </div>
              </div>

              {/* Party filter pills */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(["ALL", "DEM", "GOP", "IND"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPartyFilter(p)}
                    className={`px-4 py-2 font-mono text-xs font-bold uppercase cursor-pointer border-2 transition-colors ${
                      partyFilter === p
                        ? "bg-black text-cream border-black"
                        : "bg-surface text-gray-mid border-border hover:border-black"
                    }`}
                  >
                    {p === "ALL" ? "All Parties" : p}
                  </button>
                ))}
              </div>

              <p className="font-mono text-xs text-gray-mid mb-3 font-bold">
                {filteredVotes.length} VOTE{filteredVotes.length !== 1 ? "S" : ""} SHOWN
                {savedRepNames.length > 0 && " — ★ = YOUR SAVED REPS"}
              </p>

              {/* Vote table */}
              <div className="overflow-x-auto border-2 border-border">
                <table className="w-full">
                  <thead>
                    <tr className="bg-black text-cream">
                      <th
                        scope="col"
                        onClick={() => handleSort("memberName")}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("memberName"); } }}
                        tabIndex={0}
                        role="columnheader"
                        aria-sort={sortField === "memberName" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        className="text-left px-4 py-3 font-mono text-xs font-bold uppercase cursor-pointer hover:text-red transition-colors"
                      >
                        Member{sortArrow("memberName")}
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("party")}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("party"); } }}
                        tabIndex={0}
                        role="columnheader"
                        aria-sort={sortField === "party" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        className="text-left px-4 py-3 font-mono text-xs font-bold uppercase cursor-pointer hover:text-red transition-colors"
                      >
                        Party{sortArrow("party")}
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("state")}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("state"); } }}
                        tabIndex={0}
                        role="columnheader"
                        aria-sort={sortField === "state" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        className="text-left px-4 py-3 font-mono text-xs font-bold uppercase cursor-pointer hover:text-red transition-colors"
                      >
                        State{sortArrow("state")}
                      </th>
                      <th
                        scope="col"
                        onClick={() => handleSort("vote")}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("vote"); } }}
                        tabIndex={0}
                        role="columnheader"
                        aria-sort={sortField === "vote" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                        className="text-left px-4 py-3 font-mono text-xs font-bold uppercase cursor-pointer hover:text-red transition-colors"
                      >
                        Vote{sortArrow("vote")}
                      </th>
                      <th scope="col" className="text-left px-4 py-3 font-mono text-xs font-bold uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVotes.map((v, i) => {
                      const isSaved = savedRepNames.some(
                        (n) => v.memberName.toLowerCase().includes(n) || n.includes(v.memberName.toLowerCase())
                      );
                      return (
                        <tr
                          key={`${v.memberName}-${i}`}
                          className={`border-t border-border-light ${
                            isSaved ? "bg-red/5" : i % 2 === 0 ? "bg-surface" : "bg-cream-dark"
                          } hover:bg-hover transition-colors`}
                        >
                          <td className="px-4 py-3 font-body text-base font-bold">
                            {isSaved && <span className="text-red mr-1" title="Saved representative">★</span>}
                            {v.memberName}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-mono font-bold ${partyColorClass(v.party)}`}>
                              {partyLabel(v.party)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm">{v.state}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-3 py-1 text-xs font-mono font-bold border ${voteBadgeBg(v.vote)} ${voteColor(v.vote)}`}>
                              {v.vote.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/draft?rep=${encodeURIComponent(v.memberName)}&issue=${encodeURIComponent(`${result.bill.number}: ${result.bill.title} — ${v.memberName} voted ${v.vote.toUpperCase()} on this bill.`)}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red text-cream font-mono text-[10px] font-bold no-underline hover:bg-red-dark transition-colors border border-black"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              WRITE
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Vote Comparison Tool ── */}
          {result.rollCallVotes.length > 0 && (
            <div className="border-3 border-border bg-surface p-6">
              <h3 className="font-headline text-2xl mb-2">Compare Two Representatives</h3>
              <p className="font-body text-sm text-gray-mid mb-4">
                See how two members voted side-by-side on this bill.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="compare-a" className="font-mono text-xs font-bold text-gray-mid block mb-1">
                    REPRESENTATIVE A
                  </label>
                  <input
                    id="compare-a"
                    type="text"
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                    placeholder="Type a name..."
                    list="members-list-a"
                    className="w-full px-3 py-2 border-2 border-border bg-cream-dark font-mono text-sm focus:outline-none focus:border-red"
                  />
                  <datalist id="members-list-a">
                    {result.rollCallVotes.slice(0, 100).map((v, i) => (
                      <option key={i} value={v.memberName} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="compare-b" className="font-mono text-xs font-bold text-gray-mid block mb-1">
                    REPRESENTATIVE B
                  </label>
                  <input
                    id="compare-b"
                    type="text"
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                    placeholder="Type a name..."
                    list="members-list-b"
                    className="w-full px-3 py-2 border-2 border-border bg-cream-dark font-mono text-sm focus:outline-none focus:border-red"
                  />
                  <datalist id="members-list-b">
                    {result.rollCallVotes.slice(0, 100).map((v, i) => (
                      <option key={i} value={v.memberName} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Saved reps quick-pick */}
              {myReps.length > 0 && (
                <div className="mb-4">
                  <p className="font-mono text-[10px] font-bold text-gray-mid mb-2">QUICK-PICK FROM YOUR SAVED REPS:</p>
                  <div className="flex flex-wrap gap-2">
                    {myReps.map((rep) => (
                      <button
                        key={rep.id}
                        onClick={() => {
                          if (!compareA) setCompareA(rep.fullName);
                          else if (!compareB) setCompareB(rep.fullName);
                          else setCompareA(rep.fullName);
                        }}
                        className="px-2 py-1 border border-border font-mono text-[10px] font-bold cursor-pointer hover:bg-red hover:text-white hover:border-red transition-colors"
                      >
                        ★ {rep.fullName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison result */}
              {comparisonResult && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border-2 p-4 ${comparisonResult.voteA ? "border-border" : "border-border-light"}`}>
                    {comparisonResult.voteA ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-mono font-bold ${partyColorClass(comparisonResult.voteA.party)}`}>
                            {partyLabel(comparisonResult.voteA.party)}
                          </span>
                          <span className="font-mono text-xs text-gray-mid">{comparisonResult.voteA.state}</span>
                        </div>
                        <p className="font-headline text-lg normal-case mb-2">{comparisonResult.voteA.memberName}</p>
                        <span className={`inline-block px-4 py-2 text-sm font-mono font-bold border ${voteBadgeBg(comparisonResult.voteA.vote)} ${voteColor(comparisonResult.voteA.vote)}`}>
                          {comparisonResult.voteA.vote.toUpperCase()}
                        </span>
                      </>
                    ) : (
                      <p className="font-body text-sm text-gray-mid">
                        {compareA ? `"${compareA}" not found in this vote` : "Enter a name above"}
                      </p>
                    )}
                  </div>

                  <div className="sm:hidden text-center font-headline text-lg text-gray-mid -my-2">VS</div>

                  <div className={`border-2 p-4 ${comparisonResult.voteB ? "border-border" : "border-border-light"}`}>
                    {comparisonResult.voteB ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-mono font-bold ${partyColorClass(comparisonResult.voteB.party)}`}>
                            {partyLabel(comparisonResult.voteB.party)}
                          </span>
                          <span className="font-mono text-xs text-gray-mid">{comparisonResult.voteB.state}</span>
                        </div>
                        <p className="font-headline text-lg normal-case mb-2">{comparisonResult.voteB.memberName}</p>
                        <span className={`inline-block px-4 py-2 text-sm font-mono font-bold border ${voteBadgeBg(comparisonResult.voteB.vote)} ${voteColor(comparisonResult.voteB.vote)}`}>
                          {comparisonResult.voteB.vote.toUpperCase()}
                        </span>
                      </>
                    ) : (
                      <p className="font-body text-sm text-gray-mid">
                        {compareB ? `"${compareB}" not found in this vote` : "Enter a name above"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Action Timeline ── */}
          {result.actions.length > 0 && (
            <div className="border-3 border-border bg-surface p-6">
              <h3 className="font-headline text-2xl mb-4">
                {result.rollCallVotes.length > 0 ? "Legislative Timeline" : "Action History"}
              </h3>
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border-light" />
                <div className="space-y-4">
                  {result.actions.map((action, i) => (
                    <div key={i} className="flex gap-4 relative">
                      <div className={`w-10 h-10 shrink-0 flex items-center justify-center z-10 ${actionAccent(action.text)}`}>
                        <span className="font-headline text-xs text-white">{actionIcon(action.text)}</span>
                      </div>
                      <div className="flex-1 pb-2">
                        <p className="font-mono text-xs font-bold text-gray-mid">{action.date}</p>
                        <p className="font-body text-base mt-1">{action.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION E: How to Use Vote Data            */}
      {/* ═══════════════════════════════════════════ */}
      {!loading && (
        <section className="border-3 border-border bg-surface p-6 md:p-8 mt-8">
          <h2 className="font-headline text-2xl mb-2">How to Use Vote Data</h2>
          <p className="font-body text-sm text-gray-mid leading-relaxed mb-5">
            Congressional votes are public record. Here&apos;s how to turn that transparency into action.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-border p-4 bg-cream-dark">
              <div className="w-10 h-10 bg-red flex items-center justify-center text-cream mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="font-headline text-lg normal-case mb-1">Hold Your Rep Accountable</h3>
              <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
                Reference specific votes when writing to your representative. Saying
                &quot;you voted NAY on HR 1234&quot; is far more powerful than general complaints.
              </p>
              <Link href="/draft" className="font-mono text-xs font-bold text-red no-underline hover:text-black transition-colors">
                WRITE TO CONGRESS &rarr;
              </Link>
            </div>
            <div className="border-2 border-border p-4 bg-cream-dark">
              <div className="w-10 h-10 bg-black flex items-center justify-center text-cream mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-headline text-lg normal-case mb-1">Track Voting Patterns</h3>
              <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
                One vote doesn&apos;t tell the whole story. Look at how representatives vote
                over time, especially on issues you care about. Check their party loyalty
                score on their profile page.
              </p>
              <Link href="/directory" className="font-mono text-xs font-bold text-red no-underline hover:text-black transition-colors">
                BROWSE MEMBER PROFILES &rarr;
              </Link>
            </div>
            <div className="border-2 border-border p-4 bg-cream-dark">
              <div className="w-10 h-10 bg-navy flex items-center justify-center text-cream mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-headline text-lg normal-case mb-1">Follow the Money</h3>
              <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
                Cross-reference how your rep votes with who donates to their campaigns.
                Every member profile includes campaign finance data and lobbying filings
                so you can connect the dots.
              </p>
              <Link href="/directory" className="font-mono text-xs font-bold text-red no-underline hover:text-black transition-colors">
                VIEW CAMPAIGN FINANCE &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
