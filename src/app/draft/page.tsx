"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { issues, getIssueBySlug } from "@/data/issues";
import { buildSystemPrompt } from "@/lib/prompts";
import type { Representative } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";

type Mode = "letter" | "call" | "social";

const modeConfig: Record<Mode, { label: string; emoji: string; desc: string; action: string }> = {
  letter: { label: "Letter", emoji: "\u{2709}\u{FE0F}", desc: "Email / letter for their office", action: "GENERATE LETTER" },
  call: { label: "Call Script", emoji: "\u{1F4DE}", desc: "Talking points for phone call", action: "GENERATE SCRIPT" },
  social: { label: "Social Post", emoji: "\u{1F4F1}", desc: "Posts to tag them online", action: "GENERATE POSTS" },
};

const quickTopics = [
  { label: "Healthcare", slug: "healthcare", icon: "🏥" },
  { label: "Climate", slug: "environment", icon: "🌍" },
  { label: "Economy", slug: "economy", icon: "💰" },
  { label: "Education", slug: "education", icon: "📚" },
  { label: "Immigration", slug: "immigration", icon: "🌐" },
  { label: "Housing", slug: "housing", icon: "🏠" },
  { label: "Civil Rights", slug: "civil-rights", icon: "⚖️" },
  { label: "Defense", slug: "defense", icon: "🛡️" },
];

function partyBg(party: string) {
  if (party === "D") return "bg-dem";
  if (party === "R") return "bg-rep";
  return "bg-ind";
}

function DraftInner() {
  const searchParams = useSearchParams();
  const { myReps, hasSavedReps } = useMyReps();
  const outputRef = useRef<HTMLDivElement>(null);

  const [allReps, setAllReps] = useState<Representative[]>([]);
  const [mode, setMode] = useState<Mode>(
    (searchParams.get("mode") as Mode) || "letter"
  );
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [selectedIssueSlug, setSelectedIssueSlug] = useState(
    searchParams.get("issue") || ""
  );
  const [concern, setConcern] = useState(searchParams.get("concern") || "");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAllReps, setShowAllReps] = useState(false);
  const [repSearch, setRepSearch] = useState("");

  // Load all reps
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data: Representative[]) => {
        setAllReps(data);
        // Auto-select from URL param
        const repParam = searchParams.get("rep");
        if (repParam) {
          const match = data.find((r: Representative) => r.slug === repParam);
          if (match) setSelectedRep(match);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Auto-select first saved rep if none selected and no URL param
  useEffect(() => {
    if (!selectedRep && hasSavedReps && !searchParams.get("rep")) {
      // Don't auto-select, let user choose
    }
  }, [hasSavedReps, selectedRep, searchParams]);

  const selectedIssue = selectedIssueSlug ? getIssueBySlug(selectedIssueSlug) : undefined;

  // Filter reps for search
  const filteredReps = repSearch
    ? allReps.filter((r) =>
        r.fullName.toLowerCase().includes(repSearch.toLowerCase()) ||
        r.state.toLowerCase().includes(repSearch.toLowerCase())
      )
    : allReps;

  // Reps not in saved list
  const otherReps = filteredReps.filter((r) => !myReps.some((mr) => mr.id === r.id));

  function getApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("civicforge_api_key");
  }

  async function handleGenerate() {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("No API key found. Add your Anthropic API key in Settings first.");
      return;
    }
    if (!selectedRep) {
      setError("Pick a representative first.");
      return;
    }
    if (!concern.trim()) {
      setError("Tell us what's on your mind — even a few words work.");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    const systemPrompt = buildSystemPrompt(mode, selectedRep, selectedIssue);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
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
              content: `My concern: ${concern}\n\nMy location: [CITY, STATE] (the user will fill this in)\n\nPlease draft the ${mode === "letter" ? "letter" : mode === "call" ? "call script" : "social media posts"}.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.content?.[0]?.text || "No response generated. Please try again.";
      setOutput(text);

      // Scroll to output on mobile
      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      // Auto-log to contact tracker
      try {
        const logs = JSON.parse(localStorage.getItem("civicforge_contacts") || "[]");
        logs.push({
          id: Date.now().toString(),
          repId: selectedRep.id,
          repName: selectedRep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          date: new Date().toISOString().split("T")[0],
          status: "sent",
          notes: concern.slice(0, 100),
          content: text.slice(0, 500),
        });
        localStorage.setItem("civicforge_contacts", JSON.stringify(logs));
      } catch {
        // Silently fail on storage errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getMailtoLink() {
    if (!selectedRep || !output) return "";
    const subject = encodeURIComponent(
      `Constituent Message: ${selectedIssue?.name || "Important Issue"}`
    );
    const body = encodeURIComponent(output);
    const email = selectedRep.email || "";
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function handleOpenContactForm() {
    if (!selectedRep) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    if (selectedRep.contactForm) {
      window.open(selectedRep.contactForm, "_blank");
    } else if (selectedRep.website) {
      window.open(selectedRep.website, "_blank");
    }
  }

  function handlePrint() {
    window.print();
  }

  const canGenerate = selectedRep && concern.trim().length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8" data-print-content>
      {/* Compact header */}
      <div className="mb-6" data-print-hide>
        <h1 className="font-headline text-4xl md:text-5xl mb-1">Write Congress</h1>
        <p className="font-mono text-xs text-gray-mid font-bold">
          AI-DRAFTED WITH REP VOTING CONTEXT — YOUR API KEY STAYS IN YOUR BROWSER
        </p>
      </div>

      {/* Step 1: Pick your rep — the fastest path */}
      {!output && (
        <div data-print-hide>
          {/* Mode pills — compact */}
          <div className="flex gap-2 mb-5">
            {(["letter", "call", "social"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setOutput(""); }}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 cursor-pointer transition-colors ${
                  mode === m
                    ? "bg-red text-white border-red"
                    : "bg-surface text-gray-mid border-border hover:border-red hover:text-red"
                }`}
              >
                {modeConfig[m].emoji} {modeConfig[m].label}
              </button>
            ))}
          </div>

          {/* STEP 1: Select rep */}
          <section className="mb-5">
            <h2 className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-widest">
              Step 1 — Who are you writing to?
            </h2>

            {/* Saved reps — one-tap selection */}
            {hasSavedReps && (
              <div className="mb-4">
                <p className="font-mono text-[10px] text-gray-mid font-bold mb-2">MY REPRESENTATIVES</p>
                <div className="flex flex-wrap gap-2">
                  {myReps.map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => setSelectedRep(rep)}
                      className={`flex items-center gap-2 px-4 py-3 border-3 cursor-pointer transition-all ${
                        selectedRep?.id === rep.id
                          ? "border-red bg-red-light"
                          : "border-border bg-surface hover:border-red"
                      }`}
                    >
                      <div className={`w-8 h-8 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                        <span className="font-headline text-sm text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                        {rep.photoUrl && (
                          <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="block font-headline text-sm normal-case leading-tight">{rep.fullName}</span>
                        <span className="block font-mono text-[10px] text-gray-mid">
                          {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"} — {rep.chamber}
                        </span>
                      </div>
                      {selectedRep?.id === rep.id && (
                        <span className="text-red font-bold text-lg ml-1">&#10003;</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other reps — collapsible search */}
            {!hasSavedReps || showAllReps ? (
              <div className={hasSavedReps ? "border-t border-border-light pt-4" : ""}>
                {hasSavedReps && (
                  <p className="font-mono text-[10px] text-gray-mid font-bold mb-2">OTHER MEMBERS OF CONGRESS</p>
                )}
                <input
                  type="search"
                  value={repSearch}
                  onChange={(e) => setRepSearch(e.target.value)}
                  placeholder="Search by name or state..."
                  className="w-full px-4 py-3 border-2 border-border bg-cream font-mono text-sm placeholder:text-gray-light focus:outline-none focus:border-red mb-3"
                />
                <div className="max-h-48 overflow-y-auto border-2 border-border bg-surface">
                  {(hasSavedReps ? otherReps : filteredReps).slice(0, 50).map((rep) => (
                    <button
                      key={rep.id}
                      onClick={() => { setSelectedRep(rep); setShowAllReps(false); setRepSearch(""); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors border-b border-border-light last:border-0 ${
                        selectedRep?.id === rep.id ? "bg-red-light" : "hover:bg-hover"
                      }`}
                    >
                      <span className={`w-6 h-6 ${partyBg(rep.party)} flex items-center justify-center shrink-0`}>
                        <span className="font-headline text-[10px] text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                      </span>
                      <span className="font-mono text-sm flex-1">
                        {rep.fullName} <span className="text-gray-mid">({rep.party}) — {rep.title}, {rep.state}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAllReps(true)}
                className="font-mono text-xs text-gray-mid font-bold cursor-pointer hover:text-red transition-colors underline"
              >
                SEARCH ALL MEMBERS OF CONGRESS &rarr;
              </button>
            )}

            {!hasSavedReps && (
              <p className="mt-3 font-mono text-[10px] text-gray-mid">
                <Link href="/my-reps" className="text-red no-underline font-bold hover:text-black transition-colors">
                  Save your reps
                </Link>{" "}
                for one-tap access here.
              </p>
            )}
          </section>

          {/* Selected rep confirmation */}
          {selectedRep && (
            <div className="border-3 border-red bg-red-light p-4 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${partyBg(selectedRep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                  <span className="font-headline text-base text-white">{selectedRep.firstName[0]}{selectedRep.lastName[0]}</span>
                  {selectedRep.photoUrl && (
                    <img src={selectedRep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                </div>
                <div>
                  <span className="block font-headline text-lg normal-case">{selectedRep.fullName}</span>
                  <span className="block font-mono text-[10px] text-gray-mid">
                    {selectedRep.title} — {selectedRep.state}{selectedRep.district ? `, ${selectedRep.district}` : ""} — {selectedRep.committees.length} committees, {selectedRep.keyVotes.length} key votes loaded
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRep(null)}
                className="font-mono text-xs text-gray-mid font-bold cursor-pointer hover:text-red"
              >
                CHANGE
              </button>
            </div>
          )}

          {/* STEP 2: Quick topic or freeform */}
          <section className="mb-5">
            <h2 className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-widest">
              Step 2 — What&apos;s this about?
            </h2>

            {/* Quick topic pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {quickTopics.map((topic) => (
                <button
                  key={topic.slug}
                  onClick={() => {
                    setSelectedIssueSlug(topic.slug);
                    if (!concern.trim()) {
                      const iss = getIssueBySlug(topic.slug);
                      if (iss && iss.talkingPoints.length > 0) {
                        setConcern(iss.talkingPoints[0]);
                      }
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 font-mono text-xs font-bold border-2 cursor-pointer transition-colors ${
                    selectedIssueSlug === topic.slug
                      ? "border-red bg-red-light text-red"
                      : "border-border bg-surface text-gray-mid hover:border-red hover:text-red"
                  }`}
                >
                  <span>{topic.icon}</span>
                  {topic.label}
                </button>
              ))}
            </div>

            {/* Concern textarea */}
            <label htmlFor="draft-concern" className="font-mono text-[10px] text-gray-mid block mb-1.5 font-bold">
              YOUR CONCERN (EVEN A FEW WORDS — THE AI WILL EXPAND IT)
            </label>
            <textarea
              id="draft-concern"
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Example: I'm worried about rising healthcare costs and want my rep to support the Affordable Insulin Now Act..."
              rows={3}
              className="w-full px-4 py-3 border-3 border-border bg-cream font-body text-base focus:outline-none focus:border-red resize-none"
            />
          </section>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 border-3 border-status-red bg-status-red text-white font-mono text-sm font-bold" role="alert">
              {error}
              {error.includes("API key") && (
                <Link href="/settings" className="text-white/80 ml-2 underline">
                  Go to Settings
                </Link>
              )}
            </div>
          )}

          {/* Generate button — BIG, unmissable */}
          <button
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
            className={`w-full px-6 py-5 font-headline uppercase text-xl tracking-wider border-3 cursor-pointer transition-colors ${
              loading
                ? "bg-gray-mid text-white border-gray-mid"
                : canGenerate
                  ? "bg-red text-white border-red hover:bg-red-dark hover:border-red-dark"
                  : "bg-gray-light text-gray-mid border-gray-light cursor-not-allowed"
            }`}
          >
            {loading
              ? "Drafting with AI..."
              : canGenerate
                ? modeConfig[mode].action
                : selectedRep
                  ? "Describe your concern above"
                  : "Pick a rep to get started"}
          </button>

          {/* Loading state */}
          {loading && (
            <div className="mt-4 p-6 border-3 border-border bg-surface text-center">
              <div className="font-headline text-2xl mb-2 motion-safe:animate-pulse text-red">
                Drafting...
              </div>
              <p className="font-mono text-xs text-gray-mid font-bold">
                Injecting {selectedRep?.fullName}&apos;s voting record + committee data
              </p>
            </div>
          )}
        </div>
      )}

      {/* OUTPUT — When generated, this becomes the entire view */}
      {output && (
        <div ref={outputRef}>
          {/* Print-only header — shows rep info when printed */}
          <div className="hidden" data-print-show data-print-header>
            <h1 style={{ fontFamily: "Arial Black, sans-serif", fontSize: "18pt", textTransform: "uppercase", marginBottom: "4pt" }}>
              {mode === "letter" ? "Letter" : mode === "call" ? "Call Script" : "Social Posts"} to {selectedRep?.fullName}
            </h1>
            <p style={{ fontFamily: "Courier New, monospace", fontSize: "9pt", color: "#666", marginBottom: "4pt" }}>
              {selectedRep?.title} — {selectedRep?.state}{selectedRep?.district ? `, ${selectedRep.district}` : ""} — {selectedRep?.party === "D" ? "Democrat" : selectedRep?.party === "R" ? "Republican" : "Independent"}
            </p>
            <p style={{ fontFamily: "Courier New, monospace", fontSize: "9pt", color: "#666" }}>
              Issue: {selectedIssue ? selectedIssue.name : "General Concern"} — Generated {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Action bar — THE MOST IMPORTANT PART */}
          <div className="border-3 border-red bg-red p-4 mb-0" data-print-hide>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 text-white">
                <p className="font-headline text-lg normal-case">
                  Your {modeConfig[mode].label} to {selectedRep?.fullName}
                </p>
                <p className="font-mono text-[10px] text-white/70">
                  {selectedIssue ? selectedIssue.name.toUpperCase() : "GENERAL CONCERN"} — Generated just now
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                {mode === "letter" && (
                  <>
                    {/* PRIMARY: Email it */}
                    <a
                      href={getMailtoLink()}
                      className="flex items-center gap-2 px-5 py-3 bg-white text-black font-mono text-sm font-bold no-underline hover:bg-cream transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      SEND EMAIL
                    </a>
                    {/* SECONDARY: Copy + open contact form */}
                    {(selectedRep?.contactForm || selectedRep?.website) && (
                      <button
                        onClick={handleOpenContactForm}
                        className="flex items-center gap-2 px-4 py-3 bg-black text-white font-mono text-sm font-bold cursor-pointer hover:bg-white hover:text-black transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        COPY &amp; OPEN FORM
                      </button>
                    )}
                  </>
                )}
                {/* PRINT — for letters and call scripts */}
                {(mode === "letter" || mode === "call") && (
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-3 bg-black text-white font-mono text-sm font-bold cursor-pointer hover:bg-white hover:text-black transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    PRINT
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-3 bg-black text-white font-mono text-sm font-bold cursor-pointer hover:bg-white hover:text-black transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  {copied ? "COPIED!" : "COPY"}
                </button>
              </div>
            </div>
          </div>

          {/* Letter content */}
          <div className="border-3 border-t-0 border-border bg-white p-5 md:p-8" data-print-letter>
            <div className="font-body text-base leading-relaxed whitespace-pre-wrap max-w-3xl">
              {output}
            </div>
          </div>

          {/* Bottom action bar — repeat for easy access */}
          <div className="border-3 border-t-0 border-border bg-cream-dark p-4 flex flex-col sm:flex-row items-center justify-between gap-3" data-print-hide>
            <div className="flex gap-3 flex-wrap">
              {mode === "letter" && (
                <a
                  href={getMailtoLink()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red text-white font-mono text-xs font-bold no-underline hover:bg-black transition-colors"
                >
                  SEND EMAIL
                </a>
              )}
              {(mode === "letter" || mode === "call") && (
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 bg-black text-white font-mono text-xs font-bold cursor-pointer hover:bg-red transition-colors"
                >
                  PRINT
                </button>
              )}
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-black text-white font-mono text-xs font-bold cursor-pointer hover:bg-red transition-colors"
              >
                {copied ? "COPIED!" : "COPY TO CLIPBOARD"}
              </button>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => { setOutput(""); setError(""); }}
                className="px-4 py-2.5 bg-surface text-gray-mid font-mono text-xs font-bold border-2 border-border cursor-pointer hover:border-red hover:text-red transition-colors"
              >
                EDIT &amp; REGENERATE
              </button>
              <button
                onClick={() => { setOutput(""); setSelectedRep(null); setConcern(""); setSelectedIssueSlug(""); setError(""); }}
                className="px-4 py-2.5 bg-surface text-gray-mid font-mono text-xs font-bold border-2 border-border cursor-pointer hover:border-red hover:text-red transition-colors"
              >
                START OVER
              </button>
            </div>
          </div>

          {/* Next steps callout */}
          <div className="mt-6 border-3 border-border bg-surface p-5" data-print-hide>
            <h3 className="font-headline text-lg normal-case mb-3">What Next?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-border-light p-3 bg-cream-dark">
                <p className="font-headline text-base normal-case mb-1">Call Too</p>
                <p className="font-body text-xs text-gray-mid mb-2">
                  Letters + phone calls are 3x more effective than either alone.
                </p>
                <button
                  onClick={() => { setMode("call"); setOutput(""); }}
                  className="w-full px-3 py-2 bg-black text-white font-mono text-[10px] font-bold cursor-pointer hover:bg-red transition-colors"
                >
                  GENERATE CALL SCRIPT
                </button>
              </div>
              <div className="border-2 border-border-light p-3 bg-cream-dark">
                <p className="font-headline text-base normal-case mb-1">Go Public</p>
                <p className="font-body text-xs text-gray-mid mb-2">
                  Public posts add accountability pressure elected officials notice.
                </p>
                <button
                  onClick={() => { setMode("social"); setOutput(""); }}
                  className="w-full px-3 py-2 bg-black text-white font-mono text-[10px] font-bold cursor-pointer hover:bg-red transition-colors"
                >
                  GENERATE SOCIAL POSTS
                </button>
              </div>
              <div className="border-2 border-border-light p-3 bg-cream-dark">
                <p className="font-headline text-base normal-case mb-1">Write Another Rep</p>
                <p className="font-body text-xs text-gray-mid mb-2">
                  Your voice is louder when both senators and your house rep hear it.
                </p>
                <button
                  onClick={() => { setOutput(""); setSelectedRep(null); }}
                  className="w-full px-3 py-2 bg-black text-white font-mono text-[10px] font-bold cursor-pointer hover:bg-red transition-colors"
                >
                  PICK ANOTHER REP
                </button>
              </div>
              <div className="border-2 border-border-light p-3 bg-cream-dark">
                <p className="font-headline text-base normal-case mb-1">Get Records</p>
                <p className="font-body text-xs text-gray-mid mb-2">
                  Use FOIA to get the government documents behind the decisions.
                </p>
                <a
                  href="https://www.thefoiaforge.org/new-request"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-3 py-2 bg-[#1a1a2e] text-white font-mono text-[10px] font-bold text-center no-underline hover:bg-red transition-colors"
                >
                  FILE A FOIA REQUEST →
                </a>
              </div>
            </div>
          </div>

          {/* Log link */}
          <p className="mt-4 text-center font-mono text-xs text-gray-mid" data-print-hide>
            This message was auto-saved to your{" "}
            <Link href="/contacts" className="text-red no-underline font-bold hover:text-black transition-colors">
              contact log
            </Link>.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="font-headline text-4xl md:text-5xl mb-2">Write Congress</h1>
        <p className="font-mono text-sm text-gray-mid">Loading...</p>
      </div>
    }>
      <DraftInner />
    </Suspense>
  );
}
