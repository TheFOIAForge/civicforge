"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useState, useMemo, useEffect } from "react";
import { US_STATES } from "@/data/states";
import type { Representative } from "@/data/types";
import CongressInfoGraphics from "@/components/CongressInfoGraphics";

function partyBg(party: string) {
  if (party === "D") return "bg-dem";
  if (party === "R") return "bg-rep";
  return "bg-ind";
}

function partyBorder(party: string) {
  if (party === "D") return "border-l-dem";
  if (party === "R") return "border-l-rep";
  return "border-l-ind";
}

export default function DirectoryPage() {
  const [allMembers, setAllMembers] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [chamberFilter, setChamberFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        setAllMembers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return allMembers.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.fullName.toLowerCase().includes(q) &&
          !r.state.toLowerCase().includes(q) &&
          !r.stateAbbr.toLowerCase().includes(q)
        )
          return false;
      }
      if (stateFilter && r.stateAbbr !== stateFilter) return false;
      if (chamberFilter && r.chamber !== chamberFilter) return false;
      if (partyFilter && r.party !== partyFilter) return false;
      return true;
    });
  }, [allMembers, search, stateFilter, chamberFilter, partyFilter]);

  const hasFilters = search || stateFilter || chamberFilter || partyFilter;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" style={{ backgroundColor: "#f5e6c8" }}>
      <h1 className="font-headline text-5xl md:text-6xl mb-2" style={{ color: "#1a1a1a" }}>Explore Congress</h1>
      <p className="font-mono text-sm mb-8 font-bold" style={{ color: "#5a5a5a" }}>
        SEARCH BY NAME, FILTER BY STATE, CHAMBER, OR PARTY
      </p>

      {/* Congressional Spotlight Infographics */}
      <CongressInfoGraphics />

      {/* Filters */}
      <div style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }} className="p-5 mb-8" role="search" aria-label="Filter members of Congress">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="dir-search" className="font-mono text-sm block mb-2 font-bold" style={{ color: "#5a5a5a" }}>SEARCH</label>
            <input
              id="dir-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or state..."
              className="w-full px-4 py-3 font-mono text-base focus:outline-none"
              style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee", color: "#1a1a1a" }}
            />
          </div>
          <div>
            <label htmlFor="dir-state" className="font-mono text-sm block mb-2 font-bold" style={{ color: "#5a5a5a" }}>STATE</label>
            <select
              id="dir-state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full px-4 py-3 font-mono text-base focus:outline-none"
              style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee", color: "#1a1a1a" }}
            >
              <option value="">All States</option>
              {US_STATES.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dir-chamber" className="font-mono text-sm block mb-2 font-bold" style={{ color: "#5a5a5a" }}>CHAMBER</label>
            <select
              id="dir-chamber"
              value={chamberFilter}
              onChange={(e) => setChamberFilter(e.target.value)}
              className="w-full px-4 py-3 font-mono text-base focus:outline-none"
              style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee", color: "#1a1a1a" }}
            >
              <option value="">Both Chambers</option>
              <option value="Senate">Senate</option>
              <option value="House">House</option>
            </select>
          </div>
          <div>
            <label htmlFor="dir-party" className="font-mono text-sm block mb-2 font-bold" style={{ color: "#5a5a5a" }}>PARTY</label>
            <select
              id="dir-party"
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="w-full px-4 py-3 font-mono text-base focus:outline-none"
              style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee", color: "#1a1a1a" }}
            >
              <option value="">All Parties</option>
              <option value="D">Democrat</option>
              <option value="R">Republican</option>
              <option value="I">Independent</option>
            </select>
          </div>
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStateFilter("");
              setChamberFilter("");
              setPartyFilter("");
            }}
            className="mt-4 px-5 py-2 font-mono text-sm uppercase cursor-pointer transition-colors font-bold"
            style={{ backgroundColor: "#C1272D", color: "#f5e6c8", border: "3px solid #1a1a1a" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      {loading ? (
        <p className="font-mono text-sm mb-4 font-bold motion-safe:animate-pulse" style={{ color: "#5a5a5a" }} aria-live="polite" aria-busy="true">
          LOADING MEMBERS OF CONGRESS...
        </p>
      ) : (
        <p className="font-mono text-sm mb-4 font-bold" style={{ color: "#5a5a5a" }}>
          {filtered.length} {filtered.length === 1 ? "MEMBER" : "MEMBERS"} FOUND
        </p>
      )}

      {/* Results grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((rep) => (
          <Link
            key={rep.id}
            href={`/directory/${rep.slug}`}
            className={`no-underline p-5 hover:bg-hover transition-colors group border-l-6 ${partyBorder(rep.party)}`}
            style={{ color: "#1a1a1a", border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                <span className="font-headline text-lg" style={{ color: "#f5e6c8" }}>{rep.firstName[0]}{rep.lastName[0]}</span>
                {rep.photoUrl && (
                  <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-mono font-bold ${partyBg(rep.party)}`} style={{ color: "#f5e6c8" }}>
                    {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                  </span>
                  <span className="font-mono text-xs font-bold" style={{ color: "#5a5a5a" }}>{rep.chamber}</span>
                  {rep.isLeadership && <span className="text-lg" style={{ color: "#C1272D" }} aria-label="Leadership role" title="Leadership role">&#9733;</span>}
                </div>
              </div>
            </div>
            <h3 className="font-headline text-xl normal-case group-hover:text-red" style={{ color: "#1a1a1a" }}>{rep.fullName}</h3>
            <p className="font-mono text-sm mt-1" style={{ color: "#5a5a5a" }}>
              {rep.title} — {rep.state}
              {rep.district ? `, ${rep.district} District` : ""}
            </p>
            {rep.leadershipRole && (
              <p className="font-mono text-sm font-bold mt-1" style={{ color: "#C1272D" }}>{rep.leadershipRole}</p>
            )}
            <div className="mt-3 pt-3 flex gap-4 font-mono text-xs" style={{ borderTop: "2px solid #c4a44a", color: "#5a5a5a" }}>
              {rep.partyLoyalty > 0 && <span><span className="font-bold">{rep.partyLoyalty}%</span> Party Loyalty</span>}
              {rep.billsIntroduced > 0 && <span><span className="font-bold">{rep.billsIntroduced}</span> bills</span>}
              {rep.totalFundraising && rep.totalFundraising !== "$0" && <span><span className="font-bold">{rep.totalFundraising}</span></span>}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="p-12 text-center" style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}>
          <p className="font-headline text-2xl" style={{ color: "#1a1a1a" }}>No members found</p>
          <p className="font-body text-base mt-2" style={{ color: "#5a5a5a" }}>
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}
