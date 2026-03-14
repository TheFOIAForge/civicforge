"use client";

import { useState, useEffect } from "react";
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

  // Track sidebar collapsed/pinned state for content offset
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkSidebar = () => {
      const pinned = localStorage.getItem("sidebar-pinned") !== "false";
      const collapsed = localStorage.getItem("sidebar-collapsed") === "true";
      setSidebarCollapsed(!pinned || collapsed);
    };
    checkSidebar();
    window.addEventListener("storage", checkSidebar);
    // Poll for changes from sidebar interactions
    const interval = setInterval(checkSidebar, 300);
    return () => { window.removeEventListener("storage", checkSidebar); clearInterval(interval); };
  }, []);

  const contentPadding = hideChrome ? "" : sidebarCollapsed ? "lg:pl-16" : "lg:pl-64";

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
