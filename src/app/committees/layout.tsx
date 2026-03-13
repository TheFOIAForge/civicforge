import type { Metadata } from "next";
export const metadata: Metadata = { title: "Congressional Committees — CheckMyRep" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
