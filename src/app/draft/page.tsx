"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { issues, getIssueBySlug } from "@/data/issues";
import { buildSystemPrompt } from "@/lib/prompts";
import type { Representative } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";
import { useAuth } from "@/lib/auth-context";
import { recordAction } from "@/lib/points";
import MailLetterModal from "@/components/MailLetterModal";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Mail,
  Phone,
  PenLine,
  Search,
  Check,
  X,
  Copy,
  Printer,
  ExternalLink,
  Sparkles,
  Send,
  ArrowRight,
  Heart,
  Globe,
  TrendingUp,
  GraduationCap,
  Plane,
  Users,
  Swords,
  Home as HomeIcon,
  Star,
  ChevronDown,
  RotateCcw,
  UserPlus,
} from "lucide-react";

type Mode = "letter" | "call" | "social";

const modeConfig: Record<Mode, { label: string; desc: string; action: string; hint: string; Icon: typeof Mail; civicIcon: string }> = {
  letter: { label: "Mail a Letter", desc: "Physical letter via USPS", action: "GENERATE LETTER", hint: "Strongest impact — lands on their desk", Icon: Mail, civicIcon: "/images/civic/icons/mail.png" },
  call: { label: "Make a Call", desc: "Talking points for a phone call", action: "GENERATE SCRIPT", hint: "Fastest way to get attention", Icon: Phone, civicIcon: "/images/civic/icons/contact.png" },
  social: { label: "Send an Email", desc: "Email their office directly", action: "GENERATE EMAIL", hint: "Quick and convenient", Icon: PenLine, civicIcon: "/images/civic/icons/email.png" },
};

const quickTopics = [
  { label: "Healthcare", slug: "healthcare", Icon: Heart },
  { label: "Climate", slug: "environment", Icon: Globe },
  { label: "Economy", slug: "economy", Icon: TrendingUp },
  { label: "Education", slug: "education", Icon: GraduationCap },
  { label: "Immigration", slug: "immigration", Icon: Plane },
  { label: "Housing", slug: "housing", Icon: HomeIcon },
  { label: "Civil Rights", slug: "civil-rights", Icon: Users },
  { label: "Defense", slug: "defense", Icon: Swords },
];

function partyConfig(party: string) {
  if (party === "D") return { label: "Democrat", bg: "bg-blue", text: "text-blue", light: "bg-blue-light" };
  if (party === "R") return { label: "Republican", bg: "bg-red", text: "text-red", light: "bg-red-light" };
  return { label: "Independent", bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50" };
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

function DraftInner() {
  const searchParams = useSearchParams();
  const { myReps, hasSavedReps } = useMyReps();
  const { user, setShowAuthModal, setAuthModalMessage } = useAuth();
  const outputRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [allReps, setAllReps] = useState<Representative[]>([]);
  const [selectedModes, setSelectedModes] = useState<Set<Mode>>(
    new Set([(searchParams.get("mode") as Mode) || "letter"])
  );
  const mode: Mode = selectedModes.has("letter") ? "letter" : selectedModes.has("call") ? "call" : "social";
  const [selectedReps, setSelectedReps] = useState<Representative[]>([]);
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
  const [mailSessionId, setMailSessionId] = useState("");
  const [mailLetters, setMailLetters] = useState<Array<{
    repName: string; letterId: string | null; expectedDeliveryDate: string | null;
    trackingUrl: string | null; thumbnailUrl: string | null; error: boolean;
    deliveryStatus: string | null;
  }>>([]);
  const [mailStatusLoading, setMailStatusLoading] = useState(false);
  const [showAccountPrompt, setShowAccountPrompt] = useState(false);
  const [lastLogId, setLastLogId] = useState("");

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
      setMailSessionId(mailSuccessParam);
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
      window.history.replaceState({}, "", "/draft");
    }
  }, [searchParams]);

  // Poll for mail status
  const pollMailStatus = useCallback(async (sessionId: string) => {
    setMailStatusLoading(true);
    let attempts = 0;
    const maxAttempts = 20;
    const poll = async () => {
      try {
        const res = await fetch(`/api/mail/status?session_id=${sessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.letters && data.letters.length > 0) {
          setMailLetters(data.letters);
          try {
            const logs = JSON.parse(localStorage.getItem("checkmyrep_contacts") || "[]");
            const idx = logs.findIndex((l: Record<string, string>) => l.stripeSessionId === sessionId);
            if (idx !== -1 && data.letters[0]?.letterId) {
              logs[idx].lobLetterId = data.letters.map((l: { letterId: string }) => l.letterId).join(",");
              logs[idx].expectedDeliveryDate = data.letters[0].expectedDeliveryDate || "";
              logs[idx].lobTrackingUrl = data.letters[0].trackingUrl || "";
              localStorage.setItem("checkmyrep_contacts", JSON.stringify(logs));
            }
          } catch { /* ignore */ }
        }
        if (data.status === "sent" || data.status === "error") {
          setMailStatusLoading(false);
          return;
        }
      } catch { /* ignore */ }
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 3000);
      } else {
        setMailStatusLoading(false);
      }
    };
    poll();
  }, []);

  useEffect(() => {
    if (mailSessionId) pollMailStatus(mailSessionId);
  }, [mailSessionId, pollMailStatus]);

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
      setSelectedReps((prev) => prev.some((r) => r.id === rep.id) ? prev.filter((r) => r.id !== rep.id) : [...prev, rep]);
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
      } catch { /* ignore */ }

      if (user) {
        recordAction(user.id, {
          repId: selectedRep.id,
          repName: selectedRep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          content: text,
          concern: concern.slice(0, 500),
        }).catch(() => {});
      } else {
        setShowAccountPrompt(true);
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

    if (user) {
      for (const rep of selectedReps) {
        recordAction(user.id, {
          repId: rep.id,
          repName: rep.fullName,
          method: mode,
          issue: selectedIssue?.name || "General",
          content: concern,
          concern: concern.slice(0, 500),
        }).catch(() => {});
      }
    } else {
      setShowAccountPrompt(true);
    }

    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handlePrint() {
    window.print();
  }

  const canGenerate = selectedRep && concern.trim().length > 0;

  return (
    <div className="min-h-screen pb-24" data-print-content>
      {/* Header */}
      <div className="bg-gradient-hero px-4 sm:px-6 pt-8 pb-8 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-[0.04]" />
        <img
          src="/images/civic/illustrations/sign-envelope.png"
          alt=""
          className="absolute right-4 bottom-0 w-28 sm:w-36 opacity-[0.15]"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <img src="/images/civic/icons/capitol.png" alt="" className="w-7 h-7 opacity-80" aria-hidden="true" />
            <span className="text-sm text-white/60 font-medium">CheckMyRep</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Write Congress
          </h1>
          <p className="mt-2 text-white/70">
            Pick a rep, write or paste your message, and send it.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 relative z-10">
        {!output ? (
          <div className="space-y-6" data-print-hide>

            {/* Step 1: Choose how to reach them */}
            <Card padding="md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-navy text-white flex items-center justify-center text-sm font-semibold shrink-0">
                  1
                </div>
                <h2 className="text-lg font-semibold text-navy">
                  How do you want to reach them?
                </h2>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Select one or more — we&apos;ll handle the rest
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["letter", "call", "social"] as Mode[]).map((m) => {
                  const isSelected = selectedModes.has(m);
                  const cfg = modeConfig[m];
                  const colors = m === "letter" ? "border-navy bg-navy-50" : m === "call" ? "border-teal bg-teal-50" : "border-gold-dark bg-gold-50";
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
                      className={`relative text-left p-4 rounded-xl cursor-pointer transition-all border-2
                        ${isSelected ? colors : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden
                          ${isSelected ? (m === "letter" ? "bg-navy text-white" : m === "call" ? "bg-teal text-white" : "bg-gold-dark text-white") : "bg-gray-100 text-gray-500"}`}>
                          <img src={cfg.civicIcon} alt="" className="w-6 h-6" style={{ filter: isSelected ? "brightness(10)" : "grayscale(0.5) opacity(0.6)" }} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`block text-sm font-semibold ${isSelected ? "text-navy" : "text-gray-700"}`}>
                            {cfg.label}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">{cfg.hint}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-navy flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedModes.size > 1 && (
                <p className="text-xs text-teal font-medium mt-2">
                  {selectedModes.size} methods selected — write once, send {selectedModes.size} ways
                </p>
              )}
            </Card>

            {/* Step 2: Pick your rep */}
            <Card padding="md" className="relative z-40">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0
                  ${step >= 1 ? "bg-navy text-white" : "bg-gray-200 text-gray-500"}`}>
                  2
                </div>
                <h2 className="text-lg font-semibold text-navy">
                  Who are you writing to?
                </h2>
              </div>

              {/* Saved reps */}
              {hasSavedReps && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-3">
                    Your saved representatives — tap to select
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {myReps.map((rep) => {
                      const isRepSelected = selectedReps.some((r) => r.id === rep.id);
                      const party = partyConfig(rep.party);
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
                          className={`flex items-center gap-3 p-3 rounded-xl text-left cursor-pointer transition-all border-2
                            ${isRepSelected ? "border-navy bg-navy-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                        >
                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2
                            ${isRepSelected ? "bg-navy border-navy" : "border-gray-300"}`}>
                            {isRepSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div className={`w-10 h-10 ${party.bg} rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative`}>
                            <span className="text-white font-semibold text-sm">{rep.firstName[0]}{rep.lastName[0]}</span>
                            {rep.photoUrl && (
                              <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-navy">{rep.fullName}</span>
                            <span className="block text-xs text-gray-500">
                              {party.label} — {rep.chamber}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedReps.length > 1 && (
                    <p className="text-xs text-navy font-medium mt-2">
                      {selectedReps.length} representatives selected
                    </p>
                  )}
                </div>
              )}

              {/* Search for other reps */}
              <div ref={resultsRef}>
                {hasSavedReps && !showAllReps ? (
                  <button
                    onClick={() => setShowAllReps(true)}
                    className="w-full p-3 text-sm text-gray-500 font-medium text-center cursor-pointer transition-colors
                      border-2 border-dashed border-gray-300 rounded-xl bg-transparent hover:border-navy hover:text-navy"
                  >
                    Search All Members of Congress
                  </button>
                ) : (
                  <>
                    {!hasSavedReps && (
                      <p className="text-xs text-gray-500 mb-3">
                        Search for your representative, or{" "}
                        <Link href="/my-reps" className="font-semibold text-navy">
                          save your reps
                        </Link>{" "}
                        for one-tap access next time.
                      </p>
                    )}

                    {/* Filter chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {(["All", "Senate", "House"] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => { setChamberFilter(c); setShowResults(true); setHighlightIdx(-1); }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all border
                            ${chamberFilter === c ? "bg-navy text-white border-navy" : "bg-white text-gray-600 border-gray-200 hover:border-navy"}`}
                        >
                          {c}
                        </button>
                      ))}
                      <div className="w-px h-4 mx-1 bg-gray-200" />
                      {(["D", "R", "I"] as const).map((p) => {
                        const isActive = partyFilter === p;
                        const labels = { D: "Dem", R: "GOP", I: "Ind" };
                        const colors = {
                          D: isActive ? "bg-blue text-white border-blue" : "text-blue border-gray-200 hover:border-blue",
                          R: isActive ? "bg-red text-white border-red" : "text-red border-gray-200 hover:border-red",
                          I: isActive ? "bg-purple-600 text-white border-purple-600" : "text-purple-600 border-gray-200 hover:border-purple-600",
                        };
                        return (
                          <button
                            key={p}
                            onClick={() => { setPartyFilter(partyFilter === p ? "All" : p); setShowResults(true); setHighlightIdx(-1); }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer transition-all border bg-white ${colors[p]}`}
                          >
                            {labels[p]}
                          </button>
                        );
                      })}
                      <div className="w-px h-4 mx-1 bg-gray-200" />
                      <select
                        value={stateFilter}
                        onChange={(e) => { setStateFilter(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full cursor-pointer border transition-all
                          ${stateFilter === "All" ? "bg-white text-gray-600 border-gray-200" : "bg-navy text-white border-navy"}`}
                      >
                        <option value="All">State</option>
                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={() => { setChamberFilter("All"); setPartyFilter("All"); setStateFilter("All"); }}
                          className="px-2 py-1.5 text-xs font-medium text-red cursor-pointer bg-transparent border-none"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={repSearch}
                        onChange={(e) => { setRepSearch(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
                        onFocus={() => setShowResults(true)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Search by name or state..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm
                          placeholder:text-gray-400 focus:bg-white focus:border-navy focus:outline-none transition-all"
                      />
                      {hasFilters && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          {filteredReps.length} found
                        </span>
                      )}
                      {showResults && hasFilters && dropdownReps.length > 0 && (
                        <div className="absolute z-40 left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto
                          bg-white border border-gray-200 rounded-xl shadow-lg">
                          {dropdownReps.map((rep, idx) => {
                            const party = partyConfig(rep.party);
                            return (
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
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors border-b border-gray-100
                                  ${idx === highlightIdx ? "bg-gray-50" : "bg-white hover:bg-gray-50"}`}
                              >
                                <div className={`w-8 h-8 ${party.bg} rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative`}>
                                  <span className="text-white text-xs font-semibold">{rep.firstName[0]}{rep.lastName[0]}</span>
                                  {rep.photoUrl && (
                                    <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-navy flex-1">{rep.fullName}</span>
                                <span className="text-xs text-gray-400">
                                  {party.label.slice(0, 3)} · {rep.stateAbbr} · {rep.chamber}
                                </span>
                              </button>
                            );
                          })}
                          {filteredReps.length > 30 && (
                            <div className="px-4 py-2 text-xs text-center text-gray-400">
                              Showing 30 of {filteredReps.length} — type to narrow
                            </div>
                          )}
                        </div>
                      )}
                      {showResults && hasFilters && dropdownReps.length === 0 && (
                        <div className="absolute z-40 left-0 right-0 top-full mt-1 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
                          <p className="text-sm text-center text-gray-500">
                            No representatives found. Try different filters.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Selected reps pills */}
              {selectedReps.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-navy font-medium mb-2">
                    {selectedReps.length === 1 ? "Selected representative" : `${selectedReps.length} representatives selected`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReps.map((rep) => {
                      const party = partyConfig(rep.party);
                      return (
                        <div
                          key={rep.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-navy-50 border border-navy/20 rounded-full"
                        >
                          <div className={`w-6 h-6 ${party.bg} rounded-full flex items-center justify-center shrink-0 overflow-hidden relative`}>
                            <span className="text-white text-[10px] font-semibold">{rep.firstName[0]}{rep.lastName[0]}</span>
                            {rep.photoUrl && (
                              <img src={rep.photoUrl} alt="" className="absolute inset-0 w-full h-full object-cover rounded-full" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            )}
                          </div>
                          <span className="text-sm font-medium text-navy">{rep.fullName}</span>
                          <button
                            onClick={() => setSelectedReps((prev) => prev.filter((r) => r.id !== rep.id))}
                            className="text-gray-400 hover:text-red cursor-pointer bg-transparent border-none p-0"
                            aria-label={`Remove ${rep.fullName}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            {/* Step 3: What's on your mind? */}
            <Card padding="md" id="step-3-topics">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0
                  ${selectedRep ? "bg-navy text-white" : "bg-gray-200 text-gray-500"}`}>
                  3
                </div>
                <h2 className={`text-lg font-semibold ${selectedRep ? "text-navy" : "text-gray-400"}`}>
                  What&apos;s on your mind?
                </h2>
              </div>

              {/* Quick topics */}
              <p className="text-xs text-gray-500 mb-3">Pick a topic to get started</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {quickTopics.map((topic) => {
                  const isSelected = selectedIssueSlug === topic.slug;
                  return (
                    <button
                      key={topic.slug}
                      onClick={() => {
                        if (selectedIssueSlug === topic.slug) {
                          setSelectedIssueSlug("");
                          setConcern("");
                          return;
                        }
                        setSelectedIssueSlug(topic.slug);
                        const iss = getIssueBySlug(topic.slug);
                        if (iss && iss.talkingPoints.length > 0) {
                          setConcern(iss.talkingPoints[0]);
                        }
                        setTimeout(() => {
                          const ta = document.getElementById("draft-concern");
                          if (ta) { ta.scrollIntoView({ behavior: "smooth", block: "center" }); ta.focus(); }
                        }, 100);
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl text-left cursor-pointer transition-all border-2
                        ${isSelected ? "border-navy bg-navy-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <topic.Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-navy" : "text-gray-400"}`} />
                      <span className={`text-sm font-medium ${isSelected ? "text-navy" : "text-gray-600"}`}>
                        {topic.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Concern textarea */}
              <label
                htmlFor="draft-concern"
                className="text-xs text-gray-500 block mb-2 font-medium"
              >
                Write your letter or describe your concern
              </label>
              <textarea
                id="draft-concern"
                value={concern}
                onChange={(e) => setConcern(e.target.value)}
                placeholder="Write your full letter here, paste one you've already written, or just describe your concern and use 'Generate with AI' to draft it for you..."
                rows={4}
                className={`w-full px-4 py-3 text-sm rounded-xl border-2 focus:outline-none resize-none transition-all
                  ${selectedIssueSlug ? "border-navy bg-navy-50" : "border-gray-200 bg-gray-50 focus:border-navy focus:bg-white"}`}
              />
            </Card>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-light border border-red/20 rounded-xl text-sm text-red font-medium" role="alert">
                {error}
                {error.includes("API key") && (
                  <Link href="/settings" className="ml-2 underline text-red">Go to Settings</Link>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleUseOwn}
                disabled={!canGenerate}
                variant="outline"
                size="lg"
                className="flex-1"
                icon={<Send className="w-4 h-4" />}
              >
                {selectedReps.length === 0 ? "Pick a rep first" : !concern.trim() ? "Write your message" : selectedReps.length > 1 ? `Send to ${selectedReps.length} reps` : "Send as-is"}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading || !canGenerate}
                loading={loading}
                variant="primary"
                size="lg"
                className="flex-1"
                icon={!loading ? <Sparkles className="w-4 h-4" /> : undefined}
              >
                {loading ? "Drafting..." : "Generate with AI"}
              </Button>
            </div>

            {/* Loading state */}
            {loading && (
              <Card padding="md" className="text-center">
                <svg className="animate-spin h-6 w-6 text-navy mx-auto mb-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-navy font-medium">Drafting your message...</p>
                <p className="text-xs text-gray-500 mt-1">
                  Using {selectedRep?.fullName}&apos;s voting record and committee data
                </p>
              </Card>
            )}
          </div>
        ) : (
          /* Output view */
          <div ref={outputRef} className="space-y-0">
            {/* Print-only header */}
            <div className="hidden" data-print-show data-print-header>
              <h1 style={{ fontSize: "18pt", marginBottom: "4pt" }}>
                {mode === "letter" ? "Letter" : mode === "call" ? "Call Script" : "Email"} to {selectedRep?.fullName}
              </h1>
              <p style={{ fontSize: "9pt", color: "#6B7280" }}>
                {selectedRep?.title} — {selectedRep?.state}{selectedRep?.district ? `, ${selectedRep.district}` : ""} — Generated {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Action bar */}
            <Card padding="md" className="rounded-b-none border-b-0" data-print-hide>
              <div className="mb-4">
                <p className="text-lg font-semibold text-navy">
                  Your Message to {selectedReps.length > 1 ? `${selectedReps.length} Representatives` : selectedRep?.fullName}
                </p>
                {selectedReps.length > 1 && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedReps.map((r) => r.fullName).join(" · ")}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedIssue ? selectedIssue.name : "General concern"} — {selectedModes.size} delivery method{selectedModes.size > 1 ? "s" : ""}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {selectedModes.has("letter") && selectedRep && (
                  <Button onClick={() => setMailModalOpen(true)} variant="primary" icon={<Mail className="w-4 h-4" />}>
                    {selectedReps.length > 1 ? `Mail ${selectedReps.length} Letters — $${(selectedReps.length * 1.5).toFixed(2)}` : "Mail Letter — $1.50"}
                  </Button>
                )}
                {selectedModes.has("call") && selectedRep && (
                  <a href={`tel:${selectedRep.offices?.[0]?.phone || ""}`}>
                    <Button variant="teal" icon={<Phone className="w-4 h-4" />}>Call Now</Button>
                  </a>
                )}
                {selectedModes.has("social") && (
                  <a href={getMailtoLink()}>
                    <Button variant="secondary" icon={<PenLine className="w-4 h-4" />}>Send Email</Button>
                  </a>
                )}
                {(selectedRep?.contactForm || selectedRep?.website) && (
                  <Button onClick={handleOpenContactForm} variant="outline" icon={<ExternalLink className="w-4 h-4" />}>
                    Copy &amp; Open Form
                  </Button>
                )}
                <Button onClick={handlePrint} variant="ghost" icon={<Printer className="w-4 h-4" />}>Print</Button>
                <Button onClick={handleCopy} variant="ghost" icon={<Copy className="w-4 h-4" />}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </Card>

            {/* Letter content */}
            <div className="p-6 md:p-8 bg-white border border-gray-200 border-t-0 rounded-b-xl" data-print-letter>
              <div className="text-sm leading-relaxed whitespace-pre-wrap max-w-3xl text-gray-800">
                {output}
              </div>
            </div>

            {/* Bottom actions */}
            <Card padding="md" className="mt-4" data-print-hide>
              <div className="flex gap-2 flex-wrap mb-4">
                {selectedModes.has("letter") && selectedRep && (
                  <Button onClick={() => setMailModalOpen(true)} variant="primary" icon={<Mail className="w-4 h-4" />}>
                    {selectedReps.length > 1 ? `Mail ${selectedReps.length} Letters` : "Mail Letter — $1.50"}
                  </Button>
                )}
                {selectedModes.has("call") && selectedRep && (
                  <a href={`tel:${selectedRep.offices?.[0]?.phone || ""}`}>
                    <Button variant="teal" icon={<Phone className="w-4 h-4" />}>Call Now</Button>
                  </a>
                )}
                {selectedModes.has("social") && (
                  <a href={getMailtoLink()}>
                    <Button variant="secondary" icon={<PenLine className="w-4 h-4" />}>Send Email</Button>
                  </a>
                )}
                <Button onClick={handleCopy} variant="outline" icon={<Copy className="w-4 h-4" />}>
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              {/* Next steps */}
              <div className="grid grid-cols-2 gap-3">
                {mode !== "call" && (
                  <button
                    onClick={() => { setSelectedModes(new Set(["call"])); setOutput(""); }}
                    className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                  >
                    <Phone className="w-5 h-5 text-teal mb-1" />
                    <span className="block text-sm font-semibold text-navy">Call Too</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Letters + calls = 3x impact</span>
                  </button>
                )}
                {mode !== "social" && (
                  <button
                    onClick={() => { setSelectedModes(new Set(["social"])); setOutput(""); }}
                    className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                  >
                    <PenLine className="w-5 h-5 text-gold-dark mb-1" />
                    <span className="block text-sm font-semibold text-navy">Email Too</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Add another channel</span>
                  </button>
                )}
                <button
                  onClick={() => { setOutput(""); setSelectedReps([]); }}
                  className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                >
                  <Users className="w-5 h-5 text-navy mb-1" />
                  <span className="block text-sm font-semibold text-navy">Another Rep</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Both senators + house rep</span>
                </button>
                <button
                  onClick={() => { setOutput(""); setError(""); }}
                  className="p-3 text-left rounded-xl bg-gray-50 border border-gray-200 hover:border-navy cursor-pointer transition-all"
                >
                  <RotateCcw className="w-5 h-5 text-gray-500 mb-1" />
                  <span className="block text-sm font-semibold text-navy">Edit &amp; Redo</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Tweak and regenerate</span>
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                Auto-saved to your{" "}
                <Link href="/my-reps" className="text-navy font-medium">contact log</Link>.
              </p>
            </Card>

            {/* Mail success banner */}
            {mailSuccess && (
              <Card padding="md" className="mt-4 border-green/30 bg-green-light" data-print-hide>
                <p className="text-lg font-semibold text-green">
                  Letter{mailLetters.length > 1 ? "s" : ""} Mailed!
                </p>

                {mailStatusLoading && mailLetters.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Processing your letter{selectedReps.length > 1 ? "s" : ""}...</p>
                )}

                {mailLetters.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {mailLetters.map((letter, i) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-green/20">
                        <div className="flex items-start gap-3">
                          {letter.thumbnailUrl && (
                            <a href={letter.trackingUrl || "#"} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <img
                                src={letter.thumbnailUrl}
                                alt={`Letter to ${letter.repName}`}
                                className="w-16 h-auto rounded-lg border border-gray-200"
                              />
                            </a>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy">{letter.repName}</p>
                            {letter.deliveryStatus && (
                              <p className="text-xs text-green mt-0.5">Status: {letter.deliveryStatus}</p>
                            )}
                            {letter.expectedDeliveryDate && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                Expected: {new Date(letter.expectedDeliveryDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                              </p>
                            )}
                            {letter.trackingUrl && (
                              <a href={letter.trackingUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-block mt-1 text-xs font-medium text-teal">
                                View Letter &amp; Tracking
                              </a>
                            )}
                            {letter.error && (
                              <p className="text-xs text-red mt-0.5">Issue sending — we&apos;ll retry automatically.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">
                      Receipt sent to your email. Letters arrive in 3-5 business days via USPS First Class.
                    </p>
                  </div>
                ) : !mailStatusLoading ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Your letter{selectedReps.length > 1 ? "s are" : " is"} being printed and will arrive in 3-5 business days.
                  </p>
                ) : null}
              </Card>
            )}
          </div>
        )}

        {/* Account prompt */}
        {showAccountPrompt && !user && (
          <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
            <Card padding="md" className="shadow-xl border-gold/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
                  <img src="/images/civic/icons/voter-reg.png" alt="" className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">Track Your Impact</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Create a free account to earn points, track letters, and build your civic profile.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => {
                        setShowAccountPrompt(false);
                        setAuthModalMessage("Your action was saved locally. Create an account to track it across devices!");
                        setShowAuthModal(true);
                      }}
                      variant="primary"
                      size="sm"
                      icon={<UserPlus className="w-3.5 h-3.5" />}
                    >
                      Sign Up Free
                    </Button>
                    <Button onClick={() => setShowAccountPrompt(false)} variant="ghost" size="sm">
                      Later
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
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
    </div>
  );
}

export default function DraftPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Write Congress</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <DraftInner />
    </Suspense>
  );
}
