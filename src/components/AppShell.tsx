"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import OnboardingModal from "@/components/OnboardingModal";

const HIDE_CHROME_ROUTES = ["/draft"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const hideChrome = HIDE_CHROME_ROUTES.includes(pathname);

  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const syncSidebar = useCallback(() => {
    const pinned = localStorage.getItem("sidebar-pinned") !== "false";
    const collapsed = localStorage.getItem("sidebar-collapsed") === "true";
    setSidebarExpanded(pinned && !collapsed);
  }, []);

  useEffect(() => {
    syncSidebar();
    const handler = () => syncSidebar();
    window.addEventListener("sidebar-state", handler);
    return () => window.removeEventListener("sidebar-state", handler);
  }, [syncSidebar]);

  const contentPadding = hideChrome ? "" : sidebarExpanded ? "lg:pl-64" : "lg:pl-16";

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

      <div className={`${contentPadding} min-h-screen flex flex-col transition-all duration-300`}>
        {!hideChrome && <TopBar onMenuToggle={() => setSidebarOpen(true)} />}
        <main
          id="main-content"
          className="flex-1 pb-20 lg:pb-0"
          style={{ backgroundColor: hideChrome ? "#000" : "var(--color-offwhite)" }}
        >
          {children}
        </main>
      </div>

      {!hideChrome && <BottomNav />}
    </>
  );
}
