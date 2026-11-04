export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "tr";

/** Cihaz tercihi (ilerlemeden bağımsız): dil seçici ve ilk ziyaret bandı bunu kullanır. */
export const LOCALE_STORAGE_KEY = "algoritma-app:locale";
