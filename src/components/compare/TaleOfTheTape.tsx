"use client";

/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
import type { Representative } from "@/data/types";
import type { ComparisonVerdicts } from "@/lib/compare-verdicts";

const PC: Record<string, string> = { R: "#C1272D", D: "#1a3a6b", I: "#6b5b3e" };
// Brighter versions for text on dark backgrounds
const PCBright: Record<string, string> = { R: "#ff4d4d", D: "#5b8def", I: "#c4a96a" };
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
          <div style={{ position: "absolute", inset: 0, opacity: 0.08, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", backgroundColor: PC[repA.party] }} />
            <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", backgroundColor: PC[repB.party] }} />
          </div>

          {/* Top label */}
          <div style={{ position: "relative", textAlign: "center", paddingTop: 20, paddingBottom: 8 }}>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
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
              <div className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {repA.stateAbbr} · {repA.title}
              </div>
              <p className="font-body hidden md:block" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 8, lineHeight: 1.5, maxWidth: 200, marginLeft: "auto", marginRight: "auto", fontStyle: "italic" }}>
                {overall.characterizationA}
              </p>
            </div>

            {/* Center VS */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.3)", transform: "rotate(45deg)" }}>
                <span className="font-headline" style={{ fontSize: 24, color: "#ff4d4d", transform: "rotate(-45deg)" }}>VS</span>
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
              <div className="font-mono" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {repB.stateAbbr} · {repB.title}
              </div>
              <p className="font-body hidden md:block" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 8, lineHeight: 1.5, maxWidth: 200, marginLeft: "auto", marginRight: "auto", fontStyle: "italic" }}>
                {overall.characterizationB}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SCORE: Big scoreboard
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: "#111", color: "#fff", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
            {/* Rep A score */}
            <div style={{ padding: "20px 0", textAlign: "center", backgroundColor: overall.winsA >= overall.winsB ? PC[repA.party] : "transparent" }}>
              <div className="font-headline" style={{ fontSize: 64, lineHeight: 1, color: "#fff" }}>
                {overall.winsA}
              </div>
              <div className="font-mono" style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4, color: "rgba(255,255,255,0.8)" }}>
                {repA.lastName}
              </div>
            </div>

            {/* Center */}
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div className="font-headline" style={{ fontSize: 24, color: "rgba(255,255,255,0.3)" }}>—</div>
              {overall.ties > 0 && (
                <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4, textTransform: "uppercase" }}>
                  {overall.ties} tie{overall.ties > 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Rep B score */}
            <div style={{ padding: "20px 0", textAlign: "center", backgroundColor: overall.winsB >= overall.winsA ? PC[repB.party] : "transparent" }}>
              <div className="font-headline" style={{ fontSize: 64, lineHeight: 1, color: "#fff" }}>
                {overall.winsB}
              </div>
              <div className="font-mono" style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4, color: "rgba(255,255,255,0.8)" }}>
                {repB.lastName}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ textAlign: "center", padding: "0 24px 16px" }}>
            <p className="font-body" style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", maxWidth: 480, margin: "0 auto" }}>
              {overall.overallSummary}
            </p>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            CATEGORY BREAKDOWN
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: "#141414", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ textAlign: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.25em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>
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

            // Winner gets bright party color, loser gets a readable light gray
            const colorA = v.winner === "A" ? PCBright[repA.party] : "rgba(255,255,255,0.55)";
            const colorB = v.winner === "B" ? PCBright[repB.party] : "rgba(255,255,255,0.55)";
            const barColorA = v.winner === "A" ? PC[repA.party] : "rgba(255,255,255,0.2)";
            const barColorB = v.winner === "B" ? PC[repB.party] : "rgba(255,255,255,0.2)";

            return (
              <a
                key={cat.key}
                href={sectionAnchor(cat.key)}
                style={{ display: "block", textDecoration: "none", borderBottom: i < categories.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
                  {/* LEFT: Rep A */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: "14px 12px 14px 16px" }}>
                    {/* Winner badge */}
                    {v.winner === "A" && (
                      <span className="font-mono hidden md:inline" style={{ fontSize: 9, fontWeight: 700, color: "#fff", backgroundColor: PC[repA.party], padding: "2px 6px", letterSpacing: "0.05em" }}>
                        WIN
                      </span>
                    )}
                    <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: colorA }}>
                      {v.labelA}
                    </span>
                    {/* Bar from right edge */}
                    <div className="hidden md:block" style={{ width: 100, height: 14, background: "rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", right: 0, top: 0, height: "100%", width: `${pctA}%`, backgroundColor: barColorA, transition: "width 0.7s" }} />
                    </div>
                  </div>

                  {/* CENTER: Category */}
                  <div style={{ padding: "14px 12px", textAlign: "center", minWidth: 150 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <span className="font-headline" style={{ fontSize: 14, textTransform: "uppercase", color: "#fff" }}>
                        {cat.label}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      {isNoData ? (
                        <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>No Data</span>
                      ) : isTie ? (
                        <span className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>Draw</span>
                      ) : (
                        <>
                          {[0, 1, 2].map((dot) => {
                            const active = v.margin === "decisive" || (v.margin === "moderate" && dot < 2) || (v.margin === "slight" && dot < 1);
                            return (
                              <div
                                key={dot}
                                style={{
                                  width: 7, height: 7,
                                  backgroundColor: active ? PCBright[winnerRep!.party] : "rgba(255,255,255,0.15)",
                                }}
                              />
                            );
                          })}
                          <span className="font-mono" style={{
                            fontSize: 10,
                            marginLeft: 4,
                            textTransform: "uppercase",
                            fontWeight: 700,
                            color: v.margin === "decisive" ? "#ff4d4d" : v.margin === "moderate" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.5)",
                          }}>
                            {v.margin}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* RIGHT: Rep B */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 10, padding: "14px 16px 14px 12px" }}>
                    <div className="hidden md:block" style={{ width: 100, height: 14, background: "rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pctB}%`, backgroundColor: barColorB, transition: "width 0.7s" }} />
                    </div>
                    <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: colorB }}>
                      {v.labelB}
                    </span>
                    {v.winner === "B" && (
                      <span className="font-mono hidden md:inline" style={{ fontSize: 9, fontWeight: 700, color: "#fff", backgroundColor: PC[repB.party], padding: "2px 6px", letterSpacing: "0.05em" }}>
                        WIN
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════ */}
        <div style={{ background: "#0e0e0e", borderTop: "1px solid rgba(255,255,255,0.12)", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {overall.winsA + overall.winsB + overall.ties} Categories Analyzed
            </div>
            <div className="font-headline" style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {overallWinner ? (
                <span style={{ color: PCBright[overallWinner.party] }}>
                  {overallWinner.lastName} Leads {Math.max(overall.winsA, overall.winsB)}-{Math.min(overall.winsA, overall.winsB)}
                </span>
              ) : (
                <span style={{ color: "rgba(255,255,255,0.6)" }}>Even Match</span>
              )}
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              CivicForge
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default TaleOfTheTape;
