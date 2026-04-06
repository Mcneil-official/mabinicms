"use client";

import { useEffect } from "react";
import { initPWA } from "@/lib/utils/pwa-utils";

/**
 * PWA Initializer Component
 * Initializes PWA features when the app loads
 * This must be in a client component to access browser APIs
 */
export function PWAInitializer() {
  useEffect(() => {
    let cancelled = false;

    const startPWA = () => {
      if (!cancelled) {
        void initPWA();
      }
    };

    if (typeof window === "undefined") {
      return () => {
        cancelled = true;
      };
    }

    if ("requestIdleCallback" in window) {
      const idleWindow = window as Window & {
        requestIdleCallback: typeof window.requestIdleCallback;
        cancelIdleCallback: typeof window.cancelIdleCallback;
      };
      const idleId = idleWindow.requestIdleCallback(startPWA, { timeout: 2000 });

      return () => {
        cancelled = true;
        idleWindow.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(startPWA, 1000);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, []);

  return null; // This component doesn't render anything
}
