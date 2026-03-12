import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support CivicForge — Help Keep Government Accountability Free",
  description:
    "CivicForge is free and open source. Support the project to help keep government accountability tools available to everyone.",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
