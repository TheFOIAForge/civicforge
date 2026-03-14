"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { MemberStats, MemberStatsPayload } from "@/data/member-stats";
import { getLeaderboards, HARDCODED_MEMBER_STATS } from "@/data/member-stats";

function partyColor(party: string) {
  if (party === "D") return "bg-dem";
  if (party === "R") return "bg-rep";
  return "bg-ind";
}

function partyTextColor(party: string) {
  if (party === "D") return "text-dem";
  if (party === "R") return "text-rep";
  return "text-ind";
}

function partyLabel(party: string) {
  if (party === "D") return "DEM";
  if (party === "R") return "GOP";
  return "IND";
}

// ─── Bar component for visual stat display ──────────────────────────────────

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-black/10 h-2.5 mt-1">
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Single leaderboard card ────────────────────────────────────────────────

function LeaderboardCard({
  title,
  subtitle,
  members,
  statKey,
  statLabel,
  statSuffix = "",
  maxVal,
  icon,
  color = "bg-red",
}: {
  title: string;
  subtitle: string;
  members: MemberStats[];
  statKey: keyof Pick<MemberStats, "partyLoyalty" | "missedVotes" | "billsSponsored" | "billsEnacted" | "successRate">;
  statLabel: string;
  statSuffix?: string;
  maxVal: number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="border-3 border-border bg-surface">
      <div className={`${color} px-4 py-3 flex items-center gap-2`}>
        <span className="text-xl" aria-hidden="true">{icon}</span>
        <div>
          <h3 className="font-sans font-bold text-base text-white uppercase">{title}</h3>
          <p className="font-mono text-[10px] text-white/70 tracking-wider">{subtitle}</p>
        </div>
      </div>
      <div className="divide-y divide-border-light">
        {members.map((m, i) => (
          <Link
            key={m.bioguideId}
            href={`/directory/${m.slug}`}
            className="flex items-center gap-3 px-4 py-3 no-underline text-black hover:bg-hover transition-colors group"
          >
            <span className="font-sans font-bold text-2xl text-gray-mid/40 w-6 text-right shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold text-white ${partyColor(m.party)}`}>
                  {partyLabel(m.party)}
                </span>
                <span className="font-sans font-bold text-sm normal-case group-hover:text-red truncate">
                  {m.name}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[10px] text-gray-mid">
                  {m.stateAbbr} · {m.chamber}
                </span>
                <StatBar value={m[statKey]} max={maxVal} color={partyColor(m.party)} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className={`font-sans font-bold text-lg ${partyTextColor(m.party)}`}>
                {m[statKey]}{statSuffix}
              </span>
              <span className="block font-mono text-[9px] text-gray-mid uppercase">{statLabel}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

type InfoTab = "loyalty" | "attendance" | "legislation" | "effectiveness";

export default function CongressInfoGraphics() {
  const [data, setData] = useState<MemberStatsPayload>(HARDCODED_MEMBER_STATS);
  const [activeTab, setActiveTab] = useState<InfoTab>("loyalty");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");

  // Load cached data from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("checkmyrep_member_stats");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as MemberStatsPayload;
        if (parsed.members && parsed.members.length > 0) {
          setData(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const leaderboards = getLeaderboards(data);

  const handleUpdate = useCallback(async () => {
    setUpdating(true);
    setUpdateError("");
    setUpdateSuccess("");

    try {
      const res = await fetch("/api/member-stats/update", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }

      const result = await res.json();

      // Fetch the fresh data
      const statsRes = await fetch("/api/member-stats");
      if (statsRes.ok) {
        const freshData = await statsRes.json() as MemberStatsPayload;
        setData(freshData);
        localStorage.setItem("checkmyrep_member_stats", JSON.stringify(freshData));
        setUpdateSuccess(`Updated ${result.membersUpdated} members`);
      }
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }, []);

  const tabs: { key: InfoTab; label: string; icon: string }[] = [
    { key: "loyalty", label: "Party Loyalty", icon: "🏛️" },
    { key: "attendance", label: "Attendance", icon: "📋" },
    { key: "legislation", label: "Legislation", icon: "📜" },
    { key: "effectiveness", label: "Effectiveness", icon: "⚡" },
  ];

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-sans font-bold text-3xl md:text-4xl">Congressional Spotlight</h2>
          <p className="font-mono text-xs text-gray-mid mt-1">
            {data.source === "live" ? "LIVE DATA" : "SNAPSHOT DATA"} · {data.congress}TH CONGRESS
            {data.lastUpdated && (
              <> · UPDATED {new Date(data.lastUpdated).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {updateSuccess && (
            <span className="font-mono text-[10px] text-green-700 font-bold">{updateSuccess}</span>
          )}
          {updateError && (
            <span className="font-mono text-[10px] text-red font-bold">{updateError}</span>
          )}
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="px-4 py-2 bg-black text-white font-mono text-xs font-bold uppercase cursor-pointer hover:bg-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updating ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full motion-safe:animate-spin" />
                UPDATING...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                UPDATE DATA
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-3 border-border border-b-0 bg-cream-dark overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 min-w-[130px] px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border-b-3 ${
              activeTab === tab.key
                ? "border-red bg-surface text-black"
                : "border-transparent text-gray-mid hover:text-black hover:bg-surface/50"
            }`}
          >
            <span className="mr-1.5" aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="border-3 border-border border-t-0 bg-surface p-4 md:p-6">
        {activeTab === "loyalty" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LeaderboardCard
              title="Most Loyal"
              subtitle="HIGHEST PARTY-LINE VOTING %"
              members={leaderboards.mostLoyal}
              statKey="partyLoyalty"
              statLabel="LOYALTY"
              statSuffix="%"
              maxVal={100}
              icon="🎯"
              color="bg-black"
            />
            <LeaderboardCard
              title="Most Independent"
              subtitle="MOST LIKELY TO CROSS PARTY LINES"
              members={leaderboards.leastLoyal}
              statKey="partyLoyalty"
              statLabel="LOYALTY"
              statSuffix="%"
              maxVal={100}
              icon="🤝"
              color="bg-gray-dark"
            />
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LeaderboardCard
              title="Most Absent"
              subtitle="HIGHEST % OF MISSED VOTES"
              members={leaderboards.mostMissed}
              statKey="missedVotes"
              statLabel="MISSED"
              statSuffix="%"
              maxVal={50}
              icon="🚫"
              color="bg-red"
            />
            <LeaderboardCard
              title="Most Present"
              subtitle="BEST VOTE ATTENDANCE RECORD"
              members={leaderboards.leastMissed}
              statKey="missedVotes"
              statLabel="MISSED"
              statSuffix="%"
              maxVal={10}
              icon="✅"
              color="bg-green-800"
            />
          </div>
        )}

        {activeTab === "legislation" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LeaderboardCard
              title="Most Prolific"
              subtitle="MOST BILLS & RESOLUTIONS SPONSORED"
              members={leaderboards.mostBills}
              statKey="billsSponsored"
              statLabel="BILLS"
              maxVal={Math.max(...leaderboards.mostBills.map(m => m.billsSponsored))}
              icon="📝"
              color="bg-black"
            />
            <LeaderboardCard
              title="Most Selective"
              subtitle="FEWEST BILLS SPONSORED"
              members={leaderboards.fewestBills}
              statKey="billsSponsored"
              statLabel="BILLS"
              maxVal={Math.max(...leaderboards.mostBills.map(m => m.billsSponsored))}
              icon="🎯"
              color="bg-gray-dark"
            />
          </div>
        )}

        {activeTab === "effectiveness" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LeaderboardCard
              title="Most Effective"
              subtitle="HIGHEST % OF BILLS BECOMING LAW"
              members={leaderboards.highestSuccess}
              statKey="successRate"
              statLabel="SUCCESS"
              statSuffix="%"
              maxVal={35}
              icon="🏆"
              color="bg-black"
            />
            <LeaderboardCard
              title="Least Effective"
              subtitle="LOWEST LEGISLATIVE SUCCESS RATE"
              members={leaderboards.lowestSuccess}
              statKey="successRate"
              statLabel="SUCCESS"
              statSuffix="%"
              maxVal={35}
              icon="📉"
              color="bg-gray-dark"
            />
            <div className="md:col-span-2 border-2 border-border-light bg-cream-dark p-4">
              <p className="font-mono text-[10px] text-gray-mid">
                <span className="font-bold">NOTE:</span> Success rate = bills that became law ÷ total bills sponsored.
                Members with fewer than 5 sponsored bills are excluded to avoid misleading percentages.
                Most legislation never becomes law — a 10%+ success rate is exceptionally high.
              </p>
            </div>
          </div>
        )}

        {/* Chamber composition mini-graphic */}
        <div className="mt-6 pt-5 border-t-2 border-border-light">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] text-gray-mid font-bold uppercase tracking-wider mb-2">
                Chamber Breakdown in Dataset
              </p>
              <div className="flex items-center gap-4">
                {(() => {
                  const dems = data.members.filter(m => m.party === "D").length;
                  const reps = data.members.filter(m => m.party === "R").length;
                  const inds = data.members.filter(m => m.party === "I").length;
                  const total = data.members.length;
                  return (
                    <>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-dem inline-block" />
                        <span className="font-mono text-xs font-bold">{dems} DEM</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 bg-rep inline-block" />
                        <span className="font-mono text-xs font-bold">{reps} GOP</span>
                      </span>
                      {inds > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 bg-ind inline-block" />
                          <span className="font-mono text-xs font-bold">{inds} IND</span>
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-gray-mid">
                        {total} MEMBERS TRACKED
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <Link
              href="/compare"
              className="px-4 py-2 border-2 border-border text-black font-mono text-xs font-bold no-underline hover:border-red hover:text-red transition-colors"
            >
              COMPARE TWO MEMBERS →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
