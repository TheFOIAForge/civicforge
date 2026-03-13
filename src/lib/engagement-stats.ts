import type { ContactLogEntry, EngagementStats } from "@/data/types";

/**
 * Get the Monday-based week key for a given date string (YYYY-MM-DD or ISO).
 * Returns "YYYY-Www" where ww is the ISO week number.
 */
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  // Adjust to Monday-based week: set to nearest Thursday to get correct ISO week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d);
  monday.setDate(diff);

  // ISO week number: week 1 is the week with the year's first Thursday
  const jan1 = new Date(monday.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((monday.getTime() - jan1.getTime()) / 86400000) + 1;
  const weekNum = Math.ceil(dayOfYear / 7);

  return `${monday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/**
 * Returns a sorted array of consecutive week keys starting from startWeek going back.
 */
function getPreviousWeekKey(weekKey: string): string {
  // Parse YYYY-Www
  const [yearStr, wStr] = weekKey.split("-W");
  let year = parseInt(yearStr, 10);
  let week = parseInt(wStr, 10);

  week -= 1;
  if (week < 1) {
    year -= 1;
    // Approximate: most years have 52 weeks, some have 53
    week = 52;
  }

  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function getEngagementStats(contacts: ContactLogEntry[]): EngagementStats {
  const stats: EngagementStats = {
    totalActions: contacts.length,
    lettersSent: 0,
    callsMade: 0,
    socialPosts: 0,
    uniqueRepsContacted: 0,
    uniqueIssues: 0,
    currentStreak: 0,
    longestStreak: 0,
    thisMonth: 0,
    lastAction: undefined,
    mostContactedRep: undefined,
    topIssue: undefined,
  };

  if (contacts.length === 0) return stats;

  // Count by method
  const repIds = new Set<string>();
  const issueSet = new Set<string>();
  const repCounts = new Map<string, { name: string; count: number }>();
  const issueCounts = new Map<string, number>();
  const weekSet = new Set<string>();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let latestDate: string | undefined;

  for (const c of contacts) {
    // Method counts
    if (c.method === "letter") stats.lettersSent++;
    else if (c.method === "call") stats.callsMade++;
    else if (c.method === "social") stats.socialPosts++;

    // Unique reps and issues
    repIds.add(c.repId);
    issueSet.add(c.issue);

    // Rep frequency
    const existing = repCounts.get(c.repId);
    if (existing) {
      existing.count++;
    } else {
      repCounts.set(c.repId, { name: c.repName, count: 1 });
    }

    // Issue frequency
    issueCounts.set(c.issue, (issueCounts.get(c.issue) || 0) + 1);

    // Week tracking
    weekSet.add(getWeekKey(c.date));

    // This month
    const d = new Date(c.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      stats.thisMonth++;
    }

    // Latest action
    if (!latestDate || c.date > latestDate) {
      latestDate = c.date;
    }
  }

  stats.uniqueRepsContacted = repIds.size;
  stats.uniqueIssues = issueSet.size;
  stats.lastAction = latestDate;

  // Most contacted rep
  let maxRepCount = 0;
  for (const entry of repCounts.values()) {
    if (entry.count > maxRepCount) {
      maxRepCount = entry.count;
      stats.mostContactedRep = { name: entry.name, count: entry.count };
    }
  }

  // Top issue
  let maxIssueCount = 0;
  for (const [issue, count] of issueCounts.entries()) {
    if (count > maxIssueCount) {
      maxIssueCount = count;
      stats.topIssue = { name: issue, count };
    }
  }

  // Streak calculation: consecutive weeks with >= 1 action
  // Current streak: count backward from current week
  const currentWeekKey = getWeekKey(now.toISOString());
  let streak = 0;
  let checkWeek = currentWeekKey;

  while (weekSet.has(checkWeek)) {
    streak++;
    checkWeek = getPreviousWeekKey(checkWeek);
  }
  stats.currentStreak = streak;

  // Longest streak: sort all weeks and find longest consecutive run
  const allWeeks = Array.from(weekSet).sort();
  let longest = 0;
  let run = 0;
  let prevWeek = "";

  for (const w of allWeeks) {
    if (prevWeek && getPreviousWeekKey(w) === prevWeek) {
      // This week follows the previous one — but we need to check forward.
      // Actually, let's just iterate by checking if next expected week exists.
    }
    prevWeek = w;
  }

  // Better approach: iterate through sorted weeks and count consecutive
  if (allWeeks.length > 0) {
    run = 1;
    longest = 1;
    for (let i = 1; i < allWeeks.length; i++) {
      // Check if allWeeks[i] is exactly one week after allWeeks[i-1]
      const expectedNext = nextWeekKey(allWeeks[i - 1]);
      if (allWeeks[i] === expectedNext) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 1;
      }
    }
  }
  stats.longestStreak = Math.max(longest, stats.currentStreak);

  return stats;
}

function nextWeekKey(weekKey: string): string {
  const [yearStr, wStr] = weekKey.split("-W");
  let year = parseInt(yearStr, 10);
  let week = parseInt(wStr, 10);

  week += 1;
  if (week > 52) {
    year += 1;
    week = 1;
  }

  return `${year}-W${String(week).padStart(2, "0")}`;
}
