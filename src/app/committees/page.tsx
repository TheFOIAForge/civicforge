"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Committee } from "@/data/types";

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [chamberFilter, setChamberFilter] = useState<"all" | "Senate" | "House" | "Joint">("all");

  useEffect(() => {
    fetch("/api/committees")
      .then((r) => r.json())
      .then(setCommittees)
      .catch(() => setCommittees([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = chamberFilter === "all"
    ? committees
    : committees.filter((c) => c.chamber === chamberFilter);

  const grouped = {
    Senate: filtered.filter((c) => c.chamber === "Senate"),
    House: filtered.filter((c) => c.chamber === "House"),
    Joint: filtered.filter((c) => c.chamber === "Joint"),
  };

  const chamberColor: Record<string, string> = {
    Senate: "bg-blue-900",
    House: "bg-red",
    Joint: "bg-black",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">
        Congressional Committees
      </h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        THE WORKING GROUPS THAT SHAPE EVERY PIECE OF LEGISLATION
      </p>

      {/* Explainer */}
      <section className="border-3 border-border bg-surface p-6 md:p-8 mb-8">
        <h2 className="font-headline text-3xl mb-4">Why Committees Matter</h2>
        <p className="font-body text-base leading-relaxed text-gray-dark mb-3">
          Most of Congress&apos;s real work happens in committees — not on the floor.
          Committees hold hearings, mark up bills, approve spending, and conduct oversight
          of federal agencies. A bill&apos;s fate is usually decided in committee long
          before it reaches a floor vote.
        </p>
        <p className="font-body text-base leading-relaxed text-gray-dark">
          Committee chairs control what gets heard and what gets buried. Knowing which
          committees your representatives sit on tells you where they have real power —
          and what industries are lobbying them the hardest.
        </p>
      </section>

      {/* Chamber filters */}
      <div className="flex gap-2 mb-8">
        {(["all", "Senate", "House", "Joint"] as const).map((ch) => (
          <button
            key={ch}
            onClick={() => setChamberFilter(ch)}
            className={`px-4 py-2 font-mono text-sm font-bold border-2 transition-colors cursor-pointer ${
              chamberFilter === ch
                ? "bg-black text-white border-black"
                : "bg-surface text-gray-mid border-border hover:border-black hover:text-black"
            }`}
          >
            {ch === "all" ? "ALL COMMITTEES" : ch.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border-3 border-border p-5 bg-surface motion-safe:animate-pulse">
              <div className="h-4 bg-border-light w-20 mb-3" />
              <div className="h-6 bg-border-light w-3/4 mb-2" />
              <div className="h-4 bg-border-light w-1/2" />
            </div>
          ))}
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
                  <span className="font-mono text-xs text-gray-mid font-bold">
                    {items.length} COMMITTEE{items.length !== 1 ? "S" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((c) => (
                    <Link
                      key={c.systemCode}
                      href={`/committees/${c.slug}`}
                      className="no-underline group border-3 border-border bg-surface hover:border-red transition-all"
                    >
                      <div className="h-1.5 bg-black group-hover:bg-red transition-colors" />
                      <div className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 font-mono text-[10px] font-bold text-white ${chamberColor[c.chamber]}`}>
                            {c.chamber.toUpperCase()}
                          </span>
                          <span className="font-mono text-[10px] text-gray-mid font-bold uppercase">
                            {c.systemCode}
                          </span>
                        </div>
                        <h3 className="font-headline text-xl normal-case group-hover:text-red transition-colors mb-2">
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-4 font-mono text-xs text-gray-mid">
                          <span className="font-bold">{c.members.length} MEMBERS</span>
                          {c.subcommittees.length > 0 && (
                            <span>{c.subcommittees.length} SUBCOMMITTEES</span>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-border-light flex items-center justify-between">
                          <div className="flex gap-1 flex-wrap">
                            {c.members.slice(0, 5).map((m) => (
                              <span
                                key={m.bioguideId}
                                className={`w-6 h-6 flex items-center justify-center text-white text-[10px] font-mono font-bold ${
                                  m.party === "D" ? "bg-blue-900" : m.party === "R" ? "bg-red" : "bg-gray-mid"
                                }`}
                                title={m.name}
                              >
                                {m.name.charAt(0)}
                              </span>
                            ))}
                            {c.members.length > 5 && (
                              <span className="w-6 h-6 flex items-center justify-center bg-cream-dark text-[10px] font-mono font-bold text-gray-mid border border-border">
                                +{c.members.length - 5}
                              </span>
                            )}
                          </div>
                          <span className="font-headline text-sm text-black/40 group-hover:text-red group-hover:translate-x-1 transition-all">
                            VIEW &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
