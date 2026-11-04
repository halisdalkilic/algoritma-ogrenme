"use client";

import { getSupabase, profileUrl } from "./supabase";
import { useAccountStore } from "./useAccountStore";
import { pullIfStale, resetSyncState, syncNow } from "./sync";

let listening = false;

/**
 * Supabase istemcisini yükler ve oturum değişikliklerini hesap deposuna yansıtır (tek sefer).
 * Oturum açıldığında ilerleme bulutla otomatik eşitlenir.
 */
export async function ensureAuth() {
  const supabase = await getSupabase();
  if (!listening) {
    listening = true;
    supabase.auth.onAuthStateChange((event, session) => {
      const account = useAccountStore.getState();
      if (event === "PASSWORD_RECOVERY") account.set({ recovery: true });
      if (session?.user) {
        const changed = account.email !== (session.user.email ?? null);
        account.set({ ready: true, email: session.user.email ?? null });
        // Callback içinde başka Supabase çağrısı yapmak kilitlenir; bir sonraki turda çalıştır.
        setTimeout(() => (changed ? void syncNow() : pullIfStale()), 0);
      } else {
        account.set({ ready: true, email: null, sync: "idle", syncMessage: null, recovery: false });
        resetSyncState();
      }
    });
  }
  return supabase;
}

/** Supabase hata iletilerini dilden bağımsız bir koda çevirir (ham ileti kullanıcıya gösterilmez; metin panelde seçilir). */
export type AuthErrorCode = "invalidLogin" | "notConfirmed" | "exists" | "weak" | "rate" | "network" | "generic" | "deleteFailed";
export type AuthInfoCode = "verifySent" | "resetSent" | "passwordUpdated" | "accountDeleted";

export function authErrorCode(error: { message?: string; code?: string } | null | undefined): AuthErrorCode {
  const text = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
  if (text.includes("invalid login") || text.includes("invalid_credentials")) return "invalidLogin";
  if (text.includes("not confirmed") || text.includes("email_not_confirmed")) return "notConfirmed";
  if (text.includes("already") || text.includes("exists")) return "exists";
  if (text.includes("weak") || text.includes("at least") || text.includes("password")) return "weak";
  if (text.includes("rate") || text.includes("too many") || text.includes("seconds")) return "rate";
  if (text.includes("fetch") || text.includes("network") || text.includes("failed")) return "network";
  return "generic";
}

export type AuthResult = { ok: true; info?: AuthInfoCode } | { ok: false; error: AuthErrorCode };

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const supabase = await ensureAuth();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { ok: false, error: authErrorCode(error) } : { ok: true };
  } catch (e) {
    return { ok: false, error: authErrorCode(e as { message?: string }) };
  }
}

export async function signUp(email: string, password: string, profilePath: string): Promise<AuthResult> {
  try {
    const supabase = await ensureAuth();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: profileUrl(profilePath) } });
    if (error) return { ok: false, error: authErrorCode(error) };
    return data.session
      ? { ok: true }
      : { ok: true, info: "verifySent" };
  } catch (e) {
    return { ok: false, error: authErrorCode(e as { message?: string }) };
  }
}

export async function sendPasswordReset(email: string, profilePath: string): Promise<AuthResult> {
  try {
    const supabase = await ensureAuth();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: profileUrl(profilePath) });
    if (error) return { ok: false, error: authErrorCode(error) };
    // Hesap var mı yok mu belli etmeyiz.
    return { ok: true, info: "resetSent" };
  } catch (e) {
    return { ok: false, error: authErrorCode(e as { message?: string }) };
  }
}

export async function updatePassword(password: string): Promise<AuthResult> {
  try {
    const supabase = await ensureAuth();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: authErrorCode(error) };
    useAccountStore.getState().set({ recovery: false });
    return { ok: true, info: "passwordUpdated" };
  } catch (e) {
    return { ok: false, error: authErrorCode(e as { message?: string }) };
  }
}

export async function signOut(): Promise<void> {
  const supabase = await ensureAuth();
  await supabase.auth.signOut(); // yerel ilerleme bu cihazda kalır
}

/** Hesabı ve buluttaki tüm veriyi kalıcı siler; bu cihazdaki yerel ilerlemeye dokunmaz. */
export async function deleteAccount(): Promise<AuthResult> {
  try {
    const supabase = await ensureAuth();
    const { error } = await supabase.rpc("delete_account");
    if (error) return { ok: false, error: "deleteFailed" };
    await supabase.auth.signOut();
    return { ok: true, info: "accountDeleted" };
  } catch (e) {
    return { ok: false, error: authErrorCode(e as { message?: string }) };
  }
}
