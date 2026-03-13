"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useMyReps } from "@/lib/my-reps-context";
import { useUserMode, type UserMode } from "@/lib/user-mode-context";
import ModeSelector from "./ModeSelector";

interface NavSection {
  label: string;
  minMode?: UserMode;
  links: { href: string; label: string; sub?: boolean; minMode?: UserMode }[];
}

const sections: NavSection[] = [
  {
    label: "Take Action",
    links: [
      { href: "/draft", label: "Write Congress" },
      { href: "/my-reps", label: "My Representatives" },
      { href: "/scorecard", label: "My Scorecard", sub: true, minMode: "power" },
      { href: "/contacts", label: "My Letters", sub: true },
      { href: "/campaigns", label: "My Campaigns" },
      { href: "/alerts", label: "Alerts" },
    ],
  },
  {
    label: "Research",
    links: [
      { href: "/directory", label: "Members of Congress" },
      { href: "/compare", label: "Compare Reps", sub: true },
      { href: "/committees", label: "Committees", sub: true },
      { href: "/issues", label: "Key Issues" },
      { href: "/bills", label: "Legislation" },
      { href: "/votes", label: "Vote Lookup", sub: true },
    ],
  },
  {
    label: "Oversight",
    links: [
      { href: "/federal-register", label: "Federal Register" },
      { href: "/gao-reports", label: "GAO Oversight", sub: true },
      { href: "/support", label: "Support This Project" },
    ],
  },
];

export default function Nav() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { myReps } = useMyReps();
  const { mode, modeAtLeast: checkMode } = useUserMode();
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // Return focus to the toggle button when sidebar closes
    setTimeout(() => toggleButtonRef.current?.focus(), 0);
  }, []);

  // Focus trap for sidebar
  useEffect(() => {
    if (!sidebarOpen) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    // Focus the close button when sidebar opens
    const closeBtn = sidebar.querySelector<HTMLButtonElement>('[aria-label="Close sidebar"]');
    closeBtn?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeSidebar();
        return;
      }

      if (e.key === "Tab" && sidebar) {
        const focusable = sidebar.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen, closeSidebar]);

  return (
    <>
      {/* Top bar */}
      <header className="border-b-3 border-red bg-black text-white sticky top-0 z-50">
        <div className="px-5 xl:px-10">
          <div className="flex items-center justify-between h-18">
            <div className="flex items-center gap-5">
              <button
                ref={toggleButtonRef}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white p-2 hover:text-red transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={sidebarOpen}
                aria-controls="sidebar-nav"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M3 6h18M3 12h18M3 18h18" />
                </svg>
              </button>
              <Link href="/" className="no-underline text-white hover:text-white/80 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black">
                <span className="font-headline text-3xl tracking-tight uppercase">
                  Citizen<span className="text-red">Forge</span>
                </span>
                <span className="block font-mono text-xs text-white/40 uppercase tracking-widest -mt-1">
                  A project of FOIAForge
                </span>
              </Link>
            </div>

            {/* Quick-access top bar icons */}
            <div className="flex items-center gap-5">
              <ModeSelector />
              {myReps.length > 0 && (
                <span className="font-mono text-xs text-white/40 hidden sm:block">
                  {myReps.length} REP{myReps.length !== 1 ? "S" : ""} SAVED
                </span>
              )}
              <Link
                href="/alerts"
                className="text-white/60 hover:text-white no-underline transition-colors relative p-2 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Alerts"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </Link>
              <Link
                href="/settings"
                className="text-white/60 hover:text-white no-underline transition-colors p-2 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                aria-label="Settings"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={closeSidebar}
          onKeyDown={(e) => { if (e.key === "Escape") closeSidebar(); }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="sidebar-nav"
        role="dialog"
        aria-modal={sidebarOpen}
        aria-label="Site navigation"
        className={`fixed top-0 left-0 h-full w-72 bg-black text-white z-50 transform transition-transform duration-200 ease-out overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        {...(!sidebarOpen && { "aria-hidden": true, tabIndex: -1 })}
      >
        <div className="flex items-center justify-between px-5 h-18 border-b-3 border-red">
          <Link
            href="/"
            onClick={closeSidebar}
            className="no-underline text-white hover:text-white/80 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span className="font-headline text-3xl tracking-tight uppercase">
              Citizen<span className="text-red">Forge</span>
            </span>
            <span className="block font-mono text-xs text-white/40 uppercase tracking-widest -mt-1">
              A project of FOIAForge
            </span>
          </Link>
          <button
            onClick={closeSidebar}
            className="text-white p-2 font-headline text-2xl hover:text-red transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav aria-label="Main navigation" className="py-2">
          {/* Mind Palace — highlighted feature (power mode only) */}
          {checkMode("power") && (
            <Link
              href="/mind-palace"
              onClick={closeSidebar}
              className={`flex items-center gap-2 no-underline px-5 py-4 font-mono text-[17px] uppercase tracking-wider font-bold transition-colors border-l-4 mb-1 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                pathname === "/mind-palace"
                  ? "bg-red text-white border-white"
                  : "bg-red/80 text-white border-red hover:bg-red"
              }`}
              aria-current={pathname === "/mind-palace" ? "page" : undefined}
            >
              <span className="px-1.5 py-0.5 bg-white text-red text-[10px] font-bold tracking-widest" aria-hidden="true">AI</span>
              Mind Palace
            </Link>
          )}

          {sections.map((section) => {
            // Filter links by mode
            const visibleLinks = section.links.filter(
              (link) => !link.minMode || checkMode(link.minMode)
            );
            if (visibleLinks.length === 0) return null;
            return (
              <div key={section.label} role="group" aria-labelledby={`nav-section-${section.label}`}>
                <div className="px-5 pt-5 pb-1.5">
                  <span id={`nav-section-${section.label}`} className="font-mono text-[13px] font-bold text-white/30 uppercase tracking-[0.2em]">
                    {section.label}
                  </span>
                </div>
                {visibleLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeSidebar}
                    aria-current={pathname === link.href ? "page" : undefined}
                    className={`flex items-center no-underline font-mono uppercase tracking-wider font-bold transition-colors border-l-4 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
                      link.sub ? "px-8 py-2.5 text-[15px]" : "px-5 py-3.5 text-[17px]"
                    } ${
                      pathname === link.href
                        ? "bg-red/20 text-red border-red"
                        : link.sub
                          ? "text-white/50 border-transparent hover:bg-white/5 hover:text-white/80 hover:border-white/20"
                          : "text-white/80 border-transparent hover:bg-white/5 hover:text-white hover:border-white/30"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            );
          })}

          {/* FOIAForge — Records section */}
          <div role="group" aria-labelledby="nav-section-Records">
            <div className="px-5 pt-5 pb-1.5 border-t border-white/10 mt-2">
              <span id="nav-section-Records" className="font-mono text-[13px] font-bold text-white/30 uppercase tracking-[0.2em]">
                Records (FOIA)
              </span>
            </div>
            <a
              href="https://www.thefoiaforge.org/new-request"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeSidebar}
              className="flex items-center gap-2 no-underline font-mono uppercase tracking-wider font-bold transition-colors border-l-4 px-5 py-3.5 text-[17px] text-white/80 border-transparent hover:bg-white/5 hover:text-white hover:border-white/30 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              File a Request
              <svg width="12" height="12" className="text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="https://www.thefoiaforge.org/my-cases"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeSidebar}
              className="flex items-center gap-2 no-underline font-mono uppercase tracking-wider font-bold transition-colors border-l-4 px-8 py-2.5 text-[15px] text-white/50 border-transparent hover:bg-white/5 hover:text-white/80 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              My FOIA Cases
              <svg width="12" height="12" className="text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="https://www.thefoiaforge.org/agencies"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeSidebar}
              className="flex items-center gap-2 no-underline font-mono uppercase tracking-wider font-bold transition-colors border-l-4 px-8 py-2.5 text-[15px] text-white/50 border-transparent hover:bg-white/5 hover:text-white/80 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Agency Directory
              <svg width="12" height="12" className="text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
}
