"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { Committee } from "@/data/types";

// Top committees that control the most power — always featured at top
const POWER_COMMITTEES: Record<string, { why: string; icon: string }> = {
  "Appropriations Committee": { why: "Controls all federal spending — the most powerful committee in Congress.", icon: "💰" },
  "Ways and Means Committee": { why: "Writes the tax code. Every dollar the government collects flows through here.", icon: "📊" },
  "Armed Services Committee": { why: "Oversees the Pentagon and $800B+ defense budget.", icon: "🛡️" },
  "Judiciary Committee": { why: "Confirms federal judges, shapes immigration law, and oversees DOJ.", icon: "⚖️" },
  "Finance Committee": { why: "Senate's tax-writing committee. Also oversees Medicare, Medicaid, Social Security.", icon: "🏦" },
  "Intelligence Committee": { why: "Oversees CIA, NSA, and all intelligence operations. Classified briefings.", icon: "🔒" },
  "Select Committee on Intelligence": { why: "Senate intelligence oversight — classified briefings, spy agencies, national security.", icon: "🔒" },
  "Foreign Relations Committee": { why: "Shapes foreign policy, confirms ambassadors, ratifies treaties.", icon: "🌍" },
  "Foreign Affairs Committee": { why: "House counterpart — oversees State Department and foreign aid.", icon: "🌍" },
  "Energy and Commerce Committee": { why: "Broadest jurisdiction in the House — health, energy, internet, consumer protection.", icon: "⚡" },
  "Budget Committee": { why: "Sets the overall spending framework Congress works within.", icon: "📋" },
  "Rules Committee": { why: "Controls what bills reach the House floor and under what terms. The Speaker's committee.", icon: "📜" },
};

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [chamberFilter, setChamberFilter] = useState<"all" | "Senate" | "House" | "Joint">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "members" | "subcommittees">("name");

  useEffect(() => {
    fetch("/api/committees")
      .then((r) => r.json())
      .then(setCommittees)
      .catch(() => setCommittees([]))
      .finally(() => setLoading(false));
  }, []);

  // Identify power committees from loaded data
  const powerCommittees = useMemo(() => {
    return committees.filter(c => {
      return Object.keys(POWER_COMMITTEES).some(name =>
        c.name.includes(name) || name.includes(c.name)
      );
    }).slice(0, 6);
  }, [committees]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = committees;

    // Chamber filter
    if (chamberFilter !== "all") {
      result = result.filter(c => c.chamber === chamberFilter);
    }

    // Search
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.systemCode.toLowerCase().includes(q) ||
        c.members.some(m => m.name.toLowerCase().includes(q)) ||
        (c.jurisdiction && c.jurisdiction.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === "members") {
      result = [...result].sort((a, b) => b.members.length - a.members.length);
    } else if (sortBy === "subcommittees") {
      result = [...result].sort((a, b) => b.subcommittees.length - a.subcommittees.length);
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [committees, chamberFilter, searchQuery, sortBy]);

  const grouped = {
    Senate: filtered.filter((c) => c.chamber === "Senate"),
    House: filtered.filter((c) => c.chamber === "House"),
    Joint: filtered.filter((c) => c.chamber === "Joint"),
  };

  const chamberColor: Record<string, string> = {
    Senate: "bg-[#1a3a6b]",
    House: "bg-red",
    Joint: "bg-black",
  };

  function getPowerInfo(name: string) {
    for (const [key, val] of Object.entries(POWER_COMMITTEES)) {
      if (name.includes(key) || key.includes(name)) return val;
    }
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">
        Congressional Committees
      </h1>
      <p className="font-mono text-sm text-black/40 mb-8 font-bold uppercase tracking-wider">
        The working groups that shape every piece of legislation
      </p>

      {/* Explainer */}
      <section className="border-3 border-black bg-white p-6 md:p-8 mb-8">
        <h2 className="font-headline text-3xl mb-4">Why Committees Matter</h2>
        <p className="font-body text-base leading-relaxed text-black/70 mb-3">
          Most of Congress&apos;s real work happens in committees — not on the floor.
          Committees hold hearings, mark up bills, approve spending, and conduct oversight
          of federal agencies. A bill&apos;s fate is usually decided in committee long
          before it reaches a floor vote.
        </p>
        <p className="font-body text-base leading-relaxed text-black/70">
          Committee chairs control what gets heard and what gets buried. Knowing which
          committees your representatives sit on tells you where they have real power —
          and what industries are lobbying them the hardest.
        </p>
      </section>

      {/* ─── POWER COMMITTEES ─── */}
      {!loading && powerCommittees.length > 0 && !searchQuery && chamberFilter === "all" && (
        <section className="mb-10">
          <div className="bg-black text-white px-5 py-4 flex items-center gap-3 mb-0">
            <span className="text-2xl" aria-hidden="true">🏛️</span>
            <h2 className="font-headline text-xl uppercase tracking-wide m-0">Power Committees</h2>
            <span className="font-mono text-xs text-white/40 ml-auto">THE MOST INFLUENTIAL IN CONGRESS</span>
          </div>
          <div className="border-3 border-t-0 border-black p-6 bg-cream">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {powerCommittees.map((c) => {
                const info = getPowerInfo(c.name);
                return (
                  <Link
                    key={c.systemCode}
                    href={`/committees/${c.slug}`}
                    className="no-underline group border-3 border-black bg-white hover:border-red transition-all"
                  >
                    <div className="h-2 bg-red" />
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl shrink-0">{info?.icon || "🏛️"}</span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 font-mono text-[10px] font-bold text-white ${chamberColor[c.chamber]}`}>
                              {c.chamber.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-headline text-lg normal-case group-hover:text-red transition-colors leading-tight">
                            {c.name}
                          </h3>
                        </div>
                      </div>
                      {info && (
                        <p className="font-body text-xs text-black/50 leading-relaxed mb-3">
                          {info.why}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-black/10">
                        <div className="flex items-center gap-3 font-mono text-xs text-black/40">
                          <span className="font-bold">{c.members.length} MEMBERS</span>
                          {c.subcommittees.length > 0 && (
                            <span>{c.subcommittees.length} SUB</span>
                          )}
                        </div>
                        <span className="font-headline text-sm text-black/30 group-hover:text-red group-hover:translate-x-1 transition-all">
                          VIEW &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── FILTERS ─── */}
      <div className="border-3 border-black bg-white p-5 mb-8">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Chamber filter */}
          <div className="flex border-2 border-black/20 divide-x-2 divide-black/20">
            {(["all", "Senate", "House", "Joint"] as const).map((ch) => (
              <button
                key={ch}
                onClick={() => setChamberFilter(ch)}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase transition-colors cursor-pointer ${
                  chamberFilter === ch
                    ? ch === "Senate" ? "bg-[#1a3a6b] text-white" : ch === "House" ? "bg-red text-white" : "bg-black text-white"
                    : "bg-white text-black/50 hover:bg-black/5"
                }`}
              >
                {ch === "all" ? "All" : ch}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-black/30 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-3 py-2 font-mono text-xs font-bold uppercase border-2 border-black/20 bg-white cursor-pointer"
            >
              <option value="name">Name A-Z</option>
              <option value="members">Most Members</option>
              <option value="subcommittees">Most Subcommittees</option>
            </select>
          </div>

          {/* Count */}
          <span className="font-mono text-xs text-black/30 ml-auto">
            {filtered.length} committee{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search committees by name, code, member, or jurisdiction..."
          className="w-full px-4 py-3 border-3 border-black font-mono text-sm placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-red"
        />
      </div>

      {/* ─── COMMITTEE GRID ─── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border-3 border-black/20 p-5 bg-white motion-safe:animate-pulse">
              <div className="h-4 bg-black/10 w-20 mb-3" />
              <div className="h-6 bg-black/10 w-3/4 mb-2" />
              <div className="h-4 bg-black/10 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-3 border-black/10 bg-cream px-6 py-12 text-center">
          <div className="font-headline text-2xl mb-2">No Committees Found</div>
          <p className="font-body text-black/50">
            {searchQuery ? `No results for "${searchQuery}". Try a different search term.` : "No committees match your current filters."}
          </p>
        </div>
      ) : (
        <>
          {(["Senate", "House", "Joint"] as const).map((chamber) => {
            const items = grouped[chamber];
            if (items.length === 0) return null;
            return (
              <div key={chamber} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 font-mono text-xs font-bold text-white ${chamberColor[chamber]}`}>
                    {chamber.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-black/40 font-bold">
                    {items.length} COMMITTEE{items.length !== 1 ? "S" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((c) => {
                    const isPower = !!getPowerInfo(c.name);
                    return (
                      <Link
                        key={c.systemCode}
                        href={`/committees/${c.slug}`}
                        className="no-underline group border-3 border-black/80 bg-white hover:border-red transition-all"
                      >
                        <div className={`h-1.5 ${isPower ? "bg-red" : "bg-black"} group-hover:bg-red transition-colors`} />
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 font-mono text-[10px] font-bold text-white ${chamberColor[c.chamber]}`}>
                              {c.chamber.toUpperCase()}
                            </span>
                            <span className="font-mono text-[10px] text-black/30 font-bold uppercase">
                              {c.systemCode}
                            </span>
                            {isPower && (
                              <span className="px-2 py-0.5 font-mono text-[10px] font-bold bg-red/10 text-red">
                                POWER
                              </span>
                            )}
                          </div>
                          <h3 className="font-headline text-xl normal-case group-hover:text-red transition-colors mb-2">
                            {c.name}
                          </h3>
                          <div className="flex items-center gap-4 font-mono text-xs text-black/40">
                            <span className="font-bold">{c.members.length} MEMBERS</span>
                            {c.subcommittees.length > 0 && (
                              <span>{c.subcommittees.length} SUBCOMMITTEES</span>
                            )}
                          </div>
                          {c.chair && (
                            <div className="mt-2 font-mono text-xs text-black/40">
                              Chair: <span className="font-bold text-black/60">{c.chair}</span>
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
                            <div className="flex gap-1 flex-wrap">
                              {c.members.slice(0, 6).map((m) => (
                                <span
                                  key={m.bioguideId}
                                  className={`w-6 h-6 flex items-center justify-center text-white text-[10px] font-mono font-bold ${
                                    m.party === "D" ? "bg-[#1a3a6b]" : m.party === "R" ? "bg-red" : "bg-black/40"
                                  }`}
                                  title={`${m.name} (${m.party})`}
                                >
                                  {m.name.charAt(0)}
                                </span>
                              ))}
                              {c.members.length > 6 && (
                                <span className="w-6 h-6 flex items-center justify-center bg-black/5 text-[10px] font-mono font-bold text-black/40 border border-black/10">
                                  +{c.members.length - 6}
                                </span>
                              )}
                            </div>
                            <span className="font-headline text-sm text-black/30 group-hover:text-red group-hover:translate-x-1 transition-all">
                              VIEW &rarr;
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
