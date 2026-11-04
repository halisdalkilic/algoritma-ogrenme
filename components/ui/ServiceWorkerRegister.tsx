"use client";

import { useEffect } from "react";

/** PWA offline desteği için service worker'ı kaydeder (bkz. public/sw.js). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sw.js`).catch(() => {
        // Kayıt başarısız olsa da uygulama (offline destek olmadan) çalışmaya devam eder.
      });
    }
  }, []);

  return null;
}
