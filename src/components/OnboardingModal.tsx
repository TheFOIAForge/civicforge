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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.92)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to CheckMyRep"
    >
      <div className="w-full max-w-lg overflow-hidden" style={{ border: "4px solid #c4a44a" }}>
        {/* Header — dark with poster imagery */}
        <div
          className="relative px-6 py-10 text-center overflow-hidden"
          style={{ backgroundColor: "#1a1a1a" }}
        >
          {/* Subtle poster background */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "url(/images/propaganda/hero-poster.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="relative z-10">
            <div className="flex justify-center mb-3">
              <span className="ribbon">Welcome To</span>
            </div>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl leading-none text-center" style={{ color: "#f5e6c8" }}>
              CHECK<span style={{ color: "#C1272D" }}>MY</span>REP
            </h1>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span style={{ color: "#c4a44a" }}>&#9733;</span>
              <div className="h-0.5 w-12" style={{ backgroundColor: "#c4a44a" }} />
              <span style={{ color: "#c4a44a" }}>&#9733;</span>
            </div>
          </div>
        </div>

        {/* Body — parchment */}
        <div className="px-6 py-8 text-center" style={{ backgroundColor: "#f5e6c8" }}>
          <p className="font-body text-base leading-relaxed mb-6" style={{ color: "#3a3a3a" }}>
            Democracy works better when you show up. Write letters, call your
            reps, and hold them accountable.
          </p>

          {/* Features — poster-style icons */}
          <div className="text-left mb-8 space-y-4">
            {[
              { img: "/images/propaganda/icons-flat.jpg", imgPos: "0% 0%", label: "Write and mail letters to your representatives" },
              { img: "/images/propaganda/icons-phone.jpg", imgPos: "0% 0%", label: "Log calls and track your outreach" },
              { img: "/images/propaganda/icons-hearts.jpg", imgPos: "0% 50%", label: "Earn points and level up your activism" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-4 p-3" style={{ borderLeft: "4px solid #C1272D", backgroundColor: "#faf6ee" }}>
                <div
                  className="w-14 h-14 shrink-0 overflow-hidden"
                  style={{
                    backgroundImage: `url(${f.img})`,
                    backgroundSize: "200%",
                    backgroundPosition: f.imgPos,
                    border: "2px solid #1a1a1a",
                  }}
                />
                <span className="font-headline text-base uppercase" style={{ color: "#1a1a1a" }}>{f.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={enter}
            className="w-full py-4 font-headline uppercase text-lg tracking-wider border-none cursor-pointer"
            style={{ backgroundColor: "#C1272D", color: "#f5e6c8", border: "3px solid #1a1a1a" }}
          >
            Get Started
          </button>
          <p className="mt-4 font-mono text-[10px]" style={{ color: "#8a8a8a" }}>
            All your data is stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
}
