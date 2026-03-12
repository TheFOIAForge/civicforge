"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useMemo } from "react";
import type { Representative } from "@/data/types";

// ── Helpers ──

function partyLabel(p: string) {
  if (p === "D") return "Democrat";
  if (p === "R") return "Republican";
  return "Independent";
}

function partyBadge(p: string) {
  if (p === "D") return "bg-dem text-white";
  if (p === "R") return "bg-rep text-white";
  return "bg-ind text-white";
}

function pct(n: number) {
  return `${Math.round(n)}%`;
}

function dollars(s: string) {
  return s.startsWith("$") ? s : `$${s}`;
}

function initials(r: Representative) {
  return `${r.firstName[0]}${r.lastName[0]}`;
}

// ── Searchable Dropdown ──

function MemberDropdown({
  label,
  members,
  selected,
  onSelect,
}: {
  label: string;
  members: Representative[];
  selected: Representative | null;
  onSelect: (r: Representative | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return members;
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.stateAbbr.toLowerCase().includes(q) ||
        m.state.toLowerCase().includes(q)
    );
  }, [members, query]);

  return (
    <div ref={ref} className="flex-1 min-w-0">
      <div className="font-mono text-xs font-bold text-gray-mid mb-2 tracking-wider">
        {label}
      </div>
      <div className="relative">
        <input
          type="text"
          value={selected ? selected.fullName : query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelect(null);
            setOpen(true);
          }}
          onFocus={() => {
            if (!selected) setOpen(true);
          }}
          placeholder="Search by name or state..."
          className="w-full px-4 py-3 border-3 border-border bg-surface font-body text-base focus:outline-none focus:border-red"
        />
        {selected && (
          <button
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 font-headline text-lg text-gray-mid hover:text-red cursor-pointer"
          >
            &times;
          </button>
        )}
        {open && !selected && (
          <div className="absolute z-40 top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto border-3 border-border bg-surface shadow-lg">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 font-mono text-sm text-gray-mid">
                No members found
              </div>
            ) : (
              filtered.slice(0, 50).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onSelect(m);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-hover cursor-pointer flex items-center gap-3 border-b border-border-light last:border-b-0"
                >
                  <span
                    className={`inline-block px-2 py-0.5 font-mono text-xs font-bold ${partyBadge(m.party)}`}
                  >
                    {m.party}
                  </span>
                  <span className="font-body text-base">{m.fullName}</span>
                  <span className="font-mono text-xs text-gray-mid ml-auto">
                    {m.stateAbbr} &middot; {m.chamber}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bar component ──

function ComparisonBar({
  labelA,
  valueA,
  labelB,
  valueB,
  max,
  format = "number",
}: {
  labelA: string;
  valueA: number;
  labelB: string;
  valueB: number;
  max?: number;
  format?: "number" | "pct" | "dollars";
}) {
  const top = max ?? Math.max(valueA, valueB, 1);
  const widthA = (valueA / top) * 100;
  const widthB = (valueB / top) * 100;

  function fmt(v: number) {
    if (format === "pct") return pct(v);
    if (format === "dollars") return `$${v.toLocaleString()}`;
    return v.toLocaleString();
  }

  return (
    <div className="space-y-2">
      <div>
        <div className="flex justify-between font-mono text-xs font-bold text-gray-mid mb-1">
          <span>{labelA}</span>
          <span>{fmt(valueA)}</span>
        </div>
        <div className="h-5 bg-cream border border-border">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${Math.min(widthA, 100)}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between font-mono text-xs font-bold text-gray-mid mb-1">
          <span>{labelB}</span>
          <span>{fmt(valueB)}</span>
        </div>
        <div className="h-5 bg-cream border border-border">
          <div
            className="h-full bg-red transition-all duration-500"
            style={{ width: `${Math.min(widthB, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Section wrapper ──

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-3 border-border bg-surface">
      <div className="px-5 py-3 bg-black text-white font-mono text-sm font-bold uppercase tracking-wider">
        {title}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Loading skeleton ──

function Skeleton() {
  return (
    <div className="space-y-6 motion-safe:animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border-3 border-border bg-surface">
          <div className="px-5 py-3 bg-black/10 h-10" />
          <div className="p-5 space-y-4">
            <div className="h-6 bg-border-light w-2/3" />
            <div className="h-4 bg-border-light w-1/2" />
            <div className="h-4 bg-border-light w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──

export default function ComparePage() {
  const [members, setMembers] = useState<Representative[]>([]);
  const [repA, setRepA] = useState<Representative | null>(null);
  const [repB, setRepB] = useState<Representative | null>(null);
  const [enrichedA, setEnrichedA] = useState<Representative | null>(null);
  const [enrichedB, setEnrichedB] = useState<Representative | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);

  // Load all members on mount
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => setMembers(data))
      .catch(() => {});
  }, []);

  async function handleCompare() {
    if (!repA || !repB) return;
    setComparing(true);
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/members/${repA.id}`),
        fetch(`/api/members/${repB.id}`),
      ]);
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
      setEnrichedA(dataA);
      setEnrichedB(dataB);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  function parseDollars(s: string): number {
    return Number(s.replace(/[$,]/g, "")) || 0;
  }

  // Shared donors
  const sharedDonors = useMemo(() => {
    if (!enrichedA || !enrichedB) return new Set<string>();
    const aNames = new Set(enrichedA.topDonors.map((d) => d.name.toLowerCase()));
    return new Set(
      enrichedB.topDonors
        .filter((d) => aNames.has(d.name.toLowerCase()))
        .map((d) => d.name.toLowerCase())
    );
  }, [enrichedA, enrichedB]);

  // Shared committees
  const sharedCommittees = useMemo(() => {
    if (!enrichedA || !enrichedB) return new Set<string>();
    const aComms = new Set(enrichedA.committees.map((c) => c.toLowerCase()));
    return new Set(
      enrichedB.committees
        .filter((c) => aComms.has(c.toLowerCase()))
        .map((c) => c.toLowerCase())
    );
  }, [enrichedA, enrichedB]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <h1 className="font-headline text-5xl md:text-6xl mb-2">
        Compare Representatives
      </h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold uppercase tracking-wider">
        Side-by-side comparison of voting records, donors, and more
      </p>

      {/* Selection area */}
      <div className="border-3 border-border bg-surface p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <MemberDropdown
            label="REPRESENTATIVE A"
            members={members}
            selected={repA}
            onSelect={setRepA}
          />
          <div className="hidden md:flex items-center justify-center font-headline text-2xl text-gray-mid pb-3">
            VS
          </div>
          <MemberDropdown
            label="REPRESENTATIVE B"
            members={members}
            selected={repB}
            onSelect={setRepB}
          />
          <button
            onClick={handleCompare}
            disabled={!repA || !repB}
            className={`px-8 py-3 font-headline text-base uppercase border-3 transition-colors cursor-pointer whitespace-nowrap ${
              repA && repB
                ? "bg-red text-white border-red hover:bg-red-dark hover:border-red-dark"
                : "bg-gray-mid text-white border-gray-mid cursor-not-allowed opacity-50"
            }`}
          >
            Compare
          </button>
        </div>
      </div>

      {/* Comparison results */}
      {comparing && loading && <Skeleton />}

      {comparing && !loading && enrichedA && enrichedB && (
        <div className="space-y-6">
          {/* 1. Overview */}
          <Section title="Overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[enrichedA, enrichedB].map((rep, i) => (
                <div
                  key={rep.id}
                  className={`flex items-center gap-4 p-4 border-3 ${
                    i === 0 ? "border-black" : "border-red"
                  }`}
                >
                  {rep.photoUrl ? (
                    <img
                      src={rep.photoUrl}
                      alt={rep.fullName}
                      className="w-20 h-20 object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-black text-white flex items-center justify-center font-headline text-2xl border-2 border-border">
                      {initials(rep)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-headline text-2xl">{rep.fullName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 font-mono text-xs font-bold ${partyBadge(rep.party)}`}
                      >
                        {rep.party}
                      </span>
                      <span className="font-mono text-sm text-gray-mid">
                        {partyLabel(rep.party)}
                      </span>
                    </div>
                    <div className="font-mono text-sm text-gray-mid mt-1">
                      {rep.state} &middot; {rep.chamber}
                      {rep.district ? ` &middot; District ${rep.district}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 2. Voting Record */}
          <Section title="Voting Record">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-wider">
                  Party Loyalty
                </div>
                <ComparisonBar
                  labelA={enrichedA.lastName}
                  valueA={enrichedA.partyLoyalty}
                  labelB={enrichedB.lastName}
                  valueB={enrichedB.partyLoyalty}
                  max={100}
                  format="pct"
                />
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-wider">
                  Votes Cast
                </div>
                <ComparisonBar
                  labelA={enrichedA.lastName}
                  valueA={enrichedA.votesCast}
                  labelB={enrichedB.lastName}
                  valueB={enrichedB.votesCast}
                />
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-wider">
                  Missed Votes
                </div>
                <ComparisonBar
                  labelA={enrichedA.lastName}
                  valueA={enrichedA.missedVotes}
                  labelB={enrichedB.lastName}
                  valueB={enrichedB.missedVotes}
                />
              </div>
            </div>
          </Section>

          {/* 3. Legislative Activity */}
          <Section title="Legislative Activity">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-wider">
                  Bills Introduced
                </div>
                <ComparisonBar
                  labelA={enrichedA.lastName}
                  valueA={enrichedA.billsIntroduced}
                  labelB={enrichedB.lastName}
                  valueB={enrichedB.billsIntroduced}
                />
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-wider">
                  Bills Enacted
                </div>
                <ComparisonBar
                  labelA={enrichedA.lastName}
                  valueA={enrichedA.billsEnacted}
                  labelB={enrichedB.lastName}
                  valueB={enrichedB.billsEnacted}
                />
              </div>
            </div>
          </Section>

          {/* 4. Campaign Finance */}
          <Section title="Campaign Finance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-wider">
                  Total Fundraising
                </div>
                <ComparisonBar
                  labelA={enrichedA.lastName}
                  valueA={parseDollars(enrichedA.totalFundraising)}
                  labelB={enrichedB.lastName}
                  valueB={parseDollars(enrichedB.totalFundraising)}
                  format="dollars"
                />
              </div>
              <div>
                <div className="font-mono text-xs font-bold text-gray-mid mb-3 uppercase tracking-wider">
                  Small Dollar Donations
                </div>
                <ComparisonBar
                  labelA={enrichedA.lastName}
                  valueA={enrichedA.smallDollarPct}
                  labelB={enrichedB.lastName}
                  valueB={enrichedB.smallDollarPct}
                  max={100}
                  format="pct"
                />
              </div>
            </div>
          </Section>

          {/* 5. Top Donors */}
          <Section title="Top Donors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[enrichedA, enrichedB].map((rep) => (
                <div key={rep.id}>
                  <div className="font-headline text-lg mb-3">{rep.lastName}</div>
                  <div className="space-y-1">
                    {rep.topDonors.length === 0 ? (
                      <div className="font-mono text-sm text-gray-mid">
                        No donor data available
                      </div>
                    ) : (
                      rep.topDonors.map((d, i) => {
                        const isShared = sharedDonors.has(d.name.toLowerCase());
                        return (
                          <div
                            key={i}
                            className={`flex justify-between px-3 py-2 border font-mono text-sm ${
                              isShared
                                ? "border-red bg-red/10 text-red font-bold"
                                : "border-border-light"
                            }`}
                          >
                            <span>{d.name}</span>
                            <span>{dollars(d.amount)}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
            {sharedDonors.size > 0 && (
              <div className="mt-4 px-4 py-3 border-3 border-red bg-red/5 font-mono text-sm">
                <span className="font-bold text-red">SHARED DONORS:</span>{" "}
                {sharedDonors.size} donor{sharedDonors.size !== 1 ? "s" : ""} contribute
                to both representatives
              </div>
            )}
          </Section>

          {/* 6. Committee Overlap */}
          <Section title="Committees">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[enrichedA, enrichedB].map((rep) => (
                <div key={rep.id}>
                  <div className="font-headline text-lg mb-3">{rep.lastName}</div>
                  <div className="space-y-1">
                    {rep.committees.length === 0 ? (
                      <div className="font-mono text-sm text-gray-mid">
                        No committee data
                      </div>
                    ) : (
                      rep.committees.map((c, i) => {
                        const isShared = sharedCommittees.has(c.toLowerCase());
                        return (
                          <div
                            key={i}
                            className={`px-3 py-2 border font-mono text-sm ${
                              isShared
                                ? "border-red bg-red/10 text-red font-bold"
                                : "border-border-light"
                            }`}
                          >
                            {c}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
            {sharedCommittees.size > 0 && (
              <div className="mt-4 px-4 py-3 border-3 border-red bg-red/5 font-mono text-sm">
                <span className="font-bold text-red">SHARED COMMITTEES:</span>{" "}
                {sharedCommittees.size} committee{sharedCommittees.size !== 1 ? "s" : ""}{" "}
                in common
              </div>
            )}
          </Section>

          {/* 7. Key Issues / Voting Categories */}
          <Section title="Key Issues">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[enrichedA, enrichedB].map((rep) => (
                <div key={rep.id}>
                  <div className="font-headline text-lg mb-3">{rep.lastName}</div>
                  <div className="space-y-2">
                    {rep.votingRecord.length === 0 ? (
                      <div className="font-mono text-sm text-gray-mid">
                        No voting category data
                      </div>
                    ) : (
                      rep.votingRecord.slice(0, 8).map((cat, i) => {
                        const total = cat.yea + cat.nay;
                        const yeaPct = total > 0 ? (cat.yea / total) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between font-mono text-xs font-bold mb-1">
                              <span>{cat.category}</span>
                              <span>
                                {cat.yea}Y / {cat.nay}N
                              </span>
                            </div>
                            <div className="h-3 bg-cream border border-border flex">
                              <div
                                className="h-full bg-green"
                                style={{ width: `${yeaPct}%` }}
                              />
                              <div
                                className="h-full bg-status-red"
                                style={{ width: `${100 - yeaPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
