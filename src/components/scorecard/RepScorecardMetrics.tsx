"use client";

import { TrendingUp, Vote, FileText, Users, Clock } from "lucide-react";

interface Props {
  partyLoyalty: number;
  billsIntroduced: number;
  billsEnacted: number;
  committeesCount: number;
  missedVotes: number;
  votesCast: number;
}

export default function RepScorecardMetrics({
  partyLoyalty,
  billsIntroduced,
  billsEnacted,
  committeesCount,
  missedVotes,
  votesCast,
}: Props) {
  const attendance = votesCast > 0
    ? Math.round(((votesCast - missedVotes) / votesCast) * 100)
    : 0;

  const metrics = [
    {
      label: "Party Loyalty",
      value: `${partyLoyalty}%`,
      Icon: TrendingUp,
      color: partyLoyalty >= 90 ? "text-navy" : partyLoyalty >= 70 ? "text-gold-dark" : "text-teal",
      bar: partyLoyalty,
    },
    {
      label: "Attendance",
      value: `${attendance}%`,
      Icon: Clock,
      color: attendance >= 95 ? "text-teal" : attendance >= 85 ? "text-gold-dark" : "text-red",
      bar: attendance,
    },
    {
      label: "Bills Introduced",
      value: String(billsIntroduced),
      Icon: FileText,
      color: "text-navy",
      bar: Math.min(100, (billsIntroduced / 30) * 100), // normalize to ~30 as high
    },
    {
      label: "Committees",
      value: String(committeesCount),
      Icon: Users,
      color: "text-navy",
      bar: Math.min(100, (committeesCount / 6) * 100), // normalize to ~6 as high
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {metrics.map((m) => (
        <div key={m.label} className="flex items-start gap-2">
          <m.Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${m.color}`} strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-gray-500 font-medium">{m.label}</span>
              <span className={`text-sm font-bold tabular-nums ${m.color}`}>{m.value}</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${m.bar}%`,
                  backgroundColor: m.color.includes("teal") ? "#0F766E"
                    : m.color.includes("red") ? "#DC2626"
                    : m.color.includes("gold") ? "#C9A66B"
                    : "#0A2540",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
