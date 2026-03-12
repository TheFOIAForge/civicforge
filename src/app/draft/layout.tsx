import type { Metadata } from "next";
export const metadata: Metadata = { title: "Write Congress — CivicForge" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
