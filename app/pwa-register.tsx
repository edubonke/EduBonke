"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || window.self !== window.top) return;
    // Embedded previews do not need offline installation. Browser policies can
    // also deny service-worker access in otherwise supported top-level pages.
    try {
      if (!("serviceWorker" in navigator)) return;
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath}/` }).catch(() => undefined);
    } catch {
      // Offline installation is optional; keep the application usable.
    }
  }, []);
  return null;
}
