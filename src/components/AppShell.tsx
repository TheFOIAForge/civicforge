"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import OnboardingModal from "@/components/OnboardingModal";

const HIDE_TOPBAR_ROUTES = ["/draft"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const hideTopBar = HIDE_TOPBAR_ROUTES.includes(pathname);

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

      <div className={`${hideTopBar ? "" : "lg:pl-64"} min-h-screen flex flex-col`}>
        {!hideTopBar && <TopBar onMenuToggle={() => setSidebarOpen(true)} />}
        <main
          id="main-content"
          className="flex-1 pb-20 lg:pb-0"
          style={{ backgroundColor: hideTopBar ? "#000" : "var(--color-offwhite)" }}
        >
          {children}
        </main>
      </div>

      {!hideTopBar && <BottomNav />}
    </>
  );
}
