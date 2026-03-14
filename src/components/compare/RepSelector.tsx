"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Representative } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";

const PARTY_COLORS: Record<string, string> = {
  R: "bg-red text-white",
  D: "bg-[#1a3a6b] text-white",
  I: "bg-[#6b5b3e] text-white",
};

const PARTY_LABELS: Record<string, string> = { R: "R", D: "D", I: "I" };

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

interface RepSelectorProps {
  slot: "A" | "B";
  members: Representative[];
  selected: Representative | null;
  otherSelected: Representative | null;
  onSelect: (rep: Representative) => void;
  onClear: () => void;
}

export default function RepSelector({ slot, members, selected, otherSelected, onSelect, onClear }: RepSelectorProps) {
  const { myReps } = useMyReps();
  const [query, setQuery] = useState("");
  const [chamber, setChamber] = useState<"All" | "Senate" | "House">("All");
  const [party, setParty] = useState<"All" | "D" | "R" | "I">("All");
  const [stateFilter, setStateFilter] = useState<string>("All");
  const [showResults, setShowResults] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close results on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = members.filter(m => {
    if (otherSelected && m.id === otherSelected.id) return false;
    if (chamber !== "All" && m.chamber !== chamber) return false;
    if (party !== "All" && m.party !== party) return false;
    if (stateFilter !== "All" && m.stateAbbr !== stateFilter) return false;
    if (query.length >= 2) {
      const q = query.toLowerCase();
      return m.fullName.toLowerCase().includes(q) || m.state.toLowerCase().includes(q) || m.stateAbbr.toLowerCase() === q;
    }
    return query.length >= 2 || (chamber !== "All" || party !== "All" || stateFilter !== "All");
  }).slice(0, 15);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIdx >= 0 && filtered[highlightIdx]) {
      e.preventDefault();
      onSelect(filtered[highlightIdx]);
      setShowResults(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  }, [filtered, highlightIdx, onSelect]);

  // If a rep is selected, show their card
  if (selected) {
    return (
      <div className="border-3 border-black p-5 bg-white relative">
        <button
          onClick={onClear}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black text-white font-sans font-bold text-sm hover:bg-red transition-colors cursor-pointer"
          aria-label="Remove selection"
        >
          ✕
        </button>
        <div className="font-mono text-xs text-black/40 uppercase tracking-widest mb-2">
          Representative {slot}
        </div>
        <div className="flex items-center gap-4">
          {selected.photoUrl ? (
            <img
              src={selected.photoUrl}
              alt=""
              className="w-16 h-16 object-cover border-2 border-black"
            />
          ) : (
            <div className={`w-16 h-16 flex items-center justify-center border-2 border-black font-sans font-bold text-2xl text-white ${selected.party === "R" ? "bg-red" : selected.party === "D" ? "bg-[#1a3a6b]" : "bg-[#6b5b3e]"}`}>
              {selected.firstName[0]}{selected.lastName[0]}
            </div>
          )}
          <div>
            <div className="font-sans font-bold text-xl uppercase">{selected.fullName}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 font-mono text-xs font-bold ${PARTY_COLORS[selected.party]}`}>
                {PARTY_LABELS[selected.party]}
              </span>
              <span className="font-mono text-sm text-black/60">
                {selected.stateAbbr} · {selected.chamber}
              </span>
            </div>
            <div className="font-mono text-xs text-black/40 mt-1">
              {selected.title} · Party loyalty: {selected.partyLoyalty}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Selection UI
  return (
    <div ref={containerRef} className="border-3 border-black p-5 bg-white">
      <div className="font-mono text-xs text-black/40 uppercase tracking-widest mb-3">
        Select Representative {slot}
      </div>

      {/* My Reps quick-picks */}
      {myReps.length > 0 && (
        <div className="mb-4">
          <div className="font-mono text-[11px] text-black/30 uppercase tracking-wider mb-2">Your Saved Reps</div>
          <div className="flex flex-wrap gap-2">
            {myReps.filter(r => !otherSelected || r.id !== otherSelected.id).map(rep => (
              <button
                key={rep.id}
                onClick={() => onSelect(rep)}
                className="flex items-center gap-2 px-3 py-2 border-2 border-black/20 hover:border-black hover:bg-cream transition-colors cursor-pointer"
              >
                <span className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] font-bold ${PARTY_COLORS[rep.party]}`}>
                  {PARTY_LABELS[rep.party]}
                </span>
                <span className="font-mono text-sm font-bold">{rep.lastName}</span>
                <span className="font-mono text-xs text-black/40">{rep.stateAbbr}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex border-2 border-black/20 divide-x-2 divide-black/20">
          {(["All", "Senate", "House"] as const).map(c => (
            <button
              key={c}
              onClick={() => { setChamber(c); setShowResults(true); setHighlightIdx(-1); }}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase cursor-pointer transition-colors ${
                chamber === c ? "bg-black text-white" : "bg-white text-black/50 hover:bg-black/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex border-2 border-black/20 divide-x-2 divide-black/20">
          {(["All", "D", "R", "I"] as const).map(p => (
            <button
              key={p}
              onClick={() => { setParty(p); setShowResults(true); setHighlightIdx(-1); }}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase cursor-pointer transition-colors ${
                party === p
                  ? p === "D" ? "bg-[#1a3a6b] text-white" : p === "R" ? "bg-red text-white" : p === "I" ? "bg-[#6b5b3e] text-white" : "bg-black text-white"
                  : "bg-white text-black/50 hover:bg-black/5"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <select
          value={stateFilter}
          onChange={e => { setStateFilter(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
          className="px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-black/20 bg-white cursor-pointer"
        >
          <option value="All">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowResults(true); setHighlightIdx(-1); }}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name, state..."
          className="w-full px-4 py-3 border-3 border-black font-mono text-base placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-red"
        />

        {/* Results dropdown */}
        {showResults && filtered.length > 0 && (
          <div className="absolute z-40 left-0 right-0 top-full mt-1 border-3 border-black bg-white max-h-80 overflow-y-auto shadow-lg">
            {filtered.map((rep, idx) => (
              <button
                key={rep.id}
                onClick={() => {
                  onSelect(rep);
                  setShowResults(false);
                  setQuery("");
                }}
                onMouseEnter={() => setHighlightIdx(idx)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors border-b border-black/10 last:border-b-0 ${
                  idx === highlightIdx ? "bg-cream" : "hover:bg-black/5"
                }`}
              >
                <span className={`w-7 h-7 flex items-center justify-center font-mono text-xs font-bold shrink-0 ${PARTY_COLORS[rep.party]}`}>
                  {PARTY_LABELS[rep.party]}
                </span>
                <span className="font-mono text-sm font-bold flex-1">{rep.fullName}</span>
                <span className="font-mono text-xs text-black/40">{rep.stateAbbr} · {rep.chamber}</span>
              </button>
            ))}
          </div>
        )}

        {showResults && query.length >= 2 && filtered.length === 0 && (
          <div className="absolute z-40 left-0 right-0 top-full mt-1 border-3 border-black bg-white p-4">
            <p className="font-mono text-sm text-black/40 text-center">No representatives found matching your search.</p>
          </div>
        )}
      </div>

      {myReps.length === 0 && (
        <p className="font-mono text-xs text-black/30 mt-3">
          Tip: <Link href="/my-reps" className="text-red hover:underline">Save your representatives</Link> for quick selection.
        </p>
      )}
    </div>
  );
}
