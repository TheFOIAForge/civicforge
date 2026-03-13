"use client";

import { useUserMode, type UserMode } from "@/lib/user-mode-context";

const modes: { value: UserMode; label: string; icon: string }[] = [
  { value: "activist", label: "SIMPLE", icon: "\u270A" },
  { value: "informed", label: "DETAIL", icon: "\uD83D\uDCF0" },
  { value: "power", label: "PRO", icon: "\u26A1" },
];

export default function ModeSelector() {
  const { mode, setMode } = useUserMode();
  const activeIndex = modes.findIndex((m) => m.value === mode);

  return (
    <div
      className="relative flex items-center h-8 p-0.5"
      role="radiogroup"
      aria-label="Experience mode"
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: "9999px",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {/* Sliding pill indicator */}
      <div
        className="absolute top-0.5 bottom-0.5 transition-all duration-300 ease-out"
        style={{
          width: `calc(${100 / modes.length}% - 2px)`,
          left: `calc(${(activeIndex * 100) / modes.length}% + 1px)`,
          backgroundColor: "#C1272D",
          borderRadius: "9999px",
          boxShadow: "0 0 12px rgba(193,39,45,0.5)",
        }}
      />

      {modes.map((m) => {
        const isActive = mode === m.value;
        return (
          <button
            key={m.value}
            role="radio"
            aria-checked={isActive}
            aria-label={`${m.label} mode`}
            onClick={() => setMode(m.value)}
            className="relative z-10 flex items-center gap-1 px-2.5 py-1 cursor-pointer bg-transparent border-none transition-colors"
            style={{
              color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <span className="text-xs" aria-hidden="true">{m.icon}</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider hidden sm:inline">
              {m.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
