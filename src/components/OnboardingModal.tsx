"use client";

import { useUserMode } from "@/lib/user-mode-context";

export default function OnboardingModal() {
  const { isOnboarded, setMode, completeOnboarding } = useUserMode();

  if (isOnboarded) return null;

  function enter() {
    setMode("activist");
    completeOnboarding();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to CheckMyRep"
    >
      <div className="w-full max-w-lg mx-4 bg-black overflow-hidden">
        {/* Header */}
        <div
          className="relative px-6 py-12 text-center overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #C1272D 0%, #1a1a2e 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10">
            <p className="font-mono text-sm text-white/80 tracking-[0.4em] uppercase mb-4">
              Welcome to
            </p>
            <h1 className="font-headline text-5xl md:text-7xl text-white leading-none">
              CHECK
              <span
                style={{
                  color: "#C1272D",
                  textShadow: "0 0 40px rgba(193,39,45,0.5)",
                }}
              >
                MY
              </span>
              REP
            </h1>
            <div
              className="mt-4 h-1 w-24 mx-auto"
              style={{ backgroundColor: "#C1272D" }}
            />
            <p className="mt-4 font-body text-lg text-white/90 max-w-md mx-auto">
              Democracy works better when you show up. Write letters, call your
              reps, and hold them accountable.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 py-8 text-center" style={{ backgroundColor: "#0a0a0a" }}>
          <button
            onClick={enter}
            className="w-full px-8 py-4 bg-red text-white font-headline uppercase text-lg tracking-wider border-none cursor-pointer hover:bg-red-dark transition-colors"
          >
            Get Started
          </button>
          <p className="mt-4 font-mono text-xs text-white/40 tracking-wider">
            All your data is stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
}
