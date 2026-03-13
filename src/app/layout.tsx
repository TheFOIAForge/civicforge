import type { Metadata } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { UserModeProvider } from "@/lib/user-mode-context";
import { MyRepsProvider } from "@/lib/my-reps-context";
import { ScorecardProvider } from "@/lib/scorecard-context";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "CitizenForge — They Work For You",
  description:
    "Find your representatives, draft AI-powered letters, track your contacts, and organize campaigns. A civic engagement hub by FOIAForge.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CitizenForge",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icons/favicon.svg",
    apple: "/icons/apple-touch-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ServiceWorkerRegistration />
        <UserModeProvider>
          <MyRepsProvider>
            <ScorecardProvider>
              <AppShell>{children}</AppShell>
            </ScorecardProvider>
          </MyRepsProvider>
        </UserModeProvider>
      </body>
    </html>
  );
}
