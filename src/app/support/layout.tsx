import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support CheckMyRep — Help Keep Government Accountability Free",
  description:
    "CheckMyRep is free and open source. Support the project to help keep government accountability tools available to everyone.",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
