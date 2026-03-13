"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useMyReps } from "@/lib/my-reps-context";

interface AlertSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface Alert {
  id: string;
  type: "comment_deadline" | "gao_report" | "new_rule";
  title: string;
  detail: string;
  date: string;
  urgency: "high" | "medium" | "low";
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const STORAGE_KEY = "checkmyrep_alerts";
const SETTINGS_KEY = "checkmyrep_alert_settings";

const DEFAULT_SETTINGS: AlertSetting[] = [
  {
    id: "comment_deadlines",
    label: "Comment Period Deadlines",
    description: "Alert when a federal rule's comment period is closing within 7 days",
    enabled: true,
  },
  {
    id: "gao_reports",
    label: "New GAO Reports",
    description: "Alert when new oversight reports are published",
    enabled: true,
  },
  {
    id: "my_rep_activity",
    label: "My Rep Activity",
    description: "Alert when your saved representatives introduce bills or vote on major legislation",
    enabled: true,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<AlertSetting[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { myReps, hasSavedReps } = useMyReps();

  // Load saved settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    const newAlerts: Alert[] = [];

    // Load persisted read state
    let readIds: string[] = [];
    try {
      readIds = JSON.parse(localStorage.getItem(STORAGE_KEY + "_read") || "[]");
    } catch { /* ignore */ }

    // Fetch closing comment periods
    if (settings.find((s) => s.id === "comment_deadlines")?.enabled) {
      try {
        const res = await fetch("/api/feed");
        if (res.ok) {
          const items = await res.json();
          for (const item of items) {
            if (item.type === "comment_closing") {
              newAlerts.push({
                id: item.id,
                type: "comment_deadline",
                title: item.title,
                detail: item.subtitle,
                date: item.date,
                urgency: item.urgency,
                read: readIds.includes(item.id),
                actionUrl: item.url,
                actionLabel: "VIEW & COMMENT",
              });
            }
          }
        }
      } catch { /* ignore */ }
    }

    // Fetch recent GAO reports
    if (settings.find((s) => s.id === "gao_reports")?.enabled) {
      try {
        const res = await fetch("/api/gao-reports?limit=5");
        if (res.ok) {
          const reports = await res.json();
          for (const r of reports.slice(0, 3)) {
            const id = `gao-alert-${r.packageId}`;
            newAlerts.push({
              id,
              type: "gao_report",
              title: r.title,
              detail: `GAO Report ${r.reportNumber || ""} — Published ${new Date(r.dateIssued).toLocaleDateString()}`,
              date: r.dateIssued,
              urgency: "low",
              read: readIds.includes(id),
              actionUrl: `/gao-reports`,
              actionLabel: "READ REPORT",
            });
          }
        }
      } catch { /* ignore */ }
    }

    newAlerts.sort((a, b) => {
      // Unread first, then by urgency, then by date
      if (a.read !== b.read) return a.read ? 1 : -1;
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      const uo = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (uo !== 0) return uo;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    setAlerts(newAlerts);
    setLoading(false);
  }, [settings]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  function markRead(alertId: string) {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)));
    try {
      const readIds: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY + "_read") || "[]");
      if (!readIds.includes(alertId)) {
        readIds.push(alertId);
        localStorage.setItem(STORAGE_KEY + "_read", JSON.stringify(readIds));
      }
    } catch { /* ignore */ }
  }

  function markAllRead() {
    const ids = alerts.map((a) => a.id);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    localStorage.setItem(STORAGE_KEY + "_read", JSON.stringify(ids));
  }

  function toggleSetting(id: string) {
    const updated = settings.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setSettings(updated);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-headline text-5xl md:text-6xl">Alerts</h1>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-3 py-1.5 font-mono text-xs font-bold border-2 border-border text-gray-mid hover:text-black hover:border-black transition-colors cursor-pointer"
            >
              MARK ALL READ
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 font-mono text-xs font-bold border-2 border-border text-gray-mid hover:text-black hover:border-black transition-colors cursor-pointer"
          >
            {showSettings ? "CLOSE SETTINGS" : "SETTINGS"}
          </button>
        </div>
      </div>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        COMMENT DEADLINES, NEW REPORTS, AND LEGISLATIVE ACTIVITY
        {unreadCount > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-red text-white text-xs">
            {unreadCount} NEW
            <span className="sr-only"> unread alerts</span>
          </span>
        )}
      </p>

      {/* Settings panel */}
      {showSettings && (
        <section className="border-3 border-border bg-cream-dark p-6 mb-8">
          <h2 className="font-headline text-xl mb-4">Alert Settings</h2>
          <div className="space-y-3">
            {settings.map((s) => (
              <label
                key={s.id}
                className="flex items-start gap-3 cursor-pointer p-3 border-2 border-border-light bg-surface hover:border-border transition-colors"
              >
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => toggleSetting(s.id)}
                  className="mt-0.5 w-5 h-5 accent-red cursor-pointer"
                />
                <div>
                  <div className="font-mono text-sm font-bold">{s.label}</div>
                  <div className="font-body text-xs text-gray-mid">{s.description}</div>
                </div>
              </label>
            ))}
          </div>
          {!hasSavedReps && (
            <div className="mt-4 p-3 border-2 border-red bg-red-light">
              <p className="font-mono text-xs font-bold text-red">
                Save your representatives on the homepage to get personalized alerts.
              </p>
              <Link href="/" className="font-mono text-xs font-bold text-red underline">
                GO TO HOMEPAGE
              </Link>
            </div>
          )}
          {hasSavedReps && (
            <div className="mt-4 p-3 border-2 border-border bg-surface">
              <p className="font-mono text-xs text-gray-mid">
                <span className="font-bold">Tracking {myReps.length} representative{myReps.length !== 1 ? "s" : ""}:</span>{" "}
                {myReps.map((r) => r.fullName).join(", ")}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Alerts list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-2 border-border p-5 bg-surface motion-safe:animate-pulse">
              <div className="h-3 bg-border-light w-20 mb-2" />
              <div className="h-5 bg-border-light w-3/4 mb-1" />
              <div className="h-3 bg-border-light w-1/2" />
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="border-3 border-border p-12 bg-surface text-center">
          <h2 className="font-headline text-2xl mb-2">No Alerts</h2>
          <p className="font-body text-base text-gray-mid">
            All caught up! Enable more alert types in Settings or check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-3" aria-live="polite" role="region" aria-label="Alert notifications">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-2 p-5 transition-colors cursor-pointer ${
                !alert.read
                  ? alert.urgency === "high"
                    ? "border-red bg-red-light"
                    : alert.urgency === "medium"
                      ? "border-yellow bg-yellow-light"
                      : "border-black bg-surface"
                  : "border-border-light bg-surface opacity-70"
              }`}
              onClick={() => markRead(alert.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); markRead(alert.id); } }}
              role="button"
              tabIndex={0}
              aria-label={`${alert.read ? "Read" : "Unread"} alert: ${alert.title}. Click to mark as read.`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 font-mono text-[10px] font-bold ${
                    alert.type === "comment_deadline" ? "bg-red text-white" :
                    alert.type === "gao_report" ? "bg-black text-white" :
                    "bg-gray-mid text-white"
                  }`}>
                    {alert.type === "comment_deadline" ? "DEADLINE" :
                     alert.type === "gao_report" ? "GAO" : "UPDATE"}
                  </span>
                  <span className="font-mono text-[10px] text-gray-mid">
                    {new Date(alert.date).toLocaleDateString()}
                  </span>
                  {!alert.read && (
                    <span className="w-2 h-2 bg-red rounded-full" aria-hidden="true" />
                  )}
                </div>
              </div>
              <h3 className="font-headline text-lg normal-case leading-tight mb-1">
                {alert.title}
              </h3>
              <p className="font-mono text-xs text-gray-mid mb-2">{alert.detail}</p>
              {alert.actionUrl && (
                <Link
                  href={alert.actionUrl}
                  className="font-mono text-xs font-bold text-red no-underline hover:underline"
                >
                  {alert.actionLabel || "VIEW"} &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
