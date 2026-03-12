"use client";

import { useState } from "react";
import Link from "next/link";
import type { Legislation } from "@/data/types";

const CONGRESS_OPTIONS = [
  { value: "119", label: "119th (Current)" },
  { value: "118", label: "118th" },
  { value: "117", label: "117th" },
];

const SUGGESTED_SEARCHES = [
  "healthcare",
  "defense spending",
  "immigration",
  "education",
  "climate",
  "tax reform",
  "infrastructure",
  "cybersecurity",
];

const STATUS_LABELS: Record<string, { text: string; className: string }> = {
  passed: { text: "PASSED", className: "bg-green text-white" },
  in_committee: { text: "IN COMMITTEE", className: "bg-yellow text-black" },
  failed: { text: "FAILED", className: "bg-status-red text-white" },
  introduced: { text: "INTRODUCED", className: "bg-status-red-light text-status-red" },
};

const STEPS = [
  {
    number: "1",
    title: "Introduced",
    description: "A member of Congress introduces a bill in the House or Senate.",
  },
  {
    number: "2",
    title: "Committee",
    description: "The bill is referred to a committee for hearings and markup.",
  },
  {
    number: "3",
    title: "Floor Vote",
    description: "Both chambers debate and vote. Differences are reconciled.",
  },
  {
    number: "4",
    title: "Signed into Law",
    description: "The President signs the bill, or Congress overrides a veto.",
  },
];

function buildCongressGovUrl(billNumber: string, congress: string): string {
  const cleaned = billNumber.replace(/[.\s]/g, "").toLowerCase();
  const match = cleaned.match(/^(hr|s|hjres|sjres|hconres|sconres|hres|sres)(\d+)$/);
  if (!match) return `https://www.congress.gov/search?q=${encodeURIComponent(billNumber)}`;

  const [, prefix, number] = match;
  const typeMap: Record<string, string> = {
    hr: "house-bill",
    s: "senate-bill",
    hjres: "house-joint-resolution",
    sjres: "senate-joint-resolution",
    hconres: "house-concurrent-resolution",
    sconres: "senate-concurrent-resolution",
    hres: "house-resolution",
    sres: "senate-resolution",
  };
  const type = typeMap[prefix] || "house-bill";
  return `https://www.congress.gov/bill/${congress}th-congress/${type}/${number}`;
}

function SkeletonCard() {
  return (
    <div className="border-3 border-border p-5 bg-surface motion-safe:animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-5 w-24 bg-gray-200" />
        <div className="h-4 w-20 bg-gray-200" />
        <div className="h-4 w-28 bg-gray-200" />
      </div>
      <div className="h-6 w-3/4 bg-gray-200 mb-2" />
      <div className="h-4 w-1/3 bg-gray-200 mb-3" />
      <div className="h-4 w-full bg-gray-200 mb-1" />
      <div className="h-4 w-2/3 bg-gray-200" />
    </div>
  );
}

export default function BillsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [congress, setCongress] = useState("119");
  const [bills, setBills] = useState<Legislation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  async function doSearch(query: string) {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setHasSearched(true);

    // Check if input looks like a bill number
    const billNumberPattern = /^(hr|s|hjres|sjres|hconres|sconres|hres|sres)\s*\.?\s*\d+$/i;
    const isBillNumber = billNumberPattern.test(query.trim().replace(/[.\s]/g, ""));

    const params = new URLSearchParams({ congress });
    if (isBillNumber) {
      params.set("billNumber", query.trim());
    } else {
      params.set("query", query.trim());
    }

    try {
      const res = await fetch(`/api/bills?${params}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to fetch bills");
        setBills([]);
        return;
      }
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch {
      setError("Network error. Please try again.");
      setBills([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(searchInput);
  }

  function handleSuggestedSearch(topic: string) {
    setSearchInput(topic);
    doSearch(topic);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Legislation Tracker</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        SEARCH BILLS, TRACK THEIR STATUS, AND SEE WHO&apos;S BEHIND THEM
      </p>

      {/* Search section */}
      <form onSubmit={handleSubmit} role="search" aria-label="Search legislation" className="mb-8">
        <div className="flex flex-col sm:flex-row gap-2 mb-3">
          <label htmlFor="bills-search" className="sr-only">Search by keyword or bill number</label>
          <input
            id="bills-search"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by keyword or bill number (e.g., HR 1234, S 500)"
            className="flex-1 px-4 py-3 border-2 border-border font-mono text-base focus:outline-none focus:border-red bg-cream"
          />
          <button
            type="submit"
            disabled={loading || !searchInput.trim()}
            className="px-6 py-3 bg-black text-white font-headline uppercase text-base border-2 border-black hover:bg-red hover:border-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Congress session toggle */}
        <div className="flex gap-2">
          {CONGRESS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCongress(opt.value)}
              className={`px-4 py-2 font-mono text-sm font-bold border-2 border-border transition-colors ${
                congress === opt.value
                  ? "bg-red text-white border-red"
                  : "hover:bg-black hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="border-3 border-status-red p-4 mb-6 bg-status-red-light" role="alert">
          <p className="font-mono text-sm text-status-red font-bold">{error}</p>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-6 w-32 bg-gray-200 motion-safe:animate-pulse mb-4" />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : hasSearched ? (
        bills.length > 0 ? (
          <div>
            {/* Count badge */}
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-black text-white font-mono text-xs font-bold">
                {bills.length} BILL{bills.length !== 1 ? "S" : ""} FOUND
              </span>
            </div>

            {/* Bill cards */}
            <div className="space-y-4">
              {bills.map((bill) => {
                const statusInfo = STATUS_LABELS[bill.status] || {
                  text: bill.status.toUpperCase(),
                  className: "bg-gray-200 text-black",
                };

                return (
                  <div key={bill.id} className="border-3 border-border p-5 bg-surface">
                    {/* Status + bill number + date */}
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 font-mono text-xs font-bold ${statusInfo.className}`}>
                        {statusInfo.text}
                      </span>
                      <span className="font-mono text-sm font-bold">{bill.billNumber}</span>
                      <span className="font-mono text-xs text-gray-mid">{bill.date}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-headline text-xl mb-1">{bill.title}</h3>

                    {/* Sponsor */}
                    {bill.sponsor && (
                      <p className="font-mono text-xs text-gray-mid mb-2">
                        Sponsor: {bill.sponsor}
                      </p>
                    )}

                    {/* Summary */}
                    {bill.summary && (
                      <p className="font-body text-sm text-gray-mid line-clamp-2 mb-3">
                        {bill.summary}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-4">
                      <a
                        href={buildCongressGovUrl(bill.billNumber, congress)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs font-bold text-red hover:underline"
                      >
                        VIEW ON CONGRESS.GOV
                      </a>
                      <Link
                        href={`/draft?context=${encodeURIComponent(`Bill: ${bill.billNumber} - ${bill.title}`)}`}
                        className="font-mono text-xs font-bold text-black hover:text-red transition-colors"
                      >
                        USE IN LETTER
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="border-3 border-border p-8 bg-surface text-center">
            <p className="font-headline text-2xl mb-2">No Bills Found</p>
            <p className="font-body text-gray-mid mb-4">
              Try a different search term, check the bill number format, or switch the Congress session.
            </p>
            <p className="font-mono text-xs text-gray-mid">
              Tip: Use formats like &quot;HR 1234&quot; or &quot;S 500&quot; for direct bill lookup.
            </p>
          </div>
        )
      ) : (
        /* Suggested searches (before any search) */
        <div className="mb-12">
          <h2 className="font-headline text-2xl mb-4">Popular Topics</h2>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_SEARCHES.map((topic) => (
              <button
                key={topic}
                onClick={() => handleSuggestedSearch(topic)}
                className="px-4 py-2 border-2 border-border font-mono text-sm font-bold hover:bg-black hover:text-white hover:border-black transition-colors capitalize"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* How a Bill Becomes Law */}
      <div className="mt-16 border-t-3 border-border pt-8">
        <h2 className="font-headline text-3xl mb-6">How a Bill Becomes Law</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((step) => (
            <div key={step.number} className="border-3 border-border p-5 bg-surface">
              <div className="font-headline text-4xl text-red mb-2">{step.number}</div>
              <h3 className="font-headline text-lg mb-2">{step.title}</h3>
              <p className="font-body text-sm text-gray-mid">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
