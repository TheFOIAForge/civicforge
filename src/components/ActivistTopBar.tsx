"use client";

import Link from "next/link";
import ModeSelector from "./ModeSelector";

export default function ActivistTopBar() {
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
          </div>
        </div>
      </div>
    </header>
  );
}
