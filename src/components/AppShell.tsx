"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import OnboardingModal from "@/components/OnboardingModal";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <OnboardingModal />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100]
          focus:bg-navy focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main
          id="main-content"
          className="flex-1 pb-20 lg:pb-0"
          style={{ backgroundColor: "var(--color-offwhite)" }}
        >
          {children}
        </main>
      </div>

      <BottomNav />
    </>
  );
}
