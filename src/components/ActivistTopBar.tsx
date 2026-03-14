"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getLevelForPoints } from "@/lib/points";

export default function ActivistTopBar() {
  const { user, profile, engagement, setShowAuthModal } = useAuth();
  const level = getLevelForPoints(engagement?.total_points || 0);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="no-underline text-gray-900 hover:text-gray-700">
            <span className="font-headline text-2xl tracking-tight uppercase">
              Check<span style={{ color: "#C1272D" }}>My</span>Rep
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/profile" className="flex items-center gap-2 no-underline">
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase"
                    style={{ backgroundColor: level.color, color: "#fff" }}
                  >
                    {engagement?.total_points || 0}
                  </span>
                </div>
                <div
                  className="w-8 h-8 flex items-center justify-center font-headline text-sm"
                  style={{ backgroundColor: level.color, color: "#fff" }}
                >
                  {profile?.display_name?.[0]?.toUpperCase() || "?"}
                </div>
              </Link>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-1.5 font-mono text-[11px] font-bold uppercase cursor-pointer"
                style={{
                  backgroundColor: "#C1272D",
                  color: "#fff",
                  border: "none",
                }}
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
