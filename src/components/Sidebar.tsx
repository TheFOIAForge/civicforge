"use client";

import { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Pin,
  Menu,
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
  const [pinned, setPinned] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-pinned") === "true";
    }
    return true;
  });
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar-pinned", String(pinned));
  }, [pinned]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // When unpinned, collapse when not hovered
  const showExpanded = pinned ? !collapsed : hovered;
  const sidebarWidth = showExpanded ? "w-64" : "w-16";

  const navLink = (item: (typeof mainNav)[0]) => {
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        aria-current={isActive ? "page" : undefined}
        title={!showExpanded ? item.label : undefined}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          no-underline transition-all
          ${isActive
            ? "bg-white/15 text-white shadow-sm"
            : "text-white/60 hover:bg-white/10 hover:text-white"
          }
        `}
      >
        <item.Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
        {showExpanded && <span className="whitespace-nowrap">{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + controls */}
      <div className="flex items-center justify-between px-3 h-16 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 no-underline" onClick={onClose}>
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
            <img src="/images/civic/icons/capitol.png" alt="" className="w-5 h-5" aria-hidden="true" />
          </div>
          {showExpanded && (
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">
              <span className="text-red-500">Check</span><span className="text-white">My</span><span className="text-blue-400">Rep</span>
            </span>
          )}
        </Link>
        <div className="flex items-center gap-1">
          {/* Pin button — desktop only */}
          {showExpanded && (
            <button
              onClick={() => setPinned(!pinned)}
              className="hidden lg:flex p-1.5 text-white/40 hover:text-white rounded-lg transition-colors cursor-pointer bg-transparent border-none"
              aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
              title={pinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              <Pin className={`w-4 h-4 ${pinned ? "text-blue-400" : ""}`} style={pinned ? { transform: "rotate(45deg)" } : undefined} />
            </button>
          )}
          {/* Collapse button — desktop only, when pinned */}
          {pinned && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 text-white/40 hover:text-white rounded-lg transition-colors cursor-pointer bg-transparent border-none"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-white/40 hover:text-white rounded-lg transition-colors cursor-pointer bg-transparent border-none"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {showExpanded && (
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-white/30">
            Navigate
          </p>
        )}
        {mainNav.map(navLink)}

        <div className="my-4 border-t border-white/10" />

        {showExpanded && (
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-white/30">
            More
          </p>
        )}
        {secondaryNav.map(navLink)}
      </nav>

      {/* Footer CTA */}
      {showExpanded && (
        <div className="p-3 border-t border-white/10">
          <Link
            href="/draft"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3
              font-semibold text-sm rounded-xl no-underline shadow-sm
              text-white transition-all hover:scale-105 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #dc2626, #7c3aed, #2563eb)" }}
          >
            <PenLine className="w-4 h-4" />
            Contact Congress
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-out drawer */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-72 bg-gray-950 shadow-xl
          transform transition-transform duration-300 ease-out
          lg:hidden
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col ${sidebarWidth} lg:fixed lg:inset-y-0 lg:left-0
          bg-gray-950 border-r border-white/10 z-30 transition-all duration-300`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
