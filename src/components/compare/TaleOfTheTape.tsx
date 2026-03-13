"use client";

import { forwardRef } from "react";
import type { Representative } from "@/data/types";
import type { ComparisonVerdicts } from "@/lib/compare-verdicts";

const PC: Record<string, string> = { R: "#C1272D", D: "#1a3a6b", I: "#6b5b3e" };
const PCBg: Record<string, string> = { R: "bg-red", D: "bg-[#1a3a6b]", I: "bg-[#6b5b3e]" };
const PARTY_LABELS: Record<string, string> = { R: "R", D: "D", I: "I" };

interface TaleOfTheTapeProps {
  repA: Representative;
  repB: Representative;
  verdicts: ComparisonVerdicts;
}

const TaleOfTheTape = forwardRef<HTMLDivElement, TaleOfTheTapeProps>(
  function TaleOfTheTape({ repA, repB, verdicts }, ref) {
    const { overall, categories } = verdicts;

    return (
      <div ref={ref} className="border-3 border-black bg-white mb-8 overflow-hidden" id="tale-of-tape">
        {/* Header band */}
        <div className="bg-black text-white px-6 py-3 text-center">
          <h2 className="font-headline text-lg uppercase tracking-widest m-0">Tale of the Tape</h2>
        </div>

        {/* Main face-off */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-8 gap-4">
          {/* Rep A */}
          <div className="text-center">
            {repA.photoUrl ? (
              <img src={repA.photoUrl} alt="" className="w-24 h-24 mx-auto object-cover border-3 border-black mb-3" />
            ) : (
              <div className={`w-24 h-24 mx-auto flex items-center justify-center border-3 border-black mb-3 font-headline text-3xl text-white ${PCBg[repA.party]}`}>
                {repA.firstName[0]}{repA.lastName[0]}
              </div>
            )}
            <div className="font-headline text-xl uppercase">{repA.fullName}</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`px-2 py-0.5 font-mono text-xs font-bold text-white ${PCBg[repA.party]}`}>
                {PARTY_LABELS[repA.party]}
              </span>
              <span className="font-mono text-xs text-black/50">{repA.stateAbbr} · {repA.chamber}</span>
            </div>
            <p className="font-body text-xs text-black/50 mt-2 leading-relaxed max-w-xs mx-auto italic">
              {overall.characterizationA}
            </p>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="font-headline text-5xl text-red tracking-tight">VS</div>
          </div>

          {/* Rep B */}
          <div className="text-center">
            {repB.photoUrl ? (
              <img src={repB.photoUrl} alt="" className="w-24 h-24 mx-auto object-cover border-3 border-black mb-3" />
            ) : (
              <div className={`w-24 h-24 mx-auto flex items-center justify-center border-3 border-black mb-3 font-headline text-3xl text-white ${PCBg[repB.party]}`}>
                {repB.firstName[0]}{repB.lastName[0]}
              </div>
            )}
            <div className="font-headline text-xl uppercase">{repB.fullName}</div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`px-2 py-0.5 font-mono text-xs font-bold text-white ${PCBg[repB.party]}`}>
                {PARTY_LABELS[repB.party]}
              </span>
              <span className="font-mono text-xs text-black/50">{repB.stateAbbr} · {repB.chamber}</span>
            </div>
            <p className="font-body text-xs text-black/50 mt-2 leading-relaxed max-w-xs mx-auto italic">
              {overall.characterizationB}
            </p>
          </div>
        </div>

        {/* Category winner dots */}
        <div className="border-t-3 border-black px-6 py-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map(cat => {
              const winnerRep = cat.verdict.winner === "A" ? repA : cat.verdict.winner === "B" ? repB : null;
              return (
                <a
                  key={cat.key}
                  href={`#sec-${cat.key === "partyLoyalty" ? "loyalty" : cat.key === "votingRecord" ? "voting" : cat.key === "keyVotes" ? "keyvotes" : cat.key}`}
                  className="flex flex-col items-center gap-1 no-underline group"
                  title={`${cat.label}: ${cat.verdict.winner === "tie" ? "Tie" : cat.verdict.winnerName}`}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span
                    className="w-4 h-4 border-2 border-black/20 transition-transform group-hover:scale-125"
                    style={{
                      backgroundColor: winnerRep ? PC[winnerRep.party] : "#d4d4d4",
                    }}
                  />
                  <span className="font-mono text-[9px] text-black/30 uppercase">{cat.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Score tally */}
        <div className="border-t-3 border-black bg-cream px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-4">
            <span className="font-headline text-2xl uppercase" style={{ color: PC[repA.party] }}>
              {repA.lastName}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-headline text-4xl">{overall.winsA}</span>
              <span className="font-mono text-lg text-black/30">—</span>
              <span className="font-headline text-4xl">{overall.winsB}</span>
            </div>
            <span className="font-headline text-2xl uppercase" style={{ color: PC[repB.party] }}>
              {repB.lastName}
            </span>
          </div>
          {overall.ties > 0 && (
            <div className="font-mono text-xs text-black/40 mt-1">{overall.ties} tie{overall.ties > 1 ? "s" : ""}</div>
          )}
          <p className="font-body text-sm text-black/60 mt-3 max-w-lg mx-auto">{overall.overallSummary}</p>
        </div>

        {/* Score Breakdown — how each category was decided */}
        <div className="border-t-3 border-black bg-white px-6 py-4">
          <div className="font-mono text-[10px] text-black/40 uppercase tracking-wider mb-3 text-center font-bold">
            How the score was decided — 8 categories, each worth 1 point
          </div>
          <div className="space-y-0">
            {categories.map(cat => {
              const v = cat.verdict;
              const winnerRep = v.winner === "A" ? repA : v.winner === "B" ? repB : null;
              const isTie = v.winner === "tie";
              const isNoData = v.winnerName === "No Data";

              return (
                <a
                  key={cat.key}
                  href={`#sec-${cat.key === "partyLoyalty" ? "loyalty" : cat.key === "votingRecord" ? "voting" : cat.key === "keyVotes" ? "keyvotes" : cat.key}`}
                  className="flex items-center gap-3 px-3 py-2.5 no-underline hover:bg-black/3 transition-colors border-b border-black/5 last:border-b-0 group"
                >
                  {/* Icon */}
                  <span className="text-base w-6 text-center flex-shrink-0">{cat.icon}</span>

                  {/* Category name */}
                  <span className="font-mono text-xs font-bold uppercase w-24 flex-shrink-0 text-black/70">{cat.label}</span>

                  {/* Winner indicator */}
                  <span className="flex-shrink-0 w-20 text-center">
                    {isNoData ? (
                      <span className="inline-block px-2 py-0.5 bg-black/5 font-mono text-[10px] text-black/30 font-bold">NO DATA</span>
                    ) : isTie ? (
                      <span className="inline-block px-2 py-0.5 bg-black/10 font-mono text-[10px] text-black/40 font-bold">TIE</span>
                    ) : (
                      <span
                        className="inline-block px-2 py-0.5 font-mono text-[10px] font-bold text-white"
                        style={{ backgroundColor: PC[winnerRep!.party] }}
                      >
                        {winnerRep!.lastName.toUpperCase()}
                      </span>
                    )}
                  </span>

                  {/* Score values */}
                  <span className="flex-shrink-0 font-mono text-[10px] text-black/40 w-28 text-center">
                    {v.labelA} vs {v.labelB}
                  </span>

                  {/* Margin badge */}
                  <span className={`flex-shrink-0 font-mono text-[10px] uppercase ${
                    v.margin === "decisive" ? "text-red font-bold" :
                    v.margin === "moderate" ? "text-black/60 font-bold" :
                    v.margin === "slight" ? "text-black/40" : "text-black/25"
                  }`}>
                    {v.margin === "decisive" ? "▓▓▓" :
                     v.margin === "moderate" ? "▓▓░" :
                     v.margin === "slight" ? "▓░░" : "░░░"}
                    <span className="ml-1">{v.margin}</span>
                  </span>

                  {/* Arrow to section */}
                  <span className="ml-auto text-black/20 group-hover:text-black/50 transition-colors flex-shrink-0">→</span>
                </a>
              );
            })}
          </div>
          <div className="mt-3 flex justify-center gap-6 font-mono text-[9px] text-black/30 uppercase">
            <span>▓▓▓ Decisive (&gt;20pt gap)</span>
            <span>▓▓░ Moderate (10–20pt)</span>
            <span>▓░░ Slight (3–10pt)</span>
            <span>░░░ Negligible (&lt;3pt)</span>
          </div>
        </div>
      </div>
    );
  }
);

export default TaleOfTheTape;
