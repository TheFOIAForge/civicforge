"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { issues, getIssueBySlug } from "@/data/issues";
import { buildSystemPrompt } from "@/lib/prompts";
import type { Representative } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";
import { useUserMode } from "@/lib/user-mode-context";
import MailLetterModal from "@/components/MailLetterModal";

type Mode = "letter" | "call" | "social";

const modeConfig: Record<Mode, { label: string; emoji: string; desc: string; action: string; hint: string; icon: string }> = {
  letter: { label: "Mail a Letter", emoji: "\u{2709}\u{FE0F}", desc: "Physical letter via USPS", action: "GENERATE LETTER", hint: "Strongest impact — lands on their desk", icon: "mail" },
  call: { label: "Make a Call", emoji: "\u{1F4DE}", desc: "Talking points for a phone call", action: "GENERATE SCRIPT", hint: "Fastest way to get a staffer's attention", icon: "phone" },
  social: { label: "Send an Email", emoji: "\u{1F4F1}", desc: "Email their office directly", action: "GENERATE EMAIL", hint: "Quick and convenient digital contact", icon: "email" },
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

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function DraftInner() {
  const searchParams = useSearchParams();
  const { myReps, hasSavedReps } = useMyReps();
  const { mode: userMode } = useUserMode();
  const outputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [allReps, setAllReps] = useState<Representative[]>([]);
  const [selectedModes, setSelectedModes] = useState<Set<Mode>>(
    new Set([(searchParams.get("mode") as Mode) || "letter"])
  );
  const mode: Mode = selectedModes.has("letter") ? "letter" : selectedModes.has("call") ? "call" : "social";
  const [selectedReps, setSelectedReps] = useState<Representative[]>([]);
  // Convenience: first selected rep (for backwards compat with single-rep logic)
  const selectedRep = selectedReps.length > 0 ? selectedReps[0] : null;
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
  const [chamberFilter, setChamberFilter] = useState<"All" | "Senate" | "House">("All");
  const [partyFilter, setPartyFilter] = useState<"All" | "D" | "R" | "I">("All");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [showResults, setShowResults] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [step, setStep] = useState(1);
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [mailSuccess, setMailSuccess] = useState(false);
  const [lastLogId, setLastLogId] = useState("");

  const isActivist = userMode === "activist";

  // Load all reps
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data: Representative[]) => {
        setAllReps(data);
        const repParam = searchParams.get("rep");
        if (repParam) {
          const match = data.find((r: Representative) => r.slug === repParam);
          if (match) { setSelectedReps([match]); setStep(3); }
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Close search results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Handle Stripe redirect back
  useEffect(() => {
    const mailSuccessParam = searchParams.get("mail_success");
    if (mailSuccessParam) {
      setMailSuccess(true);
      // Update contact log entry
      try {
        const pending = sessionStorage.getItem("checkmyrep_pending_mail");
        if (pending) {
          const { contactLogId } = JSON.parse(pending);
          const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
          const idx = logs.findIndex((l: Record<string, string>) => l.id === contactLogId);
          if (idx !== -1) {
            logs[idx].deliveryStatus = "mailed";
            logs[idx].mailedAt = new Date().toISOString();
            logs[idx].stripeSessionId = mailSuccessParam;
            localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
          }
          sessionStorage.removeItem("checkmyrep_pending_mail");
        }
      } catch { /* ignore */ }
      // Clean URL
      window.history.replaceState({}, "", "/draft");
    }
  }, [searchParams]);

  // Auto-advance step when rep is selected
  useEffect(() => {
    if (selectedRep && step < 3) setStep(3);
  }, [selectedRep, step]);

  const selectedIssue = selectedIssueSlug ? getIssueBySlug(selectedIssueSlug) : undefined;

  const hasFilters = chamberFilter !== "All" || partyFilter !== "All" || stateFilter !== "All" || repSearch.length >= 2;

  const filteredReps = allReps.filter((r) => {
    if (chamberFilter !== "All" && r.chamber !== chamberFilter) return false;
    if (partyFilter !== "All" && r.party !== partyFilter) return false;
    if (stateFilter !== "All" && r.stateAbbr !== stateFilter) return false;
    if (repSearch.length >= 2) {
      const q = repSearch.toLowerCase();
      return r.fullName.toLowerCase().includes(q) || r.state.toLowerCase().includes(q) || r.stateAbbr.toLowerCase() === q;
    }
    return true;
  });

  const otherReps = filteredReps.filter((r) => !myReps.some((mr) => mr.id === r.id));
  const dropdownReps = (hasSavedReps ? otherReps : filteredReps).slice(0, 30);

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, dropdownReps.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0 && dropdownReps[highlightIdx]) {
      e.preventDefault();
      const rep = dropdownReps[highlightIdx];
      if (isActivist) {
        setSelectedReps((prev) => prev.some((r) => r.id === rep.id) ? prev.filter((r) => r.id !== rep.id) : [...prev, rep]);
      } else {
        setSelectedReps([rep]);
      }
      setShowResults(false);
      setRepSearch("");
      setShowAllReps(false);
      setStep(3);
      setTimeout(() => document.getElementById("step-3-topics")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  }

  const activeFilterCount = [chamberFilter !== "All", partyFilter !== "All", stateFilter !== "All"].filter(Boolean).length;

  function getApiKey(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("checkmyrep_api_key");
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

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      try {
        const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
        const logId = Date.now().toString();
        setLastLogId(logId);
        const logEntry: Record<string, unknown> = {
          id: logId,
          repId: selectedRep.id,
          repName: selectedRep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          date: new Date().toISOString().split("T")[0],
          status: "sent",
          notes: concern.slice(0, 100),
          content: text.slice(0, 500),
        };
        if (selectedIssue?.legislation && selectedIssue.legislation.length > 0) {
          logEntry.billNumber = selectedIssue.legislation[0].billNumber;
          logEntry.billId = selectedIssue.legislation[0].id;
        }
        logs.push(logEntry);
        localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
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

  function handleUseOwn() {
    if (selectedReps.length === 0) {
      setError("Pick at least one representative first.");
      return;
    }
    if (!concern.trim()) {
      setError("Write or paste your message above first.");
      return;
    }
    setOutput(concern);
    setError("");
    // Save to contact log for each selected rep
    try {
      const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
      const logId = Date.now().toString();
      setLastLogId(logId);
      for (const rep of selectedReps) {
        const logEntry: Record<string, unknown> = {
          id: `${logId}-${rep.id}`,
          repId: rep.id,
          repName: rep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          date: new Date().toISOString().split("T")[0],
          status: "sent",
          notes: concern.slice(0, 100),
          content: concern.slice(0, 500),
        };
        if (selectedIssue?.legislation && selectedIssue.legislation.length > 0) {
          logEntry.billNumber = selectedIssue.legislation[0].billNumber;
          logEntry.billId = selectedIssue.legislation[0].id;
        }
        logs.push(logEntry);
      }
      localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
    } catch { /* ignore */ }
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handlePrint() {
    window.print();
  }

  const canGenerate = selectedRep && concern.trim().length > 0;

  // ─── ACTIVIST MODE: Guided wizard with dark dramatic UI ───
  if (isActivist) {
    return (
      <div className="min-h-screen pb-24" style={{ backgroundColor: "#ffffff" }} data-print-content>
        {/* Dark hero header */}
        <div
          className="relative px-5 pt-8 pb-6 overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(140,20,25,0.95) 0%, rgba(140,20,25,0.9) 50%, rgba(140,20,25,0.3) 100%)",
          }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10">
            <h1
              className="font-headline text-3xl md:text-4xl uppercase leading-none"
              style={{ color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}
            >
              Write Congress
            </h1>
            <p className="mt-2 font-body text-base" style={{ color: "rgba(255,255,255,0.8)" }}>
              Pick a rep, write or paste your message, and send it.
            </p>
          </div>
        </div>

        {/* Main content */}
        {!output ? (
          <div className="px-4 py-6 space-y-6" data-print-hide>

            {/* ── STEP 1: Choose how to reach them (multi-select) ── */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 flex items-center justify-center font-headline text-base shrink-0"
                  style={{ backgroundColor: "#C1272D", color: "#fff" }}
                >
                  1
                </div>
                <h2 className="font-headline text-lg uppercase" style={{ color: "#111827" }}>
                  How do you want to reach them?
                </h2>
              </div>
              <p className="font-mono text-[11px] mb-3 font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>
                SELECT ONE OR MORE — WE&apos;LL HANDLE THE REST
              </p>
              <div className="grid grid-cols-1 gap-3">
                {(["letter", "call", "social"] as Mode[]).map((m) => {
                  const isSelected = selectedModes.has(m);
                  const actionImg = m === "letter" ? "/images/actions/write-letter.jpg" : m === "call" ? "/images/actions/call-script.jpg" : "/images/actions/social-post.jpg";
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setSelectedModes((prev) => {
                          const next = new Set(prev);
                          if (next.has(m)) {
                            if (next.size > 1) next.delete(m);
                          } else {
                            next.add(m);
                          }
                          return next;
                        });
                        setOutput("");
                      }}
                      className="relative text-left overflow-hidden border-2 cursor-pointer transition-all"
                      style={{
                        borderColor: isSelected ? "#C1272D" : "rgba(0,0,0,0.12)",
                        backgroundColor: isSelected ? "rgba(193,39,45,0.15)" : "rgba(0,0,0,0.03)",
                        height: "90px",
                      }}
                    >
                      <div className="flex items-center h-full">
                        <div className="flex-1 px-4 py-3 relative z-10">
                          <span
                            className="block font-headline text-lg uppercase"
                            style={{ color: isSelected ? "#111827" : "rgba(0,0,0,0.7)" }}
                          >
                            {modeConfig[m].label}
                          </span>
                          <span
                            className="block font-mono text-xs mt-1"
                            style={{ color: isSelected ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" }}
                          >
                            {modeConfig[m].hint}
                          </span>
                        </div>
                        <div className="relative h-full w-[45%] shrink-0">
                          <img src={actionImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.4) 30%, transparent 100%)" }} />
                        </div>
                        {/* Checkbox indicator */}
                        <div
                          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center z-10 border-2"
                          style={{
                            backgroundColor: isSelected ? "#C1272D" : "transparent",
                            borderColor: isSelected ? "#C1272D" : "rgba(0,0,0,0.3)",
                          }}
                        >
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedModes.size > 1 && (
                <p className="font-mono text-[11px] mt-2 font-bold" style={{ color: "#C1272D" }}>
                  {selectedModes.size} METHODS SELECTED — WRITE ONCE, SEND {selectedModes.size} WAYS
                </p>
              )}
            </div>

            {/* ── STEP 2: Pick your rep ── */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 flex items-center justify-center font-headline text-base shrink-0"
                  style={{ backgroundColor: step >= 1 ? "#C1272D" : "rgba(0,0,0,0.15)", color: "#fff" }}
                >
                  2
                </div>
                <h2 className="font-headline text-lg uppercase" style={{ color: "#111827" }}>
                  Who are you writing to?
                </h2>
              </div>

              {/* Saved reps — multi-select */}
              {hasSavedReps && (
                <div className="mb-4">
                  <p className="font-mono text-xs font-bold mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
                    YOUR SAVED REPRESENTATIVES — TAP TO SELECT (MULTIPLE OK)
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {myReps.map((rep) => {
                      const isRepSelected = selectedReps.some((r) => r.id === rep.id);
                      return (
                      <button
                        key={rep.id}
                        onClick={() => {
                          setSelectedReps((prev) => {
                            const exists = prev.some((r) => r.id === rep.id);
                            const next = exists ? prev.filter((r) => r.id !== rep.id) : [...prev, rep];
                            if (next.length > 0) setStep(3);
                            return next;
                          });
                          setTimeout(() => document.getElementById("step-3-topics")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
                        }}
                        className="flex items-center gap-3 p-4 text-left cursor-pointer transition-all"
                        style={{
                          backgroundColor: isRepSelected ? "rgba(193,39,45,0.1)" : "rgba(0,0,0,0.03)",
                          border: isRepSelected ? "2px solid #C1272D" : "2px solid rgba(0,0,0,0.1)",
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          className="w-6 h-6 flex items-center justify-center shrink-0 border-2"
                          style={{
                            backgroundColor: isRepSelected ? "#C1272D" : "transparent",
                            borderColor: isRepSelected ? "#C1272D" : "rgba(0,0,0,0.3)",
                          }}
                        >
                          {isRepSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className={`w-12 h-12 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                          <span className="font-headline text-lg text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                          {rep.photoUrl && (
                            <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="block font-headline text-base normal-case" style={{ color: "#111827" }}>
                            {rep.fullName}
                          </span>
                          <span className="block font-mono text-xs" style={{ color: "rgba(0,0,0,0.5)" }}>
                            {rep.party === "D" ? "Democrat" : rep.party === "R" ? "Republican" : "Independent"} — {rep.chamber}
                          </span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                  {selectedReps.length > 1 && (
                    <p className="font-mono text-[11px] mt-2 font-bold" style={{ color: "#C1272D" }}>
                      {selectedReps.length} REPRESENTATIVES SELECTED
                    </p>
                  )}
                </div>
              )}

              {/* Search for other reps */}
              <div ref={resultsRef}>
                  {hasSavedReps && !showAllReps ? (
                    <button
                      onClick={() => setShowAllReps(true)}
                      className="w-full p-3 font-mono text-xs font-bold uppercase text-center cursor-pointer transition-colors"
                      style={{
                        color: "rgba(0,0,0,0.5)",
                        border: "1px dashed rgba(0,0,0,0.15)",
                        backgroundColor: "transparent",
                      }}
                    >
                      Search All Members of Congress →
                    </button>
                  ) : (
                    <>
                      {!hasSavedReps && (
                        <p className="font-mono text-xs mb-3" style={{ color: "rgba(0,0,0,0.5)" }}>
                          Search for your representative, or{" "}
                          <Link href="/my-reps" className="no-underline font-bold" style={{ color: "#C1272D" }}>
                            save your reps
                          </Link>{" "}
                          for one-tap access next time.
                        </p>
                      )}

                      {/* Unified filter row — single row of chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {/* Chamber chips */}
                        {(["All", "Senate", "House"] as const).map((c) => (
                          <button
                            key={c}
                            onClick={() => { setChamberFilter(c); setShowResults(true); setHighlightIdx(-1); }}
                            className="px-3 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase cursor-pointer transition-all"
                            style={{
                              backgroundColor: chamberFilter === c ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.03)",
                              color: chamberFilter === c ? "#111827" : "rgba(0,0,0,0.4)",
                              border: chamberFilter === c ? "1px solid rgba(0,0,0,0.15)" : "1px solid rgba(0,0,0,0.1)",
                            }}
                          >
                            {c === "All" ? "All" : c}
                          </button>
                        ))}

                        {/* Divider */}
                        <div className="w-px h-5 mx-1" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />

                        {/* Party chips — color coded */}
                        {(["D", "R", "I"] as const).map((p) => {
                          const isActive = partyFilter === p;
                          const colors = {
                            D: { bg: isActive ? "#1a5fb4" : "rgba(26,95,180,0.15)", border: isActive ? "#3584e4" : "rgba(26,95,180,0.3)", label: "DEM" },
                            R: { bg: isActive ? "#C1272D" : "rgba(193,39,45,0.15)", border: isActive ? "#e85555" : "rgba(193,39,45,0.3)", label: "GOP" },
                            I: { bg: isActive ? "#8B6914" : "rgba(139,105,20,0.15)", border: isActive ? "#c49b1a" : "rgba(139,105,20,0.3)", label: "IND" },
                          };
                          const c = colors[p];
                          return (
                            <button
                              key={p}
                              onClick={() => { setPartyFilter(partyFilter === p ? "All" : p); setShowResults(true); setHighlightIdx(-1); }}
                              className="px-3 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase cursor-pointer transition-all"
                              style={{
                                backgroundColor: c.bg,
                                color: isActive ? "#fff" : "rgba(0,0,0,0.5)",
                                border: `1px solid ${c.border}`,
                              }}
                            >
                              {c.label}
                            </button>
                          );
                        })}

                        {/* Divider */}
                        <div className="w-px h-5 mx-1" style={{ backgroundColor: "rgba(0,0,0,0.12)" }} />

                        {/* State dropdown */}
                        <select
                          value={stateFilter}
                          onChange={(e) => { setStateFilter(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
                          className="px-3 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase cursor-pointer"
                          style={{
                            backgroundColor: stateFilter === "All" ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.1)",
                            color: stateFilter === "All" ? "rgba(0,0,0,0.4)" : "#111827",
                            border: stateFilter === "All" ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(0,0,0,0.15)",
                          }}
                        >
                          <option value="All">State</option>
                          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* Clear button */}
                        {activeFilterCount > 0 && (
                          <button
                            onClick={() => { setChamberFilter("All"); setPartyFilter("All"); setStateFilter("All"); }}
                            className="px-2 py-1.5 rounded-full font-mono text-[10px] font-bold cursor-pointer transition-all"
                            style={{ color: "#C1272D", border: "1px solid rgba(193,39,45,0.3)" }}
                          >
                            ✕ CLEAR
                          </button>
                        )}
                      </div>

                      {/* Search input */}
                      <div className="relative">
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={repSearch}
                          onChange={(e) => { setRepSearch(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
                          onFocus={() => setShowResults(true)}
                          onKeyDown={handleSearchKeyDown}
                          placeholder="Search by name or state..."
                          className="w-full px-4 py-3 font-mono text-sm focus:outline-none"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.04)",
                            border: "2px solid rgba(0,0,0,0.12)",
                            color: "#111827",
                          }}
                        />
                        {hasFilters && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold pointer-events-none" style={{ color: "rgba(0,0,0,0.4)" }}>
                            {filteredReps.length} FOUND
                          </span>
                        )}
                        {showResults && hasFilters && dropdownReps.length > 0 && (
                          <div
                            className="absolute z-40 left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto shadow-lg"
                            style={{ backgroundColor: "#fff", border: "2px solid rgba(0,0,0,0.1)" }}
                          >
                            {dropdownReps.map((rep, idx) => (
                              <button
                                key={rep.id}
                                onClick={() => {
                                  setSelectedReps((prev) => {
                                    const exists = prev.some((r) => r.id === rep.id);
                                    return exists ? prev.filter((r) => r.id !== rep.id) : [...prev, rep];
                                  });
                                  setShowResults(false);
                                  setRepSearch("");
                                  setStep(3);
                                  setTimeout(() => document.getElementById("step-3-topics")?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
                                }}
                                onMouseEnter={() => setHighlightIdx(idx)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors"
                                style={{
                                  backgroundColor: idx === highlightIdx ? "rgba(0,0,0,0.05)" : "transparent",
                                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                                }}
                              >
                                <span className={`w-8 h-8 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                                  <span className="font-headline text-[10px] text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                                  {rep.photoUrl && (
                                    <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  )}
                                </span>
                                <span className="font-mono text-sm font-bold flex-1" style={{ color: "#111827" }}>{rep.fullName}</span>
                                <span className="font-mono text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>
                                  {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"} · {rep.stateAbbr} · {rep.chamber}
                                </span>
                              </button>
                            ))}
                            {filteredReps.length > 30 && (
                              <div className="px-4 py-2 font-mono text-[10px] text-center" style={{ color: "rgba(0,0,0,0.4)" }}>
                                Showing 30 of {filteredReps.length} — type to narrow results
                              </div>
                            )}
                          </div>
                        )}
                        {showResults && hasFilters && dropdownReps.length === 0 && (
                          <div
                            className="absolute z-40 left-0 right-0 top-full mt-1 p-4 shadow-lg"
                            style={{ backgroundColor: "#fff", border: "2px solid rgba(0,0,0,0.1)" }}
                          >
                            <p className="font-mono text-sm text-center" style={{ color: "rgba(0,0,0,0.5)" }}>
                              No representatives found. Try different filters.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
            </div>

            {/* ── STEP 3: What's on your mind? ── */}
            <div id="step-3-topics">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 flex items-center justify-center font-headline text-base shrink-0"
                  style={{ backgroundColor: selectedRep ? "#C1272D" : "rgba(0,0,0,0.15)", color: "#fff" }}
                >
                  3
                </div>
                <h2
                  className="font-headline text-lg uppercase"
                  style={{ color: selectedRep ? "#111827" : "rgba(0,0,0,0.3)" }}
                >
                  What&apos;s on your mind?
                </h2>
              </div>

              {/* Quick topic cards — pick a topic to pre-fill */}
              <p className="font-mono text-[11px] mb-2 font-bold" style={{ color: "rgba(0,0,0,0.4)" }}>
                TAP A TOPIC TO GET STARTED
              </p>
              <div className="grid grid-cols-2 gap-3">
                {quickTopics.map((topic) => {
                  const isSelected = selectedIssueSlug === topic.slug;
                  return (
                    <button
                      key={topic.slug}
                      onClick={() => {
                        const wasSelected = selectedIssueSlug === topic.slug;
                        if (wasSelected) {
                          setSelectedIssueSlug("");
                          setConcern("");
                          return;
                        }
                        setSelectedIssueSlug(topic.slug);
                        const iss = getIssueBySlug(topic.slug);
                        if (iss && iss.talkingPoints.length > 0) {
                          setConcern(iss.talkingPoints[0]);
                        }
                        // Scroll textarea into view and focus
                        setTimeout(() => {
                          const ta = document.getElementById("draft-concern");
                          if (ta) { ta.scrollIntoView({ behavior: "smooth", block: "center" }); ta.focus(); }
                        }, 100);
                      }}
                      className="relative text-left overflow-hidden cursor-pointer transition-all"
                      style={{
                        border: isSelected ? "2px solid #C1272D" : "2px solid rgba(0,0,0,0.08)",
                        backgroundColor: "#000",
                        height: "100px",
                        boxShadow: isSelected ? "0 0 12px rgba(193,39,45,0.3)" : "none",
                      }}
                    >
                      {/* Full background illustration */}
                      <img
                        src={`/images/icons/topics/${topic.slug}.jpg`}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ opacity: isSelected ? 1 : 0.6 }}
                      />
                      {/* Dark overlay for text readability */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)" }} />
                      {/* Label — bottom left */}
                      <div className="relative z-10 h-full flex items-end p-3">
                        <span
                          className="font-headline text-lg uppercase leading-tight"
                          style={{
                            color: "#fff",
                            textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)",
                          }}
                        >
                          {topic.label}
                        </span>
                      </div>
                      {/* Selected check */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center z-10" style={{ backgroundColor: "#C1272D" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>


              {/* Concern textarea */}
              <label
                htmlFor="draft-concern"
                className="font-mono text-xs block mb-2 font-bold"
                style={{ color: selectedIssueSlug ? "#C1272D" : "rgba(0,0,0,0.5)" }}
              >
                WRITE YOUR LETTER OR DESCRIBE YOUR CONCERN
              </label>
              <textarea
                id="draft-concern"
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="Write your full letter here, paste one you've already written, or just describe your concern and use 'Generate with AI' to draft it for you..."
                rows={3}
                className="w-full px-4 py-3 font-body text-base focus:outline-none resize-none transition-all"
                style={{
                  backgroundColor: selectedIssueSlug ? "rgba(193,39,45,0.03)" : "rgba(0,0,0,0.04)",
                  border: selectedIssueSlug ? "2px solid #C1272D" : "2px solid rgba(0,0,0,0.12)",
                  color: "#111827",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="p-4 font-mono text-sm font-bold"
                role="alert"
                style={{ backgroundColor: "rgba(193,39,45,0.15)", border: "2px solid #C1272D", color: "#C1272D" }}
              >
                {error}
                {error.includes("API key") && (
                  <Link href="/settings" className="ml-2 underline" style={{ color: "#C1272D" }}>
                    Go to Settings
                  </Link>
                )}
              </div>
            )}

            {/* ── ACTION BUTTONS ── */}
            <div className="flex gap-3">
              <button
                onClick={handleUseOwn}
                disabled={!canGenerate}
                className="flex-1 py-5 font-headline uppercase text-xl tracking-wider cursor-pointer transition-all"
                style={{
                  backgroundColor: canGenerate ? "#111" : "rgba(0,0,0,0.08)",
                  color: canGenerate ? "#fff" : "rgba(0,0,0,0.3)",
                  border: "none",
                }}
              >
                {selectedReps.length === 0 ? "↑ Pick a rep first" : !concern.trim() ? "↑ Write your message" : selectedReps.length > 1 ? `SEND TO ${selectedReps.length} REPS` : "SEND AS-IS"}
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading || !canGenerate}
                className="flex-1 py-5 font-headline uppercase text-lg tracking-wider cursor-pointer transition-all"
                style={{
                  backgroundColor: loading ? "#999" : canGenerate ? "#C1272D" : "rgba(0,0,0,0.08)",
                  color: loading ? "#fff" : canGenerate ? "#fff" : "rgba(0,0,0,0.3)",
                  border: "none",
                  textShadow: canGenerate ? "0 2px 8px rgba(0,0,0,0.5)" : "none",
                  boxShadow: canGenerate && !loading ? "0 0 30px rgba(193,39,45,0.4)" : "none",
                }}
              >
                {loading ? "Drafting..." : "GENERATE WITH AI"}
              </button>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="p-6 text-center" style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "2px solid rgba(0,0,0,0.1)" }}>
                <div className="font-headline text-2xl mb-2 motion-safe:animate-pulse" style={{ color: "#C1272D" }}>
                  Drafting...
                </div>
                <p className="font-mono text-xs font-bold" style={{ color: "rgba(0,0,0,0.5)" }}>
                  Injecting {selectedRep?.fullName}&apos;s voting record + committee data
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ── OUTPUT VIEW — Dark themed ── */
          <div ref={outputRef} className="px-4 py-6">
            {/* Print-only header */}
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

            {/* Action bar */}
            <div className="p-4 mb-0" style={{ backgroundColor: "#C1272D" }} data-print-hide>
              <div className="mb-3">
                <p className="font-headline text-lg normal-case" style={{ color: "#fff" }}>
                  Your Message to {selectedReps.length > 1 ? `${selectedReps.length} Representatives` : selectedRep?.fullName}
                </p>
                {selectedReps.length > 1 && (
                  <p className="font-mono text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {selectedReps.map((r) => r.fullName).join(" · ")}
                  </p>
                )}
                <p className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {selectedIssue ? selectedIssue.name.toUpperCase() : "GENERAL CONCERN"} — {selectedModes.size} delivery method{selectedModes.size > 1 ? "s" : ""} selected
                </p>
              </div>

              {/* Delivery method buttons — one for each selected mode */}
              <div className="flex gap-2 flex-wrap">
                {selectedModes.has("letter") && selectedRep && (
                  <button
                    onClick={() => setMailModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 font-mono text-sm font-bold cursor-pointer"
                    style={{ backgroundColor: "#fff", color: "#111", border: "none" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {selectedReps.length > 1 ? `MAIL ${selectedReps.length} LETTERS — $${(selectedReps.length * 1.5).toFixed(2)}` : "MAIL LETTER — $1.50"}
                  </button>
                )}
                {selectedModes.has("call") && selectedRep && (
                  <a
                    href={`tel:${selectedRep.offices?.[0]?.phone || ""}`}
                    className="flex items-center gap-2 px-5 py-3 font-mono text-sm font-bold no-underline"
                    style={{ backgroundColor: "#fff", color: "#111" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    CALL NOW
                  </a>
                )}
                {selectedModes.has("social") && (
                  <a
                    href={getMailtoLink()}
                    className="flex items-center gap-2 px-5 py-3 font-mono text-sm font-bold no-underline"
                    style={{ backgroundColor: "#fff", color: "#111" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    SEND EMAIL
                  </a>
                )}
                {(selectedRep?.contactForm || selectedRep?.website) && (
                  <button
                    onClick={handleOpenContactForm}
                    className="flex items-center gap-2 px-4 py-3 font-mono text-sm font-bold cursor-pointer"
                    style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "#fff", border: "none" }}
                  >
                    COPY & OPEN FORM
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-3 font-mono text-sm font-bold cursor-pointer"
                  style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "#fff", border: "none" }}
                >
                  PRINT
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-3 font-mono text-sm font-bold cursor-pointer"
                  style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "#fff", border: "none" }}
                >
                  {copied ? "COPIED!" : "COPY"}
                </button>
              </div>
            </div>

            {/* Letter content — white bg for readability */}
            <div className="p-5 md:p-8" style={{ backgroundColor: "#fff" }} data-print-letter>
              <div className="font-body text-base leading-relaxed whitespace-pre-wrap max-w-3xl" style={{ color: "#111" }}>
                {output}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(0,0,0,0.03)", borderTop: "1px solid rgba(0,0,0,0.1)" }} data-print-hide>
              <div className="flex gap-2 flex-wrap">
                {selectedModes.has("letter") && selectedRep && (
                  <button
                    onClick={() => setMailModalOpen(true)}
                    className="flex-1 px-4 py-3 font-mono text-xs font-bold cursor-pointer"
                    style={{ backgroundColor: "#C1272D", color: "#fff", border: "none" }}
                  >
                    {selectedReps.length > 1 ? `MAIL ${selectedReps.length} LETTERS — $${(selectedReps.length * 1.5).toFixed(2)}` : "MAIL LETTER — $1.50"}
                  </button>
                )}
                {selectedModes.has("call") && selectedRep && (
                  <a
                    href={`tel:${selectedRep.offices?.[0]?.phone || ""}`}
                    className="flex-1 text-center px-4 py-3 font-mono text-xs font-bold no-underline"
                    style={{ backgroundColor: "#1B2A4A", color: "#fff" }}
                  >
                    CALL NOW
                  </a>
                )}
                {selectedModes.has("social") && (
                  <a
                    href={getMailtoLink()}
                    className="flex-1 text-center px-4 py-3 font-mono text-xs font-bold no-underline"
                    style={{ backgroundColor: "#111", color: "#fff" }}
                  >
                    SEND EMAIL
                  </a>
                )}
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-3 font-mono text-xs font-bold cursor-pointer"
                  style={{ backgroundColor: "rgba(0,0,0,0.08)", color: "#111827", border: "none" }}
                >
                  {copied ? "COPIED!" : "COPY TO CLIPBOARD"}
                </button>
              </div>

              {/* Next steps — simplified cards */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {mode !== "call" && (
                  <button
                    onClick={() => { setSelectedModes(new Set(["call"])); setOutput(""); }}
                    className="p-3 text-left cursor-pointer"
                    style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)" }}
                  >
                    <span className="block text-lg mb-1">📞</span>
                    <span className="block font-headline text-sm normal-case" style={{ color: "#111827" }}>Call Too</span>
                    <span className="block font-mono text-[10px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>
                      Letters + calls = 3x impact
                    </span>
                  </button>
                )}
                {mode !== "social" && (
                  <button
                    onClick={() => { setSelectedModes(new Set(["social"])); setOutput(""); }}
                    className="p-3 text-left cursor-pointer"
                    style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)" }}
                  >
                    <span className="block text-lg mb-1">📱</span>
                    <span className="block font-headline text-sm normal-case" style={{ color: "#111827" }}>Go Public</span>
                    <span className="block font-mono text-[10px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>
                      Add accountability pressure
                    </span>
                  </button>
                )}
                <button
                  onClick={() => { setOutput(""); setSelectedReps([]); }}
                  className="p-3 text-left cursor-pointer"
                  style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  <span className="block text-lg mb-1">👥</span>
                  <span className="block font-headline text-sm normal-case" style={{ color: "#111827" }}>Another Rep</span>
                  <span className="block font-mono text-[10px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>
                    Both senators + house rep
                  </span>
                </button>
                <button
                  onClick={() => { setOutput(""); setError(""); }}
                  className="p-3 text-left cursor-pointer"
                  style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.1)" }}
                >
                  <span className="block text-lg mb-1">✏️</span>
                  <span className="block font-headline text-sm normal-case" style={{ color: "#111827" }}>Edit & Redo</span>
                  <span className="block font-mono text-[10px] mt-1" style={{ color: "rgba(0,0,0,0.4)" }}>
                    Tweak your concern & regenerate
                  </span>
                </button>
              </div>

              <p className="mt-2 text-center font-mono text-xs" style={{ color: "rgba(0,0,0,0.3)" }}>
                This message was auto-saved to your{" "}
                <Link href="/contacts" className="no-underline font-bold" style={{ color: "#C1272D" }}>
                  contact log
                </Link>.
              </p>
            </div>

            {/* Mail success banner */}
            {mailSuccess && (
              <div className="p-4" style={{ backgroundColor: "rgba(22,163,74,0.1)", borderTop: "3px solid #16a34a" }} data-print-hide>
                <p className="font-headline text-lg" style={{ color: "#16a34a" }}>
                  Letter Mailed!
                </p>
                <p className="font-mono text-xs mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>
                  Your letter to {selectedRep?.fullName} is being printed and will arrive in 3-5 business days via USPS First Class.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mail Letter Modal */}
        {mailModalOpen && selectedRep && (
          <MailLetterModal
            isOpen={mailModalOpen}
            onClose={() => setMailModalOpen(false)}
            letterContent={output}
            rep={selectedRep}
            reps={selectedReps}
            contactLogId={lastLogId}
            issue={selectedIssue?.name || concern.slice(0, 50) || "General"}
          />
        )}
      </div>
    );
  }

  // ─── INFORMED / POWER MODE: Original layout ───
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8" data-print-content>
      {/* Compact header */}
      <div className="mb-6" data-print-hide>
        <h1 className="font-headline text-4xl md:text-5xl mb-1">Write Congress</h1>
        <p className="font-mono text-xs text-gray-mid font-bold">
          WRITE YOUR OWN OR USE AI TO DRAFT — YOUR DATA STAYS IN YOUR BROWSER
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
                onClick={() => { setSelectedModes(new Set([m])); setOutput(""); }}
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
                      onClick={() => setSelectedReps([rep])}
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

            {/* Search + filters — always visible */}
            <div ref={resultsRef} className={hasSavedReps ? "border-t border-border-light pt-4" : ""}>
              {hasSavedReps && (
                <p className="font-mono text-[10px] text-gray-mid font-bold mb-2">ALL MEMBERS OF CONGRESS</p>
              )}

              {/* Filter pills row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex border-2 border-border divide-x-2 divide-border">
                  {(["All", "Senate", "House"] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => { setChamberFilter(c); setShowResults(true); setHighlightIdx(-1); }}
                      className={`px-3 py-1.5 font-mono text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                        chamberFilter === c ? "bg-black text-white" : "bg-surface text-gray-mid hover:bg-hover"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="flex border-2 border-border divide-x-2 divide-border">
                  {(["All", "D", "R", "I"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => { setPartyFilter(p); setShowResults(true); setHighlightIdx(-1); }}
                      className={`px-3 py-1.5 font-mono text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                        partyFilter === p
                          ? p === "D" ? "text-white" : p === "R" ? "text-white" : p === "I" ? "text-white" : "bg-black text-white"
                          : "bg-surface text-gray-mid hover:bg-hover"
                      }`}
                      style={
                        partyFilter === p
                          ? p === "D" ? { backgroundColor: "#1a3a6b" }
                          : p === "R" ? { backgroundColor: "#C1272D" }
                          : p === "I" ? { backgroundColor: "#6b5b3e" }
                          : undefined
                          : undefined
                      }
                    >
                      {p === "D" ? "DEM" : p === "R" ? "GOP" : p === "I" ? "IND" : "ALL"}
                    </button>
                  ))}
                </div>

                <select
                  value={stateFilter}
                  onChange={(e) => { setStateFilter(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
                  className="px-3 py-1.5 font-mono text-[11px] font-bold uppercase border-2 border-border bg-surface cursor-pointer"
                >
                  <option value="All">All States</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setChamberFilter("All"); setPartyFilter("All"); setStateFilter("All"); }}
                    className="px-2 py-1.5 font-mono text-[10px] text-red font-bold cursor-pointer hover:underline"
                  >
                    CLEAR FILTERS ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={repSearch}
                  onChange={(e) => { setRepSearch(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
                  onFocus={() => setShowResults(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search by name or state..."
                  className="w-full px-4 py-3 border-3 border-border bg-cream font-mono text-sm placeholder:text-gray-light focus:outline-none focus:border-red"
                />

                {hasFilters && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-gray-mid font-bold pointer-events-none">
                    {filteredReps.length} FOUND
                  </span>
                )}

                {showResults && hasFilters && dropdownReps.length > 0 && (
                  <div className="absolute z-40 left-0 right-0 top-full mt-1 border-3 border-border bg-white max-h-72 overflow-y-auto shadow-lg">
                    {dropdownReps.map((rep, idx) => (
                      <button
                        key={rep.id}
                        onClick={() => {
                          setSelectedReps([rep]);
                          setShowResults(false);
                          setRepSearch("");
                        }}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors border-b border-border-light last:border-0 ${
                          idx === highlightIdx ? "bg-cream-dark" : "hover:bg-hover"
                        }`}
                      >
                        <span className={`w-7 h-7 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                          <span className="font-headline text-[10px] text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                          {rep.photoUrl && (
                            <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          )}
                        </span>
                        <span className="font-mono text-sm font-bold flex-1">{rep.fullName}</span>
                        <span className="font-mono text-[11px] text-gray-mid">
                          {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"} · {rep.stateAbbr} · {rep.chamber}
                        </span>
                      </button>
                    ))}
                    {filteredReps.length > 30 && (
                      <div className="px-4 py-2 font-mono text-[10px] text-gray-mid text-center bg-cream-dark">
                        Showing 30 of {filteredReps.length} — type to narrow results
                      </div>
                    )}
                  </div>
                )}

                {showResults && hasFilters && dropdownReps.length === 0 && (
                  <div className="absolute z-40 left-0 right-0 top-full mt-1 border-3 border-border bg-white p-4">
                    <p className="font-mono text-sm text-gray-mid text-center">No representatives found. Try different filters.</p>
                  </div>
                )}
              </div>

              {!hasSavedReps && (
                <p className="mt-3 font-mono text-[10px] text-gray-mid">
                  <Link href="/my-reps" className="text-red no-underline font-bold hover:text-black transition-colors">
                    Save your reps
                  </Link>{" "}
                  for one-tap access here.
                </p>
              )}
            </div>
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
                onClick={() => setSelectedReps([])}
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
              WRITE YOUR LETTER OR DESCRIBE YOUR CONCERN
            </label>
            <textarea
              id="draft-concern"
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
              placeholder="Write your full letter here, paste one you've already written, or describe your concern and use 'Generate with AI'..."
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

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleUseOwn}
              disabled={!canGenerate}
              className={`flex-1 px-6 py-5 font-headline uppercase text-xl tracking-wider border-3 cursor-pointer transition-colors ${
                canGenerate
                  ? "bg-black text-white border-black hover:bg-red hover:border-red"
                  : "bg-gray-light text-gray-mid border-gray-light cursor-not-allowed"
              }`}
            >
              {!selectedRep ? "Pick a rep first" : !concern.trim() ? "Write your message" : "SEND AS-IS"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || !canGenerate}
              className={`flex-1 px-6 py-5 font-headline uppercase text-lg tracking-wider border-3 cursor-pointer transition-colors ${
                loading
                  ? "bg-gray-mid text-white border-gray-mid"
                  : canGenerate
                    ? "bg-red text-white border-red hover:bg-red-dark hover:border-red-dark"
                    : "bg-gray-light text-gray-mid border-gray-light cursor-not-allowed"
              }`}
            >
              {loading ? "Drafting..." : "GENERATE WITH AI"}
            </button>
          </div>

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
                    <a
                      href={getMailtoLink()}
                      className="flex items-center gap-2 px-5 py-3 bg-white text-black font-mono text-sm font-bold no-underline hover:bg-cream transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      SEND EMAIL
                    </a>
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
                    {selectedRep && (
                      <button
                        onClick={() => setMailModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-black text-white font-mono text-sm font-bold cursor-pointer hover:bg-white hover:text-black transition-colors"
                      >
                        {selectedReps.length > 1 ? `MAIL ${selectedReps.length} LETTERS — $${(selectedReps.length * 1.5).toFixed(2)}` : "MAIL LETTER — $1.50"}
                      </button>
                    )}
                  </>
                )}
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

          <div className="border-3 border-t-0 border-border bg-white p-5 md:p-8" data-print-letter>
            <div className="font-body text-base leading-relaxed whitespace-pre-wrap max-w-3xl">
              {output}
            </div>
          </div>

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
                onClick={() => { setOutput(""); setSelectedReps([]); setConcern(""); setSelectedIssueSlug(""); setError(""); }}
                className="px-4 py-2.5 bg-surface text-gray-mid font-mono text-xs font-bold border-2 border-border cursor-pointer hover:border-red hover:text-red transition-colors"
              >
                START OVER
              </button>
            </div>
          </div>

          <div className="mt-6 border-3 border-border bg-surface p-5" data-print-hide>
            <h3 className="font-headline text-lg normal-case mb-3">What Next?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border-2 border-border-light p-3 bg-cream-dark">
                <p className="font-headline text-base normal-case mb-1">Call Too</p>
                <p className="font-body text-xs text-gray-mid mb-2">
                  Letters + phone calls are 3x more effective than either alone.
                </p>
                <button
                  onClick={() => { setSelectedModes(new Set(["call"])); setOutput(""); }}
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
                  onClick={() => { setSelectedModes(new Set(["social"])); setOutput(""); }}
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
                  onClick={() => { setOutput(""); setSelectedReps([]); }}
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
                  className="block w-full px-3 py-2 bg-gray-100 text-black font-mono text-[10px] font-bold text-center no-underline hover:bg-red hover:text-white transition-colors"
                >
                  FILE A FOIA REQUEST →
                </a>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-xs text-gray-mid" data-print-hide>
            This message was auto-saved to your{" "}
            <Link href="/contacts" className="text-red no-underline font-bold hover:text-black transition-colors">
              contact log
            </Link>.
          </p>
        </div>
      )}

      {/* Mail success banner (informed/power mode) */}
      {mailSuccess && (
        <div className="border-3 border-green bg-green-light p-4 mt-4">
          <p className="font-headline text-lg" style={{ color: "#16a34a" }}>
            Letter Mailed!
          </p>
          <p className="font-mono text-xs mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>
            Your letter is being printed and will arrive in 3-5 business days via USPS First Class.
          </p>
        </div>
      )}

      {/* Mail Letter Modal (informed/power mode) */}
      {mailModalOpen && selectedRep && (
        <MailLetterModal
          isOpen={mailModalOpen}
          onClose={() => setMailModalOpen(false)}
          letterContent={output}
          rep={selectedRep}
          reps={selectedReps}
          contactLogId={lastLogId}
          issue={selectedIssue?.name || concern.slice(0, 50) || "General"}
        />
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
