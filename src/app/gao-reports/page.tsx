"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { GAOReport } from "@/data/types";

const CATEGORIES = [
  "Defense",
  "Healthcare",
  "Cybersecurity",
  "Education",
  "Environment",
  "Financial",
  "Technology",
  "Transportation",
  "Veterans",
  "Homeland Security",
  "Energy",
  "Housing",
];

export default function GAOReportsPage() {
  const [reports, setReports] = useState<GAOReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    fetch(`/api/gao-reports?${params}`)
      .then((r) => r.json())
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [keyword]);

  // When a category is active, the keyword search already filters server-side.
  // Also do a client-side category match for any extra precision.
  const filteredReports = activeCategory
    ? reports.filter((r) => r.category === activeCategory || r.title.toLowerCase().includes(activeCategory.toLowerCase()))
    : reports;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="font-headline text-5xl md:text-6xl mb-2">
        Government Oversight
      </h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        GAO AUDIT REPORTS, INVESTIGATIONS, AND PROGRAM EVALUATIONS
      </p>

      {/* What is the GAO? */}
      <section className="border-3 border-border bg-surface p-6 md:p-8 mb-8">
        <h2 className="font-headline text-3xl mb-4">What is the GAO?</h2>
        <p className="font-body text-base leading-relaxed text-gray-dark mb-4">
          The <strong>Government Accountability Office (GAO)</strong> is Congress&apos;s
          nonpartisan watchdog. It audits federal spending, evaluates government programs,
          and investigates allegations of fraud, waste, and abuse. GAO reports are the
          gold standard for understanding how taxpayer money is actually being spent —
          and where it&apos;s being wasted.
        </p>
        <p className="font-body text-base leading-relaxed text-gray-dark">
          Every year the GAO identifies <strong>tens of billions of dollars</strong> in
          potential savings. Their reports are used by congressional committees, journalists,
          and advocacy organizations to hold federal agencies accountable.
        </p>
      </section>

      {/* Why This Matters */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="border-3 border-border p-5 bg-surface">
          <div className="w-10 h-10 bg-red flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-headline text-xl normal-case mb-2">Follow Your Tax Dollars</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed">
            GAO tracks how federal agencies spend your money. Find out which programs
            are delivering results and which are wasting billions.
          </p>
        </div>
        <div className="border-3 border-border p-5 bg-surface">
          <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="font-headline text-xl normal-case mb-2">Hold Agencies Accountable</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed">
            These reports reveal when federal programs fail, when agencies ignore
            the law, and when oversight is needed most.
          </p>
        </div>
        <div className="border-3 border-border p-5 bg-surface">
          <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="font-headline text-xl normal-case mb-2">Fuel Your Advocacy</h3>
          <p className="font-body text-sm text-gray-mid leading-relaxed">
            Reference specific GAO findings when writing to Congress. Nothing
            strengthens a letter like citing the government&apos;s own auditors.
          </p>
        </div>
      </section>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setActiveCategory(null);
          setKeyword(searchInput);
        }}
        role="search"
        aria-label="Search GAO reports"
        className="flex gap-2 mb-4"
      >
        <label htmlFor="gao-search" className="sr-only">Search reports</label>
        <input
          id="gao-search"
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search reports (e.g., defense spending, cybersecurity, Medicare fraud)..."
          className="flex-1 px-4 py-3 border-3 border-border font-mono text-base focus:outline-none focus:border-red bg-cream"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-black text-white font-headline uppercase text-base border-3 border-black hover:bg-red hover:border-red transition-colors"
        >
          Search
        </button>
      </form>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => {
            setActiveCategory(null);
            setKeyword("");
            setSearchInput("");
          }}
          className={`px-3 py-1.5 font-mono text-xs font-bold border-2 transition-colors cursor-pointer ${
            !activeCategory
              ? "bg-black text-white border-black"
              : "bg-surface text-gray-mid border-border hover:border-black hover:text-black"
          }`}
        >
          ALL
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              if (activeCategory === cat) {
                setActiveCategory(null);
                setKeyword("");
                setSearchInput("");
              } else {
                setActiveCategory(cat);
                setSearchInput(cat.toLowerCase());
                setKeyword(cat.toLowerCase());
              }
            }}
            className={`px-3 py-1.5 font-mono text-xs font-bold border-2 transition-colors cursor-pointer ${
              activeCategory === cat
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
              <div className="h-4 bg-border-light w-32 mb-3" />
              <div className="h-6 bg-border-light w-3/4 mb-2" />
              <div className="h-4 bg-border-light w-full mb-2" />
              <div className="h-4 bg-border-light w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="border-3 border-border p-8 bg-surface text-center">
          <p className="font-headline text-2xl mb-2">No Reports Found</p>
          <p className="font-body text-base text-gray-mid">
            {activeCategory
              ? `No reports categorized under "${activeCategory}". Try searching by keyword instead.`
              : keyword
                ? `No reports matching "${keyword}". Try a different search term.`
                : "No reports available. This may be a temporary API issue."}
          </p>
        </div>
      ) : (
        <>
          <p className="font-mono text-xs text-gray-mid mb-4 font-bold">
            {filteredReports.length} REPORT{filteredReports.length !== 1 ? "S" : ""} FOUND
            {activeCategory ? ` IN ${activeCategory.toUpperCase()}` : ""}
            {keyword ? ` FOR "${keyword.toUpperCase()}"` : ""}
          </p>
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <div key={report.packageId} className="border-3 border-border bg-surface hover:border-red transition-colors">
                {/* Category accent bar */}
                {report.category && (
                  <div className="h-1 bg-red w-full" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 font-mono text-xs font-bold bg-black text-white">
                      GAO
                    </span>
                    <span className="font-mono text-xs text-gray-mid font-bold">
                      {report.reportNumber}
                    </span>
                    <span className="font-mono text-xs text-gray-mid">
                      {report.dateIssued ? new Date(report.dateIssued).toLocaleDateString() : ""}
                    </span>
                    {report.category && (
                      <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-cream-dark border border-border text-gray-mid uppercase">
                        {report.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline text-xl mb-2">
                    <a
                      href={report.govInfoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black hover:text-red transition-colors"
                    >
                      {report.title}
                    </a>
                  </h3>
                  {report.summary && report.summary !== report.title && (
                    <p className="font-body text-sm text-gray-mid line-clamp-2 mb-3">
                      {report.summary}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 font-mono text-xs">
                    {report.pdfUrl && (
                      <a
                        href={report.pdfUrl}
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
                      href={report.govInfoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-border text-gray-dark font-bold hover:border-black hover:text-black transition-colors"
                    >
                      VIEW ON GOVINFO
                    </a>
                    <Link
                      href={`/draft?context=${encodeURIComponent(`GAO Report ${report.reportNumber}: ${report.title}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-border text-gray-dark font-bold hover:border-red hover:text-red transition-colors no-underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      USE IN LETTER
                    </Link>
                    <a
                      href={`https://www.thefoiaforge.org/new-request?context=${encodeURIComponent(`Related to GAO Report ${report.reportNumber}: ${report.title}`)}`}
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
            ))}
          </div>
        </>
      )}

      {/* How to Use These Reports */}
      <section className="mt-12 border-3 border-border bg-surface p-6 md:p-8">
        <h2 className="font-headline text-3xl mb-6">How to Use GAO Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="border-2 border-border p-5 bg-cream-dark">
            <div className="w-10 h-10 bg-red flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-2">
              Reference in a Letter
            </h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
              Citing a GAO report in your letter to Congress shows you&apos;ve done your
              homework. Use the &ldquo;Use in Letter&rdquo; button to pre-fill your draft
              with the report details.
            </p>
            <Link
              href="/draft"
              className="font-mono text-xs font-bold text-red hover:underline no-underline"
            >
              GO TO LETTER DRAFTING &rarr;
            </Link>
          </div>
          <div className="border-2 border-border p-5 bg-cream-dark">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-2">
              Share With Local Media
            </h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
              Local journalists love GAO reports — they&apos;re authoritative, nonpartisan,
              and full of specific findings. Send relevant reports to your local paper&apos;s
              news desk with a note about the local impact.
            </p>
            <a
              href="https://www.usnpl.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs font-bold text-red hover:underline no-underline"
            >
              FIND LOCAL NEWS OUTLETS &rarr;
            </a>
          </div>
          <div className="border-2 border-border p-5 bg-cream-dark">
            <div className="w-10 h-10 bg-black flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-headline text-xl normal-case mb-2">
              File a FOIA Request
            </h3>
            <p className="font-body text-sm text-gray-mid leading-relaxed mb-3">
              GAO reports often reference underlying documents that aren&apos;t public.
              Use FOIA to request the raw data, internal memos, or agency responses
              that informed the audit.
            </p>
            <a
              href="https://www.thefoiaforge.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs font-bold text-red hover:underline no-underline"
            >
              VISIT FOIAFORGE &rarr;
            </a>
          </div>
        </div>
      </section>

      {/* Quick explainer */}
      <section className="mt-8 border-3 border-border bg-cream-dark p-6">
        <h3 className="font-mono text-xs font-bold text-gray-mid uppercase tracking-widest mb-3">
          UNDERSTANDING GAO REPORT TYPES
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-body text-sm">
          <div>
            <span className="font-bold text-black">Audit Reports</span>
            <p className="text-gray-mid mt-1">Financial audits of federal agencies — did they spend money legally and effectively?</p>
          </div>
          <div>
            <span className="font-bold text-black">Program Evaluations</span>
            <p className="text-gray-mid mt-1">Deep dives into whether government programs are achieving their goals.</p>
          </div>
          <div>
            <span className="font-bold text-black">Investigations</span>
            <p className="text-gray-mid mt-1">Fraud, waste, and abuse investigations often requested by congressional committees.</p>
          </div>
          <div>
            <span className="font-bold text-black">Testimonies</span>
            <p className="text-gray-mid mt-1">When GAO officials testify before Congress about their findings and recommendations.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
