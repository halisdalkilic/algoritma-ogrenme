import type { Locale } from "./config";

/**
 * Serbest metin cevaplarını karşılaştırmak için küçük harfe çevirir. Türkçe yerel ayarı ("tr-TR") İngilizcede
 * yanlış sonuç verir ("I" → "ı", "İ" → "i"), bu yüzden dile göre seçilir. İki taraf da AYNI dilden geçirilmelidir.
 */
export function lowerFor(locale: Locale, s: string): string {
  return s.toLocaleLowerCase(locale === "tr" ? "tr-TR" : "en-US");
}

/** Boşlukları kırpıp küçük harfe çevirir (karşılaştırma için). */
export function normalizeAnswer(s: string, locale: Locale): string {
  return lowerFor(locale, s.trim());
}
