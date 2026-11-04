import type { Locale } from "./config";

/**
 * Dil seçici ve ilk ziyaret bandının metinleri. Sözlük dışında tutuldu: her metin KARŞI dilde yazılır
 * (Türkçe sayfadaki seçici "English" der, İngilizce sayfadaki "Türkçe" der) ve İngilizce sözlük testi
 * Türkçe harfleri yasaklar. Anahtar, metnin GÖSTERİLDİĞİ sayfanın dilidir.
 */
export const SWITCHER: Record<Locale, { label: string; title: string; aria: string; target: Locale; targetLang: string }> = {
  tr: { label: "EN", title: "English", aria: "View this page in English", target: "en", targetLang: "en" },
  en: { label: "TR", title: "Türkçe", aria: "Bu sayfayı Türkçe görüntüle", target: "tr", targetLang: "tr" },
};

export const BANNER: Record<Locale, { text: string; action: string; dismiss: string; lang: string }> = {
  tr: { text: "Algorithm Learning is also available in English.", action: "Switch to English", dismiss: "Dismiss", lang: "en" },
  en: { text: "Bu sitenin Türkçe sürümü de var.", action: "Türkçeye geç", dismiss: "Kapat", lang: "tr" },
};
