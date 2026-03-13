import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "us.checkmyrep.app",
  appName: "CheckMyRep",
  webDir: "out",
  server: {
    // In production, point to your deployed URL so API routes work
    // url: "https://civic.thefoiaforge.org",
    // cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#F5F0E8",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#F5F0E8",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
