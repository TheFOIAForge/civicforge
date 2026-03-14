"use client";

import { useAuth } from "@/lib/auth-context";
import { getLevelForPoints, getNextLevel, getProgressToNextLevel, LEVELS } from "@/lib/points";
import { createClient } from "@/lib/supabase-browser";
import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Mail,
  Phone,
  PenLine,
  Trophy,
  Flame,
  Users,
  Star,
  LogOut,
  Check,
  Clock,
} from "lucide-react";

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
        {/* Forclaude security icon */}
        <img src="/images/civic/icons/security.png" alt="" className="w-16 h-16 mx-auto mb-4 opacity-60" aria-hidden="true" />
        <h1 className="text-3xl font-bold text-navy mb-3">Your Profile</h1>
        <p className="text-gray-500 mb-6">
          Create an account to track your civic engagement, earn points, and level up.
        </p>
        <Button
          onClick={() => {
            setAuthModalMessage("Create an account to start tracking your civic engagement");
            setShowAuthModal(true);
          }}
          variant="primary"
          size="lg"
        >
          Sign Up / Log In
        </Button>
      </div>
    );
  }

  const totalPoints = engagement?.total_points || 0;
  const currentLevel = getLevelForPoints(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  const progress = getProgressToNextLevel(totalPoints);
  const totalActions = (engagement?.letters_sent || 0) + (engagement?.calls_made || 0) + (engagement?.emails_sent || 0);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header card — uses gradient hero with forclaude globe as watermark */}
      <Card padding="md" className="mb-6 bg-gradient-hero border-none text-white relative overflow-hidden">
        <img
          src="/images/civic/icons/globe.png"
          alt=""
          className="absolute top-4 right-4 w-24 h-24 opacity-10"
          aria-hidden="true"
        />
        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-2xl font-bold"
            style={{ backgroundColor: currentLevel.color }}
          >
            {profile?.display_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{profile?.display_name || "Citizen"}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                style={{ backgroundColor: currentLevel.color }}
              >
                {currentLevel.name}
              </span>
              <span className="text-sm text-white/70">{totalPoints} points</span>
            </div>
          </div>
          <Button onClick={signOut} variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" icon={<LogOut className="w-4 h-4" />}>
            Sign Out
          </Button>
        </div>

        {/* Level progress */}
        {nextLevel && (
          <div className="mt-5 relative z-10">
            <div className="flex justify-between mb-1.5 text-xs text-white/60">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.name} ({nextLevel.minPoints} pts)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress * 100}%`, backgroundColor: currentLevel.color }}
              />
            </div>
            <p className="text-xs text-white/50 mt-1.5">
              {nextLevel.minPoints - totalPoints} points to {nextLevel.name}
            </p>
          </div>
        )}
      </Card>

      {/* Stats grid — with forclaude civic icons as accents */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Letters", value: engagement?.letters_sent || 0, Icon: Mail, color: "text-navy", civicIcon: "/images/civic/icons/mail.png" },
          { label: "Calls", value: engagement?.calls_made || 0, Icon: Phone, color: "text-teal", civicIcon: "/images/civic/icons/contact.png" },
          { label: "Emails", value: engagement?.emails_sent || 0, Icon: PenLine, color: "text-gold-dark", civicIcon: "/images/civic/icons/email.png" },
          { label: "Mailed", value: engagement?.letters_mailed || 0, Icon: Check, color: "text-green" },
        ].map((s) => (
          <Card key={s.label} padding="sm" className="text-center">
            {s.civicIcon ? (
              <img src={s.civicIcon} alt="" className="w-5 h-5 mx-auto mb-1 opacity-70" aria-hidden="true" />
            ) : (
              <s.Icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
            )}
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Streak + unique stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card padding="sm" className="text-center border-gold/30">
          <Flame className="w-4 h-4 mx-auto mb-1 text-gold-dark" />
          <div className="text-xl font-bold text-gold-dark">{engagement?.streak_days || 0}</div>
          <div className="text-[10px] text-gray-500 font-medium">DAY STREAK</div>
        </Card>
        <Card padding="sm" className="text-center">
          <img src="/images/civic/icons/candidates.png" alt="" className="w-5 h-5 mx-auto mb-1 opacity-70" aria-hidden="true" />
          <div className="text-xl font-bold text-navy">{engagement?.unique_reps || 0}</div>
          <div className="text-[10px] text-gray-500 font-medium">REPS CONTACTED</div>
        </Card>
        <Card padding="sm" className="text-center">
          <img src="/images/civic/icons/ballot.png" alt="" className="w-5 h-5 mx-auto mb-1 opacity-70" aria-hidden="true" />
          <div className="text-xl font-bold text-teal">{engagement?.unique_issues || 0}</div>
          <div className="text-[10px] text-gray-500 font-medium">ISSUES</div>
        </Card>
      </div>

      {/* Level roadmap */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-gold-dark" />
          <p className="text-sm font-semibold text-navy">Level Roadmap</p>
        </div>
        <div className="space-y-1.5">
          {LEVELS.map((level) => {
            const isUnlocked = totalPoints >= level.minPoints;
            const isCurrent = level.name === currentLevel.name;
            return (
              <div
                key={level.name}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all
                  ${isCurrent ? "bg-navy-50 border border-navy/20" : isUnlocked ? "bg-gray-50" : "opacity-40"}`}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: isUnlocked ? level.color : "#D1D5DB" }}
                />
                <span className={`text-sm font-medium flex-1 ${isUnlocked ? "text-navy" : "text-gray-400"}`}>
                  {level.name}
                </span>
                <span className="text-xs text-gray-400">{level.minPoints} pts</span>
                {isUnlocked && <Check className="w-4 h-4 text-green" />}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1 mb-4">
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all border-none
            ${activeTab === "actions" ? "bg-white text-navy shadow-sm" : "text-gray-500 bg-transparent"}`}
        >
          Action History ({totalActions})
        </button>
        <button
          onClick={() => setActiveTab("points")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all border-none
            ${activeTab === "points" ? "bg-white text-navy shadow-sm" : "text-gray-500 bg-transparent"}`}
        >
          Points Log
        </button>
      </div>

      {/* Actions list */}
      {activeTab === "actions" && (
        <div className="space-y-2">
          {actions.length === 0 && (
            <Card padding="lg" className="text-center">
              <p className="text-sm text-gray-500">
                No actions yet.{" "}
                <Link href="/draft" className="font-semibold text-navy">Write your first letter</Link>
                {" "}to get started!
              </p>
            </Card>
          )}
          {actions.map((a) => {
            const methodIcon = a.method === "letter" ? <Mail className="w-3.5 h-3.5" /> : a.method === "call" ? <Phone className="w-3.5 h-3.5" /> : <PenLine className="w-3.5 h-3.5" />;
            const methodColor = a.method === "letter" ? "bg-navy text-white" : a.method === "call" ? "bg-teal text-white" : "bg-gold-dark text-white";
            return (
              <Card key={a.id} padding="sm" className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${methodColor}`}>
                  {methodIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{a.rep_name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {a.issue || "General"} · {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {a.delivery_status === "mailed" && (
                    <span className="text-xs font-medium text-green flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mailed
                    </span>
                  )}
                  {a.lob_tracking_url && (
                    <a href={a.lob_tracking_url} target="_blank" rel="noopener noreferrer"
                      className="block text-xs text-teal mt-0.5">
                      Track
                    </a>
                  )}
                  {a.expected_delivery_date && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(a.expected_delivery_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Points log */}
      {activeTab === "points" && (
        <div className="space-y-1">
          {pointEvents.length === 0 && (
            <Card padding="lg" className="text-center">
              <p className="text-sm text-gray-500">
                No points earned yet. Take action to start earning!
              </p>
            </Card>
          )}
          {pointEvents.map((pe) => (
            <div
              key={pe.id}
              className="flex items-center justify-between py-3 px-1 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm text-navy">{pe.description}</p>
                <p className="text-xs text-gray-400">{new Date(pe.created_at).toLocaleDateString()}</p>
              </div>
              <span className="text-lg font-bold text-green">+{pe.points}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
