import { createClient } from "@/lib/supabase-browser";

// ── Point Values ──
export const POINTS = {
  generate_letter: 5,
  generate_call_script: 5,
  generate_email: 5,
  mail_physical_letter: 25,
  make_call: 15,
  send_email: 10,
  contact_new_rep: 10,    // bonus: first time contacting this rep
  new_issue_topic: 5,     // bonus: first time on this issue
  daily_streak: 5,        // per day
  streak_7_day: 50,       // bonus at 7 days
  streak_30_day: 200,     // bonus at 30 days
} as const;

// ── Levels ──
export const LEVELS = [
  { name: "Citizen", minPoints: 0, color: "#6B7280" },
  { name: "Engaged", minPoints: 50, color: "#3B82F6" },
  { name: "Advocate", minPoints: 200, color: "#8B5CF6" },
  { name: "Organizer", minPoints: 500, color: "#F59E0B" },
  { name: "Movement Leader", minPoints: 1500, color: "#EF4444" },
] as const;

export function getLevelForPoints(points: number) {
  let level: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) level = l;
  }
  return level;
}

export function getNextLevel(points: number) {
  for (const l of LEVELS) {
    if (points < l.minPoints) return l;
  }
  return null; // max level
}

export function getProgressToNextLevel(points: number) {
  const current = getLevelForPoints(points);
  const next = getNextLevel(points);
  if (!next) return 1; // max level
  const range = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return Math.min(progress / range, 1);
}

// ── Award Points ──
export async function awardPoints(
  userId: string,
  actionType: keyof typeof POINTS,
  description: string,
  actionId?: string
) {
  const supabase = createClient();
  const points = POINTS[actionType];

  // Insert point event
  await supabase.from("point_events").insert({
    user_id: userId,
    action_type: actionType,
    points,
    description,
    action_id: actionId || null,
  });

  // Update engagement totals
  const { data: eng } = await supabase
    .from("engagement")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!eng) return;

  const newTotal = (eng.total_points || 0) + points;
  const newLevel = getLevelForPoints(newTotal);

  await supabase
    .from("engagement")
    .update({
      total_points: newTotal,
      level: newLevel.name,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return { points, newTotal, level: newLevel };
}

// ── Record Action & Award Points ──
export async function recordAction(
  userId: string,
  action: {
    repId: string;
    repName: string;
    method: "letter" | "call" | "social";
    issue: string;
    content: string;
    concern?: string;
    deliveryStatus?: string;
  }
) {
  const supabase = createClient();

  // Insert action
  const { data: newAction, error } = await supabase
    .from("actions")
    .insert({
      user_id: userId,
      rep_id: action.repId,
      rep_name: action.repName,
      method: action.method,
      issue: action.issue,
      content: action.content?.slice(0, 2000),
      concern: action.concern?.slice(0, 500),
      delivery_status: action.deliveryStatus || "drafted",
    })
    .select()
    .single();

  if (error || !newAction) return null;

  // Determine point type
  const pointType = action.method === "letter"
    ? "generate_letter"
    : action.method === "call"
    ? "generate_call_script"
    : "generate_email";

  await awardPoints(userId, pointType, `Generated ${action.method} to ${action.repName}`, newAction.id);

  // Check for bonus: first time contacting this rep
  const { count: repCount } = await supabase
    .from("actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("rep_id", action.repId);

  if (repCount === 1) {
    await awardPoints(userId, "contact_new_rep", `First contact with ${action.repName}`, newAction.id);
  }

  // Check for bonus: first time on this issue
  if (action.issue) {
    const { count: issueCount } = await supabase
      .from("actions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("issue", action.issue);

    if (issueCount === 1) {
      await awardPoints(userId, "new_issue_topic", `First action on ${action.issue}`, newAction.id);
    }
  }

  // Update engagement counters
  const { data: eng } = await supabase
    .from("engagement")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (eng) {
    const now = new Date();
    const lastAction = eng.last_action_at ? new Date(eng.last_action_at) : null;
    const daysSince = lastAction
      ? Math.floor((now.getTime() - lastAction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    let newStreak = eng.streak_days || 0;
    if (daysSince === 1) {
      newStreak += 1;
    } else if (daysSince > 1) {
      newStreak = 1;
    }
    // daysSince === 0 means same day, don't change streak

    const longestStreak = Math.max(eng.longest_streak || 0, newStreak);

    // Streak bonuses
    if (daysSince === 1) {
      await awardPoints(userId, "daily_streak", `Day ${newStreak} streak`);
      if (newStreak === 7) {
        await awardPoints(userId, "streak_7_day", "7-day streak bonus!");
      }
      if (newStreak === 30) {
        await awardPoints(userId, "streak_30_day", "30-day streak bonus!");
      }
    }

    // Count unique reps and issues
    const { count: uniqueReps } = await supabase
      .from("actions")
      .select("rep_id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: uniqueIssues } = await supabase
      .from("actions")
      .select("issue", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("issue", "");

    const updates: Record<string, unknown> = {
      last_action_at: now.toISOString(),
      streak_days: newStreak,
      longest_streak: longestStreak,
      unique_reps: uniqueReps || 0,
      unique_issues: uniqueIssues || 0,
      updated_at: now.toISOString(),
    };

    if (action.method === "letter") updates.letters_sent = (eng.letters_sent || 0) + 1;
    if (action.method === "call") updates.calls_made = (eng.calls_made || 0) + 1;
    if (action.method === "social") updates.emails_sent = (eng.emails_sent || 0) + 1;

    await supabase.from("engagement").update(updates).eq("user_id", userId);
  }

  return newAction;
}

// ── Record Mail Action (physical letter paid) ──
export async function recordMailAction(
  userId: string,
  actionId: string,
  stripeSessionId: string
) {
  const supabase = createClient();

  await supabase
    .from("actions")
    .update({
      delivery_status: "mailed",
      mailed_at: new Date().toISOString(),
      stripe_session_id: stripeSessionId,
    })
    .eq("id", actionId)
    .eq("user_id", userId);

  await awardPoints(userId, "mail_physical_letter", "Mailed a physical letter", actionId);

  // Update mailed count
  const { data: eng } = await supabase
    .from("engagement")
    .select("letters_mailed")
    .eq("user_id", userId)
    .single();

  if (eng) {
    await supabase
      .from("engagement")
      .update({ letters_mailed: (eng.letters_mailed || 0) + 1 })
      .eq("user_id", userId);
  }
}
