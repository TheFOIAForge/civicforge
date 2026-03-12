"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Explore" },
  { href: "/issues", label: "Issues" },
  { href: "/draft", label: "Take Action" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/contacts", label: "Contact Log" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-b-3 border-red bg-black text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-18 py-3">
          <Link href="/" className="no-underline text-white hover:text-white/80">
            <span className="font-headline text-2xl tracking-tight uppercase">
              Civic<span className="text-red">Forge</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`no-underline px-4 py-2 font-mono text-sm uppercase tracking-wider font-bold transition-colors ${
                  pathname === link.href
                    ? "bg-red text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2 font-headline text-2xl"
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden border-t-2 border-white/20 pb-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block no-underline px-4 py-3 font-mono text-base uppercase tracking-wider font-bold border-b border-white/10 ${
                  pathname === link.href
                    ? "bg-red text-white"
                    : "text-white hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
