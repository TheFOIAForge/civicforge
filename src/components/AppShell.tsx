"use client";

import ActivistTopBar from "@/components/ActivistTopBar";
import ActivistBottomNav from "@/components/ActivistBottomNav";
import OnboardingModal from "@/components/OnboardingModal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OnboardingModal />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-red focus:text-white focus:px-4 focus:py-2 focus:font-mono focus:font-bold"
      >
        Skip to main content
      </a>
      <ActivistTopBar />
      <main
        id="main-content"
        className="flex-1"
        style={{ paddingBottom: "5rem", backgroundColor: "#f5e6c8" }}
      >
        {children}
      </main>
      <ActivistBottomNav />
    </>
  );
}
