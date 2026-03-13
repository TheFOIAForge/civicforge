"use client";

import { useUserMode } from "@/lib/user-mode-context";
import Nav from "@/components/Nav";
import ActivistTopBar from "@/components/ActivistTopBar";
import ActivistBottomNav from "@/components/ActivistBottomNav";
import UrgencyBanner from "@/components/UrgencyBanner";
import Footer from "@/components/Footer";
import OnboardingModal from "@/components/OnboardingModal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { mode, modeAtLeast } = useUserMode();
  const isActivist = mode === "activist";

  return (
    <>
      <OnboardingModal />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-red focus:text-white focus:px-4 focus:py-2 focus:font-mono focus:font-bold"
      >
        Skip to main content
      </a>
      {isActivist ? <ActivistTopBar /> : <Nav />}
      {modeAtLeast("informed") && <UrgencyBanner />}
      <main
        id="main-content"
        className="flex-1"
        style={isActivist ? { paddingBottom: "5rem", backgroundColor: "#ffffff" } : undefined}
      >
        {children}
      </main>
      {isActivist ? <ActivistBottomNav /> : <Footer />}
    </>
  );
}
