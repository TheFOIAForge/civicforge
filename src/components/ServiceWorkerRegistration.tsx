"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Always unregister old SWs and clear stale caches first,
      // then register the latest sw.js (which uses network-first)
      (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            await reg.unregister();
          }
          // Clear any stale caches from previous SW versions
          const keys = await caches.keys();
          for (const key of keys) {
            if (key.startsWith("citizenforge-")) {
              await caches.delete(key);
            }
          }
          // Register fresh SW
          const newReg = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registered (clean):", newReg.scope);
        } catch (err) {
          console.log("Service Worker registration failed:", err);
        }
      })();
    }
  }, []);

  return null;
}
