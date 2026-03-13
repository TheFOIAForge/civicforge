"use client";

import Link from "next/link";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef } from "react";
import { issues } from "@/data/issues";
import type { Representative } from "@/data/types";
import { useMyReps } from "@/lib/my-reps-context";

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

const issuePosition: Record<string, string> = {
  environment: "15% 20%",
};

const issueZoom: Record<string, string> = {
  environment: "180%",
};

/** Intersection Observer hook for scroll animations */
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
  const { myReps, saveRep, hasSavedReps } = useMyReps();
  const scrollRef = useScrollReveal();

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

  return (
      <div ref={scrollRef} style={{ backgroundColor: "#ffffff" }}>
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
              background: "linear-gradient(180deg, rgba(140,20,25,0.97) 0%, rgba(50,10,12,0.98) 40%, rgba(255,255,255,1) 100%)",
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
            <h1
              className="font-headline text-5xl sm:text-6xl md:text-8xl uppercase leading-none"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8), 0 4px 30px rgba(193,39,45,0.5)", animation: "fadeInUp 0.8s ease-out 0.1s both" }}
            >
              <span style={{ color: "#FFFFFF" }}>Check</span><span style={{ color: "#C1272D" }}>My</span><span style={{ color: "#FFFFFF" }}>Rep</span>
            </h1>
            <p
              className="mt-3 font-body text-xl sm:text-2xl md:text-3xl tracking-wide"
              style={{ color: "rgba(255,255,255,0.6)", textShadow: "0 1px 4px rgba(0,0,0,0.6)", animation: "fadeInUp 0.8s ease-out 0.2s both" }}
            >
              They Work For You.
            </p>

            {/* Search bar */}
            <form
              onSubmit={handleLookup}
              role="search"
              aria-label="Find your representatives"
              className="mt-10 flex flex-col sm:flex-row gap-0 max-w-xl mx-auto"
              style={{ animation: "fadeInUp 0.8s ease-out 0.45s both" }}
            >
              <label htmlFor="address-lookup" className="sr-only">Enter your full address</label>
              <input
                id="address-lookup"
                type="search"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full address"
                className="flex-1 px-5 py-4 font-mono text-lg focus:outline-none placeholder:text-gray-400"
                style={{
                  backgroundColor: "#ffffff",
                  color: "#111827",
                  border: "2px solid rgba(0,0,0,0.15)",
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

            {/* CTA hierarchy — primary / secondary / tertiary */}
            <div className="mt-8 flex flex-col items-center gap-4 w-full max-w-[600px] mx-auto" style={{ animation: "fadeInUp 0.8s ease-out 0.6s both" }}>
              {/* Primary CTA — Contact Congress */}
              <Link
                href="/draft"
                className="group w-full py-5 font-headline text-xl uppercase tracking-[0.15em] no-underline text-center transition-all hover:scale-[1.02] relative overflow-hidden"
                style={{
                  backgroundColor: "#8B1A1A",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(139,26,26,0.4), 0 2px 8px rgba(0,0,0,0.2)",
                  letterSpacing: "0.15em",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Congress
                </span>
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/30" />
              </Link>

              {/* Secondary — Browse Issues */}
              <Link
                href="/issues"
                className="w-full py-3 font-mono text-sm font-bold uppercase tracking-[0.15em] no-underline text-center transition-all hover:brightness-125"
                style={{
                  backgroundColor: "#1B2A4A",
                  color: "#fff",
                  border: "2px solid #1B2A4A",
                }}
              >
                Browse Issues &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Lookup results */}
        {lookupLoading && (
          <section className="px-4 py-10" style={{ backgroundColor: "#ffffff" }} aria-live="polite" aria-busy="true">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block shimmer px-8 py-4">
                <p className="font-headline text-2xl motion-safe:animate-pulse" style={{ color: "#111827" }}>Looking up your representatives...</p>
              </div>
            </div>
          </section>
        )}
        {results && !lookupLoading && results.length === 0 && (
          <section className="px-4 py-10" style={{ backgroundColor: "#ffffff" }}>
            <div className="max-w-3xl mx-auto text-center">
              <p className="font-headline text-2xl" style={{ color: "#111827" }}>No representatives found.</p>
              <p className="font-body text-base mt-2" style={{ color: "rgba(0,0,0,0.6)" }}>
                Try a full address with ZIP code.
              </p>
            </div>
          </section>
        )}
        {results && !lookupLoading && results.length > 0 && (
          <section className="px-4 py-10" style={{ backgroundColor: "#ffffff" }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline text-3xl" style={{ color: "#111827" }}>Your Representatives</h2>
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
                      backgroundColor: "#f3f4f6",
                      border: "2px solid rgba(0,0,0,0.12)",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: rep.party === "D"
                          ? "linear-gradient(135deg, rgba(26,58,107,0.1) 0%, transparent 100%)"
                          : rep.party === "R"
                            ? "linear-gradient(135deg, rgba(193,39,45,0.1) 0%, transparent 100%)"
                            : "linear-gradient(135deg, rgba(107,91,62,0.1) 0%, transparent 100%)",
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
                        <h3 className="font-headline text-2xl normal-case" style={{ color: "#111827" }}>{rep.fullName}</h3>
                        <p className="font-mono text-base mt-1" style={{ color: "rgba(0,0,0,0.6)" }}>
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
          <section className="px-4 py-12" style={{ backgroundColor: "#ffffff" }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6 animate-on-scroll">
                <div>
                  <h2 className="font-headline text-3xl" style={{ color: "#111827" }}>My Representatives</h2>
                  <p className="font-mono text-sm mt-1 font-bold" style={{ color: "rgba(0,0,0,0.6)" }}>
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
                      backgroundColor: "#f3f4f6",
                      border: "2px solid rgba(0,0,0,0.12)",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: rep.party === "D"
                          ? "linear-gradient(135deg, rgba(26,58,107,0.1) 0%, transparent 100%)"
                          : rep.party === "R"
                            ? "linear-gradient(135deg, rgba(193,39,45,0.1) 0%, transparent 100%)"
                            : "linear-gradient(135deg, rgba(107,91,62,0.1) 0%, transparent 100%)",
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
                        <h3 className="font-headline text-xl normal-case" style={{ color: "#111827" }}>{rep.fullName}</h3>
                        <p className="font-mono text-sm mt-0.5" style={{ color: "rgba(0,0,0,0.6)" }}>
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
        <section className="px-4 py-16 relative" style={{ backgroundColor: "#ffffff" }}>
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(193,39,45,0.03) 50%, transparent 100%)",
            }}
          />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-10 animate-on-scroll">
              <p className="font-mono text-base tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
                The Issues
              </p>
              <h2
                className="font-headline text-4xl md:text-5xl"
                style={{ color: "#111827" }}
              >
                What Matters To You
              </h2>
              <div className="mt-4 h-1 w-20 mx-auto" style={{ backgroundColor: "#C1272D" }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
              {issues.map((issue) => {
                const accent = issueColor[issue.id] || "#1a1a2e";
                const bgImage = issueImage[issue.id];
                const bgPos = issuePosition[issue.id] || "center";
                const bgSize = issueZoom[issue.id] || "cover";
                return (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.slug}`}
                    className="no-underline group relative overflow-hidden transition-all"
                    style={{
                      backgroundColor: "#f3f4f6",
                      border: "2px solid rgba(0,0,0,0.12)",
                      minHeight: "180px",
                    }}
                  >
                    {/* Background image */}
                    {bgImage && (
                      <div
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                        style={{
                          backgroundImage: `url(${bgImage})`,
                          backgroundSize: bgSize,
                          backgroundPosition: bgPos,
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
                      <div className="mt-2 flex items-center justify-end">
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

        {/* Stats — navy blue banner */}
        <section
          className="px-4 py-16 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a3a6b 0%, #0d2240 50%, #1a3a6b 100%)",
          }}
        >
          {/* Stars pattern */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }} />
          <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center stagger-children">
            {[
              { number: "535", label: "Members of Congress" },
              { number: "100", label: "Senators" },
              { number: "435", label: "Representatives" },
              { number: "50", label: "States Covered" },
            ].map((stat) => (
              <div key={stat.label} className="py-4">
                <div
                  className="font-headline text-5xl md:text-7xl"
                  style={{
                    color: "#ffffff",
                    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  {stat.number}
                </div>
                <div className="font-mono text-xs md:text-sm mt-3 uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call your rep */}
        <section className="relative overflow-hidden animate-on-scroll" style={{ backgroundColor: "#ffffff" }}>
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
              <p className="font-mono text-lg md:text-xl tracking-[0.4em] uppercase mb-3" style={{ color: "rgba(0,0,0,0.6)" }}>
                Make The Call
              </p>
              <h2
                className="font-headline text-4xl md:text-5xl leading-tight"
                style={{ color: "#C1272D" }}
              >
                Your Rep Is One Phone Call Away
              </h2>
              <p className="mt-4 font-body text-lg" style={{ color: "rgba(0,0,0,0.8)" }}>
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
              background: "linear-gradient(180deg, rgba(17,24,39,0.9) 0%, rgba(193,39,45,0.85) 100%)",
            }}
          />
          <div className="absolute inset-0 grid-overlay" />
          <div className="relative z-10 max-w-xl mx-auto animate-on-scroll">
            <h2
              className="font-headline text-4xl md:text-6xl leading-none"
              style={{ color: "#ffffff", textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
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

        {/* Trust bar — engagement stats */}
        <div
          className="py-4 px-4"
          style={{ backgroundColor: "#f8f8f8", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-8 flex-wrap">
            <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.35)" }}>
              <strong className="font-headline text-base" style={{ color: "#111827" }}>535</strong> MEMBERS TRACKED
            </span>
            <span className="hidden sm:inline" style={{ color: "rgba(0,0,0,0.15)" }}>|</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.35)" }}>
              <strong className="font-headline text-base" style={{ color: "#111827" }}>8</strong> ISSUES COVERED
            </span>
            <span className="hidden sm:inline" style={{ color: "rgba(0,0,0,0.15)" }}>|</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.35)" }}>
              <strong className="font-headline text-base" style={{ color: "#111827" }}>100%</strong> FREE &amp; OPEN
            </span>
          </div>
        </div>
      </div>
    );
}

