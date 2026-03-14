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
        background: "#1a1a1a",
        borderBottom: "3px solid #c4a44a",
      }}
    >
      <div className="px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="no-underline">
            <span className="font-headline text-2xl tracking-tight uppercase" style={{ color: "#f5e6c8" }}>
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
                  style={{ backgroundColor: level.color, color: "#fff", border: "2px solid #c4a44a" }}
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
                  color: "#f5e6c8",
                  border: "2px solid #c4a44a",
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
