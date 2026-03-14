import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { UserModeProvider } from "@/lib/user-mode-context";
import { MyRepsProvider } from "@/lib/my-reps-context";
import { ScorecardProvider } from "@/lib/scorecard-context";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import AuthModal from "@/components/AuthModal";

export const metadata: Metadata = {
  title: "CheckMyRep — Your Direct Line to Congress",
  description:
    "Find your representatives, write letters, send emails, make calls, and track your civic engagement. Free and non-partisan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CheckMyRep",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icons/favicon.svg",
    apple: "/icons/apple-touch-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A2540",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <ServiceWorkerRegistration />
        <AuthProvider>
          <UserModeProvider>
            <MyRepsProvider>
              <ScorecardProvider>
                <AppShell>{children}</AppShell>
                <AuthModal />
              </ScorecardProvider>
            </MyRepsProvider>
          </UserModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
