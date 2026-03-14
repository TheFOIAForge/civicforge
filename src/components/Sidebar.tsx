"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  PenLine,
  Users,
  Megaphone,
  UserCircle,
  Search,
  BarChart3,
  Settings,
  HelpCircle,
  BookOpen,
  Scale,
  X,
} from "lucide-react";

const mainNav = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/draft", label: "Write", Icon: PenLine },
  { href: "/my-reps", label: "My Reps", Icon: Users },
  { href: "/directory", label: "All Reps", Icon: Search },
  { href: "/issues", label: "Issues", Icon: Megaphone },
  { href: "/votes", label: "Votes", Icon: Scale },
  { href: "/compare", label: "Compare", Icon: BarChart3 },
];

const secondaryNav = [
  { href: "/scorecard", label: "Scorecard", Icon: BookOpen },
  { href: "/profile", label: "Profile", Icon: UserCircle },
  { href: "/settings", label: "Settings", Icon: Settings },
  { href: "/support", label: "Help", Icon: HelpCircle },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + close (mobile) */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 no-underline" onClick={onClose}>
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center overflow-hidden">
            <img src="/images/civic/icons/capitol.png" alt="" className="w-5 h-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold tracking-tight text-navy">
            Check<span className="text-gold">My</span>Rep
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-gray-400 hover:text-navy rounded-lg transition-colors cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Navigate
        </p>
        {mainNav.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                no-underline transition-all
                ${isActive
                  ? "bg-navy text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-navy"
                }
              `}
            >
              <item.Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}

        <div className="my-4 border-t border-gray-200" />

        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          More
        </p>
        {secondaryNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                no-underline transition-all
                ${isActive
                  ? "bg-navy text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-navy"
                }
              `}
            >
              <item.Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer CTA */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/draft"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gold text-navy
            font-semibold text-sm rounded-xl no-underline shadow-sm
            hover:bg-gold-dark hover:text-white transition-all"
        >
          <PenLine className="w-4 h-4" />
          Contact Congress
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-xl
          transform transition-transform duration-300 ease-out
          lg:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop permanent sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0
          bg-white border-r border-gray-200 z-30"
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
