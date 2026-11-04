import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Hesap özelliği yalnızca yapılandırma varsa açılır. Yoksa (varsayılan) uygulama tamamen yerel çalışır,
 * giriş arayüzü görünmez ve Supabase kütüphanesi hiç yüklenmez.
 */
export const accountsEnabled = Boolean(URL && ANON_KEY);

let client: Promise<SupabaseClient> | null = null;

/** Kütüphane yalnızca ilk gerektiğinde yüklenir (hesabı olmayan ziyaretçiye ek bayt yok). */
export function getSupabase(): Promise<SupabaseClient> {
  if (!accountsEnabled) return Promise.reject(new Error("Hesap özelliği yapılandırılmamış"));
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL!, ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "algoritma-app:auth" },
    }),
  );
  return client;
}

/** E-posta doğrulama / şifre sıfırlama bağlantılarının döneceği adres (alt klasör önekiyle). */
export function profileUrl(path: string): string {
  return `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}/`;
}
