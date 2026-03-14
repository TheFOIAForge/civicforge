"use client";

import { useAuth } from "@/lib/auth-context";
import { getLevelForPoints, getNextLevel, getProgressToNextLevel, LEVELS } from "@/lib/points";
import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";
import Link from "next/link";

interface ActionRecord {
  id: string;
  rep_name: string;
  method: string;
  issue: string;
  delivery_status: string;
  lob_tracking_url: string | null;
  expected_delivery_date: string | null;
  created_at: string;
  points_awarded: number;
}

interface PointEvent {
  id: string;
  action_type: string;
  points: number;
  description: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, profile, engagement, signOut, setShowAuthModal, setAuthModalMessage } = useAuth();
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [pointEvents, setPointEvents] = useState<PointEvent[]>([]);
  const [activeTab, setActiveTab] = useState<"actions" | "points">("actions");

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    supabase
      .from("actions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: ActionRecord[] | null }) => { if (data) setActions(data); });

    supabase
      .from("point_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: PointEvent[] | null }) => { if (data) setPointEvents(data); });
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="font-headline text-4xl uppercase mb-4" style={{ color: "#1a1a1a" }}>
          Your Profile
        </h1>
        <p className="font-body text-base mb-6" style={{ color: "#5a5a5a" }}>
          Create an account to track your activism, earn points, and level up.
        </p>
        <button
          onClick={() => {
            setAuthModalMessage("Create an account to start tracking your activism");
            setShowAuthModal(true);
          }}
          className="px-8 py-4 font-headline text-lg uppercase cursor-pointer"
          style={{ backgroundColor: "#C1272D", color: "#f5e6c8", border: "3px solid #1a1a1a" }}
        >
          Sign Up / Log In
        </button>
      </div>
    );
  }

  const totalPoints = engagement?.total_points || 0;
  const currentLevel = getLevelForPoints(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  const progress = getProgressToNextLevel(totalPoints);
  const totalActions = (engagement?.letters_sent || 0) + (engagement?.calls_made || 0) + (engagement?.emails_sent || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile header */}
      <div className="p-5 mb-6" style={{ backgroundColor: "#1a1a1a", color: "#f5e6c8", border: "3px solid #1a1a1a" }}>
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 flex items-center justify-center shrink-0 text-2xl font-headline"
            style={{ backgroundColor: currentLevel.color, border: "3px solid #c4a44a" }}
          >
            {profile?.display_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h1 className="font-headline text-2xl normal-case" style={{ color: "#f5e6c8" }}>{profile?.display_name || "Activist"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 font-mono text-[10px] font-bold uppercase"
                style={{ backgroundColor: currentLevel.color, color: "#f5e6c8" }}
              >
                {currentLevel.name}
              </span>
              <span className="font-mono text-xs" style={{ color: "#c4a44a" }}>
                {totalPoints} pts
              </span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="px-3 py-2 font-mono text-[10px] font-bold uppercase cursor-pointer"
            style={{ backgroundColor: "rgba(245,230,200,0.1)", color: "#c4a44a", border: "2px solid #c4a44a" }}
          >
            Sign Out
          </button>
        </div>

        {/* Level progress */}
        {nextLevel && (
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span className="font-mono text-[10px]" style={{ color: "#c4a44a" }}>
                {currentLevel.name}
              </span>
              <span className="font-mono text-[10px]" style={{ color: "#c4a44a" }}>
                {nextLevel.name} ({nextLevel.minPoints} pts)
              </span>
            </div>
            <div className="h-2 w-full" style={{ backgroundColor: "rgba(245,230,200,0.15)" }}>
              <div
                className="h-full transition-all"
                style={{ width: `${progress * 100}%`, backgroundColor: currentLevel.color }}
              />
            </div>
            <p className="font-mono text-[10px] mt-1" style={{ color: "rgba(245,230,200,0.5)" }}>
              {nextLevel.minPoints - totalPoints} points to {nextLevel.name}
            </p>
          </div>
        )}
      </div>

      {/* Star separator */}
      <div className="text-center mb-6" style={{ color: "#c4a44a", letterSpacing: "0.5em", fontSize: "14px" }}>
        &#9733; &#9733; &#9733;
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: "Letters", value: engagement?.letters_sent || 0, color: "#C1272D" },
          { label: "Calls", value: engagement?.calls_made || 0, color: "#1a1a1a" },
          { label: "Emails", value: engagement?.emails_sent || 0, color: "#1a1a1a" },
          { label: "Mailed", value: engagement?.letters_mailed || 0, color: "#16a34a" },
        ].map((s) => (
          <div key={s.label} className="p-3 text-center" style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}>
            <div className="font-headline text-2xl" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="font-mono text-[10px] font-bold uppercase" style={{ color: "#5a5a5a" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Streak + unique stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="p-3 text-center" style={{ backgroundColor: "#faf6ee", border: "3px solid #c4a44a" }}>
          <div className="font-headline text-xl" style={{ color: "#c4a44a" }}>
            {engagement?.streak_days || 0}
          </div>
          <div className="font-mono text-[10px] font-bold" style={{ color: "#5a5a5a" }}>DAY STREAK</div>
        </div>
        <div className="p-3 text-center" style={{ backgroundColor: "#faf6ee", border: "3px solid #1a1a1a" }}>
          <div className="font-headline text-xl" style={{ color: "#1a1a1a" }}>
            {engagement?.unique_reps || 0}
          </div>
          <div className="font-mono text-[10px] font-bold" style={{ color: "#5a5a5a" }}>REPS CONTACTED</div>
        </div>
        <div className="p-3 text-center" style={{ backgroundColor: "#faf6ee", border: "3px solid #C1272D" }}>
          <div className="font-headline text-xl" style={{ color: "#C1272D" }}>
            {engagement?.unique_issues || 0}
          </div>
          <div className="font-mono text-[10px] font-bold" style={{ color: "#5a5a5a" }}>ISSUES</div>
        </div>
      </div>

      {/* Level roadmap */}
      <div className="mb-6 p-4" style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}>
        <p className="font-mono text-xs font-bold mb-3" style={{ color: "#5a5a5a" }}>
          LEVEL ROADMAP
        </p>
        <div className="space-y-2">
          {LEVELS.map((level) => {
            const isUnlocked = totalPoints >= level.minPoints;
            const isCurrent = level.name === currentLevel.name;
            return (
              <div
                key={level.name}
                className="flex items-center gap-3 py-2 px-3"
                style={{
                  backgroundColor: isCurrent ? "rgba(193,39,45,0.08)" : "transparent",
                  border: isCurrent ? "3px solid #C1272D" : "2px solid rgba(26,26,26,0.1)",
                  opacity: isUnlocked ? 1 : 0.4,
                }}
              >
                <div
                  className="w-3 h-3 shrink-0"
                  style={{ backgroundColor: isUnlocked ? level.color : "rgba(26,26,26,0.15)" }}
                />
                <span className="font-headline text-sm flex-1" style={{ color: isUnlocked ? "#1a1a1a" : "#5a5a5a" }}>
                  {level.name}
                </span>
                <span className="font-mono text-[10px] font-bold" style={{ color: "#5a5a5a" }}>
                  {level.minPoints} pts
                </span>
                {isUnlocked && (
                  <span className="font-mono text-[10px]" style={{ color: "#16a34a" }}>&#10003;</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Star separator */}
      <div className="text-center mb-4" style={{ color: "#c4a44a", letterSpacing: "0.5em", fontSize: "14px" }}>
        &#9733; &#9733; &#9733;
      </div>

      {/* Tabs: Actions / Points */}
      <div className="flex mb-4" style={{ border: "3px solid #1a1a1a" }}>
        <button
          onClick={() => setActiveTab("actions")}
          className="flex-1 py-2.5 font-mono text-xs font-bold uppercase cursor-pointer border-none"
          style={{
            backgroundColor: activeTab === "actions" ? "#1a1a1a" : "#faf6ee",
            color: activeTab === "actions" ? "#f5e6c8" : "#5a5a5a",
          }}
        >
          Action History ({totalActions})
        </button>
        <button
          onClick={() => setActiveTab("points")}
          className="flex-1 py-2.5 font-mono text-xs font-bold uppercase cursor-pointer border-none"
          style={{
            backgroundColor: activeTab === "points" ? "#1a1a1a" : "#faf6ee",
            color: activeTab === "points" ? "#f5e6c8" : "#5a5a5a",
          }}
        >
          Points Log
        </button>
      </div>

      {/* Actions list */}
      {activeTab === "actions" && (
        <div className="space-y-2">
          {actions.length === 0 && (
            <div className="p-6 text-center" style={{ backgroundColor: "#faf6ee", border: "3px solid #1a1a1a" }}>
              <p className="font-body text-sm" style={{ color: "#5a5a5a" }}>
                No actions yet.{" "}
                <Link href="/draft" className="font-bold no-underline" style={{ color: "#C1272D" }}>
                  Write your first letter
                </Link>
                {" "}to get started!
              </p>
            </div>
          )}
          {actions.map((a) => {
            const methodColor = a.method === "letter" ? "#C1272D" : a.method === "call" ? "#1a1a1a" : "#1a1a1a";
            const methodLabel = a.method === "letter" ? "LETTER" : a.method === "call" ? "CALL" : "EMAIL";
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3"
                style={{ border: "3px solid #1a1a1a", backgroundColor: "#faf6ee" }}
              >
                <div
                  className="px-2 py-1 font-mono text-[9px] font-bold shrink-0"
                  style={{ backgroundColor: methodColor, color: "#f5e6c8" }}
                >
                  {methodLabel}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-bold truncate" style={{ color: "#1a1a1a" }}>
                    {a.rep_name}
                  </p>
                  <p className="font-mono text-[10px] truncate" style={{ color: "#5a5a5a" }}>
                    {a.issue || "General"} &middot; {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {a.delivery_status === "mailed" && (
                    <span className="font-mono text-[10px] font-bold" style={{ color: "#16a34a" }}>
                      MAILED
                    </span>
                  )}
                  {a.lob_tracking_url && (
                    <a
                      href={a.lob_tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-mono text-[9px] no-underline mt-0.5"
                      style={{ color: "#c4a44a" }}
                    >
                      Track
                    </a>
                  )}
                  {a.expected_delivery_date && (
                    <p className="font-mono text-[9px]" style={{ color: "#5a5a5a" }}>
                      ETA {new Date(a.expected_delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Points log */}
      {activeTab === "points" && (
        <div className="space-y-1">
          {pointEvents.length === 0 && (
            <div className="p-6 text-center" style={{ backgroundColor: "#faf6ee", border: "3px solid #1a1a1a" }}>
              <p className="font-body text-sm" style={{ color: "#5a5a5a" }}>
                No points earned yet. Take action to start earning!
              </p>
            </div>
          )}
          {pointEvents.map((pe) => (
            <div
              key={pe.id}
              className="flex items-center justify-between py-2 px-3"
              style={{ borderBottom: "2px solid rgba(26,26,26,0.1)" }}
            >
              <div>
                <p className="font-mono text-xs" style={{ color: "#1a1a1a" }}>{pe.description}</p>
                <p className="font-mono text-[10px]" style={{ color: "#5a5a5a" }}>
                  {new Date(pe.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="font-headline text-lg" style={{ color: "#16a34a" }}>
                +{pe.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
