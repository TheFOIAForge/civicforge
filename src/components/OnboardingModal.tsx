"use client";

import { useUserMode } from "@/lib/user-mode-context";
import { PenLine, Phone, Trophy, ArrowRight, Shield } from "lucide-react";

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
      style={{ backgroundColor: "rgba(10, 37, 64, 0.95)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to CheckMyRep"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-hero px-6 py-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 pattern-dots opacity-10" />
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img src="/images/civic/icons/capitol.png" alt="" className="w-8 h-8 opacity-90" aria-hidden="true" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Check<span className="text-gold">My</span>Rep
            </h1>
            <p className="mt-2 text-white/70 text-sm">
              Your direct line to Congress
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          <p className="text-center text-gray-600 text-base mb-8">
            Democracy works better when you show up. Write letters, call your
            reps, and stay informed.
          </p>

          <div className="space-y-3 mb-8">
            {[
              { civicIcon: "/images/civic/icons/mail.png", label: "Write and mail letters to your representatives", color: "bg-blue-50" },
              { civicIcon: "/images/civic/icons/contact.png", label: "Make calls with guided talking points", color: "bg-teal-50" },
              { civicIcon: "/images/civic/icons/voter-guide.png", label: "Track your impact and earn civic points", color: "bg-gold-50" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${f.color}`}>
                  <img src={f.civicIcon} alt="" className="w-6 h-6" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-navy">{f.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={enter}
            className="w-full py-3.5 bg-navy text-white font-semibold text-base rounded-xl
              flex items-center justify-center gap-2 cursor-pointer
              hover:bg-navy-light transition-all shadow-sm border-none"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-4 text-center text-xs text-gray-400">
            Your data stays on your device. No tracking, no ads.
          </p>
        </div>
      </div>
    </div>
  );
}
