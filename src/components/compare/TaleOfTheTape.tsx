"use client";

/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
import type { Representative } from "@/data/types";
import type { ComparisonVerdicts } from "@/lib/compare-verdicts";

const PC: Record<string, string> = { R: "#C1272D", D: "#1a3a6b", I: "#6b5b3e" };
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

    const overallWinner =
      overall.winsA > overall.winsB ? repA :
      overall.winsB > overall.winsA ? repB : null;

    return (
      <div ref={ref} className="mb-8 overflow-hidden border-3 border-black" id="head-to-head">
        {/* ═══════════════════════════════════════════════════════
            TOP: Dark header with face-off
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: "#0a0a0a", color: "#fff", position: "relative", overflow: "hidden" }}>
          {/* Subtle party-colored split */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.07, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", backgroundColor: PC[repA.party] }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", backgroundColor: PC[repB.party] }} />
          </div>

          {/* Top label */}
          <div style={{ position: "relative", textAlign: "center", paddingTop: 20, paddingBottom: 8 }}>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              CivicForge Congressional Comparison
            </div>
            <h2 className="font-headline" style={{ fontSize: 28, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, color: "#fff" }}>
              Head to Head
            </h2>
          </div>

          {/* Face-off row */}
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "16px 24px 32px", gap: 8 }}>
            {/* Rep A */}
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                {repA.photoUrl ? (
                  <img
                    src={repA.photoUrl} alt=""
                    style={{ width: 120, height: 120, objectFit: "cover", border: `4px solid ${PC[repA.party]}` }}
                  />
                ) : (
                  <div
                    className="font-headline"
                    style={{ width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#fff", backgroundColor: PC[repA.party], border: `4px solid ${PC[repA.party]}` }}
                  >
                    {repA.firstName[0]}{repA.lastName[0]}
                  </div>
                )}
                <div
                  className="font-mono"
                  style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", padding: "2px 12px", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", backgroundColor: PC[repA.party], whiteSpace: "nowrap" }}
                >
                  {PARTY_FULL[repA.party]}
                </div>
              </div>
              <div className="font-headline" style={{ fontSize: 20, textTransform: "uppercase", marginTop: 8, lineHeight: 1.2, color: "#fff" }}>
                {repA.fullName}
              </div>
              <div className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                {repA.stateAbbr} · {repA.title}
              </div>
              <p className="font-body hidden md:block" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8, lineHeight: 1.5, maxWidth: 200, marginLeft: "auto", marginRight: "auto", fontStyle: "italic" }}>
                {overall.characterizationA}
              </p>
            </div>

            {/* Center VS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.2)", transform: "rotate(45deg)" }}>
                <span className="font-headline" style={{ fontSize: 24, color: "#C1272D", transform: "rotate(-45deg)" }}>VS</span>
              </div>
            </div>

            {/* Rep B */}
            <div style={{ textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                {repB.photoUrl ? (
                  <img
                    src={repB.photoUrl} alt=""
                    style={{ width: 120, height: 120, objectFit: "cover", border: `4px solid ${PC[repB.party]}` }}
                  />
                ) : (
                  <div
                    className="font-headline"
                    style={{ width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, color: "#fff", backgroundColor: PC[repB.party], border: `4px solid ${PC[repB.party]}` }}
                  >
                    {repB.firstName[0]}{repB.lastName[0]}
                  </div>
                )}
                <div
                  className="font-mono"
                  style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", padding: "2px 12px", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", backgroundColor: PC[repB.party], whiteSpace: "nowrap" }}
                >
                  {PARTY_FULL[repB.party]}
                </div>
              </div>
              <div className="font-headline" style={{ fontSize: 20, textTransform: "uppercase", marginTop: 8, lineHeight: 1.2, color: "#fff" }}>
                {repB.fullName}
              </div>
              <div className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                {repB.stateAbbr} · {repB.title}
              </div>
              <p className="font-body hidden md:block" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8, lineHeight: 1.5, maxWidth: 200, marginLeft: "auto", marginRight: "auto", fontStyle: "italic" }}>
                {overall.characterizationB}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SCORE: Big scoreboard
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: "#111", color: "#fff", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
            {/* Rep A score */}
            <div style={{ padding: "20px 0", textAlign: "center", backgroundColor: overall.winsA >= overall.winsB ? PC[repA.party] : "transparent" }}>
              <div className="font-headline" style={{ fontSize: 64, lineHeight: 1, color: "#fff" }}>
                {overall.winsA}
              </div>
              <div className="font-mono" style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4, color: "rgba(255,255,255,0.6)" }}>
                {repA.lastName}
              </div>
            </div>

            {/* Center */}
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div className="font-headline" style={{ fontSize: 24, color: "rgba(255,255,255,0.2)" }}>—</div>
              {overall.ties > 0 && (
                <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, textTransform: "uppercase" }}>
                  {overall.ties} tie{overall.ties > 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Rep B score */}
            <div style={{ padding: "20px 0", textAlign: "center", backgroundColor: overall.winsB >= overall.winsA ? PC[repB.party] : "transparent" }}>
              <div className="font-headline" style={{ fontSize: 64, lineHeight: 1, color: "#fff" }}>
                {overall.winsB}
              </div>
              <div className="font-mono" style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4, color: "rgba(255,255,255,0.6)" }}>
                {repB.lastName}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ textAlign: "center", padding: "0 24px 16px" }}>
            <p className="font-body" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", maxWidth: 480, margin: "0 auto" }}>
              {overall.overallSummary}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            CATEGORY BREAKDOWN
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ textAlign: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
              Category-by-Category Breakdown
            </span>
          </div>

          {categories.map((cat, i) => {
            const v = cat.verdict;
            const winnerRep = v.winner === "A" ? repA : v.winner === "B" ? repB : null;
            const isTie = v.winner === "tie";
            const isNoData = v.winnerName === "No Data";

            const maxVal = Math.max(v.valueA, v.valueB, 1);
            const pctA = (v.valueA / maxVal) * 100;
            const pctB = (v.valueB / maxVal) * 100;

            return (
              <a
                key={cat.key}
                href={sectionAnchor(cat.key)}
                style={{ display: "block", textDecoration: "none", borderBottom: i < categories.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
                  {/* LEFT: Rep A */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 12px 12px 16px" }}>
                    <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: v.winner === "A" ? "#fff" : "rgba(255,255,255,0.3)" }}>
                      {v.labelA}
                    </span>
                    <div className="hidden md:block" style={{ width: 112, height: 12, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: `${pctA}%`, backgroundColor: v.winner === "A" ? PC[repA.party] : "rgba(255,255,255,0.15)", transition: "width 0.7s" }} />
                    </div>
                    {v.winner === "A" && (
                      <div style={{ width: 8, height: 8, flexShrink: 0, backgroundColor: PC[repA.party] }} />
                    )}
                  </div>

                  {/* CENTER: Category */}
                  <div style={{ padding: "12px 12px", textAlign: "center", minWidth: 140 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <span className="font-headline" style={{ fontSize: 14, textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
                        {cat.label}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      {isNoData ? (
                        <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase" }}>No Data</span>
                      ) : isTie ? (
                        <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Draw</span>
                      ) : (
                        <>
                          {[0, 1, 2].map((dot) => (
                            <div
                              key={dot}
                              style={{
                                width: 6, height: 6,
                                backgroundColor:
                                  v.margin === "decisive" || (v.margin === "moderate" && dot < 2) || (v.margin === "slight" && dot < 1)
                                    ? PC[winnerRep!.party]
                                    : "rgba(255,255,255,0.1)",
                              }}
                            />
                          ))}
                          <span className="font-mono" style={{ fontSize: 10, marginLeft: 4, textTransform: "uppercase", color: v.margin === "decisive" ? "#C1272D" : "rgba(255,255,255,0.3)" }}>
                            {v.margin}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Rep B */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 12, padding: "12px 16px 12px 12px" }}>
                    {v.winner === "B" && (
                      <div style={{ width: 8, height: 8, flexShrink: 0, backgroundColor: PC[repB.party] }} />
                    )}
                    <div className="hidden md:block" style={{ width: 112, height: 12, background: "rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pctB}%`, backgroundColor: v.winner === "B" ? PC[repB.party] : "rgba(255,255,255,0.15)", transition: "width 0.7s" }} />
                    </div>
                    <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: v.winner === "B" ? "#fff" : "rgba(255,255,255,0.3)" }}>
                      {v.labelB}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: "#0a0a0a", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {overall.winsA + overall.winsB + overall.ties} Categories Analyzed
            </div>
            <div className="font-headline" style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {overallWinner ? (
                <span style={{ color: PC[overallWinner.party] }}>
                  {overallWinner.lastName} Leads {Math.max(overall.winsA, overall.winsB)}-{Math.min(overall.winsA, overall.winsB)}
                </span>
              ) : (
                <span style={{ color: "rgba(255,255,255,0.4)" }}>Even Match</span>
              )}
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              CivicForge
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default TaleOfTheTape;
