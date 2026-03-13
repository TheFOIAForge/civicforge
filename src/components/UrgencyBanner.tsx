"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { UrgentAction } from "@/data/types";
import staticActions from "@/data/urgent-actions.json";

const DISMISSED_KEY = "citizenforge_dismissed_alerts";
const CYCLE_INTERVAL = 6000; // 6 seconds per item

function getDismissedIds(): string[] {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function dismissItem(id: string) {
  const dismissed = getDismissedIds();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "EXPIRED";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

export default function UrgencyBanner() {
  const [items, setItems] = useState<UrgentAction[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [countdown, setCountdown] = useState("");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load items on mount
  useEffect(() => {
    setMounted(true);
    const dismissedIds = getDismissedIds();
    setDismissed(new Set(dismissedIds));
    const now = Date.now();

    let allActions: UrgentAction[] = (staticActions as UrgentAction[]).filter(
      (a) => new Date(a.deadline).getTime() > now && !dismissedIds.includes(a.id)
    );

    fetch("/api/feed")
      .then((r) => r.json())
      .then((feedItems: Array<{ id: string; type: string; title: string; subtitle: string; date: string; urgency: string; actionLabel?: string; actionUrl?: string }>) => {
        const highUrgency = feedItems
          .filter((item) => item.urgency === "high" && !dismissedIds.includes(item.id))
          .map((item): UrgentAction => ({
            id: item.id,
            type: item.type,
            title: item.title,
            subtitle: item.subtitle,
            deadline: item.date,
            actionLabel: item.actionLabel || "TAKE ACTION",
            actionUrl: item.actionUrl || "/",
            priority: 0,
          }));

        allActions = [...highUrgency, ...allActions];
        allActions.sort((a, b) => a.priority - b.priority);
        setItems(allActions);
      })
      .catch(() => {
        allActions.sort((a, b) => a.priority - b.priority);
        setItems(allActions);
      });
  }, []);

  // Filter out dismissed
  const visibleItems = items.filter((i) => !dismissed.has(i.id));
  const activeItem = visibleItems[activeIndex % Math.max(visibleItems.length, 1)] || null;

  // Carousel auto-cycle
  useEffect(() => {
    if (visibleItems.length <= 1) return;

    cycleRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % visibleItems.length);
    }, CYCLE_INTERVAL);

    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [visibleItems.length]);

  // Countdown timer
  useEffect(() => {
    if (!activeItem || !mounted) return;

    function tick() {
      const remaining = new Date(activeItem!.deadline).getTime() - Date.now();
      setCountdown(formatCountdown(remaining));
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }

    tick();
    countdownRef.current = setInterval(tick, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [activeItem, mounted]);

  const handleDismiss = useCallback(() => {
    if (activeItem) {
      dismissItem(activeItem.id);
      setDismissed((prev) => new Set([...prev, activeItem.id]));
      // Reset index if we're past the end
      setActiveIndex(0);
    }
  }, [activeItem]);

  const goTo = useCallback((idx: number) => {
    setActiveIndex(idx);
    // Reset the cycle timer
    if (cycleRef.current) clearInterval(cycleRef.current);
    if (visibleItems.length > 1) {
      cycleRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % visibleItems.length);
      }, CYCLE_INTERVAL);
    }
  }, [visibleItems.length]);

  if (!mounted || visibleItems.length === 0) return null;

  return (
    <div
      role="alert"
      aria-label="Urgent action needed"
      aria-live="polite"
      style={{ backgroundColor: "#C1272D" }}
      className="w-full text-white"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
          <span
            className="font-mono text-xs font-bold px-2 py-1 shrink-0"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            URGENT
          </span>
          <span className="font-headline text-sm sm:text-base normal-case truncate">
            {activeItem?.title}
          </span>
          <span
            className="font-mono text-sm font-bold shrink-0"
            style={{ color: "#FFD54F" }}
          >
            {countdown}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Carousel dots */}
          {visibleItems.length > 1 && (
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Urgent items">
              {visibleItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => goTo(idx)}
                  role="tab"
                  aria-selected={idx === activeIndex % visibleItems.length}
                  aria-label={`Item ${idx + 1}: ${item.title}`}
                  className="w-2 h-2 border-none cursor-pointer transition-all"
                  style={{
                    backgroundColor: idx === activeIndex % visibleItems.length ? "#fff" : "rgba(255,255,255,0.4)",
                    borderRadius: "50%",
                  }}
                />
              ))}
            </div>
          )}
          {activeItem && (
            <Link
              href={activeItem.actionUrl}
              className="px-4 py-2 font-mono text-sm font-bold no-underline"
              style={{ backgroundColor: "#000", color: "#fff" }}
            >
              {activeItem.actionLabel}
            </Link>
          )}
          <button
            onClick={handleDismiss}
            className="text-white text-xl leading-none cursor-pointer bg-transparent border-none px-1 hover:opacity-70"
            aria-label="Dismiss alert"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
