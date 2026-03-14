"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PenLine, Users, Megaphone, UserCircle } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/draft", label: "Write", Icon: PenLine },
  { href: "/my-reps", label: "My Reps", Icon: Users },
  { href: "/issues", label: "Issues", Icon: Megaphone },
  { href: "/profile", label: "Profile", Icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-gray-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`
                flex flex-col items-center justify-center gap-1 no-underline
                w-full h-full relative transition-colors
                ${isActive ? "text-navy" : "text-gray-400 hover:text-gray-600"}
              `}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-gold" />
              )}
              <tab.Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
