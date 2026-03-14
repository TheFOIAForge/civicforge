"use client";

import type { InterestGroupRating } from "@/data/types";

interface Props {
  ratings?: InterestGroupRating[];
  party?: "D" | "R" | "I";
  className?: string;
}

/**
 * Computes a 0–100 political spectrum position from interest group ratings.
 * 0 = most progressive, 50 = moderate, 100 = most conservative.
 * Falls back to party heuristic if no ratings available.
 */
function computePosition(ratings?: InterestGroupRating[], party?: string): number {
  if (!ratings || ratings.length === 0) {
    if (party === "D") return 25;
    if (party === "R") return 75;
    return 50;
  }

  let totalWeight = 0;
  let weightedSum = 0;

  for (const r of ratings) {
    const score = typeof r.score === "string" ? parseFloat(r.score) : r.score;
    if (isNaN(score)) continue;

    // Normalize to 0–100 scale
    const normalized = Math.min(100, Math.max(0, score));

    if (r.lean === "left") {
      // High score from left-leaning group = more progressive (lower position)
      weightedSum += (100 - normalized);
    } else if (r.lean === "right") {
      // High score from right-leaning group = more conservative (higher position)
      weightedSum += normalized;
    } else {
      // Center group — score of 50 is neutral
      weightedSum += normalized;
    }
    totalWeight++;
  }

  if (totalWeight === 0) {
    if (party === "D") return 25;
    if (party === "R") return 75;
    return 50;
  }

  return Math.round(weightedSum / totalWeight);
}

function getLabel(position: number): string {
  if (position <= 20) return "Very Progressive";
  if (position <= 40) return "Progressive";
  if (position <= 60) return "Moderate";
  if (position <= 80) return "Conservative";
  return "Very Conservative";
}

export default function PoliticalSpectrumBar({ ratings, party, className = "" }: Props) {
  const position = computePosition(ratings, party);
  const label = getLabel(position);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-blue/70">Progressive</span>
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-red/70">Conservative</span>
      </div>

      {/* Track */}
      <div className="relative h-2.5 rounded-full overflow-hidden bg-gray-100">
        {/* Gradient fill */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "linear-gradient(to right, #2563EB, #7C3AED, #9CA3AF, #D97706, #DC2626)",
            opacity: 0.2,
          }}
        />

        {/* Active region glow */}
        <div
          className="absolute top-0 bottom-0 rounded-full transition-all duration-700 ease-out"
          style={{
            left: `${Math.max(0, position - 8)}%`,
            width: "16%",
            background: position <= 40
              ? "rgba(37, 99, 235, 0.3)"
              : position >= 60
                ? "rgba(220, 38, 38, 0.3)"
                : "rgba(156, 163, 175, 0.3)",
            filter: "blur(4px)",
          }}
        />

        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
          style={{ left: `${position}%`, transform: `translate(-50%, -50%)` }}
        >
          {/* Outer ring */}
          <div
            className="w-4.5 h-4.5 rounded-full border-2 border-white shadow-md flex items-center justify-center"
            style={{
              width: 18,
              height: 18,
              backgroundColor: position <= 35
                ? "#2563EB"
                : position <= 65
                  ? "#7C3AED"
                  : "#DC2626",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
