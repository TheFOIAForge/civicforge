"use client";

import { useState, useMemo } from "react";
import type { Representative } from "@/data/types";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line,
  Treemap as RechartsTreemap, Cell,
} from "recharts";
import {
  generateRadarData,
  generateIdeologyData,
  generateVoteHeatmap,
  generateSankeyData,
  generateTreemapData,
  generateTrendData,
  generateAllianceData,
  generateRankingData,
  type IdeologyPoint,
  type FundingBlock,
  type VoteHeatmapCell,
} from "@/lib/analytics-data";

// ─── Party Colors ────────────────────────────────────────────────────────────

const PC: Record<string, string> = { R: "#C1272D", D: "#1a3a6b", I: "#6b5b3e" };

function parseDollars(s: string): number {
  return Number(s.replace(/[$,]/g, "")) || 0;
}

function fmtDollars(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Tab Definitions ─────────────────────────────────────────────────────────

const TABS = [
  { key: "radar", label: "Overview", icon: "🎯" },
  { key: "ideology", label: "Ideology", icon: "🧭" },
  { key: "heatmap", label: "Vote Matrix", icon: "🗳️" },
  { key: "sankey", label: "Money Flow", icon: "💸" },
  { key: "treemap", label: "Funding", icon: "📊" },
  { key: "trends", label: "Trends", icon: "📈" },
  { key: "alliances", label: "Alliances", icon: "🤝" },
  { key: "rankings", label: "Rankings", icon: "🏆" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdvancedAnalytics({
  repA,
  repB,
}: {
  repA: Representative;
  repB: Representative;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("radar");

  return (
    <div className="mt-10">
      {/* Section Header */}
      <div className="border-3 border-black bg-black text-white px-5 py-4 flex items-center gap-3">
        <span className="text-2xl">📊</span>
        <h2 className="font-headline text-xl uppercase tracking-wide">
          Advanced Analytics
        </h2>
        <span className="ml-auto font-mono text-xs text-white/50 uppercase">
          Deep Analysis · 8 Dimensions
        </span>
      </div>

      {/* Data notice */}
      <div className="border-x-3 border-black bg-cream/60 px-5 py-2 flex items-center gap-2">
        <span className="font-mono text-[10px] text-black/40 uppercase">
          📡 Static data snapshot · Connect API key in Settings to refresh with live data
        </span>
      </div>

      {/* Tab Bar */}
      <div className="border-x-3 border-b-3 border-black bg-white">
        <div className="flex overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-3 transition-colors ${
                activeTab === tab.key
                  ? "border-red text-red bg-red/5"
                  : "border-transparent text-black/40 hover:text-black hover:bg-black/5"
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="border-x-3 border-b-3 border-black bg-white p-6">
        {activeTab === "radar" && <RadarTab repA={repA} repB={repB} />}
        {activeTab === "ideology" && <IdeologyTab repA={repA} repB={repB} />}
        {activeTab === "heatmap" && <HeatmapTab repA={repA} repB={repB} />}
        {activeTab === "sankey" && <SankeyTab repA={repA} repB={repB} />}
        {activeTab === "treemap" && <TreemapTab repA={repA} repB={repB} />}
        {activeTab === "trends" && <TrendsTab repA={repA} repB={repB} />}
        {activeTab === "alliances" && <AlliancesTab repA={repA} repB={repB} />}
        {activeTab === "rankings" && <RankingsTab repA={repA} repB={repB} />}
      </div>
    </div>
  );
}

// ─── Tab Header Helper ──────────────────────────────────────────────────────

function TabHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h3 className="font-headline text-2xl uppercase mb-1">{title}</h3>
      <p className="font-mono text-xs text-black/40 uppercase tracking-wider">
        {subtitle}
      </p>
    </div>
  );
}

function RepLegend({ repA, repB }: { repA: Representative; repB: Representative }) {
  return (
    <div className="flex items-center gap-6 mb-4 font-mono text-xs">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4" style={{ backgroundColor: PC[repA.party] }} />
        <span className="font-bold">{repA.lastName}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4" style={{ backgroundColor: PC[repB.party] }} />
        <span className="font-bold">{repB.lastName}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1: RADAR — Multi-Dimensional Profile
// ═══════════════════════════════════════════════════════════════════════════════

function RadarTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const data = useMemo(() => generateRadarData(repA, repB), [repA, repB]);

  return (
    <div>
      <TabHeader
        title="Multi-Dimensional Profile"
        subtitle="All metrics at a glance — see where each representative excels"
      />
      <RepLegend repA={repA} repB={repB} />

      <div className="w-full" style={{ height: 450 }}>
        <ResponsiveContainer>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="#e5e5e5" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fontFamily: "ui-monospace, monospace", fill: "#666" }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name={repA.lastName}
              dataKey="valueA"
              stroke={PC[repA.party]}
              fill={PC[repA.party]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Radar
              name={repB.lastName}
              dataKey="valueB"
              stroke={PC[repB.party]}
              fill={PC[repB.party]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Legend
              wrapperStyle={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ fontFamily: "ui-monospace, monospace", fontSize: 11, border: "2px solid black" }}
              formatter={(value: any) => typeof value === "number" ? value.toFixed(1) : value}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {data.map((d) => {
          const winner = d.valueA > d.valueB ? repA : d.valueB > d.valueA ? repB : null;
          const diff = Math.abs(d.valueA - d.valueB);
          return (
            <div key={d.dimension} className="border-2 border-black/10 p-3">
              <div className="font-mono text-[10px] text-black/40 uppercase">{d.dimension}</div>
              <div className="font-headline text-lg">
                {winner ? (
                  <span style={{ color: PC[winner.party] }}>{winner.lastName}</span>
                ) : (
                  <span className="text-black/30">Tie</span>
                )}
              </div>
              <div className="font-mono text-xs text-black/50">
                {diff < 3 ? "≈ Even" : `+${diff.toFixed(0)} pts`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2: IDEOLOGY — Political Spectrum Scatter Plot
// ═══════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

function IdeologyTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const data = useMemo(() => generateIdeologyData(repA, repB), [repA, repB]);

  const contextR = data.filter(d => !d.isHighlighted && d.party === "R");
  const contextD = data.filter(d => !d.isHighlighted && d.party === "D");
  const contextI = data.filter(d => !d.isHighlighted && d.party === "I");
  const highlighted = data.filter(d => d.isHighlighted);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload as IdeologyPoint;
    if (!d.isHighlighted) return null;
    return (
      <div className="bg-white border-2 border-black p-3 font-mono text-xs">
        <div className="font-bold">{d.name}</div>
        <div>Economic: {d.economic.toFixed(2)}</div>
        <div>Social: {d.social.toFixed(2)}</div>
      </div>
    );
  };

  return (
    <div>
      <TabHeader
        title="Political Spectrum"
        subtitle="Where each representative sits among all of Congress (DW-NOMINATE methodology)"
      />

      {/* Axis labels */}
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 font-mono text-[10px] text-black/30 uppercase writing-mode-vertical" style={{ writingMode: "vertical-rl", transform: "rotate(180deg) translateX(10px)", position: "absolute", left: -5, top: "50%" }}>
          ← Liberal · Social · Conservative →
        </div>

        <div className="w-full" style={{ height: 450 }}>
          <ResponsiveContainer>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis
                dataKey="economic" type="number" domain={[-1, 1]} name="Economic"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
                label={{ value: "← Liberal · Economic · Conservative →", position: "bottom", offset: 15, style: { fontSize: 10, fontFamily: "ui-monospace, monospace", fill: "#999" } }}
              />
              <YAxis
                dataKey="social" type="number" domain={[-1, 1]} name="Social"
                tick={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Context dots */}
              <Scatter name="Republicans" data={contextR} fill="#C1272D" fillOpacity={0.15} r={4} />
              <Scatter name="Democrats" data={contextD} fill="#1a3a6b" fillOpacity={0.15} r={4} />
              <Scatter name="Independents" data={contextI} fill="#6b5b3e" fillOpacity={0.2} r={4} />

              {/* Highlighted reps */}
              <Scatter
                name="Compared"
                data={highlighted}
                fill="none"
                stroke="#000"
                strokeWidth={3}
                r={10}
                shape={(props: any) => {
                  const { cx, cy } = props;
                  const d = props.payload as IdeologyPoint;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={12} fill={PC[d.party]} stroke="black" strokeWidth={3} />
                      <text x={cx} y={cy - 18} textAnchor="middle" fill="black" fontFamily="ui-monospace, monospace" fontSize={11} fontWeight="bold">
                        {d.name}
                      </text>
                    </g>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quadrant labels */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="border-2 border-black/10 p-3 bg-blue-50/30">
          <div className="font-mono text-[10px] text-black/40 uppercase">Liberal Quadrant</div>
          <div className="font-body text-sm text-black/60">
            Supports government intervention in economy, progressive social policies
          </div>
        </div>
        <div className="border-2 border-black/10 p-3 bg-red-50/30">
          <div className="font-mono text-[10px] text-black/40 uppercase">Conservative Quadrant</div>
          <div className="font-body text-sm text-black/60">
            Favors free markets, traditional social values, limited government
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3: VOTE HEATMAP — Vote Alignment Matrix
// ═══════════════════════════════════════════════════════════════════════════════

function HeatmapTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const cells = useMemo(() => generateVoteHeatmap(repA, repB), [repA, repB]);
  const agreeCount = cells.filter(c => c.agree).length;
  const agreePct = cells.length > 0 ? (agreeCount / cells.length * 100).toFixed(0) : "0";

  // Group by category
  const categories = [...new Set(cells.map(c => c.category))];

  const voteColor = (vote: string) => {
    if (vote === "YEA") return "bg-emerald-600 text-white";
    if (vote === "NAY") return "bg-red text-white";
    return "bg-black/20 text-black/60";
  };

  return (
    <div>
      <TabHeader
        title="Vote Alignment Matrix"
        subtitle={`How ${repA.lastName} and ${repB.lastName} voted on key legislation`}
      />

      {/* Agreement score */}
      <div className="flex items-center gap-4 mb-6 p-4 border-3 border-black/10 bg-cream/50">
        <div className="font-headline text-4xl">{agreePct}%</div>
        <div>
          <div className="font-mono text-xs text-black/40 uppercase">Vote Agreement Rate</div>
          <div className="font-body text-sm text-black/60">
            Agreed on {agreeCount} of {cells.length} key votes
          </div>
        </div>
        <div className="ml-auto flex gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-600" />
            <span className="font-mono text-[10px]">YEA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red" />
            <span className="font-mono text-[10px]">NAY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-black/20" />
            <span className="font-mono text-[10px]">ABSTAIN</span>
          </div>
        </div>
      </div>

      {/* Heatmap table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left font-mono text-[10px] text-black/40 uppercase p-2 border-b-2 border-black/10 w-16">Category</th>
              <th className="text-left font-mono text-[10px] text-black/40 uppercase p-2 border-b-2 border-black/10">Bill</th>
              <th className="text-center font-mono text-[10px] uppercase p-2 border-b-2 border-black/10 w-20" style={{ color: PC[repA.party] }}>{repA.lastName}</th>
              <th className="text-center font-mono text-[10px] uppercase p-2 border-b-2 border-black/10 w-20" style={{ color: PC[repB.party] }}>{repB.lastName}</th>
              <th className="text-center font-mono text-[10px] text-black/40 uppercase p-2 border-b-2 border-black/10 w-16">Match</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const catCells = cells.filter(c => c.category === cat);
              return catCells.map((cell, i) => (
                <tr key={cell.bill} className={i === 0 ? "border-t-2 border-black/10" : ""}>
                  {i === 0 && (
                    <td rowSpan={catCells.length} className="p-2 font-mono text-[10px] text-black/40 uppercase align-top border-r border-black/5">
                      {cat}
                    </td>
                  )}
                  <td className="p-2 font-mono text-xs">
                    <span className="text-black/60">{cell.bill}</span>
                    <span className="ml-2 text-black/40">{cell.billShort}</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`inline-block px-2 py-0.5 font-mono text-[10px] font-bold ${voteColor(cell.voteA)}`}>
                      {cell.voteA}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span className={`inline-block px-2 py-0.5 font-mono text-[10px] font-bold ${voteColor(cell.voteB)}`}>
                      {cell.voteB}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    {cell.agree ? (
                      <span className="text-emerald-600 font-bold text-sm">✓</span>
                    ) : (
                      <span className="text-red font-bold text-sm">✗</span>
                    )}
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 4: SANKEY — Money Flow Visualization
// ═══════════════════════════════════════════════════════════════════════════════

function SankeyTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const { nodes, links } = useMemo(() => generateSankeyData(repA, repB), [repA, repB]);

  // CSS-only Sankey since Recharts doesn't have one built-in
  // We'll render a clean flow diagram with bars and connections
  const totalA = parseDollars(repA.totalFundraising);
  const totalB = parseDollars(repB.totalFundraising);
  const maxTotal = Math.max(totalA, totalB, 1);

  // Get source industries (first N nodes before "Large Donors")
  const industries = nodes.slice(0, nodes.length - 4); // remove Large/Small/RepA/RepB
  const allIndustryTotal = links
    .filter(l => l.target === industries.length) // links to "Large Donors"
    .reduce((sum, l) => sum + l.value, 0);

  return (
    <div>
      <TabHeader
        title="Follow the Money"
        subtitle="How funding flows from industries and donors to each representative"
      />
      <RepLegend repA={repA} repB={repB} />

      {/* Simplified Sankey as CSS flow diagram */}
      <div className="space-y-8">
        {/* Top-level comparison */}
        <div className="grid grid-cols-2 gap-6">
          <div className="border-3 border-black/15 p-4">
            <div className="font-mono text-[10px] text-black/40 uppercase mb-2">Total Raised</div>
            <div className="font-headline text-3xl" style={{ color: PC[repA.party] }}>
              {fmtDollars(totalA)}
            </div>
            <div className="mt-3 h-6 bg-black/5 relative overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${(totalA / maxTotal) * 100}%`, backgroundColor: PC[repA.party] }}
              />
            </div>
            <div className="font-mono text-xs text-black/50 mt-1">{repA.fullName}</div>
          </div>
          <div className="border-3 border-black/15 p-4">
            <div className="font-mono text-[10px] text-black/40 uppercase mb-2">Total Raised</div>
            <div className="font-headline text-3xl" style={{ color: PC[repB.party] }}>
              {fmtDollars(totalB)}
            </div>
            <div className="mt-3 h-6 bg-black/5 relative overflow-hidden">
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${(totalB / maxTotal) * 100}%`, backgroundColor: PC[repB.party] }}
              />
            </div>
            <div className="font-mono text-xs text-black/50 mt-1">{repB.fullName}</div>
          </div>
        </div>

        {/* Funding source flow */}
        <div>
          <div className="font-mono text-xs text-black/40 uppercase mb-3 font-bold">Funding Sources → Recipients</div>

          {/* Small vs Large donor split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[repA, repB].map((rep) => {
              const total = parseDollars(rep.totalFundraising);
              const small = total * (rep.smallDollarPct / 100);
              const large = total - small;
              return (
                <div key={rep.id} className="border-2 border-black/10 p-4">
                  <div className="font-mono text-xs font-bold mb-3" style={{ color: PC[rep.party] }}>
                    {rep.lastName}&apos;s Funding Mix
                  </div>
                  {/* Stacked bar */}
                  <div className="h-10 flex overflow-hidden border border-black/10">
                    <div
                      className="h-full flex items-center justify-center font-mono text-[10px] text-white font-bold"
                      style={{ width: `${rep.smallDollarPct}%`, backgroundColor: "#059669" }}
                    >
                      {rep.smallDollarPct > 15 ? `${rep.smallDollarPct}% Small` : ""}
                    </div>
                    <div
                      className="h-full flex items-center justify-center font-mono text-[10px] text-white font-bold"
                      style={{ width: `${100 - rep.smallDollarPct}%`, backgroundColor: "#6b7280" }}
                    >
                      {(100 - rep.smallDollarPct) > 15 ? `${100 - rep.smallDollarPct}% Large` : ""}
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 font-mono text-[10px] text-black/40">
                    <span>🌱 Small donors: {fmtDollars(small)}</span>
                    <span>🏢 Large donors: {fmtDollars(large)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top industry flows */}
          <div className="font-mono text-xs text-black/40 uppercase mb-3 font-bold">Top Industry Donors</div>
          <div className="space-y-2">
            {industries.slice(0, 8).map((node, i) => {
              const toRepA = links.find(l => l.source === i && l.target === nodes.length - 4);
              const toRepB = links.find(l => l.source === i && l.target === nodes.length - 4);

              // Get amounts for each rep from their topIndustries
              const indA = repA.topIndustries.find(d => d.name === node.name);
              const indB = repB.topIndustries.find(d => d.name === node.name);
              const amtA = indA ? parseDollars(indA.amount) : 0;
              const amtB = indB ? parseDollars(indB.amount) : 0;
              const rowMax = Math.max(amtA, amtB, 1);

              return (
                <div key={node.name} className="border border-black/5 p-3">
                  <div className="font-mono text-xs font-bold mb-2 text-black/70">{node.name}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] w-16 text-right" style={{ color: PC[repA.party] }}>{repA.lastName}</span>
                      <div className="flex-1 h-5 bg-black/5 relative overflow-hidden">
                        <div className="h-full" style={{ width: `${(amtA / rowMax) * 100}%`, backgroundColor: PC[repA.party], opacity: 0.7 }} />
                      </div>
                      <span className="font-mono text-[10px] w-16">{amtA > 0 ? fmtDollars(amtA) : "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] w-16 text-right" style={{ color: PC[repB.party] }}>{repB.lastName}</span>
                      <div className="flex-1 h-5 bg-black/5 relative overflow-hidden">
                        <div className="h-full" style={{ width: `${(amtB / rowMax) * 100}%`, backgroundColor: PC[repB.party], opacity: 0.7 }} />
                      </div>
                      <span className="font-mono text-[10px] w-16">{amtB > 0 ? fmtDollars(amtB) : "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 5: TREEMAP — Funding Composition
// ═══════════════════════════════════════════════════════════════════════════════

const TREEMAP_COLORS: Record<string, string> = {
  Industry: "#6b7280",
  Grassroots: "#059669",
  Other: "#9ca3af",
};

function TreemapTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const dataA = useMemo(() => generateTreemapData(repA), [repA]);
  const dataB = useMemo(() => generateTreemapData(repB), [repB]);

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, pct, category } = props;
    if (width < 30 || height < 25) return null;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={TREEMAP_COLORS[category] || "#6b7280"} stroke="white" strokeWidth={2} rx={0} />
        {width > 50 && height > 35 && (
          <>
            <text x={x + 6} y={y + 16} fill="white" fontFamily="ui-monospace, monospace" fontSize={10} fontWeight="bold">
              {name?.length > width / 7 ? name.slice(0, Math.floor(width / 7)) + "…" : name}
            </text>
            <text x={x + 6} y={y + 30} fill="white" fontFamily="ui-monospace, monospace" fontSize={9} opacity={0.8}>
              {pct?.toFixed(1)}%
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <div>
      <TabHeader
        title="Funding Composition"
        subtitle="Where the money comes from — sized by dollar amount"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { rep: repA, data: dataA },
          { rep: repB, data: dataB },
        ].map(({ rep, data }) => (
          <div key={rep.id}>
            <div className="font-mono text-xs font-bold mb-2 flex items-center gap-2">
              <div className="w-3 h-3" style={{ backgroundColor: PC[rep.party] }} />
              {rep.fullName}
              <span className="text-black/40 ml-auto">{rep.totalFundraising}</span>
            </div>
            <div className="border-2 border-black/10" style={{ height: 300 }}>
              <ResponsiveContainer>
                <RechartsTreemap
                  data={data}
                  dataKey="amount"
                  nameKey="name"
                  content={<CustomContent />}
                >
                </RechartsTreemap>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex gap-4 mt-2">
              {Object.entries(TREEMAP_COLORS).map(([cat, color]) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className="w-3 h-3" style={{ backgroundColor: color }} />
                  <span className="font-mono text-[10px] text-black/50">{cat}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 6: TRENDS — Performance Over Time
// ═══════════════════════════════════════════════════════════════════════════════

function TrendsTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const series = useMemo(() => generateTrendData(repA, repB), [repA, repB]);
  const [selectedMetric, setSelectedMetric] = useState(0);

  const current = series[selectedMetric];

  return (
    <div>
      <TabHeader
        title="Performance Over Time"
        subtitle="How key metrics have changed across recent Congresses (116th–119th)"
      />
      <RepLegend repA={repA} repB={repB} />

      {/* Metric selector pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {series.map((s, i) => (
          <button
            key={s.metric}
            onClick={() => setSelectedMetric(i)}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border-2 transition-colors ${
              i === selectedMetric
                ? "border-black bg-black text-white"
                : "border-black/15 text-black/50 hover:border-black hover:text-black"
            }`}
          >
            {s.metric}
          </button>
        ))}
      </div>

      {/* Line chart */}
      <div className="w-full" style={{ height: 350 }}>
        <ResponsiveContainer>
          <LineChart data={current.data} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="congress"
              tick={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}
              label={{
                value: current.unit,
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11, fontFamily: "ui-monospace, monospace", fill: "#999" },
              }}
            />
            <Tooltip
              contentStyle={{ fontFamily: "ui-monospace, monospace", fontSize: 11, border: "2px solid black" }}
              formatter={(value: any) =>
                current.unit === "$M" ? `$${Number(value).toFixed(1)}M` : `${Number(value).toFixed(1)}${current.unit}`
              }
            />
            <Line
              type="monotone"
              dataKey="valueA"
              name={repA.lastName}
              stroke={PC[repA.party]}
              strokeWidth={3}
              dot={{ r: 5, fill: PC[repA.party] }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="valueB"
              name={repB.lastName}
              stroke={PC[repB.party]}
              strokeWidth={3}
              dot={{ r: 5, fill: PC[repB.party] }}
              activeDot={{ r: 7 }}
            />
            <Legend
              wrapperStyle={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary cards for all metrics at a glance */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {series.map((s) => {
          const latest = s.data[s.data.length - 1];
          const first = s.data[0];
          const trendA = latest.valueA - first.valueA;
          const trendB = latest.valueB - first.valueB;
          return (
            <div key={s.metric} className="border-2 border-black/10 p-3">
              <div className="font-mono text-[10px] text-black/40 uppercase mb-1">{s.metric}</div>
              <div className="flex justify-between">
                <div>
                  <span className="font-mono text-xs font-bold" style={{ color: PC[repA.party] }}>
                    {s.unit === "$M" ? `$${latest.valueA.toFixed(1)}M` : `${latest.valueA.toFixed(1)}${s.unit}`}
                  </span>
                  <span className={`ml-1 font-mono text-[10px] ${trendA >= 0 ? "text-emerald-600" : "text-red"}`}>
                    {trendA >= 0 ? "↑" : "↓"}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-xs font-bold" style={{ color: PC[repB.party] }}>
                    {s.unit === "$M" ? `$${latest.valueB.toFixed(1)}M` : `${latest.valueB.toFixed(1)}${s.unit}`}
                  </span>
                  <span className={`ml-1 font-mono text-[10px] ${trendB >= 0 ? "text-emerald-600" : "text-red"}`}>
                    {trendB >= 0 ? "↑" : "↓"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 7: ALLIANCES — Network Visualization
// ═══════════════════════════════════════════════════════════════════════════════

function AlliancesTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const { nodes, links, sharedCommittees, sharedCaucuses } = useMemo(
    () => generateAllianceData(repA, repB),
    [repA, repB]
  );

  // Group links by type
  const committeeLinks = links.filter(l => l.type === "committee");
  const caucusLinks = links.filter(l => l.type === "caucus");
  const cosponsorLinks = links.filter(l => l.type === "cosponsor");

  // Find nodes connected to each rep
  const connectedToA = new Set(links.filter(l => l.source === repA.id).map(l => l.target));
  const connectedToB = new Set(links.filter(l => l.source === repB.id).map(l => l.target));
  const sharedConnections = [...connectedToA].filter(id => connectedToB.has(id));

  return (
    <div>
      <TabHeader
        title="Legislative Alliances"
        subtitle="Committee memberships, caucuses, and co-sponsorship connections"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border-3 border-black/10 p-4 text-center">
          <div className="font-headline text-3xl">{sharedCommittees.length}</div>
          <div className="font-mono text-[10px] text-black/40 uppercase">Shared Committees</div>
        </div>
        <div className="border-3 border-black/10 p-4 text-center">
          <div className="font-headline text-3xl">{sharedCaucuses.length}</div>
          <div className="font-mono text-[10px] text-black/40 uppercase">Shared Caucuses</div>
        </div>
        <div className="border-3 border-black/10 p-4 text-center">
          <div className="font-headline text-3xl">{sharedConnections.length}</div>
          <div className="font-mono text-[10px] text-black/40 uppercase">Total Shared Links</div>
        </div>
      </div>

      {/* Visual network — as a hub-and-spoke diagram */}
      <div className="border-2 border-black/10 bg-cream/30 p-6 mb-6">
        <div className="font-mono text-[10px] text-black/40 uppercase mb-4 font-bold">Network Map</div>

        <div className="relative" style={{ minHeight: 400 }}>
          {/* Center line */}
          <div className="absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-black/10" />

          {/* Rep A hub */}
          <div className="absolute left-[15%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-20 h-20 border-3 border-black flex items-center justify-center font-headline text-white text-sm" style={{ backgroundColor: PC[repA.party] }}>
              {repA.lastName}
            </div>
          </div>

          {/* Rep B hub */}
          <div className="absolute right-[15%] top-1/2 translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-20 h-20 border-3 border-black flex items-center justify-center font-headline text-white text-sm" style={{ backgroundColor: PC[repB.party] }}>
              {repB.lastName}
            </div>
          </div>

          {/* Committee nodes - arranged in a circle around center */}
          {nodes.filter(n => !n.isCompared && n.id.startsWith("comm-")).map((node, i) => {
            const total = nodes.filter(n => n.id.startsWith("comm-")).length;
            const angle = (i / total) * Math.PI - Math.PI / 2;
            const radius = 140;
            const cx = 50 + Math.cos(angle) * 18;
            const cy = 50 + Math.sin(angle) * 30;
            const isShared = connectedToA.has(node.id) && connectedToB.has(node.id);

            return (
              <div
                key={node.id}
                className={`absolute z-5 px-2 py-1 font-mono text-[9px] border-2 whitespace-nowrap ${
                  isShared
                    ? "border-red bg-red/10 text-red font-bold"
                    : connectedToA.has(node.id)
                    ? "border-black/20 bg-white"
                    : "border-black/20 bg-white"
                }`}
                style={{ left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%, -50%)" }}
              >
                🏛️ {node.name}
                {isShared && <span className="ml-1 text-[8px]">★</span>}
              </div>
            );
          })}

          {/* Caucus nodes */}
          {nodes.filter(n => n.id.startsWith("caucus-")).map((node, i) => {
            const total = nodes.filter(n => n.id.startsWith("caucus-")).length;
            const angle = (i / total) * Math.PI + Math.PI / 2;
            const cx = 50 + Math.cos(angle) * 22;
            const cy = 65 + Math.sin(angle) * 15 + 10;
            const isShared = connectedToA.has(node.id) && connectedToB.has(node.id);

            return (
              <div
                key={node.id}
                className={`absolute z-5 px-2 py-1 font-mono text-[9px] border-2 whitespace-nowrap ${
                  isShared
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold"
                    : "border-black/15 bg-white/80 text-black/50"
                }`}
                style={{ left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%, -50%)" }}
              >
                🤝 {node.name}
              </div>
            );
          })}

          {/* Co-sponsor allies */}
          {nodes.filter(n => n.id.startsWith("ally-")).map((node, i) => {
            const side = connectedToA.has(node.id) && !connectedToB.has(node.id) ? "left" : connectedToB.has(node.id) && !connectedToA.has(node.id) ? "right" : "center";
            const cx = side === "left" ? 8 + i * 4 : side === "right" ? 72 + i * 4 : 40 + i * 5;
            const cy = 15 + (i % 3) * 25;

            return (
              <div
                key={node.id}
                className="absolute z-5 px-1.5 py-0.5 font-mono text-[9px] border border-black/10 bg-white/60 text-black/40"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%, -50%)" }}
              >
                <span className="inline-block w-2 h-2 mr-1" style={{ backgroundColor: PC[node.party] }} />
                {node.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Committees */}
        <div>
          <div className="font-mono text-xs font-bold uppercase mb-3">Committee Assignments</div>
          <div className="space-y-1">
            {[...new Set([...repA.committees, ...repB.committees])].map((c) => {
              const hasA = repA.committees.includes(c);
              const hasB = repB.committees.includes(c);
              return (
                <div key={c} className={`flex items-center gap-2 p-2 text-xs font-mono ${hasA && hasB ? "bg-red/5 border-l-3 border-red" : "border-l-3 border-black/10"}`}>
                  <span className="w-5 text-center" style={{ color: hasA ? PC[repA.party] : "#ccc" }}>
                    {hasA ? "●" : "○"}
                  </span>
                  <span className="w-5 text-center" style={{ color: hasB ? PC[repB.party] : "#ccc" }}>
                    {hasB ? "●" : "○"}
                  </span>
                  <span className={hasA && hasB ? "font-bold text-black" : "text-black/50"}>
                    {c.replace(/^(Senate|House)\s+(Committee\s+on\s+)?/i, "")}
                  </span>
                  {hasA && hasB && <span className="ml-auto text-red text-[10px] font-bold">SHARED</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Connection strength */}
        <div>
          <div className="font-mono text-xs font-bold uppercase mb-3">Connection Strength</div>
          <div className="space-y-3">
            {[
              { label: "Committee Overlap", count: sharedCommittees.length, max: Math.max(repA.committees.length, repB.committees.length), icon: "🏛️" },
              { label: "Caucus Overlap", count: sharedCaucuses.length, max: 5, icon: "🤝" },
              { label: "Co-sponsor Network", count: sharedConnections.length, max: nodes.length - 2, icon: "📋" },
            ].map(({ label, count, max, icon }) => (
              <div key={label} className="border-2 border-black/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span>{icon}</span>
                  <span className="font-mono text-xs font-bold">{label}</span>
                  <span className="ml-auto font-mono text-xs text-black/40">{count}/{max}</span>
                </div>
                <div className="h-3 bg-black/5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-700"
                    style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 8: RANKINGS — Congressional Rankings (Bump Chart)
// ═══════════════════════════════════════════════════════════════════════════════

function RankingsTab({ repA, repB }: { repA: Representative; repB: Representative }) {
  const series = useMemo(() => generateRankingData(repA, repB), [repA, repB]);
  const [selectedMetric, setSelectedMetric] = useState(0);

  const current = series[selectedMetric];
  const totalMembers = current.totalMembers;

  // For bump chart, lower rank = better, so invert Y axis
  const latest = current.data[current.data.length - 1];

  return (
    <div>
      <TabHeader
        title="Congressional Rankings"
        subtitle={`Where they rank among ${totalMembers} ${repA.chamber === "Senate" ? "senators" : "representatives"}`}
      />
      <RepLegend repA={repA} repB={repB} />

      {/* Metric selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {series.map((s, i) => (
          <button
            key={s.metric}
            onClick={() => setSelectedMetric(i)}
            className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border-2 transition-colors ${
              i === selectedMetric
                ? "border-black bg-black text-white"
                : "border-black/15 text-black/50 hover:border-black hover:text-black"
            }`}
          >
            {s.metric}
          </button>
        ))}
      </div>

      {/* Current rank cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { rep: repA, rank: latest.rankA },
          { rep: repB, rank: latest.rankB },
        ].map(({ rep, rank }) => {
          const percentile = Math.round(((totalMembers - rank) / totalMembers) * 100);
          return (
            <div key={rep.id} className="border-3 border-black/15 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3" style={{ backgroundColor: PC[rep.party] }} />
                <span className="font-mono text-xs font-bold">{rep.lastName}</span>
              </div>
              <div className="font-headline text-4xl" style={{ color: PC[rep.party] }}>
                #{rank}
              </div>
              <div className="font-mono text-[10px] text-black/40">
                of {totalMembers} · Top {percentile}%
              </div>
              {/* Rank position bar */}
              <div className="mt-3 h-4 bg-black/5 relative">
                <div
                  className="absolute top-0 bottom-0 w-1 border border-black"
                  style={{ left: `${((totalMembers - rank) / totalMembers) * 100}%`, backgroundColor: PC[rep.party] }}
                />
                {/* Quartile markers */}
                <div className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: "25%" }} />
                <div className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: "50%" }} />
                <div className="absolute top-0 bottom-0 w-px bg-black/10" style={{ left: "75%" }} />
              </div>
              <div className="flex justify-between mt-1 font-mono text-[8px] text-black/30">
                <span>Bottom</span>
                <span>Top</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bump chart (line chart with inverted Y axis) */}
      <div className="w-full" style={{ height: 350 }}>
        <ResponsiveContainer>
          <LineChart data={current.data} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis
              dataKey="congress"
              tick={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}
            />
            <YAxis
              reversed
              domain={[1, Math.min(totalMembers, 100)]}
              tick={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}
              label={{
                value: "Rank (lower = better)",
                angle: -90,
                position: "insideLeft",
                offset: 0,
                style: { fontSize: 10, fontFamily: "ui-monospace, monospace", fill: "#999" },
              }}
            />
            <Tooltip
              contentStyle={{ fontFamily: "ui-monospace, monospace", fontSize: 11, border: "2px solid black" }}
              formatter={(value: any) => [`#${value}`, ""]}
            />
            <Line
              type="monotone"
              dataKey="rankA"
              name={repA.lastName}
              stroke={PC[repA.party]}
              strokeWidth={3}
              dot={{ r: 6, fill: PC[repA.party], stroke: "white", strokeWidth: 2 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="rankB"
              name={repB.lastName}
              stroke={PC[repB.party]}
              strokeWidth={3}
              dot={{ r: 6, fill: PC[repB.party], stroke: "white", strokeWidth: 2 }}
              activeDot={{ r: 8 }}
            />
            <Legend
              wrapperStyle={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* All rankings summary */}
      <div className="mt-6">
        <div className="font-mono text-xs font-bold uppercase mb-3">All Rankings — Current Congress</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left font-mono text-[10px] text-black/40 uppercase p-2 border-b-2 border-black/10">Metric</th>
                <th className="text-center font-mono text-[10px] uppercase p-2 border-b-2 border-black/10" style={{ color: PC[repA.party] }}>{repA.lastName}</th>
                <th className="text-center font-mono text-[10px] uppercase p-2 border-b-2 border-black/10" style={{ color: PC[repB.party] }}>{repB.lastName}</th>
                <th className="text-center font-mono text-[10px] text-black/40 uppercase p-2 border-b-2 border-black/10">Edge</th>
              </tr>
            </thead>
            <tbody>
              {series.map((s) => {
                const latest = s.data[s.data.length - 1];
                const winner = latest.rankA < latest.rankB ? repA : latest.rankB < latest.rankA ? repB : null;
                return (
                  <tr key={s.metric} className="border-b border-black/5">
                    <td className="p-2 font-mono text-xs">{s.metric}</td>
                    <td className="p-2 text-center">
                      <span className={`font-mono text-sm font-bold ${latest.rankA <= latest.rankB ? "" : "text-black/40"}`} style={latest.rankA <= latest.rankB ? { color: PC[repA.party] } : {}}>
                        #{latest.rankA}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={`font-mono text-sm font-bold ${latest.rankB <= latest.rankA ? "" : "text-black/40"}`} style={latest.rankB <= latest.rankA ? { color: PC[repB.party] } : {}}>
                        #{latest.rankB}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {winner ? (
                        <span className="font-mono text-[10px] font-bold" style={{ color: PC[winner.party] }}>
                          {winner.lastName}
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-black/30">Tie</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
