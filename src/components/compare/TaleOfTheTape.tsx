"use client";

/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
import type { Representative } from "@/data/types";
import type { ComparisonVerdicts } from "@/lib/compare-verdicts";

const PC: Record<string, string> = { R: "#C1272D", D: "#1a3a6b", I: "#6b5b3e" };
const PCLight: Record<string, string> = { R: "#fde8e8", D: "#e8edf5", I: "#f0ece4" };
const PARTY_FULL: Record<string, string> = { R: "Republican", D: "Democrat", I: "Independent" };

function sectionAnchor(key: string): string {
  return `#sec-${key === "partyLoyalty" ? "loyalty" : key === "votingRecord" ? "voting" : key === "keyVotes" ? "keyvotes" : key}`;
}

interface TaleOfTheTapeProps {
  repA: Representative;
  repB: Representative;
  verdicts: ComparisonVerdicts;
}

const TaleOfTheTape = forwardRef<HTMLDivElement, TaleOfTheTapeProps>(
  function TaleOfTheTape({ repA, repB, verdicts }, ref) {
    const { overall, categories } = verdicts;
    const totalCats = categories.length;

    // Who's winning overall
    const overallWinner =
      overall.winsA > overall.winsB ? repA :
      overall.winsB > overall.winsA ? repB : null;

    return (
      <div ref={ref} className="mb-8 overflow-hidden" id="tale-of-tape">
        {/* ════════════════════════════════════════════════════════════════
            TOP SECTION: Dark dramatic header with face-off
            ════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#0a0a0a] text-white relative overflow-hidden">
          {/* Subtle diagonal split background */}
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-0 left-0 w-1/2 h-full" style={{ backgroundColor: PC[repA.party] }} />
            <div className="absolute top-0 right-0 w-1/2 h-full" style={{ backgroundColor: PC[repB.party] }} />
          </div>

          {/* Top label */}
          <div className="relative text-center pt-5 pb-2">
            <div className="font-mono text-[10px] tracking-[0.3em] text-white/30 uppercase">
              CivicForge Congressional Comparison
            </div>
            <h2 className="font-headline text-2xl md:text-3xl uppercase tracking-wider mt-1">
              Tale of the Tape
            </h2>
          </div>

          {/* Face-off row */}
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center px-6 md:px-10 pb-8 pt-4 gap-2 md:gap-6">
            {/* Rep A */}
            <div className="text-center">
              <div className="relative inline-block mb-3">
                {repA.photoUrl ? (
                  <img
                    src={repA.photoUrl} alt=""
                    className="w-28 h-28 md:w-36 md:h-36 object-cover border-4"
                    style={{ borderColor: PC[repA.party] }}
                  />
                ) : (
                  <div
                    className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center font-headline text-4xl md:text-5xl text-white border-4"
                    style={{ backgroundColor: PC[repA.party], borderColor: PC[repA.party] }}
                  >
                    {repA.firstName[0]}{repA.lastName[0]}
                  </div>
                )}
                {/* Party badge */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 font-mono text-[10px] font-bold text-white tracking-wider"
                  style={{ backgroundColor: PC[repA.party] }}
                >
                  {PARTY_FULL[repA.party]}
                </div>
              </div>
              <div className="font-headline text-xl md:text-2xl uppercase mt-2 leading-tight">
                {repA.fullName}
              </div>
              <div className="font-mono text-xs text-white/40 mt-1">
                {repA.stateAbbr} · {repA.title}
              </div>
              <p className="font-body text-xs text-white/30 mt-2 leading-relaxed max-w-[200px] mx-auto italic hidden md:block">
                {overall.characterizationA}
              </p>
            </div>

            {/* Center VS */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center border-3 border-white/20 rotate-45">
                <span className="font-headline text-2xl md:text-3xl text-red -rotate-45">VS</span>
              </div>
            </div>

            {/* Rep B */}
            <div className="text-center">
              <div className="relative inline-block mb-3">
                {repB.photoUrl ? (
                  <img
                    src={repB.photoUrl} alt=""
                    className="w-28 h-28 md:w-36 md:h-36 object-cover border-4"
                    style={{ borderColor: PC[repB.party] }}
                  />
                ) : (
                  <div
                    className="w-28 h-28 md:w-36 md:h-36 flex items-center justify-center font-headline text-4xl md:text-5xl text-white border-4"
                    style={{ backgroundColor: PC[repB.party], borderColor: PC[repB.party] }}
                  >
                    {repB.firstName[0]}{repB.lastName[0]}
                  </div>
                )}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 font-mono text-[10px] font-bold text-white tracking-wider"
                  style={{ backgroundColor: PC[repB.party] }}
                >
                  {PARTY_FULL[repB.party]}
                </div>
              </div>
              <div className="font-headline text-xl md:text-2xl uppercase mt-2 leading-tight">
                {repB.fullName}
              </div>
              <div className="font-mono text-xs text-white/40 mt-1">
                {repB.stateAbbr} · {repB.title}
              </div>
              <p className="font-body text-xs text-white/30 mt-2 leading-relaxed max-w-[200px] mx-auto italic hidden md:block">
                {overall.characterizationB}
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SCORE: Big dramatic scoreboard
            ════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#111] text-white border-t border-white/10">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center">
            {/* Rep A score side */}
            <div className="py-5 text-center" style={{ backgroundColor: overall.winsA >= overall.winsB ? PC[repA.party] : "transparent" }}>
              <div className="font-headline text-6xl md:text-7xl leading-none">
                {overall.winsA}
              </div>
              <div className="font-mono text-xs tracking-wider uppercase mt-1 text-white/60">
                {repA.lastName}
              </div>
            </div>

            {/* Center divider */}
            <div className="py-5 px-4 md:px-8 text-center">
              <div className="font-headline text-2xl text-white/20">—</div>
              {overall.ties > 0 && (
                <div className="font-mono text-[10px] text-white/30 mt-1 uppercase">
                  {overall.ties} tie{overall.ties > 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Rep B score side */}
            <div className="py-5 text-center" style={{ backgroundColor: overall.winsB >= overall.winsA ? PC[repB.party] : "transparent" }}>
              <div className="font-headline text-6xl md:text-7xl leading-none">
                {overall.winsB}
              </div>
              <div className="font-mono text-xs tracking-wider uppercase mt-1 text-white/60">
                {repB.lastName}
              </div>
            </div>
          </div>

          {/* Summary line */}
          <div className="text-center px-6 pb-4">
            <p className="font-body text-sm text-white/50 max-w-lg mx-auto">
              {overall.overallSummary}
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            CATEGORY BREAKDOWN: Visual fight-card rows
            ════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#0a0a0a] border-t border-white/10">
          {/* Section header */}
          <div className="text-center py-3 border-b border-white/5">
            <span className="font-mono text-[10px] tracking-[0.25em] text-white/25 uppercase">
              Category-by-Category Breakdown
            </span>
          </div>

          {categories.map((cat, i) => {
            const v = cat.verdict;
            const winnerRep = v.winner === "A" ? repA : v.winner === "B" ? repB : null;
            const isTie = v.winner === "tie";
            const isNoData = v.winnerName === "No Data";

            // Calculate a visual "bar" for each side based on values
            const maxVal = Math.max(v.valueA, v.valueB, 1);
            const pctA = (v.valueA / maxVal) * 100;
            const pctB = (v.valueB / maxVal) * 100;

            return (
              <a
                key={cat.key}
                href={sectionAnchor(cat.key)}
                className="block no-underline group border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-0">
                  {/* LEFT: Rep A value + bar */}
                  <div className="flex items-center justify-end gap-3 pr-3 py-3 pl-4">
                    <div className="text-right">
                      <span className={`font-mono text-lg md:text-xl font-bold ${
                        v.winner === "A" ? "text-white" : "text-white/30"
                      }`}>
                        {v.labelA}
                      </span>
                    </div>
                    {/* Bar from right edge */}
                    <div className="hidden md:block w-28 h-3 bg-white/5 relative overflow-hidden">
                      <div
                        className="absolute right-0 top-0 h-full transition-all duration-700"
                        style={{
                          width: `${pctA}%`,
                          backgroundColor: v.winner === "A" ? PC[repA.party] : "rgba(255,255,255,0.15)",
                        }}
                      />
                    </div>
                    {/* Winner marker */}
                    {v.winner === "A" && (
                      <div className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: PC[repA.party] }} />
                    )}
                  </div>

                  {/* CENTER: Category label */}
                  <div className="py-3 px-3 md:px-5 text-center min-w-[140px] md:min-w-[180px]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-headline text-sm md:text-base uppercase text-white/80">
                        {cat.label}
                      </span>
                    </div>
                    {/* Margin indicator */}
                    <div className="mt-1 flex items-center justify-center gap-1">
                      {isNoData ? (
                        <span className="font-mono text-[10px] text-white/20 uppercase">No Data</span>
                      ) : isTie ? (
                        <span className="font-mono text-[10px] text-white/25 uppercase">Draw</span>
                      ) : (
                        <>
                          {/* Strength dots */}
                          {[0, 1, 2].map((dot) => (
                            <div
                              key={dot}
                              className="w-1.5 h-1.5"
                              style={{
                                backgroundColor:
                                  v.margin === "decisive" || (v.margin === "moderate" && dot < 2) || (v.margin === "slight" && dot < 1)
                                    ? PC[winnerRep!.party]
                                    : "rgba(255,255,255,0.1)",
                              }}
                            />
                          ))}
                          <span className={`font-mono text-[10px] ml-1 uppercase ${
                            v.margin === "decisive" ? "text-red" : "text-white/30"
                          }`}>
                            {v.margin}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Rep B value + bar */}
                  <div className="flex items-center justify-start gap-3 pl-3 py-3 pr-4">
                    {v.winner === "B" && (
                      <div className="w-2 h-2 flex-shrink-0" style={{ backgroundColor: PC[repB.party] }} />
                    )}
                    <div className="hidden md:block w-28 h-3 bg-white/5 relative overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-full transition-all duration-700"
                        style={{
                          width: `${pctB}%`,
                          backgroundColor: v.winner === "B" ? PC[repB.party] : "rgba(255,255,255,0.15)",
                        }}
                      />
                    </div>
                    <div className="text-left">
                      <span className={`font-mono text-lg md:text-xl font-bold ${
                        v.winner === "B" ? "text-white" : "text-white/30"
                      }`}>
                        {v.labelB}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            FOOTER: Branding + verdict
            ════════════════════════════════════════════════════════════════ */}
        <div className="bg-[#0a0a0a] border-t border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-wider">
              {overall.winsA + overall.winsB + overall.ties} Categories Analyzed
            </div>
            <div className="font-headline text-sm uppercase tracking-wider">
              {overallWinner ? (
                <span style={{ color: PC[overallWinner.party] }}>
                  {overallWinner.lastName} Leads {Math.max(overall.winsA, overall.winsB)}-{Math.min(overall.winsA, overall.winsB)}
                </span>
              ) : (
                <span className="text-white/40">Even Match</span>
              )}
            </div>
            <div className="font-mono text-[10px] text-white/20 uppercase tracking-wider">
              CivicForge
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default TaleOfTheTape;
