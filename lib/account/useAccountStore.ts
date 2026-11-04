"use client";

import { create } from "zustand";

export type SyncState = "idle" | "syncing" | "synced" | "error";

/** Eşitleme sorunu: metni dile göre panel seçer. `detail` sunucunun (Türkçe) doğrulama notudur. */
export type SyncIssue = { kind: "invalid"; detail: string } | { kind: "offline" } | { kind: "failed" };

type AccountStore = {
  /** Oturum durumu belirlendi mi (ilk getSession tamamlandı mı)? */
  ready: boolean;
  email: string | null;
  sync: SyncState;
  syncMessage: SyncIssue | null;
  lastSyncedAt: number | null;
  /** Şifre sıfırlama bağlantısından dönüldü: yeni şifre formu gösterilir. */
  recovery: boolean;
  set: (patch: Partial<Omit<AccountStore, "set">>) => void;
};

export const useAccountStore = create<AccountStore>((set) => ({
  ready: false,
  email: null,
  sync: "idle",
  syncMessage: null,
  lastSyncedAt: null,
  recovery: false,
  set: (patch) => set(patch),
}));
