/**
 * Türkçe sözde kodu İngilizceye (anahtar kelime düzeyinde) çevirir. İKİ amaçla kullanılır:
 *  1. Çeviri yardımcısı: `İÇİN i ← 1'DEN 5'E ADIM 1` → `FOR i ← 1 TO 5 STEP 1`
 *  2. Test: aynı program iki dilde aynı sonucu vermeli (gidiş-dönüş testi).
 *
 * Değişken ve fonksiyon adlarına DOKUNMAZ; onları çevirmen çevirir (toplam → total).
 * Dize literalleri ("Merhaba") olduğu gibi kalır; çevirmen onları ayrıca çevirir.
 */

import { EN_KEYWORDS } from "./lang";

const TR_TO_EN: Record<string, string> = Object.fromEntries(Object.entries(EN_KEYWORDS).map(([en, tr]) => [tr, en]));
// Türkçede "DEN" ve "E" ayrı anahtar kelimelerdir (ekler); İngilizcede TO tek kelimedir.
TR_TO_EN["DEN"] = "TO";

const WORD = /[A-Za-zÇĞİÖŞÜçğıöşü_][A-Za-zÇĞİÖŞÜçğıöşü0-9_]*/g;

function translateCode(code: string, renames: Record<string, string>): string {
  // "1'DEN 5'E", "3'TEN", "7'YE" gibi ünlü uyumlu ekler: kaynağı eşle, ilk yarı → " TO", ikinci yarı → sil
  let out = code.replace(/'(DEN|TEN|DAN|TAN)\b/gi, " TO");
  out = out.replace(/'(E|YE|A|YA)\b/gi, "");
  return out.replace(WORD, (word) => {
    const upper = word.toLocaleUpperCase("tr-TR");
    return TR_TO_EN[upper] ?? renames[word] ?? word;
  });
}

/**
 * @param renames Değişken/fonksiyon adı eşlemesi (tam kelime, büyük/küçük harf duyarlı). İngilizcede anahtar
 *   kelimeye dönüşen adlar için ZORUNLUDUR: Türkçe derslerdeki `not` değişkeni İngilizcede `NOT` olurdu, bu yüzden `grade` yapılır.
 */
export function trToEn(source: string, renames: Record<string, string> = {}): string {
  // Dize literallerini (çift tırnak) koru, geri kalanı çevir
  return source
    .split(/("[^"\n]*")/g)
    .map((part, i) => (i % 2 === 1 ? part : translateCode(part, renames)))
    .join("");
}
