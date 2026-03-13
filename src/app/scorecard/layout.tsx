import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Scorecard — CitizenForge",
};

export default function ScorecardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
