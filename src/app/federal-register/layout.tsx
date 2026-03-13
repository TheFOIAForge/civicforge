import type { Metadata } from "next";
export const metadata: Metadata = { title: "Federal Register — CitizenForge" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
