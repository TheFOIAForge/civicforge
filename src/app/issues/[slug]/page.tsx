"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getIssueBySlug } from "@/data/issues";
import { useScorecard } from "@/lib/scorecard-context";
import type { Representative, Legislation } from "@/data/types";

const issueEmoji: Record<string, string> = {
  healthcare: "\u{1F3E5}",
  environment: "\u{1F30D}",
  housing: "\u{1F3E0}",
  immigration: "\u{1F5FD}",
  education: "\u{1F4DA}",
  economy: "\u{1F4B0}",
  "civil-rights": "\u{2696}\u{FE0F}",
  defense: "\u{1F6E1}\u{FE0F}",
};

const issueSearchKeywords: Record<string, string> = {
  healthcare: "health care medical insurance",
  environment: "climate change energy environment",
  housing: "housing rent mortgage affordable",
  immigration: "immigration border visa",
  education: "education school student",
  economy: "economic tax budget fiscal",
  "civil-rights": "civil rights voting police reform",
  defense: "defense military veterans foreign",
  "gun-policy": "firearm gun second amendment",
  "tech-privacy": "technology privacy data digital",
};

function statusColor(status: string) {
  switch (status) {
    case "passed": return "bg-green text-white";
    case "in_committee": return "bg-yellow-light text-yellow";
    case "failed": return "bg-status-red-light text-status-red";
    default: return "bg-red-light text-red";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "passed": return "PASSED";
    case "in_committee": return "IN COMMITTEE";
    case "failed": return "FAILED";
    default: return "INTRODUCED";
  }
}

interface BillAIState {
  billId: string;
  phase: "picking" | "loading" | "done" | "error";
  memberSearch: string;
  selectedMember: Representative | null;
  analysis: string;
}

function BillSkeleton() {
  return (
    <div className="border-2 border-border-light p-5 bg-cream motion-safe:animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-24 bg-border-light" />
        <div className="h-5 w-16 bg-border-light" />
        <div className="h-5 w-20 bg-border-light" />
      </div>
      <div className="h-6 w-3/4 bg-border-light mb-2" />
      <div className="h-4 w-1/2 bg-border-light mb-2" />
      <div className="h-4 w-full bg-border-light" />
      <div className="h-4 w-5/6 bg-border-light mt-1" />
    </div>
  );
}

export default function IssueDetailPage() {
  const params = useParams();
  const issue = getIssueBySlug(params.slug as string);
  const { addVote, removeVote, hasVoted } = useScorecard();
  const [featuredReps, setFeaturedReps] = useState<Representative[]>([]);
  const [allMembers, setAllMembers] = useState<Representative[]>([]);
  const [billAI, setBillAI] = useState<BillAIState | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Live bills state
  const [liveBills, setLiveBills] = useState<Legislation[] | null>(null);
  const [billsLoading, setBillsLoading] = useState(true);
  const [billsFailed, setBillsFailed] = useState(false);

  const slug = params.slug as string;
  const searchKeyword = issueSearchKeywords[slug] || slug;

  useEffect(() => {
    setHasApiKey(!!localStorage.getItem("checkmyrep_api_key"));
    fetch("/api/members?featured=true")
      .then((r) => r.json())
      .then((reps: Representative[]) => setFeaturedReps(reps.slice(0, 4)))
      .catch(() => {});
  }, []);

  // Fetch live bills from Congress.gov API
  useEffect(() => {
    if (!slug) return;

    setBillsLoading(true);
    setBillsFailed(false);
    setLiveBills(null);

    fetch(`/api/bills?query=${encodeURIComponent(searchKeyword)}`)
      .then((r) => {
        if (!r.ok) throw new Error("API error");
        return r.json();
      })
      .then((bills: Legislation[]) => {
        if (Array.isArray(bills) && bills.length > 0) {
          setLiveBills(bills.slice(0, 8));
        } else {
          setBillsFailed(true);
        }
        setBillsLoading(false);
      })
      .catch(() => {
        setBillsFailed(true);
        setBillsLoading(false);
      });
  }, [slug, searchKeyword]);

  // Determine which bills to display: live or fallback to static
  const displayBills: Legislation[] =
    liveBills && liveBills.length > 0
      ? liveBills
      : issue?.legislation ?? [];

  const isUsingFallback = !liveBills || liveBills.length === 0;

  // Lazy-load all members when user opens a picker
  const loadMembers = useCallback(() => {
    if (allMembers.length > 0) return;
    fetch("/api/members")
      .then((r) => r.json())
      .then(setAllMembers)
      .catch(() => {});
  }, [allMembers.length]);

  const startBillAI = (bill: Legislation) => {
    loadMembers();
    setBillAI({
      billId: bill.id,
      phase: "picking",
      memberSearch: "",
      selectedMember: null,
      analysis: "",
    });
  };

  const selectMemberForBill = async (bill: Legislation, member: Representative) => {
    setBillAI((prev) =>
      prev ? { ...prev, phase: "loading", selectedMember: member } : null
    );

    const apiKey = localStorage.getItem("checkmyrep_api_key");
    if (!apiKey) {
      setBillAI((prev) =>
        prev ? { ...prev, phase: "error", analysis: "No API key found. Add your key in Settings." } : null
      );
      return;
    }

    // Fetch enriched member data for cross-referencing
    let enrichedData = "";
    try {
      const enrichRes = await fetch(`/api/members/${member.id}`);
      if (enrichRes.ok) {
        const enriched: Representative = await enrichRes.json();
        const donors = enriched.topDonors?.map((d) => `${d.name}: ${d.amount}`).join(", ") || "None";
        const industries = enriched.topIndustries?.map((d) => `${d.name}: ${d.amount}`).join(", ") || "None";
        const lobbying = (enriched.lobbyingFilings || [])
          .slice(0, 10)
          .map((f) => `${f.client} (${f.registrant}) — $${f.amount.toLocaleString()} — Issues: ${f.issueLabels.join(", ")} — Bills: ${f.billsLobbied.join(", ") || "none cited"}${f.matchesDonor ? " [MATCHES TOP DONOR]" : ""}`)
          .join("\n");
        const committees = enriched.committees?.join(", ") || "None";
        const funding = enriched.totalFundraising || "Unknown";
        const smallDollar = enriched.smallDollarPct ?? "Unknown";

        enrichedData = `
MEMBER DATA FOR ${enriched.fullName} (${enriched.party === "D" ? "Democrat" : enriched.party === "R" ? "Republican" : "Independent"}-${enriched.stateAbbr}):
- Committees: ${committees}
- Total Fundraising: ${funding}
- Small Dollar %: ${smallDollar}%
- Top Donor Employers: ${donors}
- Donor Occupations: ${industries}
- Recent Lobbying Activity (up to 10 filings):
${lobbying || "None found"}
- Party Loyalty: ${enriched.partyLoyalty}%
- Bills Introduced: ${enriched.billsIntroduced}
- Notable Legislation: ${enriched.notableLegislation?.map((b) => `${b.billNumber}: ${b.title} (${b.role})`).join("; ") || "None"}`;
      }
    } catch {
      // Continue with basic data
    }

    const systemPrompt = `You are an investigative government accountability analyst for CheckMyRep. You cross-reference bill data with campaign finance, lobbying disclosures, and committee assignments to reveal connections the average citizen would miss.

BILL DATA:
- Bill: ${bill.billNumber} — "${bill.title}"
- Status: ${bill.status}
- Date: ${bill.date}
- Sponsor: ${bill.sponsor}
- Summary: ${bill.summary}
- Issue Area: ${issue?.name || "Unknown"}
${enrichedData}

YOUR TASK:
Analyze this bill in the context of ${member.fullName}'s record. Specifically address:

1. **The Bill**: What does it actually do? Who benefits? Who might oppose it?
2. **This Member's Role**: Did they sponsor/co-sponsor? Are they on a committee with jurisdiction? Have they spoken about this issue?
3. **Follow the Money**: Do any of their top donors or lobbying clients have a financial interest in this bill's outcome? Flag any donor-lobbyist overlaps explicitly.
4. **Committee Connection**: Is this bill in a committee they sit on? Do they have leverage over its fate?
5. **The Bottom Line**: A clear 1-2 sentence assessment for a voter trying to understand this member's relationship to this bill.

RULES:
- Be factual. Cite specific dollar amounts and names from the data.
- If data is unavailable, say so — don't speculate.
- Flag conflicts of interest clearly but let the reader draw conclusions.
- No partisan framing. Present facts.
- Keep it under 400 words.
- Do not use phrases like "let that sink in", "make no mistake", "imagine", or "wake up".
- Write like an investigative journalist, not an activist.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Analyze ${bill.billNumber} ("${bill.title}") in the context of ${member.fullName}'s record, donors, and lobbying connections.`,
            },
          ],
        }),
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || "Unable to generate analysis.";
      setBillAI((prev) =>
        prev ? { ...prev, phase: "done", analysis: text } : null
      );
    } catch {
      setBillAI((prev) =>
        prev ? { ...prev, phase: "error", analysis: "Failed to generate analysis. Check your API key." } : null
      );
    }
  };

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-headline text-5xl">Issue Not Found</h1>
        <Link href="/issues" className="inline-block mt-6 px-8 py-4 bg-black text-white font-headline uppercase text-base no-underline hover:bg-red transition-colors">
          Back to Issues
        </Link>
      </div>
    );
  }

  const emoji = issueEmoji[issue.id] || issue.icon;

  // Filter members for the picker
  const filteredMembers = billAI?.memberSearch
    ? allMembers.filter((m) =>
        m.fullName.toLowerCase().includes(billAI.memberSearch.toLowerCase()) ||
        m.state.toLowerCase().includes(billAI.memberSearch.toLowerCase()) ||
        m.stateAbbr.toLowerCase().includes(billAI.memberSearch.toLowerCase())
      ).slice(0, 8)
    : allMembers.slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/issues" className="font-mono text-sm text-gray-mid hover:text-red no-underline font-bold">
        &larr; BACK TO ISSUES
      </Link>

      {/* Header */}
      <div className="mt-4 bg-black text-white border-3 border-border p-8">
        <span className="block mb-4" style={{ fontSize: 80 }}>{emoji}</span>
        <h1 className="font-headline text-5xl md:text-6xl normal-case text-white">
          {issue.name}
        </h1>
        <p className="mt-4 font-body text-lg text-white/85">
          {issue.description}
        </p>
        <Link
          href={`/draft?issue=${issue.slug}`}
          className="inline-block mt-6 px-8 py-4 bg-red text-white font-headline uppercase text-base no-underline hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
        >
          Take Action on {issue.name} &rarr;
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Explainer */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-4">{"\u{1F4D6}"} What You Need to Know</h2>
            <p className="font-body text-base leading-relaxed text-gray-mid">{issue.explainer}</p>
          </section>

          {/* Legislation Feed */}
          <section className="border-3 border-border p-6 bg-surface">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="font-headline text-2xl">{"\u{1F4DC}"} Current Legislation</h2>
              {!isUsingFallback && (
                <span className="font-mono text-[10px] text-gray-mid border border-border-light px-2 py-1">
                  LIVE FROM CONGRESS.GOV
                </span>
              )}
              {isUsingFallback && !billsLoading && (
                <span className="font-mono text-[10px] text-gray-mid border border-border-light px-2 py-1">
                  SAMPLE LEGISLATION
                </span>
              )}
            </div>

            {/* Loading skeletons */}
            {billsLoading && (
              <div className="space-y-4">
                <BillSkeleton />
                <BillSkeleton />
                <BillSkeleton />
              </div>
            )}

            {/* Bills list */}
            {!billsLoading && displayBills.length === 0 ? (
              <p className="font-mono text-base text-gray-mid">No tracked legislation for this issue yet.</p>
            ) : !billsLoading ? (
              <div className="space-y-4">
                {displayBills.map((bill) => (
                  <div key={bill.id} className="border-2 border-border-light p-5 bg-cream">
                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 font-mono text-xs font-bold ${statusColor(bill.status)}`}>
                          {statusLabel(bill.status)}
                        </span>
                        <span className="font-mono text-sm text-gray-mid font-bold">{bill.billNumber}</span>
                        <span className="font-mono text-sm text-gray-mid">{bill.date}</span>
                      </div>
                      {/* Ask AI button */}
                      {hasApiKey ? (
                        <button
                          onClick={() => startBillAI(bill)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red text-white font-mono text-xs font-bold cursor-pointer hover:bg-black transition-colors shrink-0"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          ASK AI
                        </button>
                      ) : (
                        <Link
                          href="/settings"
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-gray-mid font-mono text-[10px] font-bold no-underline hover:text-red hover:border-red transition-colors shrink-0"
                        >
                          SET API KEY FOR AI
                        </Link>
                      )}
                    </div>
                    <h3 className="font-headline text-lg normal-case">{bill.title}</h3>
                    <p className="font-mono text-sm text-gray-mid mt-1 font-bold">
                      Sponsor: {bill.sponsor}
                    </p>
                    <p className="font-body text-base text-gray-mid mt-2">{bill.summary}</p>

                    {/* Scorecard YEA/NAY buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-light">
                      <span className="font-mono text-[10px] text-gray-mid font-bold">YOUR POSITION:</span>
                      <button
                        onClick={() => {
                          if (hasVoted(bill.billNumber) === "YEA") {
                            removeVote(bill.billNumber);
                          } else {
                            addVote(bill.billNumber, bill.title, "YEA", issue?.name);
                          }
                        }}
                        className={`px-3 py-1.5 font-mono text-xs font-bold border-2 cursor-pointer transition-colors ${
                          hasVoted(bill.billNumber) === "YEA"
                            ? "bg-green text-white border-green"
                            : "bg-surface text-green border-green hover:bg-green-light"
                        }`}
                      >
                        YEA
                      </button>
                      <button
                        onClick={() => {
                          if (hasVoted(bill.billNumber) === "NAY") {
                            removeVote(bill.billNumber);
                          } else {
                            addVote(bill.billNumber, bill.title, "NAY", issue?.name);
                          }
                        }}
                        className={`px-3 py-1.5 font-mono text-xs font-bold border-2 cursor-pointer transition-colors ${
                          hasVoted(bill.billNumber) === "NAY"
                            ? "bg-status-red text-white border-status-red"
                            : "bg-surface text-status-red border-status-red hover:bg-status-red-light"
                        }`}
                      >
                        NAY
                      </button>
                      {hasVoted(bill.billNumber) && (
                        <Link
                          href="/scorecard"
                          className="font-mono text-[10px] text-red no-underline font-bold hover:text-black transition-colors ml-2"
                        >
                          VIEW SCORECARD
                        </Link>
                      )}
                    </div>

                    {/* AI Analysis Panel — inline under this bill */}
                    {billAI && billAI.billId === bill.id && (
                      <div className="mt-4 border-t-2 border-border-light pt-4">
                        {/* Member picker */}
                        {billAI.phase === "picking" && (
                          <div>
                            <p className="font-mono text-xs font-bold text-gray-mid mb-2">
                              SELECT A MEMBER TO ANALYZE THIS BILL IN THEIR CONTEXT:
                            </p>
                            <input
                              type="text"
                              placeholder="Search by name or state..."
                              value={billAI.memberSearch}
                              onChange={(e) =>
                                setBillAI((prev) =>
                                  prev ? { ...prev, memberSearch: e.target.value } : null
                                )
                              }
                              className="w-full px-3 py-2 border-2 border-border bg-surface font-mono text-sm mb-2 focus:outline-none focus:border-red"
                              autoFocus
                            />
                            {allMembers.length === 0 ? (
                              <p className="font-mono text-xs text-gray-mid motion-safe:animate-pulse">Loading members...</p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                {filteredMembers.map((m) => (
                                  <button
                                    key={m.id}
                                    onClick={() => selectMemberForBill(bill, m)}
                                    className="flex items-center gap-2 p-2 border border-border-light hover:border-red hover:bg-red/5 transition-colors cursor-pointer text-left"
                                  >
                                    <span
                                      className={`w-7 h-7 flex items-center justify-center text-white text-[10px] font-mono font-bold shrink-0 ${
                                        m.party === "D" ? "bg-blue-900" : m.party === "R" ? "bg-red" : "bg-gray-mid"
                                      }`}
                                    >
                                      {m.party}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="font-mono text-xs font-bold truncate">{m.fullName}</div>
                                      <div className="font-mono text-[10px] text-gray-mid">{m.title} — {m.stateAbbr}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                            <button
                              onClick={() => setBillAI(null)}
                              className="mt-2 font-mono text-xs text-gray-mid hover:text-red cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Loading */}
                        {billAI.phase === "loading" && billAI.selectedMember && (
                          <div className="text-center py-4">
                            <p className="font-mono text-sm text-gray-mid motion-safe:animate-pulse mb-1">
                              Analyzing {bill.billNumber} in context of {billAI.selectedMember.fullName}...
                            </p>
                            <p className="font-mono text-[10px] text-gray-mid">
                              Cross-referencing donors, lobbying filings, and committee data
                            </p>
                          </div>
                        )}

                        {/* Result */}
                        {(billAI.phase === "done" || billAI.phase === "error") && (
                          <div>
                            {billAI.selectedMember && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-mono text-xs font-bold text-gray-mid">ANALYSIS FOR:</span>
                                <Link
                                  href={`/directory/${billAI.selectedMember.slug}`}
                                  className="font-mono text-xs font-bold text-red no-underline hover:underline"
                                >
                                  {billAI.selectedMember.fullName} ({billAI.selectedMember.party}-{billAI.selectedMember.stateAbbr})
                                </Link>
                              </div>
                            )}
                            <div className="bg-surface border-2 border-border p-4">
                              <p className="font-body text-sm leading-relaxed whitespace-pre-wrap">
                                {billAI.analysis}
                              </p>
                            </div>
                            <div className="flex gap-3 mt-2">
                              <button
                                onClick={() => startBillAI(bill)}
                                className="font-mono text-xs text-gray-mid hover:text-red cursor-pointer font-bold"
                              >
                                ANALYZE WITH DIFFERENT MEMBER
                              </button>
                              <button
                                onClick={() => setBillAI(null)}
                                className="font-mono text-xs text-gray-mid hover:text-red cursor-pointer"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* View more legislation link */}
                {!isUsingFallback && (
                  <Link
                    href={`/bills?query=${encodeURIComponent(searchKeyword)}`}
                    className="block mt-4 px-5 py-3 border-3 border-border text-center font-headline uppercase text-base no-underline text-black hover:bg-black hover:text-white transition-colors"
                  >
                    View more legislation &rarr;
                  </Link>
                )}
              </div>
            ) : null}
          </section>

          {/* Related reps */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-5">{"\u{1F465}"} Write to These Members</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredReps.map((rep) => (
                <Link
                  key={rep.id}
                  href={`/draft?rep=${rep.slug}&issue=${issue.slug}`}
                  className="no-underline text-black border-2 border-border p-4 hover:bg-hover transition-colors flex items-center gap-3 group"
                >
                  <div className={`w-10 h-10 ${rep.party === "D" ? "bg-dem" : rep.party === "R" ? "bg-rep" : "bg-ind"} flex items-center justify-center shrink-0`}>
                    <span className="font-headline text-sm text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                  </div>
                  <div>
                    <div className="font-headline text-base normal-case group-hover:text-red">{rep.fullName}</div>
                    <div className="font-mono text-xs text-gray-mid">{rep.title} — {rep.state}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Talking Points */}
          <section className="border-3 border-border p-6 bg-cream-dark">
            <h2 className="font-headline text-2xl mb-5">{"\u{1F4AC}"} Talking Points</h2>
            <div className="space-y-4">
              {issue.talkingPoints.map((point, i) => (
                <div key={i} className="border-l-4 border-red pl-4 py-1">
                  <p className="font-body text-base text-gray-mid">{point}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="border-3 border-border p-6 bg-surface">
            <h2 className="font-headline text-2xl mb-4">Take Action</h2>
            <p className="font-body text-base text-gray-mid mb-5">
              Use these talking points to draft a letter, call script, or social
              post to your representatives.
            </p>
            <Link
              href={`/draft?issue=${issue.slug}`}
              className="block px-5 py-4 bg-red text-white font-headline uppercase text-base text-center no-underline hover:bg-red-dark transition-colors mb-3"
            >
              {"\u{270F}\u{FE0F}"} Draft a Letter
            </Link>
            <Link
              href={`/draft?issue=${issue.slug}&mode=call`}
              className="block px-5 py-4 bg-black text-white font-headline uppercase text-base text-center no-underline hover:bg-gray-dark transition-colors mb-3"
            >
              {"\u{1F4DE}"} Call Script
            </Link>
            <Link
              href="/directory"
              className="block px-5 py-4 bg-black text-white font-headline uppercase text-base text-center no-underline hover:bg-gray-dark transition-colors"
            >
              {"\u{1F50D}"} Find Your Rep
            </Link>
            <a
              href="https://www.thefoiaforge.org/new-request"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-5 py-4 bg-[#1a1a2e] text-white font-headline uppercase text-base text-center no-underline hover:bg-red transition-colors mt-3"
            >
              📄 File a FOIA Request
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
