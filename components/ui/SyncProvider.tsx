"use client";

import { useEffect } from "react";
import { accountsEnabled } from "@/lib/account/supabase";
import { ensureAuth } from "@/lib/account/auth";
import { flushNow, pullIfStale, schedulePush, syncNow } from "@/lib/account/sync";
import { useAccountStore } from "@/lib/account/useAccountStore";
import { useProgressStore } from "@/lib/useProgressStore";

const AUTH_STORAGE_KEY = "algoritma-app:auth";

/** Bu cihazda daha önce giriş yapılmış mı, ya da e-posta bağlantısından mı dönüldü? */
function mayHaveSession(): boolean {
  try {
    if (window.localStorage.getItem(AUTH_STORAGE_KEY)) return true;
  } catch {
    // localStorage yok: oturum da saklanamaz
  }
  return /[#?&](access_token|code|type)=/.test(window.location.hash + window.location.search);
}

/**
 * Hesap özelliği açıkken ilerlemeyi bulutla eşitler. Hiç giriş yapılmamış ziyaretçide Supabase
 * kütüphanesini yüklemez; yapılandırma yoksa hiçbir şey yapmaz.
 */
export function SyncProvider() {
  useEffect(() => {
    if (!accountsEnabled) return;

    if (mayHaveSession()) void ensureAuth();
    else useAccountStore.getState().set({ ready: true });

    const unsubscribe = useProgressStore.subscribe((state, prev) => {
      if (state.progress !== prev.progress) schedulePush(state.progress);
    });
    const onVisibility = () => (document.visibilityState === "hidden" ? flushNow() : pullIfStale());
    const onOnline = () => {
      if (useAccountStore.getState().sync === "error") void syncNow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
