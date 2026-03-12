"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/directory", label: "Members of Congress" },
  { href: "/issues", label: "Key Issues" },
  { href: "/draft", label: "Write Congress" },
  { href: "/federal-register", label: "Federal Register" },
  { href: "/gao-reports", label: "Oversight Reports" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/contacts", label: "My Letters" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Top bar */}
      <header className="border-b-3 border-red bg-black text-white sticky top-0 z-50">
        <div className="px-4 xl:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white p-1 font-headline text-xl hover:text-red transition-colors"
                aria-label="Toggle sidebar"
              >
                ☰
              </button>
              <Link href="/" className="no-underline text-white hover:text-white/80">
                <span className="font-headline text-2xl tracking-tight uppercase">
                  Civic<span className="text-red">Forge</span>
                </span>
                <span className="block font-mono text-[10px] text-white/40 uppercase tracking-widest -mt-1">
                  A project of FOIAForge
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-black text-white z-50 transform transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b-3 border-red">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="no-underline text-white hover:text-white/80"
          >
            <span className="font-headline text-2xl tracking-tight uppercase">
              Civic<span className="text-red">Forge</span>
            </span>
            <span className="block font-mono text-[10px] text-white/40 uppercase tracking-widest -mt-1">
              A project of FOIAForge
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white p-1 font-headline text-xl hover:text-red transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="py-2">
          {/* Mind Palace — highlighted feature */}
          <Link
            href="/mind-palace"
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-2 no-underline px-5 py-4 font-mono text-sm uppercase tracking-wider font-bold transition-colors border-l-4 mb-1 ${
              pathname === "/mind-palace"
                ? "bg-red text-white border-white"
                : "bg-red/80 text-white border-red hover:bg-red"
            }`}
          >
            <span className="px-1.5 py-0.5 bg-white text-red text-[10px] font-bold tracking-widest">AI</span>
            Mind Palace
          </Link>

          <div className="border-b border-white/10 mb-1" />

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center no-underline px-5 py-3.5 font-mono text-sm uppercase tracking-wider font-bold transition-colors border-l-4 ${
                pathname === link.href
                  ? "bg-red/20 text-red border-red"
                  : "text-white/80 border-transparent hover:bg-white/5 hover:text-white hover:border-white/30"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
