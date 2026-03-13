"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from "react";
import { issues } from "@/data/issues";
import type { Representative, ContactLogEntry } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";
import { useUserMode } from "@/lib/user-mode-context";
import { getEngagementStats } from "@/lib/engagement-stats";

function partyBg(party: string) {
  if (party === "D") return "bg-dem";
  if (party === "R") return "bg-rep";
  return "bg-ind";
}

const issueColor: Record<string, string> = {
  healthcare: "#c62828",
  environment: "#2e7d32",
  housing: "#e65100",
  immigration: "#1565c0",
  education: "#6a1b9a",
  economy: "#f9a825",
  "civil-rights": "#37474f",
  defense: "#1a1a2e",
};

const issueSvgPath: Record<string, string> = {
  healthcare: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  environment: "M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.95 7.95l-.71-.71M4.76 4.76l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z",
  housing: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  immigration: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  education: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
  economy: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "civil-rights": "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  defense: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
};

const issueImage: Record<string, string> = {
  healthcare: "/images/issues/healthcare.jpg",
  environment: "/images/issues/environment.jpg",
  housing: "/images/issues/housing.jpg",
  immigration: "/images/issues/immigration.jpg",
  education: "/images/issues/education.jpg",
  economy: "/images/issues/economy.jpg",
  "civil-rights": "/images/issues/civil-rights.jpg",
  defense: "/images/issues/defense.jpg",
};

interface FeedItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  date: string;
  urgency: "high" | "medium" | "low";
  url?: string;
  actionLabel?: string;
  actionUrl?: string;
}

/** Intersection Observer hook for scroll animations */
/** Live hot-issue banner — cycles through feed items */
function LiveIssueBanner({ items }: { items: FeedItem[] }) {
  const [idx, setIdx] = useState(0);
  const current = items[idx % items.length];

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  const urgencyLabel = current.urgency === "high" ? "URGENT" : current.urgency === "medium" ? "TRENDING" : "NEW";
  const urgencyBg = current.urgency === "high" ? "#C1272D" : current.urgency === "medium" ? "#D97706" : "rgba(255,255,255,0.15)";

  return (
    <div
      className="mb-8 mx-auto max-w-2xl"
      style={{ animation: "fadeInUp 0.8s ease-out both" }}
    >
      <Link
        href={current.actionUrl || current.url || "/issues"}
        className="no-underline group block px-5 py-3 transition-all"
        style={{
          backgroundColor: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(10px)",
          borderRadius: "2px",
        }}
      >
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span
            className="font-mono text-xs font-bold px-2 py-0.5 shrink-0"
            style={{ backgroundColor: urgencyBg, color: "#fff" }}
          >
            {urgencyLabel}
          </span>
          <span
            className="font-body text-base text-white group-hover:text-red transition-colors text-center leading-snug"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
          >
            {current.title.length > 80 ? current.title.slice(0, 80) + "..." : current.title}
          </span>
          <span className="font-mono text-sm font-bold text-white/80 group-hover:text-white transition-colors shrink-0">
            {current.actionLabel || "LEARN MORE"} &rarr;
          </span>
        </div>
        {items.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx(i); }}
                className="border-none cursor-pointer p-0"
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: i === idx % items.length ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "background-color 0.2s",
                }}
                aria-label={`Issue ${i + 1}`}
              />
            ))}
          </div>
        )}
      </Link>
    </div>
  );
}

function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Small delay to ensure DOM is fully painted before observing
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: "100px" },
      );

      const targets = el.querySelectorAll(
        ".animate-on-scroll, .animate-on-scroll-left, .animate-on-scroll-scale, .stagger-children",
      );
      targets.forEach((t) => observer.observe(t));

      // Store observer for cleanup
      (el as any).__scrollObserver = observer;
    }, 100);

    return () => {
      clearTimeout(timer);
      if ((el as any).__scrollObserver) {
        (el as any).__scrollObserver.disconnect();
      }
    };
  }, []);

  return containerRef;
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [results, setResults] = useState<Representative[] | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [leadership, setLeadership] = useState<Representative[]>([]);
  const [featured, setFeatured] = useState<Representative[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const { myReps, saveRep, hasSavedReps } = useMyReps();
  const { mode, modeAtLeast } = useUserMode();
  const isActivist = mode === "activist";
  const [engagementStats, setEngagementStats] = useState<ReturnType<typeof getEngagementStats> | null>(null);
  const scrollRef = useScrollReveal();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("citizenforge_contacts");
      if (stored) {
        const contacts: ContactLogEntry[] = JSON.parse(stored);
        if (contacts.length > 0) {
          setEngagementStats(getEngagementStats(contacts));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetch("/api/members?leadership=true")
      .then((r) => r.json())
      .then(setLeadership)
      .catch(() => {});
    fetch("/api/members?featured=true")
      .then((r) => r.json())
      .then(setFeatured)
      .catch(() => {});
    fetch("/api/feed")
      .then((r) => r.json())
      .then(setFeed)
      .catch(() => setFeed([]))
      .finally(() => setFeedLoading(false));
  }, []);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const input = address.trim();
    if (!input) return;
    setLookupLoading(true);
    fetch(`/api/lookup?address=${encodeURIComponent(input)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.length > 0 ? data : []);
        setLookupLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLookupLoading(false);
      });
  }

  function handleSaveReps() {
    if (results) {
      results.forEach((rep) => saveRep(rep));
    }
  }

  const urgencyColor = (u: string) => {
    if (u === "high") return "border-red bg-red-light";
    if (u === "medium") return "border-yellow bg-yellow-light";
    return "border-border bg-surface";
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "comment_closing": return "COMMENT";
      case "gao_report": return "GAO";
      case "new_rule": return "RULE";
      case "bill_action": return "BILL";
      default: return "UPDATE";
    }
  };

  /* ──────────────────────────────────────────────────
     ACTIVIST MODE — Dark dramatic layout
  ────────────────────────────────────────────────── */
  if (isActivist) {
    return (
      <div ref={scrollRef} style={{ backgroundColor: "#111827" }}>
        {/* Hero — Full screen dramatic with background image */}
        <section
          className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        >
          {/* Background image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/hero-rally.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
            }}
          />
          {/* Gradient overlay on top of image */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(140,20,25,0.97) 0%, rgba(50,10,12,0.98) 40%, rgba(17,24,39,1) 100%)",
            }}
          />
          {/* Decorative grid */}
          <div className="absolute inset-0 grid-overlay" />
          {/* Radial glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
            style={{
              background: "radial-gradient(ellipse, rgba(193,39,45,0.3) 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 text-center px-4 py-16 w-full max-w-3xl mx-auto">
            {/* Live hot issue banner */}
            {feed.length > 0 && (
              <LiveIssueBanner items={feed} />
            )}
            <h1
              className="font-headline text-5xl sm:text-6xl md:text-8xl uppercase leading-none"
              style={{ color: "#FFFFFF", textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 4px 30px rgba(193,39,45,0.5)", animation: "fadeInUp 0.8s ease-out 0.15s both" }}
            >
              They Work
              <br />
              <span style={{ color: "#FF8A8A", textShadow: "0 0 30px rgba(255,138,138,0.7), 0 2px 10px rgba(0,0,0,0.8)" }}>
                For You.
              </span>
            </h1>
            <p
              className="mt-6 text-xl md:text-2xl font-body max-w-xl mx-auto"
              style={{ color: "rgba(255,255,255,0.95)", textShadow: "0 2px 8px rgba(0,0,0,0.7)", animation: "fadeInUp 0.8s ease-out 0.3s both" }}
            >
              Find your reps. Write a letter. Make a call. Three taps from couch to Congress.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleLookup}
              role="search"
              aria-label="Find your representatives"
              className="mt-10 flex flex-col sm:flex-row gap-0 max-w-xl mx-auto"
              style={{ animation: "fadeInUp 0.8s ease-out 0.45s both" }}
            >
              <label htmlFor="address-lookup" className="sr-only">Enter your ZIP code or full address</label>
              <input
                id="address-lookup"
                type="search"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your ZIP or address"
                className="flex-1 px-5 py-4 font-mono text-lg focus:outline-none placeholder:text-white/50"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              />
              <button
                type="submit"
                className="px-8 py-4 font-headline uppercase text-lg tracking-wider border-2 transition-all cursor-pointer glow-red"
                style={{
                  backgroundColor: "#C1272D",
                  borderColor: "#C1272D",
                  color: "#fff",
                }}
              >
                Find My Reps
              </button>
            </form>

            {/* Quick action pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-3" style={{ animation: "fadeInUp 0.8s ease-out 0.6s both" }}>
              <Link
                href="/draft"
                className="px-6 py-3 font-mono text-base font-bold uppercase tracking-wider no-underline transition-all"
                style={{
                  border: "2px solid #C1272D",
                  color: "#fff",
                  backgroundColor: "#C1272D",
                }}
              >
                Write a Letter
              </Link>
              <Link
                href="/draft?mode=call"
                className="px-6 py-3 font-mono text-base font-bold uppercase tracking-wider no-underline transition-all"
                style={{
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              >
                Make a Call
              </Link>
              <Link
                href="/draft?mode=email"
                className="px-6 py-3 font-mono text-base font-bold uppercase tracking-wider no-underline transition-all"
                style={{
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              >
                Send an Email
              </Link>
              <Link
                href="/issues"
                className="px-6 py-3 font-mono text-base font-bold uppercase tracking-wider no-underline transition-all"
                style={{
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              >
                Browse Issues
              </Link>
              <Link
                href="/my-reps"
                className="px-6 py-3 font-mono text-base font-bold uppercase tracking-wider no-underline transition-all"
                style={{
                  border: "2px solid rgba(255,255,255,0.5)",
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.15)",
                }}
              >
                My Saved Reps
              </Link>
            </div>
          </div>
        </section>

        {/* Lookup results */}
        {lookupLoading && (
          <section className="px-4 py-10" style={{ backgroundColor: "#111827" }} aria-live="polite" aria-busy="true">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block shimmer px-8 py-4">
                <p className="font-headline text-2xl text-white motion-safe:animate-pulse">Looking up your representatives...</p>
              </div>
            </div>
          </section>
        )}
        {results && !lookupLoading && results.length === 0 && (
          <section className="px-4 py-10" style={{ backgroundColor: "#111827" }}>
            <div className="max-w-3xl mx-auto text-center">
              <p className="font-headline text-2xl text-white">No representatives found.</p>
              <p className="font-body text-base mt-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                Try a full address with ZIP code.
              </p>
            </div>
          </section>
        )}
        {results && !lookupLoading && results.length > 0 && (
          <section className="px-4 py-10" style={{ backgroundColor: "#111827" }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline text-3xl text-white">Your Representatives</h2>
                <button
                  onClick={handleSaveReps}
                  className="px-5 py-3 font-mono text-base font-bold cursor-pointer transition-colors"
                  style={{ backgroundColor: "#C1272D", color: "#fff", border: "none" }}
                >
                  SAVE AS MY REPS
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((rep) => (
                  <Link
                    key={rep.id}
                    href={`/directory/${rep.slug}`}
                    className="no-underline group relative overflow-hidden p-6 transition-all"
                    style={{
                      backgroundColor: "#1e2030",
                      border: "2px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: rep.party === "D"
                          ? "linear-gradient(135deg, rgba(26,58,107,0.4) 0%, transparent 100%)"
                          : rep.party === "R"
                            ? "linear-gradient(135deg, rgba(193,39,45,0.4) 0%, transparent 100%)"
                            : "linear-gradient(135deg, rgba(107,91,62,0.4) 0%, transparent 100%)",
                      }}
                    />
                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className="w-16 h-16 flex items-center justify-center shrink-0 overflow-hidden relative"
                        style={{
                          backgroundColor: rep.party === "D" ? "#1a3a6b" : rep.party === "R" ? "#C1272D" : "#6b5b3e",
                        }}
                      >
                        <span className="font-headline text-2xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                        {rep.photoUrl && (
                          <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 text-sm font-mono font-bold text-white"
                            style={{
                              backgroundColor: rep.party === "D" ? "#1a3a6b" : rep.party === "R" ? "#C1272D" : "#6b5b3e",
                            }}
                          >
                            {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                          </span>
                        </div>
                        <h3 className="font-headline text-2xl text-white normal-case">{rep.fullName}</h3>
                        <p className="font-mono text-base mt-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                          {rep.title} — {rep.state}{rep.district ? `, ${rep.district} District` : ""}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Link
                          href="/draft"
                          className="px-5 py-2.5 font-mono text-sm font-bold no-underline text-white transition-colors"
                          style={{ backgroundColor: "#C1272D" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          WRITE
                        </Link>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* My Reps (saved) */}
        {hasSavedReps && !results && (
          <section className="px-4 py-12" style={{ backgroundColor: "#111827" }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6 animate-on-scroll">
                <div>
                  <h2 className="font-headline text-3xl text-white">My Representatives</h2>
                  <p className="font-mono text-sm mt-1 font-bold" style={{ color: "rgba(255,255,255,0.85)" }}>
                    YOUR SAVED REPS
                  </p>
                </div>
                <Link
                  href="/draft"
                  className="px-6 py-3 font-mono text-base font-bold no-underline text-white transition-colors glow-red"
                  style={{ backgroundColor: "#C1272D" }}
                >
                  WRITE TO THEM
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myReps.map((rep) => (
                  <Link
                    key={rep.id}
                    href={`/directory/${rep.slug}`}
                    className="no-underline group relative overflow-hidden p-5 transition-all"
                    style={{
                      backgroundColor: "#1e2030",
                      border: "2px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: rep.party === "D"
                          ? "linear-gradient(135deg, rgba(26,58,107,0.3) 0%, transparent 100%)"
                          : rep.party === "R"
                            ? "linear-gradient(135deg, rgba(193,39,45,0.3) 0%, transparent 100%)"
                            : "linear-gradient(135deg, rgba(107,91,62,0.3) 0%, transparent 100%)",
                      }}
                    />
                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className="w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden relative"
                        style={{
                          backgroundColor: rep.party === "D" ? "#1a3a6b" : rep.party === "R" ? "#C1272D" : "#6b5b3e",
                        }}
                      >
                        <span className="font-headline text-xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                        {rep.photoUrl && (
                          <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className="inline-block px-2 py-0.5 text-sm font-mono font-bold text-white mb-1"
                          style={{
                            backgroundColor: rep.party === "D" ? "#1a3a6b" : rep.party === "R" ? "#C1272D" : "#6b5b3e",
                          }}
                        >
                          {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                        </span>
                        <h3 className="font-headline text-xl text-white normal-case">{rep.fullName}</h3>
                        <p className="font-mono text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.9)" }}>
                          {rep.title} — {rep.state}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Issues — dramatic dark cards */}
        <section className="px-4 py-16 relative" style={{ backgroundColor: "#111827" }}>
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(193,39,45,0.05) 50%, transparent 100%)",
            }}
          />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-10 animate-on-scroll">
              <p className="font-mono text-base tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
                What Matters To You
              </p>
              <h2
                className="font-headline text-4xl md:text-5xl"
                style={{ color: "#FFFFFF", textShadow: "0 2px 20px rgba(193,39,45,0.4), 0 2px 8px rgba(0,0,0,0.6)" }}
              >
                Issues That Matter
              </h2>
              <div className="mt-4 h-1 w-20 mx-auto" style={{ backgroundColor: "#C1272D" }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
              {issues.map((issue) => {
                const accent = issueColor[issue.id] || "#1a1a2e";
                const bgImage = issueImage[issue.id];
                return (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.slug}`}
                    className="no-underline group relative overflow-hidden transition-all"
                    style={{
                      backgroundColor: "#1e2030",
                      border: "2px solid rgba(255,255,255,0.15)",
                      minHeight: "180px",
                    }}
                  >
                    {/* Background image */}
                    {bgImage && (
                      <div
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundImage: `url(${bgImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )}
                    {/* Dark gradient overlay for text readability */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.85) 100%)`,
                      }}
                    />
                    {/* Top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: accent, zIndex: 2 }} />

                    <div className="relative z-10 p-5 flex flex-col justify-end h-full" style={{ minHeight: "180px" }}>
                      <h3
                        className="font-headline text-lg md:text-xl normal-case leading-tight"
                        style={{ color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}
                      >
                        {issue.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-sm font-bold uppercase" style={{ color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                          {issue.legislation.length} {issue.legislation.length === 1 ? "bill" : "bills"}
                        </span>
                        <span
                          className="font-headline text-base group-hover:translate-x-1 transition-all"
                          style={{ color: "#fff" }}
                        >
                          &rarr;
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Visual break — community illustration */}
        <section className="relative h-64 md:h-80 overflow-hidden animate-on-scroll">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/community-protest.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 25%",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, #111827 0%, rgba(17,24,39,0.3) 30%, rgba(17,24,39,0.3) 70%, #111827 100%)",
            }}
          />
          <div className="relative z-10 h-full flex items-center justify-center">
            <p
              className="font-mono text-base tracking-[0.4em] uppercase font-bold"
              style={{ color: "#FFFFFF", textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.6)" }}
            >
              Your neighbors are already showing up
            </p>
          </div>
        </section>

        {/* Stats — glowing numbers */}
        <section
          className="px-4 py-16 relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #111827 0%, #1a0a0b 50%, #111827 100%)",
          }}
        >
          <div className="absolute inset-0 grid-overlay" />
          <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center stagger-children">
            {[
              { number: "535", label: "Members of Congress" },
              { number: "100", label: "Senators" },
              { number: "435", label: "Representatives" },
              { number: "50", label: "States Covered" },
            ].map((stat) => (
              <div key={stat.label} className="py-4">
                <div
                  className="font-headline text-5xl md:text-6xl"
                  style={{
                    color: "#FFFFFF",
                    textShadow: "0 0 30px rgba(193,39,45,0.6), 0 2px 10px rgba(0,0,0,0.5)",
                  }}
                >
                  {stat.number}
                </div>
                <div className="font-mono text-sm mt-2 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call your rep — noir illustration */}
        <section className="relative overflow-hidden animate-on-scroll" style={{ backgroundColor: "#111827" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0">
            <div
              className="h-72 md:h-auto"
              style={{
                backgroundImage: "url(/images/call-your-rep.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "320px",
              }}
            />
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="font-mono text-base tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
                Make The Call
              </p>
              <h2
                className="font-headline text-3xl md:text-4xl text-white leading-tight"
                style={{ textShadow: "0 2px 15px rgba(193,39,45,0.3)" }}
              >
                Your Rep Is One Phone Call Away
              </h2>
              <p className="mt-4 font-body text-lg" style={{ color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>
                A two-minute call has 10x the impact of an email. We&apos;ll give you talking points and connect you directly.
              </p>
              <Link
                href="/draft"
                className="inline-block mt-6 px-8 py-4 font-mono text-base font-bold uppercase tracking-wider no-underline text-white transition-all self-start"
                style={{ backgroundColor: "#C1272D", border: "2px solid #C1272D" }}
              >
                Start A Call Script
              </Link>
            </div>
          </div>
        </section>

        {/* CTA — dramatic final section with background image */}
        <section
          className="px-4 py-20 text-center relative overflow-hidden"
        >
          {/* Background image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/cta-rally.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 20%",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(193,39,45,0.8) 100%)",
            }}
          />
          <div className="absolute inset-0 grid-overlay" />
          <div className="relative z-10 max-w-xl mx-auto animate-on-scroll">
            <h2
              className="font-headline text-4xl md:text-6xl text-white leading-none"
              style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
            >
              Your Voice.
              <br />
              Their Vote.
            </h2>
            <p
              className="mt-6 font-body text-xl max-w-md mx-auto"
              style={{ color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
            >
              Every letter, every call adds up. Make yours count.
            </p>
            <Link
              href="/draft"
              className="inline-block mt-8 px-12 py-5 font-headline uppercase text-xl tracking-wider no-underline text-white transition-all glow-red"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", border: "2px solid rgba(255,255,255,0.4)" }}
            >
              Write Congress Now
            </Link>
          </div>
        </section>

        {/* Civic icons decorative strip */}
        <div className="relative h-20 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/civic-icons.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(0deg, #111827 0%, rgba(17,24,39,0.6) 50%, #111827 100%)",
            }}
          />
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────
     INFORMED / POWER MODE — Original layout with scroll animations
  ────────────────────────────────────────────────── */
  return (
    <div ref={scrollRef}>
      {/* Hero */}
      <section className="bg-black text-white px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl uppercase leading-none text-white">
            They Work
            <br />
            <span className="text-red">For You.</span>
          </h1>
          <p className="mt-5 text-xl md:text-2xl font-body text-white/80 max-w-2xl mx-auto">
            Find your elected officials. Draft a letter. Make a call. Hold them
            accountable. All in one place.
          </p>

          <form
            onSubmit={handleLookup}
            role="search"
            aria-label="Find your representatives"
            className="mt-8 flex flex-col sm:flex-row gap-0 max-w-2xl mx-auto"
          >
            <label htmlFor="address-lookup-main" className="sr-only">Enter your ZIP code or full address</label>
            <input
              id="address-lookup-main"
              type="search"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your ZIP code or full address"
              className="flex-1 px-5 py-4 bg-white text-black border-2 border-white font-mono text-base placeholder:text-gray-light focus:outline-none focus:border-red"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-red text-white font-headline uppercase text-base tracking-wider border-2 border-red hover:bg-red-dark hover:border-red-dark transition-colors cursor-pointer"
            >
              Find My Reps
            </button>
          </form>

        </div>
      </section>

      {/* Engagement card — power mode only, if user has contacts */}
      {modeAtLeast("power") && engagementStats && (
        <section className="px-4 py-4 border-b-3 border-border bg-surface">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 border-2 border-border p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-mono text-sm font-bold">
                You&apos;ve taken <span className="text-red">{engagementStats.totalActions}</span> actions
              </span>
              <span className="font-mono text-sm text-gray-mid">
                {engagementStats.uniqueRepsContacted} reps contacted
              </span>
              {engagementStats.currentStreak > 0 && (
                <span className="font-mono text-sm font-bold">
                  {"\uD83D\uDD25"} {engagementStats.currentStreak}-week streak
                </span>
              )}
            </div>
            <Link
              href="/draft"
              className="px-5 py-2 bg-red text-white font-mono text-sm font-bold uppercase no-underline hover:bg-red-dark transition-colors border-2 border-red hover:border-red-dark"
            >
              WRITE CONGRESS &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Lookup results */}
      {lookupLoading && (
        <section className="border-b-3 border-border px-4 py-10 bg-red-light" aria-live="polite" aria-busy="true">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-headline text-2xl motion-safe:animate-pulse">Looking up your representatives...</p>
          </div>
        </section>
      )}
      {results && !lookupLoading && results.length === 0 && (
        <section className="border-b-3 border-border px-4 py-10 bg-red-light">
          <div className="max-w-6xl mx-auto text-center">
            <p className="font-headline text-2xl">No representatives found for that address.</p>
            <p className="font-body text-base mt-2 text-gray-mid">Try entering a full address with ZIP code (e.g., &quot;1600 Pennsylvania Ave, Washington DC 20500&quot;)</p>
          </div>
        </section>
      )}
      {results && !lookupLoading && results.length > 0 && (
        <section className="border-b-3 border-border px-4 py-10 bg-red-light">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-3xl">Your Representatives</h2>
              <button
                onClick={handleSaveReps}
                className="px-4 py-2 bg-black text-white font-mono text-sm font-bold cursor-pointer hover:bg-red transition-colors"
              >
                SAVE AS MY REPS
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {results.map((rep) => (
                <Link
                  key={rep.id}
                  href={`/directory/${rep.slug}`}
                  className="no-underline text-black border-2 border-border bg-surface p-5 hover:bg-hover transition-colors group"
                >
                  <div className={`w-16 h-16 ${partyBg(rep.party)} flex items-center justify-center mb-3 overflow-hidden relative`}>
                    <span className="font-headline text-2xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs font-mono font-bold ${partyBg(rep.party)} text-white`}>
                    {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                  </span>
                  {rep.leadershipRole && (
                    <span className="inline-block ml-2 px-2 py-1 text-xs font-mono font-bold bg-red text-white">
                      LEADER
                    </span>
                  )}
                  <h3 className="font-headline text-xl mt-2 normal-case group-hover:text-red">{rep.fullName}</h3>
                  <p className="font-mono text-sm text-gray-mid mt-1">
                    {rep.title} — {rep.state}
                    {rep.district ? `, ${rep.district} District` : ""}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* My Representatives (saved) */}
      {hasSavedReps && !results && (
        <section className="px-4 py-10 border-b-3 border-red bg-red-light animate-on-scroll">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-headline text-3xl">My Representatives</h2>
                <p className="font-mono text-xs text-gray-mid mt-1 font-bold">YOUR SAVED REPS — PERSONALIZED ACROSS CITIZENFORGE</p>
              </div>
              <Link
                href="/draft"
                className="px-4 py-2 bg-red text-white font-mono text-sm font-bold no-underline hover:bg-black transition-colors"
              >
                WRITE TO THEM
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {myReps.map((rep) => (
                <Link
                  key={rep.id}
                  href={`/directory/${rep.slug}`}
                  className="no-underline text-black border-3 border-border bg-surface p-5 hover:border-red transition-colors group"
                >
                  <div className={`w-14 h-14 ${partyBg(rep.party)} flex items-center justify-center mb-3 overflow-hidden relative`}>
                    <span className="font-headline text-xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold ${partyBg(rep.party)} text-white`}>
                      {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                    </span>
                    <span className="font-mono text-xs text-gray-mid font-bold">{rep.chamber}</span>
                  </div>
                  <h3 className="font-headline text-lg normal-case group-hover:text-red">{rep.fullName}</h3>
                  <p className="font-mono text-xs text-gray-mid mt-1">
                    {rep.title} — {rep.state}
                  </p>
                  <div className="mt-2 pt-2 border-t border-border-light flex gap-3">
                    {rep.partyLoyalty > 0 && (
                      <span className="font-mono text-[10px] text-gray-mid">
                        <span className="font-bold">{rep.partyLoyalty}%</span> loyal
                      </span>
                    )}
                    {rep.totalFundraising && (
                      <span className="font-mono text-[10px] text-gray-mid">
                        {rep.totalFundraising}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live Feed — informed+ only */}
      {modeAtLeast("informed") && <section className="px-4 py-12 border-b-3 border-border bg-cream-dark">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-4 mb-6 animate-on-scroll">
            <h2 className="font-headline text-4xl md:text-5xl">What&apos;s Happening Now</h2>
            <div className="hidden md:block h-1 flex-1 bg-border mb-3" />
          </div>
          <p className="font-mono text-sm text-gray-mid mb-8 -mt-2 font-bold">
            LIVE UPDATES — COMMENT DEADLINES, NEW REPORTS, AND REGULATORY ACTIONS
          </p>

          {feedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-live="polite" aria-busy="true" aria-label="Loading updates">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-2 border-border p-4 bg-surface motion-safe:animate-pulse">
                  <div className="h-3 bg-border-light w-16 mb-2" />
                  <div className="h-5 bg-border-light w-3/4 mb-1" />
                  <div className="h-3 bg-border-light w-1/2" />
                </div>
              ))}
              <span className="sr-only">Loading live updates...</span>
            </div>
          ) : feed.length === 0 ? (
            <div className="border-2 border-border p-6 bg-surface text-center">
              <p className="font-mono text-sm text-gray-mid">No recent updates available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
              {feed.map((item) => (
                <div
                  key={item.id}
                  className={`border-2 p-4 ${urgencyColor(item.urgency)} transition-colors`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 font-mono text-[10px] font-bold ${
                      item.urgency === "high"
                        ? "bg-red text-white"
                        : item.urgency === "medium"
                          ? "bg-yellow text-black"
                          : "bg-black text-white"
                    }`}>
                      {typeIcon(item.type)}
                    </span>
                    <span className="font-mono text-[10px] text-gray-mid">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    {item.urgency === "high" && (
                      <span className="font-mono text-[10px] text-red font-bold motion-safe:animate-pulse">URGENT</span>
                    )}
                  </div>
                  <h4 className="font-headline text-base normal-case leading-tight mb-1">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-black hover:text-red transition-colors">
                        {item.title}
                      </a>
                    ) : item.title}
                  </h4>
                  <p className="font-mono text-xs text-gray-mid">{item.subtitle}</p>
                  {item.actionLabel && item.actionUrl && (
                    <div className="mt-2">
                      <a
                        href={item.actionUrl}
                        target={item.actionUrl.startsWith("http") ? "_blank" : undefined}
                        rel={item.actionUrl.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="font-mono text-xs font-bold text-red hover:underline no-underline"
                      >
                        {item.actionLabel} &rarr;
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <Link href="/federal-register" className="font-mono text-xs font-bold text-red no-underline hover:underline">
              ALL COMMENT PERIODS &rarr;
            </Link>
            <Link href="/gao-reports" className="font-mono text-xs font-bold text-red no-underline hover:underline">
              ALL GAO REPORTS &rarr;
            </Link>
          </div>
        </div>
      </section>}

      {/* Congressional Leadership — informed+ only */}
      {modeAtLeast("informed") && <section className="px-4 py-16 border-b-3 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-4 mb-8 animate-on-scroll">
            <h2 className="font-headline text-4xl md:text-5xl">Congressional Leadership</h2>
            <div className="hidden md:block h-1 flex-1 bg-border mb-3" />
          </div>
          <p className="font-mono text-sm text-gray-mid mb-8 -mt-4">
            THE FOUR PEOPLE WHO SET THE AGENDA FOR EVERY AMERICAN
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
            {leadership.map((rep) => {
              const bgColor = rep.party === "R" ? "bg-rep" : "bg-dem";
              return (
                <Link
                  key={rep.id}
                  href={`/directory/${rep.slug}`}
                  className={`no-underline text-white ${bgColor} p-6 hover:opacity-90 transition-opacity border-3 border-border group`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-white/80 text-2xl">&#9733;</span>
                    <span className="font-mono text-sm font-bold text-white/80">
                      {rep.party === "D" ? "DEMOCRAT" : "REPUBLICAN"}
                    </span>
                  </div>
                  <div className="w-20 h-20 bg-black/20 flex items-center justify-center mb-4 overflow-hidden relative">
                    <span className="font-headline text-4xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <h3 className="font-headline text-2xl normal-case text-white">{rep.fullName}</h3>
                  <p className="font-mono text-sm text-white/90 mt-2 font-bold">
                    {rep.leadershipRole}
                  </p>
                  <p className="font-mono text-sm text-white/70 mt-1">
                    {rep.state}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>}

      {/* Notable Members — informed+ only */}
      {modeAtLeast("informed") && <section className="px-4 py-16 border-b-3 border-border bg-cream-dark">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-4 mb-8 animate-on-scroll">
            <h2 className="font-headline text-4xl md:text-5xl">Notable Members</h2>
            <div className="hidden md:block h-1 flex-1 bg-border mb-3" />
          </div>
          <p className="font-mono text-sm text-gray-mid mb-8 -mt-4">
            HIGH-PROFILE LEGISLATORS SHAPING THE NATIONAL DEBATE
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {featured.map((rep) => (
              <Link
                key={rep.id}
                href={`/directory/${rep.slug}`}
                className="no-underline text-black border-2 border-border bg-surface p-5 hover:bg-hover transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-14 h-14 ${partyBg(rep.party)} flex items-center justify-center shrink-0 overflow-hidden relative`}>
                    <span className="font-headline text-xl text-white">{rep.firstName[0]}{rep.lastName[0]}</span>
                    {rep.photoUrl && (
                      <img src={rep.photoUrl} alt={rep.fullName} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs font-mono font-bold ${partyBg(rep.party)} text-white`}>
                        {rep.party === "D" ? "DEM" : rep.party === "R" ? "GOP" : "IND"}
                      </span>
                      <span className="font-mono text-xs text-gray-mid font-bold">{rep.chamber}</span>
                    </div>
                    <h3 className="font-headline text-xl normal-case mt-1 group-hover:text-red">{rep.fullName}</h3>
                  </div>
                </div>
                <p className="font-mono text-sm text-gray-mid">
                  {rep.title} — {rep.state}
                </p>
                {rep.leadershipRole && (
                  <p className="font-mono text-sm text-red font-bold mt-1">{rep.leadershipRole}</p>
                )}
                <div className="mt-3 pt-3 border-t-2 border-border-light flex gap-4">
                  {rep.partyLoyalty > 0 && <span className="font-mono text-xs text-gray-mid">
                    <span className="font-bold">{rep.partyLoyalty}%</span> Party Loyalty
                  </span>}
                  {rep.billsIntroduced > 0 && <span className="font-mono text-xs text-gray-mid">
                    <span className="font-bold">{rep.billsIntroduced}</span> bills
                  </span>}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/directory"
              className="inline-block px-8 py-4 bg-black text-white font-headline uppercase text-base tracking-wider border-3 border-black hover:bg-red hover:border-red transition-colors no-underline"
            >
              Browse All 535 Members
            </Link>
          </div>
        </div>
      </section>}

      {/* Issues */}
      <section className="px-4 py-16 border-b-3 border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end gap-4 mb-8 animate-on-scroll">
            <h2 className="font-headline text-4xl md:text-5xl">Issues That Matter</h2>
            <div className="hidden md:block h-1 flex-1 bg-border mb-3" />
          </div>
          <p className="font-mono text-sm text-gray-mid mb-8 -mt-4">
            LEARN THE FACTS. FIND YOUR VOICE. TAKE ACTION.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-border stagger-children">
            {issues.map((issue) => {
              const accent = issueColor[issue.id] || "#1a1a2e";
              return (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.slug}`}
                  className="no-underline text-black bg-surface hover:bg-hover transition-all group relative overflow-hidden border-b-2 border-r-2 border-border"
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
                  <div className="p-5 md:p-6">
                    <div
                      className="w-12 h-12 flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: accent }}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d={issueSvgPath[issue.id] || "M12 6v12m-6-6h12"} />
                      </svg>
                    </div>
                    <h3 className="font-headline text-base md:text-lg normal-case leading-tight group-hover:text-red transition-colors">
                      {issue.name}
                    </h3>
                    <p className="font-body text-sm text-gray-mid mt-2 line-clamp-2 hidden sm:block">
                      {issue.description.split(",").slice(0, 2).join(",")}.
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-gray-mid uppercase">
                        {issue.legislation.length} {issue.legislation.length === 1 ? "bill" : "bills"}
                      </span>
                      <span className="font-headline text-xs text-black/40 group-hover:text-red group-hover:translate-x-1 transition-all">
                        &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats banner — informed+ only */}
      {modeAtLeast("informed") && <section className="bg-black text-white px-4 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center stagger-children">
          {[
            { number: "535", label: "Members of Congress" },
            { number: "100", label: "Senators" },
            { number: "435", label: "Representatives" },
            { number: "50", label: "States Covered" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-headline text-5xl md:text-6xl text-red">
                {stat.number}
              </div>
              <div className="font-mono text-sm text-white/70 mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>}

      {/* CTA — informed+ only */}
      {modeAtLeast("informed") && <section className="px-4 py-20 bg-cta text-white text-center">
        <div className="max-w-3xl mx-auto animate-on-scroll">
          <h2 className="font-headline text-5xl md:text-6xl text-white">
            Your Voice. Their Vote.
          </h2>
          <p className="mt-6 font-body text-xl text-white/90">
            Every letter, every call, every post adds up. Representatives track
            constituent contacts. Make yours count.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/draft"
              className="px-10 py-4 bg-red text-white font-headline uppercase text-base tracking-wider border-3 border-red hover:bg-red-dark hover:border-red-dark transition-colors no-underline"
            >
              Draft a Letter Now
            </Link>
            <Link
              href="/directory"
              className="px-10 py-4 bg-white text-black font-headline uppercase text-base tracking-wider border-3 border-white hover:bg-cream-dark hover:border-cream-dark transition-colors no-underline"
            >
              Find Your Rep
            </Link>
          </div>
        </div>
      </section>}
    </div>
  );
}
