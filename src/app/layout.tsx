import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EcosystemBar from "@/components/EcosystemBar";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { MyRepsProvider } from "@/lib/my-reps-context";

export const metadata: Metadata = {
  title: "CivicForge — They Work For You",
  description:
    "Find your representatives, draft AI-powered letters, track your contacts, and organize campaigns. A civic engagement hub by FOIAForge.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CivicForge",
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
        <MyRepsProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-red focus:text-white focus:px-4 focus:py-2 focus:font-mono focus:font-bold"
          >
            Skip to main content
          </a>
          <EcosystemBar />
          <Nav />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
        </MyRepsProvider>
      </body>
    </html>
  );
}
