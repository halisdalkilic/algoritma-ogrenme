"use client";

import { getSupabase, accountsEnabled } from "./supabase";
import { useAccountStore, type SyncIssue } from "./useAccountStore";
import { useProgressStore } from "../useProgressStore";
import { mergeProgress, parseRemote } from "../mergeProgress";
import type { Progress } from "../progress";

const PUSH_DELAY_MS = 2500;
const PULL_MIN_GAP_MS = 30_000;

let running = false;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | null = null;
/** En son sunucuyla eşleşen kayıt: aynı veriyi tekrar göndermeyiz. */
let lastSynced = "";
let lastPullAt = 0;

const signature = (p: Progress) => JSON.stringify(p);

function syncIssue(message: string): SyncIssue {
  if (message.startsWith("GECERSIZ:")) return { kind: "invalid", detail: message.slice(9).trim() };
  if (/fetch|network|Failed/i.test(message)) return { kind: "offline" };
  return { kind: "failed" };
}

/** Bulutla yerel ilerlemeyi birleştirir, sonucu iki tarafa da yazar. Aynı anda tek çalışır. */
export async function syncNow(): Promise<void> {
  if (!accountsEnabled) return;
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  useProgressStore.getState().hydrate(); // yerel kayıt yüklenmeden birleştirme yapılmaz
  const account = useAccountStore.getState();
  if (!account.email) {
    running = false;
    return;
  }
  account.set({ sync: "syncing", syncMessage: null });
  try {
    const supabase = await getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: row, error: readError } = await supabase.from("progress").select("data").eq("user_id", userId).maybeSingle();
      if (readError) throw readError;

      const store = useProgressStore.getState();
      const remote = row ? parseRemote(row.data) : null;
      const merged = remote ? mergeProgress(store.progress, remote) : store.progress;
      if (signature(merged) !== signature(store.progress)) store.applySynced(merged);
      const toSend = useProgressStore.getState().progress;

      const { error } = await supabase.rpc("save_progress", { p: toSend });
      if (!error) {
        lastSynced = signature(toSend);
        lastPullAt = Date.now();
        useAccountStore.getState().set({ sync: "synced", syncMessage: null, lastSyncedAt: Date.now() });
        return;
      }
      // Başka cihaz bu arada daha ileri gitti: tekrar çekip birleştir.
      if (error.message.startsWith("ESKI_KAYIT") && attempt === 0) continue;
      throw error;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e);
    useAccountStore.getState().set({ sync: "error", syncMessage: syncIssue(message) });
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      void syncNow();
    }
  }
}

/** İlerleme değişince kısa bir gecikmeyle bulutla eşitler (art arda cevapları tek istekte toplar). */
export function schedulePush(progress: Progress): void {
  if (!accountsEnabled || !useAccountStore.getState().email) return;
  if (signature(progress) === lastSynced) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    // Bu arada başka bir eşitleme aynı veriyi zaten gönderdiyse tekrar gönderme.
    if (signature(useProgressStore.getState().progress) !== lastSynced) void syncNow();
  }, PUSH_DELAY_MS);
}

/** Sekmeye dönülünce (ör. telefonda ilerledikten sonra bilgisayarda) bulutu yeniden çeker. */
export function pullIfStale(): void {
  if (!useAccountStore.getState().email) return;
  if (Date.now() - lastPullAt < PULL_MIN_GAP_MS) return;
  void syncNow();
}

export function flushNow(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    void syncNow();
  }
}

export function resetSyncState(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  lastSynced = "";
  lastPullAt = 0;
}
