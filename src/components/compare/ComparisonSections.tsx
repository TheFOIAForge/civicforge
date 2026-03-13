"use client";

import type { Representative } from "@/data/types";
import type { CategoryVerdict, ComparisonVerdicts } from "@/lib/compare-verdicts";

// ─── Party Colors ────────────────────────────────────────────────────────────

const PC: Record<string, string> = { R: "#C1272D", D: "#1a3a6b", I: "#6b5b3e" };
const PCBg: Record<string, string> = { R: "bg-red", D: "bg-[#1a3a6b]", I: "bg-[#6b5b3e]" };

// ─── Chart Primitives ────────────────────────────────────────────────────────

function GaugeBar({ value, max, color, label, refLine }: {
  value: number; max: number; color: string; label: string; refLine?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="relative" aria-label={label}>
      <div className="h-10 bg-black/5 relative overflow-hidden">
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        {refLine !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 border-l-2 border-dashed border-black/20"
            style={{ left: `${Math.min((refLine / max) * 100, 100)}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-xs text-black/40">{label}</span>
        <span className="font-mono text-sm font-bold">{value.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function RingChart({ value, color, size = 120, label }: {
  value: number; color: string; size?: number; label: string;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center" aria-label={`${label}: ${value.toFixed(1)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e5e5" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="butt" className="transition-all duration-700"
        />
      </svg>
      <div className="-mt-[76px] mb-[40px] font-headline text-2xl">{value.toFixed(1)}%</div>
      <div className="font-mono text-xs text-black/50 mt-1">{label}</div>
    </div>
  );
}

function ComparisonBar({ valueA, valueB, colorA, colorB, labelA, labelB, nameA, nameB, unit }: {
  valueA: number; valueB: number; colorA: string; colorB: string;
  labelA: string; labelB: string; nameA: string; nameB: string; unit?: string;
}) {
  const maxVal = Math.max(valueA, valueB, 1);
  const pctA = (valueA / maxVal) * 100;
  const pctB = (valueB / maxVal) * 100;
  return (
    <div className="space-y-2">
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-mono text-xs font-bold">{nameA}</span>
          <span className="font-mono text-sm font-bold">{labelA}{unit || ""}</span>
        </div>
        <div className="h-8 bg-black/5 overflow-hidden">
          <div className="h-full transition-all duration-700" style={{ width: `${pctA}%`, backgroundColor: colorA }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="font-mono text-xs font-bold">{nameB}</span>
          <span className="font-mono text-sm font-bold">{labelB}{unit || ""}</span>
        </div>
        <div className="h-8 bg-black/5 overflow-hidden">
          <div className="h-full transition-all duration-700" style={{ width: `${pctB}%`, backgroundColor: colorB }} />
        </div>
      </div>
    </div>
  );
}

// ─── Verdict Banner ──────────────────────────────────────────────────────────

function VerdictBanner({ verdict, repA, repB }: {
  verdict: CategoryVerdict; repA: Representative; repB: Representative;
}) {
  const winnerRep = verdict.winner === "A" ? repA : verdict.winner === "B" ? repB : null;
  const bgColor = verdict.winner === "tie" ? "bg-black/5" : `${PCBg[winnerRep?.party || "D"]}/10`;

  return (
    <div
      className={`px-5 py-4 border-l-4 mb-6 ${
        verdict.winner === "tie"
          ? "border-black/20 bg-black/5"
          : verdict.winner === "A"
            ? "bg-red/5 border-l-4"
            : "bg-[#1a3a6b]/5 border-l-4"
      }`}
      style={verdict.winner !== "tie" && winnerRep ? { borderLeftColor: PC[winnerRep.party] } : undefined}
      aria-live="polite"
    >
      <div className="flex items-center gap-3 mb-1">
        {verdict.winner === "tie" ? (
          <span className="px-3 py-1 bg-black/10 font-mono text-xs font-bold uppercase">
            {verdict.winnerName === "No Data" ? "Insufficient Data" : "Tie"}
          </span>
        ) : (
          <>
            <span
              className="px-3 py-1 font-mono text-xs font-bold uppercase text-white"
              style={{ backgroundColor: PC[winnerRep!.party] }}
            >
              {verdict.margin === "decisive" ? "Clear Winner" : verdict.margin === "moderate" ? "Winner" : "Edge"}
            </span>
            <span className="font-headline text-lg uppercase">{verdict.winnerName}</span>
          </>
        )}
      </div>
      <p className="font-body text-sm text-black/70 leading-relaxed">{verdict.summary}</p>
    </div>
  );
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function Section({ title, icon, children, id }: {
  title: string; icon: string; children: React.ReactNode; id: string;
}) {
  return (
    <section id={id} className="mb-10">
      <div className="bg-black text-white px-5 py-4 flex items-center gap-3 mb-0">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <h2 className="font-headline text-xl uppercase tracking-wide m-0">{title}</h2>
      </div>
      <div className="border-3 border-t-0 border-black p-6 bg-white">
        {children}
      </div>
    </section>
  );
}

// ─── Section 1: Party Loyalty ────────────────────────────────────────────────

function PartyLoyaltySection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  // Party averages (hardcoded realistic)
  const avgR = 91; const avgD = 93;
  const refA = a.party === "R" ? avgR : a.party === "D" ? avgD : 80;
  const refB = b.party === "R" ? avgR : b.party === "D" ? avgD : 80;

  return (
    <Section title="Party Loyalty & Independence" icon="⚖️" id="sec-loyalty">
      <VerdictBanner verdict={verdict} repA={a} repB={b} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="font-mono text-xs font-bold uppercase mb-2">{a.fullName}</div>
          <GaugeBar value={a.partyLoyalty} max={100} color={PC[a.party]} label="Votes with party" refLine={refA} />
          <div className="font-mono text-[10px] text-black/30 mt-1">Dashed line = party avg ({refA}%)</div>
        </div>
        <div>
          <div className="font-mono text-xs font-bold uppercase mb-2">{b.fullName}</div>
          <GaugeBar value={b.partyLoyalty} max={100} color={PC[b.party]} label="Votes with party" refLine={refB} />
          <div className="font-mono text-[10px] text-black/30 mt-1">Dashed line = party avg ({refB}%)</div>
        </div>
      </div>
    </Section>
  );
}

// ─── Section 2: Attendance ───────────────────────────────────────────────────

function AttendanceSection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  const attA = a.votesCast + a.missedVotes > 0 ? (a.votesCast / (a.votesCast + a.missedVotes)) * 100 : 100;
  const attB = b.votesCast + b.missedVotes > 0 ? (b.votesCast / (b.votesCast + b.missedVotes)) * 100 : 100;

  return (
    <Section title="Attendance & Work Ethic" icon="📋" id="sec-attendance">
      <VerdictBanner verdict={verdict} repA={a} repB={b} />
      <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto">
        <RingChart value={attA} color={PC[a.party]} label={a.lastName} />
        <RingChart value={attB} color={PC[b.party]} label={b.lastName} />
      </div>
      <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto mt-4">
        <div className="text-center">
          <div className="font-mono text-xs text-black/40">{a.votesCast.toLocaleString()} votes cast</div>
          <div className="font-mono text-xs text-black/40">{a.missedVotes.toLocaleString()} missed</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xs text-black/40">{b.votesCast.toLocaleString()} votes cast</div>
          <div className="font-mono text-xs text-black/40">{b.missedVotes.toLocaleString()} missed</div>
        </div>
      </div>
    </Section>
  );
}

// ─── Section 3: Legislative Productivity ─────────────────────────────────────

function LegislativeSection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  const srA = a.billsIntroduced > 0 ? ((a.billsEnacted / a.billsIntroduced) * 100) : 0;
  const srB = b.billsIntroduced > 0 ? ((b.billsEnacted / b.billsIntroduced) * 100) : 0;

  return (
    <Section title="Legislative Productivity" icon="📜" id="sec-legislative">
      <VerdictBanner verdict={verdict} repA={a} repB={b} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[{ rep: a, sr: srA }, { rep: b, sr: srB }].map(({ rep, sr }) => (
          <div key={rep.id}>
            <div className="font-mono text-xs font-bold uppercase mb-3">{rep.fullName}</div>
            <div className="flex items-end gap-4 mb-4">
              <div className="text-center">
                <div className="font-headline text-4xl">{rep.billsIntroduced}</div>
                <div className="font-mono text-[10px] text-black/40 uppercase">Introduced</div>
              </div>
              <div className="text-center">
                <div className="font-headline text-4xl text-red">{rep.billsEnacted}</div>
                <div className="font-mono text-[10px] text-black/40 uppercase">Enacted</div>
              </div>
              <div className="text-center">
                <div className="font-headline text-3xl" style={{ color: PC[rep.party] }}>{sr.toFixed(1)}%</div>
                <div className="font-mono text-[10px] text-black/40 uppercase">Success Rate</div>
              </div>
            </div>
            {/* Stacked bar */}
            <div className="h-8 bg-black/5 flex overflow-hidden">
              {rep.billsIntroduced > 0 && (
                <>
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${(rep.billsEnacted / rep.billsIntroduced) * 100}%`,
                      backgroundColor: PC[rep.party],
                    }}
                  />
                  <div
                    className="h-full bg-black/10 transition-all duration-700"
                    style={{ width: `${((rep.billsIntroduced - rep.billsEnacted) / rep.billsIntroduced) * 100}%` }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-black/30">Enacted</span>
              <span className="font-mono text-[10px] text-black/30">Not enacted</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Section 4: Follow the Money ─────────────────────────────────────────────

function parseDollars(s: string): number {
  return Number(s.replace(/[$,]/g, "")) || 0;
}

function formatMoney(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function FinanceSection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  const totalA = parseDollars(a.totalFundraising);
  const totalB = parseDollars(b.totalFundraising);

  // Generic occupation/employment categories that appear in FEC data —
  // these are NOT real "shared donors" even if both reps list them.
  const GENERIC_DONORS = new Set([
    "retired", "homemaker", "housewife", "attorney", "physician",
    "self-employed", "not employed", "student", "farmer", "teacher",
    "engineer", "consultant", "real estate", "investor", "dentist",
    "none", "n/a", "information requested", "unemployed",
    "real estate agent", "sales", "manager", "professor",
  ]);

  const donorsA = new Set(
    a.topDonors
      .map(d => d.name.toLowerCase())
      .filter(n => !GENERIC_DONORS.has(n))
  );
  const sharedDonors = b.topDonors.filter(
    d => !GENERIC_DONORS.has(d.name.toLowerCase()) && donorsA.has(d.name.toLowerCase())
  );

  return (
    <Section title="Follow the Money" icon="💰" id="sec-finance">
      <VerdictBanner verdict={verdict} repA={a} repB={b} />

      {/* Total fundraising */}
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase mb-3 text-black/50">Total Fundraising</div>
        <ComparisonBar
          valueA={totalA} valueB={totalB}
          colorA={PC[a.party]} colorB={PC[b.party]}
          labelA={formatMoney(totalA)} labelB={formatMoney(totalB)}
          nameA={a.lastName} nameB={b.lastName}
        />
      </div>

      {/* Grassroots meter */}
      <div className="mb-8">
        <div className="font-mono text-xs font-bold uppercase mb-3 text-black/50">Small-Dollar Donor %</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[a, b].map(rep => (
            <div key={rep.id}>
              <div className="font-mono text-xs font-bold mb-2">{rep.lastName}</div>
              <div className="h-10 bg-black/5 relative overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${rep.smallDollarPct}%`, backgroundColor: PC[rep.party] }}
                />
                {/* 50% threshold line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red/50" />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-xs text-black/40">{rep.smallDollarPct}% grassroots</span>
                <span className="font-mono text-[10px] text-red/50">50% threshold →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top donors side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[a, b].map(rep => (
          <div key={rep.id}>
            <div className="font-mono text-xs font-bold uppercase mb-2">{rep.lastName}&apos;s Top Donors</div>
            {rep.topDonors.slice(0, 5).map((d, i) => {
              const isShared = sharedDonors.some(s => s.name.toLowerCase() === d.name.toLowerCase());
              return (
                <div key={i} className={`flex justify-between py-1.5 border-b border-black/10 ${isShared ? "bg-red/5" : ""}`}>
                  <span className={`font-mono text-xs ${isShared ? "text-red font-bold" : ""}`}>
                    {isShared && "⚠ "}{d.name}
                  </span>
                  <span className="font-mono text-xs font-bold">{d.amount}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {sharedDonors.length > 0 && (
        <div className="bg-red/5 border-l-4 border-red px-4 py-3">
          <span className="font-mono text-xs font-bold text-red">⚠ {sharedDonors.length} SHARED DONOR{sharedDonors.length > 1 ? "S" : ""}</span>
          <span className="font-mono text-xs text-black/50 ml-2">— Same organizations fund both representatives</span>
        </div>
      )}
    </Section>
  );
}

// ─── Section 5: Voting Record by Issue ───────────────────────────────────────

function VotingRecordSection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  const catMapA = new Map(a.votingRecord.map(v => [v.category, v]));
  const catMapB = new Map(b.votingRecord.map(v => [v.category, v]));
  const allCats = Array.from(new Set([...catMapA.keys(), ...catMapB.keys()]));

  return (
    <Section title="Voting Record by Issue" icon="🗳️" id="sec-voting">
      {allCats.length === 0 ? (
        <div className="bg-black/5 px-5 py-10 text-center">
          <div className="font-headline text-xl mb-2">No Issue Voting Data Available</div>
          <p className="font-mono text-xs text-black/40">
            Detailed issue-by-issue voting breakdowns are not yet available for these representatives.
            This data will be populated when live Congress.gov vote data is connected.
          </p>
        </div>
      ) : (
      <>
      <VerdictBanner verdict={verdict} repA={a} repB={b} />
      <div className="space-y-4">
        <div className="flex justify-between font-mono text-xs font-bold text-black/40 uppercase px-2">
          <span>{a.lastName}</span>
          <span>Issue Category</span>
          <span>{b.lastName}</span>
        </div>
        {allCats.map(cat => {
          const vA = catMapA.get(cat);
          const vB = catMapB.get(cat);
          const totalA = vA ? vA.yea + vA.nay : 0;
          const totalB = vB ? vB.yea + vB.nay : 0;
          const pctA = totalA > 0 ? (vA!.yea / totalA) * 100 : 0;
          const pctB = totalB > 0 ? (vB!.yea / totalB) * 100 : 0;

          return (
            <div key={cat} className="border-b border-black/10 pb-3">
              <div className="text-center font-mono text-xs font-bold uppercase mb-2">{cat}</div>
              <div className="flex items-center gap-2">
                {/* Rep A bar (right-aligned, extends left) */}
                <div className="flex-1 flex justify-end">
                  <div className="w-full h-7 bg-black/5 relative overflow-hidden">
                    <div
                      className="absolute right-0 top-0 h-full transition-all duration-700"
                      style={{ width: `${pctA}%`, backgroundColor: PC[a.party] }}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-black/70">
                      {pctA.toFixed(0)}% yea
                    </span>
                  </div>
                </div>
                {/* Center divider */}
                <div className="w-px h-7 bg-black/30 shrink-0" />
                {/* Rep B bar (left-aligned, extends right) */}
                <div className="flex-1">
                  <div className="w-full h-7 bg-black/5 relative overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full transition-all duration-700"
                      style={{ width: `${pctB}%`, backgroundColor: PC[b.party] }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold text-black/70">
                      {pctB.toFixed(0)}% yea
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}
    </Section>
  );
}

// ─── Section 6: Committee Power ──────────────────────────────────────────────

function CommitteeSection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  const sharedSet = new Set(a.committees.filter(c => b.committees.includes(c)));

  return (
    <Section title="Committee Power" icon="🏛️" id="sec-committees">
      <VerdictBanner verdict={verdict} repA={a} repB={b} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[a, b].map(rep => (
          <div key={rep.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold uppercase">{rep.fullName}</span>
              <span className="font-mono text-[10px] text-black/30">{rep.committees.length} committees</span>
            </div>
            {rep.leadershipRole && (
              <div className="bg-red/10 border-l-4 border-red px-3 py-2 mb-3">
                <span className="font-mono text-xs font-bold text-red">{rep.leadershipRole}</span>
              </div>
            )}
            <div className="space-y-1">
              {rep.committees.map((c, i) => {
                const isShared = sharedSet.has(c);
                return (
                  <div key={i} className={`px-3 py-2 font-mono text-xs ${isShared ? "bg-red/5 border-l-3 border-red font-bold" : "border-l-3 border-black/10"}`}>
                    {isShared && <span className="text-red mr-1">●</span>}
                    {c}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {sharedSet.size > 0 && (
        <div className="mt-4 bg-black/5 px-4 py-3">
          <span className="font-mono text-xs font-bold">{sharedSet.size} SHARED COMMITTEE{sharedSet.size > 1 ? "S" : ""}</span>
          <span className="font-mono text-xs text-black/40 ml-2">— Both serve on the same panel{sharedSet.size > 1 ? "s" : ""}</span>
        </div>
      )}
    </Section>
  );
}

// ─── Section 7: Key Votes Head-to-Head ───────────────────────────────────────

function KeyVotesSection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  const votesA = new Map(a.keyVotes.map(v => [v.bill, v]));
  const sharedVotes: { bill: string; title: string; vA: typeof a.keyVotes[0]; vB: typeof b.keyVotes[0] }[] = [];
  for (const vB of b.keyVotes) {
    const vA = votesA.get(vB.bill);
    if (vA) sharedVotes.push({ bill: vA.bill, title: vA.title || vB.title, vA, vB });
  }

  const agreements = sharedVotes.filter(s => s.vA.vote === s.vB.vote).length;

  return (
    <Section title="Key Votes Head-to-Head" icon="⭐" id="sec-keyvotes">
      <VerdictBanner verdict={verdict} repA={a} repB={b} />
      {sharedVotes.length > 0 ? (
        <>
          <div className="bg-black/5 px-4 py-3 mb-4">
            <span className="font-mono text-sm font-bold">{agreements}/{sharedVotes.length}</span>
            <span className="font-mono text-xs text-black/40 ml-2">votes in agreement ({((agreements / sharedVotes.length) * 100).toFixed(0)}%)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-3 border-black">
                  <th className="font-mono text-xs font-bold uppercase text-left py-3 pr-4">Bill</th>
                  <th className="font-mono text-xs font-bold uppercase text-center py-3 px-4 w-28">{a.lastName}</th>
                  <th className="font-mono text-xs font-bold uppercase text-center py-3 px-4 w-28">{b.lastName}</th>
                  <th className="font-mono text-xs font-bold uppercase text-center py-3 pl-4 w-20">Match</th>
                </tr>
              </thead>
              <tbody>
                {sharedVotes.map((sv, i) => {
                  const agree = sv.vA.vote === sv.vB.vote;
                  return (
                    <tr key={i} className="border-b border-black/10">
                      <td className="py-3 pr-4">
                        <div className="font-mono text-xs font-bold">{sv.bill}</div>
                        <div className="font-mono text-[10px] text-black/40">{sv.title}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 font-mono text-xs font-bold ${
                          sv.vA.vote === "YEA" ? "bg-green-100 text-green-800" : sv.vA.vote === "NAY" ? "bg-red/10 text-red" : "bg-black/10 text-black/40"
                        }`}>
                          {sv.vA.vote}
                        </span>
                        {sv.vA.brokeWithParty && (
                          <div className="font-mono text-[9px] text-red mt-0.5">BROKE RANKS</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 font-mono text-xs font-bold ${
                          sv.vB.vote === "YEA" ? "bg-green-100 text-green-800" : sv.vB.vote === "NAY" ? "bg-red/10 text-red" : "bg-black/10 text-black/40"
                        }`}>
                          {sv.vB.vote}
                        </span>
                        {sv.vB.brokeWithParty && (
                          <div className="font-mono text-[9px] text-red mt-0.5">BROKE RANKS</div>
                        )}
                      </td>
                      <td className="py-3 pl-4 text-center">
                        <span className={`font-mono text-lg ${agree ? "text-green-600" : "text-red"}`}>
                          {agree ? "✓" : "✗"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-black/5 px-5 py-8 text-center">
          <p className="font-mono text-sm text-black/40">No shared key votes found between these representatives.</p>
        </div>
      )}
    </Section>
  );
}

// ─── Section 8: Controversies & Ethics ───────────────────────────────────────

function EthicsSection({ a, b, verdict }: { a: Representative; b: Representative; verdict: CategoryVerdict }) {
  return (
    <Section title="Controversies & Ethics" icon="🔍" id="sec-ethics">
      <VerdictBanner verdict={verdict} repA={a} repB={b} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[a, b].map(rep => (
          <div key={rep.id}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold uppercase">{rep.fullName}</span>
              <span className="font-mono text-[10px] text-black/30">{rep.controversies.length} documented</span>
            </div>
            {rep.controversies.length > 0 ? (
              <div className="space-y-3">
                {rep.controversies.map((c, i) => (
                  <div key={i} className="border-l-4 pl-4 py-2" style={{ borderLeftColor: PC[rep.party] }}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-black/30">{c.year}</span>
                      <span className="font-mono text-xs font-bold">{c.title}</span>
                    </div>
                    <p className="font-body text-xs text-black/60 mt-1 leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 px-4 py-6 text-center">
                <span className="font-mono text-xs text-green-700">No notable controversies on record</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function AllComparisonSections({
  repA, repB, verdicts,
}: {
  repA: Representative;
  repB: Representative;
  verdicts: ComparisonVerdicts;
}) {
  return (
    <div data-print-content>
      <PartyLoyaltySection a={repA} b={repB} verdict={verdicts.partyLoyalty} />
      <AttendanceSection a={repA} b={repB} verdict={verdicts.attendance} />
      <LegislativeSection a={repA} b={repB} verdict={verdicts.legislative} />
      <FinanceSection a={repA} b={repB} verdict={verdicts.finance} />
      <VotingRecordSection a={repA} b={repB} verdict={verdicts.votingRecord} />
      <CommitteeSection a={repA} b={repB} verdict={verdicts.committees} />
      <KeyVotesSection a={repA} b={repB} verdict={verdicts.keyVotes} />
      <EthicsSection a={repA} b={repB} verdict={verdicts.ethics} />
    </div>
  );
}
