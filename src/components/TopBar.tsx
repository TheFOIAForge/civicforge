"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getLevelForPoints } from "@/lib/points";
import { Search, Bell, User, Menu } from "lucide-react";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { user, profile, engagement, setShowAuthModal } = useAuth();
  const level = getLevelForPoints(engagement?.total_points || 0);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-200">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu (mobile) + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-navy rounded-xl transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 no-underline">
              <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center overflow-hidden">
                <img src="/images/civic/icons/capitol.png" alt="" className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold tracking-tight text-navy">
                Check<span className="text-gold">My</span>Rep
              </span>
            </Link>
          </div>

          {/* Center: Search (desktop only) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search representatives, issues..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-xl text-sm
                  placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  className="relative p-2 text-gray-500 hover:text-navy rounded-xl transition-colors cursor-pointer hidden sm:flex"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 no-underline px-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {profile?.display_name || "Profile"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: level.color }}
                    >
                      {engagement?.total_points || 0}
                    </span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-semibold text-white"
                      style={{ backgroundColor: level.color }}
                    >
                      {profile?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                  </div>
                </Link>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl
                  hover:bg-navy-light transition-all shadow-sm cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
