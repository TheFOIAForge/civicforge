"use client";

import { useState, useEffect } from "react";
import type { GAOReport } from "@/data/types";

export default function GAOReportsPage() {
  const [reports, setReports] = useState<GAOReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Oversight</h1>
      <p className="font-mono text-sm text-gray-mid mb-6 font-bold">
        GAO AUDIT REPORTS, INVESTIGATIONS, AND PROGRAM EVALUATIONS.
      </p>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(searchInput);
        }}
        className="flex gap-2 mb-8"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search reports (e.g., defense spending, cybersecurity, Medicare)..."
          className="flex-1 px-4 py-3 border-2 border-border font-mono text-base focus:outline-none focus:border-red bg-cream"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-black text-white font-headline uppercase text-base border-2 border-black hover:bg-red hover:border-red transition-colors"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="font-mono text-sm text-gray-mid animate-pulse">
          Loading GAO reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="border-3 border-border p-8 bg-surface text-center">
          <p className="font-body text-lg text-gray-mid">No GAO reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.packageId} className="border-3 border-border p-5 bg-surface">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 font-mono text-xs font-bold bg-black text-white">
                  GAO
                </span>
                <span className="font-mono text-xs text-gray-mid">
                  {report.dateIssued ? new Date(report.dateIssued).toLocaleDateString() : ""}
                </span>
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
                <p className="font-body text-sm text-gray-mid line-clamp-2 mb-2">
                  {report.summary}
                </p>
              )}
              <div className="flex gap-3 font-mono text-xs">
                {report.pdfUrl && (
                  <a
                    href={report.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red font-bold hover:underline"
                  >
                    Download PDF
                  </a>
                )}
                <a
                  href={report.govInfoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red font-bold hover:underline"
                >
                  View on GovInfo
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
