import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { UserModeProvider } from "@/lib/user-mode-context";
import { MyRepsProvider } from "@/lib/my-reps-context";
import { ScorecardProvider } from "@/lib/scorecard-context";
import { AuthProvider } from "@/lib/auth-context";
import AppShell from "@/components/AppShell";
import AuthModal from "@/components/AuthModal";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});

export const metadata: Metadata = {
  title: "CheckMyRep — Your Direct Line to Congress",
  description:
    "Find your representatives, write letters, send emails, make calls, and track your civic engagement. Free and non-partisan.",
  metadataBase: new URL("https://www.checkmyrep.us"),
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
  openGraph: {
    title: "CheckMyRep — Your Direct Line to Congress",
    description:
      "Find your representatives, write letters, send emails, make calls, and track civic engagement. Free and non-partisan.",
    url: "https://www.checkmyrep.us",
    siteName: "CheckMyRep",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CheckMyRep — Your Direct Line to Congress",
    description:
      "Find your reps, write letters, send emails, make calls. Free and non-partisan.",
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="en" className={`${inter.variable} ${bebasNeue.variable}`}>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased`}>
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
