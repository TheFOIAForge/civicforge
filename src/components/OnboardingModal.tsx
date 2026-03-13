"use client";

import { useState } from "react";
import { useUserMode, type UserMode } from "@/lib/user-mode-context";

interface ModeOption {
  value: UserMode;
  headline: string;
  subline: string;
  desc: string;
  gradient: string;
  accentColor: string;
  icon: React.ReactNode;
  features: string[];
}

const options: ModeOption[] = [
  {
    value: "activist",
    headline: "ACT NOW",
    subline: "Activist Mode",
    desc: "Write. Call. Share. Three taps from couch to Congress.",
    gradient: "linear-gradient(135deg, #C1272D 0%, #8B0000 50%, #1a1a2e 100%)",
    accentColor: "#C1272D",
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <circle cx="32" cy="32" r="30" stroke="#fff" strokeWidth="2" opacity="0.3" />
        <circle cx="32" cy="32" r="20" stroke="#fff" strokeWidth="2" opacity="0.15" />
        <path d="M32 16v32M16 32h32" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 22l20 20M42 22L22 42" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      </svg>
    ),
    features: ["Write letters in 60 seconds", "One-tap call scripts", "Share on social instantly"],
  },
  {
    value: "informed",
    headline: "STAY SHARP",
    subline: "Informed Mode",
    desc: "Track bills, compare reps, follow the money. Knowledge is power.",
    gradient: "linear-gradient(135deg, #1a3a6b 0%, #0d1b2a 50%, #1a1a2e 100%)",
    accentColor: "#1a3a6b",
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <rect x="12" y="8" width="40" height="48" rx="2" stroke="#fff" strokeWidth="2" opacity="0.3" />
        <line x1="20" y1="20" x2="44" y2="20" stroke="#fff" strokeWidth="2" opacity="0.5" />
        <line x1="20" y1="28" x2="44" y2="28" stroke="#fff" strokeWidth="2" opacity="0.4" />
        <line x1="20" y1="36" x2="36" y2="36" stroke="#fff" strokeWidth="2" opacity="0.3" />
        <circle cx="40" cy="44" r="8" stroke="#fff" strokeWidth="2" />
        <path d="M46 50l6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    features: ["Bill tracking & vote records", "Campaign management", "Federal Register alerts"],
  },
  {
    value: "power",
    headline: "FULL ARSENAL",
    subline: "Power User Mode",
    desc: "AI research. Voting scorecards. Lobbying data. The whole toolkit.",
    gradient: "linear-gradient(135deg, #f9a825 0%, #C1272D 40%, #1a1a2e 100%)",
    accentColor: "#f9a825",
    icon: (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path d="M32 4l6 18h18l-14 10 6 18-16-12-16 12 6-18L8 22h18z" stroke="#fff" strokeWidth="2" fill="#fff" fillOpacity="0.15" />
        <circle cx="32" cy="32" r="28" stroke="#fff" strokeWidth="1" opacity="0.2" strokeDasharray="4 4" />
      </svg>
    ),
    features: ["AI Mind Palace research", "Alignment scorecards", "Outcome tracking & analytics"],
  },
];

export default function OnboardingModal() {
  const { isOnboarded, setMode, completeOnboarding } = useUserMode();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (isOnboarded) return null;

  function pick(mode: UserMode) {
    setMode(mode);
    completeOnboarding();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose your experience"
    >
      <div className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl md:mx-4 overflow-y-auto bg-black">
        {/* Hero header */}
        <div
          className="relative px-6 py-12 md:py-16 text-center overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #C1272D 0%, #1a1a2e 100%)",
          }}
        >
          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10">
            <p className="font-mono text-sm text-white/80 tracking-[0.4em] uppercase mb-4">
              Welcome to
            </p>
            <h1 className="font-headline text-5xl md:text-7xl text-white leading-none">
              CITIZEN<span style={{ color: "#C1272D", textShadow: "0 0 40px rgba(193,39,45,0.5)" }}>FORGE</span>
            </h1>
            <div className="mt-4 h-1 w-24 mx-auto" style={{ backgroundColor: "#C1272D" }} />
            <p className="mt-6 font-body text-xl md:text-2xl text-white max-w-lg mx-auto" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              Democracy works better when you show up.
              <br className="hidden md:block" />
              How do you want to use this tool?
            </p>
          </div>

          <button
            onClick={() => pick("activist")}
            className="absolute top-4 right-4 text-white/30 hover:text-white text-2xl cursor-pointer bg-transparent border-none p-2 z-20 transition-colors"
            aria-label="Close and use activist mode"
          >
            &times;
          </button>
        </div>

        {/* Three mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {options.map((opt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <button
                key={opt.value}
                onClick={() => pick(opt.value)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative text-left border-none cursor-pointer transition-all duration-300 overflow-hidden group"
                style={{
                  background: isHovered ? opt.gradient : "#0a0a0a",
                  minHeight: "320px",
                  borderRight: idx < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    background: opt.gradient,
                    opacity: isHovered ? 1 : 0,
                  }}
                />

                {/* Diagonal accent stripe */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 transition-transform duration-300"
                  style={{
                    background: `linear-gradient(135deg, transparent 50%, ${opt.accentColor}30 50%)`,
                    transform: isHovered ? "scale(3)" : "scale(1)",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 p-6 md:p-8 flex flex-col h-full">
                  <div className="mb-6 transition-transform duration-300 group-hover:scale-110">
                    {opt.icon}
                  </div>

                  {/* Large background number */}
                  <div
                    className="font-headline text-[100px] leading-none absolute top-4 right-6 transition-opacity duration-300"
                    style={{
                      color: "rgba(255,255,255,0.03)",
                      WebkitTextStroke: isHovered ? `1px ${opt.accentColor}40` : "1px rgba(255,255,255,0.05)",
                    }}
                  >
                    {idx + 1}
                  </div>

                  <h2
                    className="font-headline text-3xl md:text-4xl leading-none text-white mb-1 transition-transform duration-300 group-hover:translate-x-1"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
                  >
                    {opt.headline}
                  </h2>
                  <p
                    className="font-mono text-xs font-bold uppercase tracking-[0.3em] mb-4 transition-colors duration-300"
                    style={{ color: isHovered ? opt.accentColor : "rgba(255,255,255,0.7)" }}
                  >
                    {opt.subline}
                  </p>
                  <p
                    className="font-body text-base text-white mb-6 leading-relaxed transition-colors"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.7)" }}
                  >
                    {opt.desc}
                  </p>

                  <div className="mt-auto space-y-2">
                    {opt.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 shrink-0 transition-all duration-300"
                          style={{
                            backgroundColor: isHovered ? opt.accentColor : "rgba(255,255,255,0.4)",
                            borderRadius: "50%",
                          }}
                        />
                        <span className="font-mono text-sm text-white group-hover:text-white transition-colors" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="mt-6 flex items-center gap-2 transition-all duration-300 group-hover:translate-x-2"
                    style={{ color: isHovered ? "#fff" : "rgba(255,255,255,0.5)" }}
                  >
                    <span className="font-mono text-sm font-bold uppercase tracking-wider">Select</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 text-center" style={{ backgroundColor: "#050505" }}>
          <p className="font-mono text-xs text-white/50 tracking-wider">
            You can switch modes anytime from the top bar. All your data is stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
}
