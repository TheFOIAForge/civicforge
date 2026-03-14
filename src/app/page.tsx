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

const issueIcon: Record<string, string> = {
  healthcare: "&#9769;",
  environment: "&#9752;",
  housing: "&#8962;",
  immigration: "&#9992;",
  education: "&#9734;",
  economy: "&#9878;",
  "civil-rights": "&#9878;",
  defense: "&#9872;",
};

/** Intersection Observer hook for scroll animations */
function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

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
      <div ref={scrollRef} style={{ backgroundColor: "#f5e6c8" }}>
        {/* ═══ HERO — Propaganda poster style ═══ */}
        <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
          {/* Background — poster image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/propaganda/hero-poster.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 20%",
            }}
          />
          {/* Dark overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(26,26,26,0.6) 0%, rgba(26,26,26,0.4) 40%, rgba(193,39,45,0.3) 70%, rgba(245,230,200,1) 100%)",
            }}
          />
          {/* Vignette edges */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow: "inset 0 0 150px rgba(0,0,0,0.5)",
            }}
          />

          <div className="relative z-10 text-center px-4 py-16 w-full max-w-3xl mx-auto">
            {/* Ribbon banner */}
            <div className="flex justify-center mb-6" style={{ animation: "fadeInUp 0.8s ease-out 0.1s both" }}>
              <span className="ribbon">Civic Duty</span>
            </div>

            <h1
              className="font-headline text-5xl sm:text-6xl md:text-8xl uppercase leading-none"
              style={{
                color: "#fff",
                textShadow: "0 4px 20px rgba(0,0,0,0.8), 0 2px 0 #1a1a1a",
                animation: "fadeInUp 0.8s ease-out 0.2s both",
              }}
            >
              Check<span style={{ color: "#C1272D", textShadow: "0 4px 20px rgba(193,39,45,0.8), 0 2px 0 #9B1B20" }}>My</span>Rep
            </h1>

            <div className="mt-4 flex items-center justify-center gap-3" style={{ animation: "fadeInUp 0.8s ease-out 0.3s both" }}>
              <span style={{ color: "#c4a44a", fontSize: "20px" }}>&#9733;</span>
              <p className="font-mono text-sm tracking-[0.3em] uppercase" style={{ color: "#f5e6c8" }}>
                They Work For You
              </p>
              <span style={{ color: "#c4a44a", fontSize: "20px" }}>&#9733;</span>
            </div>

            {/* Search bar — poster-style heavy borders */}
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
                className="flex-1 px-5 py-4 font-mono text-lg focus:outline-none"
                style={{
                  backgroundColor: "#faf6ee",
                  color: "#1a1a1a",
                  border: "3px solid #1a1a1a",
                  borderRight: "none",
                }}
              />
              <button
                type="submit"
                className="px-8 py-4 font-headline uppercase text-lg tracking-wider cursor-pointer glow-red"
                style={{
                  backgroundColor: "#C1272D",
                  border: "3px solid #1a1a1a",
                  color: "#fff",
                }}
              >
                Find My Reps
              </button>
            </form>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-[540px] mx-auto" style={{ animation: "fadeInUp 0.8s ease-out 0.6s both" }}>
              <Link
                href="/draft"
                className="group w-full py-5 font-headline text-xl uppercase tracking-[0.15em] no-underline text-center transition-all hover:scale-[1.02] relative overflow-hidden"
                style={{
                  backgroundColor: "#1a1a1a",
                  color: "#f5e6c8",
                  border: "3px solid #c4a44a",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  &#9993; Contact Congress
                </span>
              </Link>

              <Link
                href="/issues"
                className="w-full py-3 font-mono text-sm font-bold uppercase tracking-[0.15em] no-underline text-center transition-all hover:brightness-110"
                style={{
                  backgroundColor: "rgba(26,26,26,0.7)",
                  color: "#f5e6c8",
                  border: "2px solid rgba(196,164,74,0.5)",
                }}
              >
                &#9733; Browse Issues &#9733;
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ Lookup results ═══ */}
        {lookupLoading && (
          <section className="px-4 py-10" style={{ backgroundColor: "#f5e6c8" }} aria-live="polite" aria-busy="true">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-block shimmer px-8 py-4">
                <p className="font-headline text-2xl motion-safe:animate-pulse" style={{ color: "#1a1a1a" }}>Looking up your representatives...</p>
              </div>
            </div>
          </section>
        )}
        {results && !lookupLoading && results.length === 0 && (
          <section className="px-4 py-10" style={{ backgroundColor: "#f5e6c8" }}>
            <div className="max-w-3xl mx-auto text-center">
              <p className="font-headline text-2xl" style={{ color: "#1a1a1a" }}>No representatives found.</p>
              <p className="font-body text-base mt-2" style={{ color: "#5a5a5a" }}>
                Try a full address with ZIP code.
              </p>
            </div>
          </section>
        )}
        {results && !lookupLoading && results.length > 0 && (
          <section className="px-4 py-10" style={{ backgroundColor: "#f5e6c8" }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline text-3xl" style={{ color: "#1a1a1a" }}>Your Representatives</h2>
                <button
                  onClick={handleSaveReps}
                  className="px-5 py-3 font-mono text-base font-bold cursor-pointer transition-colors"
                  style={{ backgroundColor: "#C1272D", color: "#fff", border: "3px solid #1a1a1a" }}
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
                      backgroundColor: "#faf6ee",
                      border: "3px solid #1a1a1a",
                    }}
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className="w-16 h-16 flex items-center justify-center shrink-0 overflow-hidden relative"
                        style={{
                          backgroundColor: rep.party === "D" ? "#1a3a6b" : rep.party === "R" ? "#C1272D" : "#6b5b3e",
                          border: "2px solid #1a1a1a",
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
                        <h3 className="font-headline text-2xl normal-case" style={{ color: "#1a1a1a" }}>{rep.fullName}</h3>
                        <p className="font-mono text-base mt-1" style={{ color: "#5a5a5a" }}>
                          {rep.title} — {rep.state}{rep.district ? `, ${rep.district} District` : ""}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Link
                          href="/draft"
                          className="px-5 py-2.5 font-mono text-sm font-bold no-underline text-white transition-colors"
                          style={{ backgroundColor: "#C1272D", border: "2px solid #1a1a1a" }}
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

        {/* ═══ My Reps (saved) ═══ */}
        {hasSavedReps && !results && (
          <section className="px-4 py-12" style={{ backgroundColor: "#f5e6c8" }}>
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6 animate-on-scroll">
                <div>
                  <h2 className="font-headline text-3xl" style={{ color: "#1a1a1a" }}>My Representatives</h2>
                  <p className="font-mono text-sm mt-1 font-bold" style={{ color: "#5a5a5a" }}>
                    YOUR SAVED REPS
                  </p>
                </div>
                <Link
                  href="/draft"
                  className="px-6 py-3 font-mono text-base font-bold no-underline text-white transition-colors glow-red"
                  style={{ backgroundColor: "#C1272D", border: "3px solid #1a1a1a" }}
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
                      backgroundColor: "#faf6ee",
                      border: "3px solid #1a1a1a",
                    }}
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className="w-14 h-14 flex items-center justify-center shrink-0 overflow-hidden relative"
                        style={{
                          backgroundColor: rep.party === "D" ? "#1a3a6b" : rep.party === "R" ? "#C1272D" : "#6b5b3e",
                          border: "2px solid #1a1a1a",
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
                        <h3 className="font-headline text-xl normal-case" style={{ color: "#1a1a1a" }}>{rep.fullName}</h3>
                        <p className="font-mono text-sm mt-0.5" style={{ color: "#5a5a5a" }}>
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

        {/* ═══ Action Cards — What You Can Do ═══ */}
        <section className="px-4 py-16 relative overflow-hidden" style={{ backgroundColor: "#1a1a1a" }}>
          {/* Sunburst background */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "url(/images/propaganda/progress-banner.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-10 animate-on-scroll">
              <div className="flex justify-center mb-4">
                <span className="ribbon">Take Action</span>
              </div>
              <h2 className="font-headline text-4xl md:text-5xl" style={{ color: "#f5e6c8" }}>
                Your Civic Arsenal
              </h2>
              <div className="mt-4 flex items-center justify-center gap-3">
                <span style={{ color: "#c4a44a" }}>&#9733;</span>
                <div className="h-0.5 w-20" style={{ backgroundColor: "#c4a44a" }} />
                <span style={{ color: "#c4a44a" }}>&#9733;</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
              {[
                {
                  title: "Write A Letter",
                  desc: "Strongest impact — lands on their desk",
                  href: "/draft",
                  icon: "&#9993;",
                },
                {
                  title: "Make A Call",
                  desc: "2 minutes, 10x the impact of an email",
                  href: "/draft",
                  icon: "&#9742;",
                },
                {
                  title: "Browse Issues",
                  desc: "Find what matters to you",
                  href: "/issues",
                  icon: "&#9733;",
                },
                {
                  title: "Find Your Reps",
                  desc: "Know who represents you",
                  href: "/directory",
                  icon: "&#9878;",
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="no-underline group relative overflow-hidden transition-all hover:scale-[1.03]"
                  style={{
                    backgroundColor: "#faf6ee",
                    border: "3px solid #c4a44a",
                  }}
                >
                  {/* Icon area */}
                  <div
                    className="h-28 flex items-center justify-center relative"
                    style={{ backgroundColor: "#1a1a1a", borderBottom: "3px solid #c4a44a" }}
                  >
                    <span
                      className="text-5xl group-hover:scale-110 transition-transform"
                      style={{ color: "#C1272D" }}
                      dangerouslySetInnerHTML={{ __html: card.icon }}
                    />
                    <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "url(/images/propaganda/progress-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
                  </div>
                  {/* Card content */}
                  <div className="p-4">
                    <h3 className="font-headline text-lg" style={{ color: "#1a1a1a" }}>{card.title}</h3>
                    <p className="font-mono text-xs mt-1" style={{ color: "#5a5a5a" }}>{card.desc}</p>
                    <div className="mt-3 font-headline text-sm uppercase group-hover:translate-x-1 transition-transform" style={{ color: "#C1272D" }}>
                      Go &rarr;
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Issues — dramatic poster cards ═══ */}
        <section className="px-4 py-16 relative" style={{ backgroundColor: "#f5e6c8" }}>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-10 animate-on-scroll">
              <p className="font-mono text-base tracking-[0.4em] uppercase mb-3" style={{ color: "#5a5a5a" }}>
                &#9733; The Issues &#9733;
              </p>
              <h2 className="font-headline text-4xl md:text-5xl" style={{ color: "#1a1a1a" }}>
                What Matters To You
              </h2>
              <div className="mt-4 h-1 w-20 mx-auto" style={{ backgroundColor: "#C1272D" }} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
              {issues.map((issue) => {
                const accent = issueColor[issue.id] || "#1a1a2e";
                const icon = issueIcon[issue.id] || "&#9733;";
                return (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.slug}`}
                    className="no-underline group relative overflow-hidden transition-all hover:scale-[1.03]"
                    style={{
                      backgroundColor: "#faf6ee",
                      border: "3px solid #1a1a1a",
                    }}
                  >
                    {/* Colored accent top bar */}
                    <div className="h-1.5" style={{ backgroundColor: accent }} />

                    {/* Icon area — dark with subtle poster texture */}
                    <div
                      className="h-24 flex items-center justify-center relative"
                      style={{ backgroundColor: "#1a1a1a" }}
                    >
                      <span
                        className="text-4xl group-hover:scale-110 transition-transform relative z-10"
                        style={{ color: accent }}
                        dangerouslySetInnerHTML={{ __html: icon }}
                      />
                      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "url(/images/propaganda/progress-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center" }} />
                    </div>

                    {/* Label — parchment */}
                    <div className="p-4" style={{ borderTop: `3px solid ${accent}` }}>
                      <h3
                        className="font-headline text-base md:text-lg normal-case leading-tight"
                        style={{ color: "#1a1a1a" }}
                      >
                        {issue.name}
                      </h3>
                      <div className="mt-2 flex items-center justify-end">
                        <span
                          className="font-headline text-base group-hover:translate-x-1 transition-all"
                          style={{ color: "#C1272D" }}
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

        {/* ═══ Stats — propaganda banner ═══ */}
        <section className="px-4 py-16 relative overflow-hidden">
          {/* Background poster */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/propaganda/wide-banner.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0" style={{ background: "rgba(26,26,30,0.85)" }} />
          <div className="absolute inset-0 grid-overlay" />

          <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center stagger-children">
            {[
              { number: "535", label: "Members Tracked" },
              { number: "100", label: "Senators" },
              { number: "435", label: "Representatives" },
              { number: "50", label: "States Covered" },
            ].map((stat) => (
              <div key={stat.label} className="py-4">
                <div
                  className="font-headline text-5xl md:text-7xl"
                  style={{
                    color: "#C1272D",
                    textShadow: "0 2px 10px rgba(193,39,45,0.3)",
                  }}
                >
                  {stat.number}
                </div>
                <div className="font-mono text-xs md:text-sm mt-3 uppercase tracking-[0.2em]" style={{ color: "#c4a44a" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ Call Your Rep — poster split ═══ */}
        <section className="relative overflow-hidden animate-on-scroll" style={{ backgroundColor: "#f5e6c8" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0">
            <div
              className="h-72 md:h-auto relative"
              style={{
                backgroundImage: "url(/images/propaganda/icons-poster.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "320px",
              }}
            >
              {/* Aged poster overlay */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(245,230,200,0.15) 0%, transparent 100%)" }} />
              <div className="absolute inset-0" style={{ border: "4px solid #1a1a1a" }} />
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12" style={{ borderTop: "4px solid #1a1a1a", borderBottom: "4px solid #1a1a1a", borderRight: "4px solid #1a1a1a" }}>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ color: "#c4a44a", fontSize: "18px" }}>&#9733;</span>
                <p className="font-mono text-sm tracking-[0.3em] uppercase" style={{ color: "#5a5a5a" }}>
                  Make The Call
                </p>
              </div>
              <h2
                className="font-headline text-4xl md:text-5xl leading-tight"
                style={{ color: "#C1272D" }}
              >
                Your Rep Is One Phone Call Away
              </h2>
              <p className="mt-4 font-body text-lg" style={{ color: "#3a3a3a" }}>
                A two-minute call has 10x the impact of an email. We&apos;ll give you talking points and connect you directly.
              </p>
              <Link
                href="/draft"
                className="inline-block mt-6 px-8 py-4 font-headline text-base uppercase tracking-wider no-underline transition-all self-start"
                style={{ backgroundColor: "#C1272D", color: "#f5e6c8", border: "3px solid #1a1a1a" }}
              >
                Start A Call Script
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ CTA — final dramatic poster section ═══ */}
        <section className="px-4 py-20 text-center relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/images/propaganda/rally-banner.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(26,26,26,0.85) 0%, rgba(193,39,45,0.8) 100%)",
            }}
          />
          <div className="absolute inset-0 grid-overlay" />
          <div className="relative z-10 max-w-xl mx-auto animate-on-scroll">
            <div className="flex justify-center mb-4">
              <span className="ribbon">Power To The People</span>
            </div>
            <h2
              className="font-headline text-4xl md:text-6xl leading-none"
              style={{ color: "#f5e6c8", textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}
            >
              Your Voice.
              <br />
              Their Vote.
            </h2>
            <p
              className="mt-6 font-body text-xl max-w-md mx-auto"
              style={{ color: "#f5e6c8", textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
            >
              Every letter, every call adds up. Make yours count.
            </p>
            <Link
              href="/draft"
              className="inline-block mt-8 px-12 py-5 font-headline uppercase text-xl tracking-wider no-underline transition-all glow-red"
              style={{ backgroundColor: "#1a1a1a", color: "#f5e6c8", border: "3px solid #c4a44a" }}
            >
              Write Congress Now
            </Link>
          </div>
        </section>

        {/* ═══ Trust bar ═══ */}
        <div
          className="py-5 px-4"
          style={{ backgroundColor: "#1a1a1a", borderTop: "3px solid #c4a44a" }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-8 flex-wrap">
            <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "#8a8a8a" }}>
              <strong className="font-headline text-base" style={{ color: "#C1272D" }}>535</strong> MEMBERS TRACKED
            </span>
            <span style={{ color: "#c4a44a" }}>&#9733;</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "#8a8a8a" }}>
              <strong className="font-headline text-base" style={{ color: "#C1272D" }}>8</strong> ISSUES COVERED
            </span>
            <span style={{ color: "#c4a44a" }}>&#9733;</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: "#8a8a8a" }}>
              <strong className="font-headline text-base" style={{ color: "#C1272D" }}>100%</strong> FREE &amp; OPEN
            </span>
          </div>
        </div>
      </div>
    );
}
