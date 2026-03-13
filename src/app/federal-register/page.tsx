"use client";

import { useState, useEffect, useRef, Suspense, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { FederalRegisterDocument } from "@/data/types";

const AGENCY_CATEGORIES = [
  "EPA",
  "FDA",
  "FCC",
  "SEC",
  "DOD",
  "HHS",
  "Education",
  "Treasury",
  "Labor",
  "Energy",
  "Transportation",
  "Homeland Security",
];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number | null): string {
  if (days === null) return "";
  if (days <= 3) return "border-red bg-red-light";
  if (days <= 7) return "border-status-red bg-status-red-light";
  if (days <= 14) return "border-yellow bg-yellow-light";
  return "border-border";
}

/* ── Inline Comment Form ── */

function CommentForm({
  doc,
  onClose,
}: {
  doc: FederalRegisterDocument;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/regulations/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: doc.documentNumber,
          comment,
          firstName,
          lastName,
          email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
      } else {
        setTrackingNumber(data.trackingNumber);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (trackingNumber) {
    return (
      <div className="mt-4 border-3 border-black bg-cream-dark p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-black flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-headline text-xl">Comment Submitted</p>
            <p className="font-mono text-xs text-gray-mid font-bold">
              TRACKING NUMBER: {trackingNumber}
            </p>
          </div>
        </div>
        <p className="font-body text-sm text-gray-dark mb-4">
          Your comment has been submitted to Regulations.gov. Save your tracking
          number to check the status of your comment. It may take several hours
          to appear on the public docket.
        </p>
        <div className="flex gap-2">
          <a
            href={doc.regulationsGovUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border-2 border-border font-mono text-xs font-bold text-gray-dark hover:border-black hover:text-black transition-colors no-underline"
          >
            VIEW ON REGULATIONS.GOV
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-border font-mono text-xs font-bold text-gray-mid hover:border-black hover:text-black transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 border-3 border-red bg-cream-dark p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-headline text-lg">
          Submit Comment to Regulations.gov
        </h4>
        <button
          onClick={onClose}
          className="w-8 h-8 border-2 border-border flex items-center justify-center font-mono text-sm font-bold text-gray-mid hover:border-black hover:text-black transition-colors cursor-pointer"
          aria-label="Close comment form"
        >
          X
        </button>
      </div>

      <p className="font-mono text-xs text-gray-mid font-bold mb-1">
        RE: {doc.documentNumber} — {doc.agencies.join(", ")}
      </p>
      <p className="font-body text-sm text-gray-dark mb-4">
        Your comment will be submitted directly to Regulations.gov and will become
        part of the public record. Comments due{" "}
        <strong>{doc.commentEndDate}</strong>.
      </p>

      {error && (
        <div className="border-3 border-red bg-red-light p-3 mb-4" role="alert">
          <p className="font-mono text-xs font-bold text-red">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-xs font-bold text-gray-dark mb-1">
              FIRST NAME *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 border-3 border-border font-body text-base focus:outline-none focus:border-red bg-cream"
            />
          </div>
          <div>
            <label className="block font-mono text-xs font-bold text-gray-dark mb-1">
              LAST NAME *
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 border-3 border-border font-body text-base focus:outline-none focus:border-red bg-cream"
            />
          </div>
        </div>
        <div>
          <label className="block font-mono text-xs font-bold text-gray-dark mb-1">
            EMAIL *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border-3 border-border font-body text-base focus:outline-none focus:border-red bg-cream"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-mono text-xs font-bold text-gray-dark">
              YOUR COMMENT *
            </label>
            <Link
              href={`/draft?context=${encodeURIComponent(`Federal Register: ${doc.title} (${doc.documentNumber}) — Comment period closes ${doc.commentEndDate}`)}`}
              className="font-mono text-[10px] font-bold text-red hover:underline no-underline"
            >
              DRAFT WITH AI FIRST
            </Link>
          </div>
          <textarea
            required
            rows={8}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your public comment here. Be specific, reference the rule number, and explain your reasoning..."
            className="w-full px-3 py-2 border-3 border-border font-body text-base focus:outline-none focus:border-red bg-cream resize-y"
          />
          <p className="font-mono text-[10px] text-gray-mid mt-1">
            Your comment is public record. Do not include sensitive personal
            information (SSN, medical info, etc.).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-3 font-headline text-base border-3 transition-colors cursor-pointer ${
              submitting
                ? "bg-gray-mid text-white border-gray-mid cursor-not-allowed"
                : "bg-red text-white border-red hover:bg-black hover:border-black"
            }`}
          >
            {submitting ? "SUBMITTING..." : "SUBMIT TO REGULATIONS.GOV"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 border-3 border-border font-mono text-sm font-bold text-gray-mid hover:border-black hover:text-black transition-colors cursor-pointer"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Main Page ── */

export default function FederalRegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8"><div className="h-8 bg-border-light w-64 motion-safe:animate-pulse" /></div>}>
      <FederalRegisterContent />
    </Suspense>
  );
}

function FederalRegisterContent() {
  const searchParams = useSearchParams();
  const openCommentParam = searchParams.get("openComment");
  const [docs, setDocs] = useState<FederalRegisterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [mode, setMode] = useState<"comments" | "rules">("comments");
  const [openCommentForm, setOpenCommentForm] = useState<string | null>(null);
  const [showDirectComment, setShowDirectComment] = useState(!!openCommentParam);
  const commentSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ mode });
    if (keyword) params.set("keyword", keyword);
    fetch(`/api/federal-register?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDocs(data);
        // If linked with ?openComment=DOC_ID, auto-open that form
        if (openCommentParam) {
          setOpenCommentForm(openCommentParam);
          setShowDirectComment(true);
          // Scroll to the comment section after render
          setTimeout(() => {
            commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [keyword, mode, openCommentParam]);

  const closingSoon = docs.filter((d) => {
    const days = daysUntil(d.commentEndDate);
    return days !== null && days >= 0 && days <= 7;
  });

  const isCommentOpen = (doc: FederalRegisterDocument) => {
    if (doc.type !== "PRORULE") return false;
    const days = daysUntil(doc.commentEndDate);
    return days !== null && days >= 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Federal Register</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        PROPOSED RULES, OPEN COMMENT PERIODS, AND FINAL RULES FROM FEDERAL AGENCIES
      </p>

      {/* Direct Comment Wizard — shown when linked from urgency banner */}
      {showDirectComment && openCommentParam && (
        <div ref={commentSectionRef} className="mb-8 border-3 border-red bg-cream-dark p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: "#C1272D" }}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h2 className="font-headline text-2xl">Submit Your Comment</h2>
              <p className="font-mono text-xs text-gray-mid font-bold">YOU WERE DIRECTED HERE FROM AN URGENT ACTION</p>
            </div>
            <button
              onClick={() => setShowDirectComment(false)}
              className="ml-auto w-8 h-8 border-2 border-border flex items-center justify-center font-mono text-sm font-bold text-gray-mid hover:border-black hover:text-black transition-colors cursor-pointer"
              aria-label="Close wizard"
            >
              X
            </button>
          </div>

          <div className="mb-6">
            <h3 className="font-headline text-lg mb-2">How to submit your comment:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-border bg-surface p-4">
                <div className="w-8 h-8 text-white font-headline text-lg flex items-center justify-center mb-2" style={{ backgroundColor: "#C1272D" }}>1</div>
                <p className="font-body text-sm text-gray-dark">
                  <strong>Draft your comment</strong> using our AI-powered writer, or write it yourself below.
                </p>
              </div>
              <div className="border-2 border-border bg-surface p-4">
                <div className="w-8 h-8 text-white font-headline text-lg flex items-center justify-center mb-2" style={{ backgroundColor: "#C1272D" }}>2</div>
                <p className="font-body text-sm text-gray-dark">
                  <strong>Fill in your name and email</strong> — your comment becomes part of the public record.
                </p>
              </div>
              <div className="border-2 border-border bg-surface p-4">
                <div className="w-8 h-8 text-white font-headline text-lg flex items-center justify-center mb-2" style={{ backgroundColor: "#C1272D" }}>3</div>
                <p className="font-body text-sm text-gray-dark">
                  <strong>Submit directly</strong> — we&apos;ll send it to Regulations.gov and give you a tracking number.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/draft?context=${encodeURIComponent(`Federal Register comment for docket ${openCommentParam}`)}`}
              className="px-6 py-3 font-headline text-base border-3 text-white no-underline transition-colors"
              style={{ backgroundColor: "#C1272D", borderColor: "#C1272D" }}
            >
              DRAFT WITH AI FIRST
            </Link>
            <a
              href={`https://www.regulations.gov/search?filter=${encodeURIComponent(openCommentParam)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white font-headline text-base border-3 border-black hover:bg-red hover:border-red transition-colors no-underline"
            >
              GO TO REGULATIONS.GOV DIRECTLY
            </a>
            <button
              onClick={() => {
                setShowDirectComment(false);
                // Scroll to the document list
                window.scrollTo({ top: document.querySelector('[role="search"]')?.getBoundingClientRect().top! + window.scrollY - 100, behavior: "smooth" });
              }}
              className="px-6 py-3 border-3 border-border font-headline text-base text-gray-dark hover:border-black hover:text-black transition-colors cursor-pointer"
            >
              BROWSE ALL OPEN COMMENTS
            </button>
          </div>
        </div>
      )}

      {/* What is the Federal Register? */}
      <section className="border-3 border-border bg-surface p-6 md:p-8 mb-8">
        <h2 className="font-headline text-3xl mb-4">What is the Federal Register?</h2>
        <p className="font-body text-base leading-relaxed text-gray-dark mb-4">
          The <strong>Federal Register</strong> is the daily journal of the United States
          government. Every time a federal agency wants to create a new regulation, change
          an existing one, or announce an action, it must publish a notice here. It&apos;s
          the official public record of how rules that affect your daily life get made.
        </p>
        <p className="font-body text-base leading-relaxed text-gray-dark">
          Most importantly, many proposed rules include a <strong>public comment period</strong> —
          a window where <em>you</em> can submit your opinion directly to the federal agency.
          By law, agencies must consider every public comment before finalizing a rule. This
          is one of the most direct ways citizens can influence federal policy.
        </p>
      </section>

      {/* Why This Matters */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border-3 border-border p-5 bg-surface">
          <div className="w-10 h-10 bg-red flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h3 className="font-headline text-xl normal-case mb-2">Your Voice Matters</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed">
            Agencies must read and respond to every public comment. A well-researched
            comment on a proposed rule carries real legal weight in the rulemaking process.
          </p>
        </div>
        <div className="border-3 border-border p-5 bg-surface">
          <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-headline text-xl normal-case mb-2">Time-Sensitive</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed">
            Comment periods have strict deadlines — usually 30 to 90 days. Once the
            deadline passes, the agency moves forward. Check closing dates carefully.
          </p>
        </div>
        <div className="border-3 border-border p-5 bg-surface">
          <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-headline text-xl normal-case mb-2">Rules Become Law</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed">
            Federal regulations have the force of law. Once a final rule is published, it
            applies to everyone. Commenting is your chance to shape it before that happens.
          </p>
        </div>
      </section>

      {/* Closing Soon Alert */}
      {closingSoon.length > 0 && mode === "comments" && (
        <div className="border-3 border-red bg-red-light p-4 mb-6" role="alert">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-red text-white font-mono text-xs font-bold">CLOSING SOON</span>
            <span className="font-mono text-xs text-red font-bold">
              {closingSoon.length} comment period{closingSoon.length !== 1 ? "s" : ""} closing within 7 days
            </span>
          </div>
          <div className="space-y-1">
            {closingSoon.slice(0, 3).map((doc) => (
              <p key={doc.documentNumber} className="font-mono text-xs text-gray-dark">
                <strong>{daysUntil(doc.commentEndDate)} days</strong> — {doc.title.slice(0, 100)}{doc.title.length > 100 ? "..." : ""}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("comments")}
          className={`px-4 py-2.5 font-mono text-sm font-bold border-3 transition-colors cursor-pointer ${
            mode === "comments" ? "bg-red text-white border-red" : "border-border hover:bg-black hover:text-white hover:border-black"
          }`}
        >
          Open Comment Periods
        </button>
        <button
          onClick={() => setMode("rules")}
          className={`px-4 py-2.5 font-mono text-sm font-bold border-3 transition-colors cursor-pointer ${
            mode === "rules" ? "bg-red text-white border-red" : "border-border hover:bg-black hover:text-white hover:border-black"
          }`}
        >
          Recent Final Rules
        </button>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(searchInput);
        }}
        role="search"
        aria-label="Search federal register documents"
        className="flex gap-2 mb-4"
      >
        <label htmlFor="fr-search" className="sr-only">Search by keyword</label>
        <input
          id="fr-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by keyword (e.g., healthcare, emissions, banking, privacy)..."
          className="flex-1 px-4 py-3 border-3 border-border font-mono text-base focus:outline-none focus:border-red bg-cream"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-black text-white font-headline uppercase text-base border-3 border-black hover:bg-red hover:border-red transition-colors cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Agency quick-filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => {
            setKeyword("");
            setSearchInput("");
          }}
          className={`px-3 py-1.5 font-mono text-xs font-bold border-2 transition-colors cursor-pointer ${
            !keyword
              ? "bg-black text-white border-black"
              : "bg-surface text-gray-mid border-border hover:border-black hover:text-black"
          }`}
        >
          ALL
        </button>
        {AGENCY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSearchInput(cat.toLowerCase());
              setKeyword(cat.toLowerCase());
            }}
            className={`px-3 py-1.5 font-mono text-xs font-bold border-2 transition-colors cursor-pointer ${
              keyword === cat.toLowerCase()
                ? "bg-red text-white border-red"
                : "bg-surface text-gray-mid border-border hover:border-red hover:text-red"
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-3 border-border p-5 bg-surface motion-safe:animate-pulse">
              <div className="h-3 bg-border-light w-32 mb-3" />
              <div className="h-5 bg-border-light w-3/4 mb-2" />
              <div className="h-3 bg-border-light w-full mb-2" />
              <div className="h-3 bg-border-light w-1/2" />
            </div>
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="border-3 border-border p-8 bg-surface text-center">
          <p className="font-headline text-2xl mb-2">No Documents Found</p>
          <p className="font-body text-base text-gray-mid">
            {mode === "comments"
              ? keyword
                ? `No open comment periods matching "${keyword}". Try a broader search.`
                : "No open comment periods at this time. Check back regularly — new ones are published daily."
              : keyword
                ? `No recent rules matching "${keyword}". Try a broader search.`
                : "No recent rules available."}
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-gray-mid mb-4 font-bold">
            {docs.length} DOCUMENT{docs.length !== 1 ? "S" : ""} FOUND
            {keyword ? ` FOR "${keyword.toUpperCase()}"` : ""}
          </p>
          <div className="space-y-3">
            {docs.map((doc) => {
              const days = daysUntil(doc.commentEndDate);
              const commentable = isCommentOpen(doc);
              const formOpen = openCommentForm === doc.documentNumber;
              return (
                <div key={doc.documentNumber} className={`border-3 p-5 bg-surface transition-colors hover:border-red ${
                  days !== null && days <= 7 ? "border-red" : "border-border"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 font-mono text-xs font-bold ${
                            doc.type === "PRORULE"
                              ? "bg-yellow text-black"
                              : "bg-black text-white"
                          }`}
                        >
                          {doc.type === "PRORULE" ? "PROPOSED RULE" : "FINAL RULE"}
                        </span>
                        {doc.agencies.map((agency) => (
                          <span key={agency} className="px-2 py-0.5 font-mono text-[10px] font-bold bg-cream-dark border border-border text-gray-mid uppercase">
                            {agency}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-headline text-xl mb-2 normal-case leading-tight">
                        <a
                          href={doc.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-red transition-colors"
                        >
                          {doc.title}
                        </a>
                      </h3>
                      {doc.abstract && (
                        <p className="font-body text-sm text-gray-mid line-clamp-2 mb-3">
                          {doc.abstract}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                        <span className="text-gray-mid">Published: {doc.publicationDate}</span>
                        {doc.commentEndDate && (
                          <span className={`font-bold ${days !== null && days <= 7 ? "text-red" : "text-gray-dark"}`}>
                            Comments due: {doc.commentEndDate}
                          </span>
                        )}
                        <div className="flex gap-2 ml-auto flex-wrap">
                          {commentable && (
                            <button
                              onClick={() =>
                                setOpenCommentForm(formOpen ? null : doc.documentNumber)
                              }
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-bold transition-colors cursor-pointer ${
                                formOpen
                                  ? "bg-black text-white border-2 border-black"
                                  : "bg-red text-white border-2 border-red hover:bg-black hover:border-black"
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              SUBMIT COMMENT
                            </button>
                          )}
                          {doc.pdfUrl && (
                            <a
                              href={doc.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red text-white font-bold hover:bg-black transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              PDF
                            </a>
                          )}
                          <a
                            href={doc.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-border text-gray-dark font-bold hover:border-black hover:text-black transition-colors"
                          >
                            VIEW ON FR.GOV
                          </a>
                          {commentable && (
                            <Link
                              href={`/draft?context=${encodeURIComponent(`Federal Register: ${doc.title} (${doc.documentNumber}) — Comment period closes ${doc.commentEndDate}`)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-border text-gray-dark font-bold hover:border-red hover:text-red transition-colors no-underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              DRAFT COMMENT
                            </Link>
                          )}
                          <a
                            href={`https://www.thefoiaforge.org/new-request?context=${encodeURIComponent(`Related to Federal Register document: ${doc.title} (${doc.documentNumber})`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-border text-gray-dark font-bold hover:border-red hover:text-red transition-colors no-underline"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            FOIA REQUEST
                          </a>
                        </div>
                      </div>
                    </div>
                    {days !== null && days >= 0 && (
                      <div
                        className={`shrink-0 text-center p-3 border-2 min-w-[80px] ${urgencyClass(days)}`}
                      >
                        <div
                          className={`font-headline text-2xl ${
                            days <= 7 ? "text-red" : "text-black"
                          }`}
                        >
                          {days}
                        </div>
                        <div className="font-mono text-[10px] text-gray-mid font-bold">
                          DAYS LEFT
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inline Comment Form */}
                  {formOpen && (
                    <CommentForm
                      doc={doc}
                      onClose={() => setOpenCommentForm(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* How to Submit a Public Comment */}
      <section className="mt-12 border-3 border-border bg-surface p-6 md:p-8">
        <h2 className="font-headline text-3xl mb-6">How to Submit an Effective Public Comment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-mono text-sm font-bold text-red mb-3">DO&apos;S</h3>
            <ul className="space-y-2 font-body text-sm text-gray-dark">
              <li className="flex items-start gap-2">
                <span className="text-red font-bold mt-0.5">✓</span>
                <span><strong>Be specific</strong> — reference the rule number and the specific provisions you support or oppose</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red font-bold mt-0.5">✓</span>
                <span><strong>Explain your reasoning</strong> — share personal experiences, data, or evidence that supports your position</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red font-bold mt-0.5">✓</span>
                <span><strong>Suggest alternatives</strong> — if you oppose a provision, propose a better approach</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red font-bold mt-0.5">✓</span>
                <span><strong>Submit before the deadline</strong> — late comments are not legally required to be considered</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-gray-mid mb-3">DON&apos;TS</h3>
            <ul className="space-y-2 font-body text-sm text-gray-dark">
              <li className="flex items-start gap-2">
                <span className="text-gray-mid font-bold mt-0.5">✗</span>
                <span><strong>Don&apos;t just say &ldquo;I oppose this&rdquo;</strong> — comments without reasoning carry less weight</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-mid font-bold mt-0.5">✗</span>
                <span><strong>Don&apos;t copy-paste form letters</strong> — agencies weight unique, substantive comments more</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-mid font-bold mt-0.5">✗</span>
                <span><strong>Don&apos;t include personal attacks</strong> — keep it professional and focused on the policy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-mid font-bold mt-0.5">✗</span>
                <span><strong>Don&apos;t include sensitive personal info</strong> — comments are part of the public record</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t-2 border-border-light">
          <p className="font-body text-sm text-gray-mid">
            <strong>Where to submit:</strong> Most comments are submitted through{" "}
            <a
              href="https://www.regulations.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red font-bold hover:underline"
            >
              Regulations.gov
            </a>
            {" "}— the official portal for public participation in federal rulemaking. Use the
            &ldquo;Submit Comment&rdquo; or &ldquo;Draft Comment&rdquo; buttons above to get started.
          </p>
        </div>
      </section>

      {/* How Rules Get Made */}
      <section className="mt-8 border-3 border-border bg-cream-dark p-6">
        <h3 className="font-mono text-xs font-bold text-gray-mid uppercase tracking-widest mb-4">
          HOW FEDERAL RULES GET MADE
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-body text-sm">
          <div className="relative">
            <div className="w-8 h-8 bg-red text-white font-headline text-lg flex items-center justify-center mb-2">1</div>
            <span className="font-bold text-black">Proposed Rule</span>
            <p className="text-gray-mid mt-1">An agency drafts a new regulation and publishes it in the Federal Register for public review.</p>
          </div>
          <div>
            <div className="w-8 h-8 bg-red text-white font-headline text-lg flex items-center justify-center mb-2">2</div>
            <span className="font-bold text-black">Comment Period</span>
            <p className="text-gray-mid mt-1">The public has 30-90 days to submit comments supporting, opposing, or suggesting changes to the rule.</p>
          </div>
          <div>
            <div className="w-8 h-8 bg-red text-white font-headline text-lg flex items-center justify-center mb-2">3</div>
            <span className="font-bold text-black">Agency Review</span>
            <p className="text-gray-mid mt-1">The agency reads all comments and may revise the rule based on public feedback. This can take months or years.</p>
          </div>
          <div>
            <div className="w-8 h-8 bg-black text-white font-headline text-lg flex items-center justify-center mb-2">4</div>
            <span className="font-bold text-black">Final Rule</span>
            <p className="text-gray-mid mt-1">The finalized rule is published and becomes enforceable law, often 30-60 days after publication.</p>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border-2 border-border p-5 bg-cream-dark">
          <h3 className="font-headline text-xl normal-case mb-2">Submit a Comment</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
            Use Regulations.gov to submit your comment officially. All comments become
            part of the public record and must be addressed by the agency.
          </p>
          <a
            href="https://www.regulations.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs font-bold text-red hover:underline no-underline"
          >
            GO TO REGULATIONS.GOV &rarr;
          </a>
        </div>
        <div className="border-2 border-border p-5 bg-cream-dark">
          <h3 className="font-headline text-xl normal-case mb-2">Draft Your Comment</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
            Use CitizenForge&apos;s AI-powered letter writer to draft a well-structured
            public comment. Click &ldquo;Draft Comment&rdquo; on any open comment period above.
          </p>
          <Link
            href="/draft"
            className="font-mono text-xs font-bold text-red hover:underline no-underline"
          >
            GO TO LETTER DRAFTING &rarr;
          </Link>
        </div>
        <div className="border-2 border-border p-5 bg-cream-dark">
          <h3 className="font-headline text-xl normal-case mb-2">Learn More</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
            The Federal Register is published by the National Archives. Learn about the
            rulemaking process, how to read regulatory documents, and your rights.
          </p>
          <a
            href="https://www.federalregister.gov/reader-aids"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs font-bold text-red hover:underline no-underline"
          >
            FEDERAL REGISTER READER AIDS &rarr;
          </a>
        </div>
      </section>
    </div>
  );
}
