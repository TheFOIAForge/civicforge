"use client";

import { useState, useEffect } from "react";
import type { FederalRegisterDocument } from "@/data/types";

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FederalRegisterPage() {
  const [docs, setDocs] = useState<FederalRegisterDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [mode, setMode] = useState<"comments" | "rules">("comments");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ mode });
    if (keyword) params.set("keyword", keyword);
    fetch(`/api/federal-register?${params}`)
      .then((r) => r.json())
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [keyword, mode]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Federal Register</h1>
      <p className="font-mono text-sm text-gray-mid mb-6 font-bold">
        PROPOSED RULES, OPEN COMMENT PERIODS, AND FINAL RULES FROM FEDERAL AGENCIES.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("comments")}
          className={`px-4 py-2 font-mono text-sm font-bold border-2 border-border transition-colors ${
            mode === "comments" ? "bg-red text-white border-red" : "hover:bg-black hover:text-white"
          }`}
        >
          Open Comment Periods
        </button>
        <button
          onClick={() => setMode("rules")}
          className={`px-4 py-2 font-mono text-sm font-bold border-2 border-border transition-colors ${
            mode === "rules" ? "bg-red text-white border-red" : "hover:bg-black hover:text-white"
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
        className="flex gap-2 mb-8"
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by keyword (e.g., healthcare, emissions, banking)..."
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
          Loading Federal Register documents...
        </div>
      ) : docs.length === 0 ? (
        <div className="border-3 border-border p-8 bg-surface text-center">
          <p className="font-body text-lg text-gray-mid">
            {mode === "comments"
              ? "No open comment periods found."
              : "No recent rules found."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map((doc) => {
            const days = daysUntil(doc.commentEndDate);
            return (
              <div key={doc.documentNumber} className="border-3 border-border p-5 bg-surface">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
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
                        <span key={agency} className="font-mono text-xs text-gray-mid">
                          {agency}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-headline text-xl mb-2">
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
                      <p className="font-body text-sm text-gray-mid line-clamp-3">
                        {doc.abstract}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 font-mono text-xs text-gray-mid">
                      <span>Published: {doc.publicationDate}</span>
                      {doc.pdfUrl && (
                        <a
                          href={doc.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red font-bold hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                  {days !== null && (
                    <div
                      className={`shrink-0 text-center p-3 border-2 min-w-[80px] ${
                        days <= 7
                          ? "border-status-red bg-status-red-light"
                          : days <= 14
                          ? "border-yellow bg-yellow-light"
                          : "border-border"
                      }`}
                    >
                      <div
                        className={`font-headline text-2xl ${
                          days <= 7 ? "text-status-red" : "text-black"
                        }`}
                      >
                        {days}
                      </div>
                      <div className="font-mono text-xs text-gray-mid font-bold">
                        DAYS LEFT
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
