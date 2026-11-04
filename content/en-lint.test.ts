import { describe, expect, it } from "vitest";
import { enContent } from "./en";

/** İngilizce dersler: Türkçe harf, Türkçe sözde kod anahtar sözcüğü, uzun tire ve kıvrık tırnak kalmamış olmalı (docs/i18n/style.md). */

function strings(node: unknown, path = ""): [string, string][] {
  if (typeof node === "string") return [[path, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (node && typeof node === "object") return Object.entries(node).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  return [];
}

// Türkçe sözde kod anahtar sözcükleri (ASCII yazımları dahil); İngilizce dersin hiçbir yerinde geçmemeli.
// "VE" ve "DEĞİL" gibi sözcükler İngilizce metinde zaten geçmez; büyük harfli yazımları aranır.
const TR_KEYWORDS = /\b(EĞER|EGER|DEĞİLSE|DEGILSE|BİTİR|BITIR|OKU|YAZ|İÇİN|ICIN|SÜRECE|SURECE|DÖNGÜ_BİTİR|DONGU_BITIR|FONKSİYON|FONKSIYON|DÖNDÜR|DONDUR|DOĞRU|DOGRU|YANLIŞ|YANLIS|SABİT|SABIT|VEYA|DEĞİL|DEGIL)\b/;

describe("İngilizce içerik: dil temizliği", () => {
  for (const l of enContent.lessons) {
    it(`ders ${l.id}`, () => {
      const all = strings(l);
      expect(all.filter(([, s]) => /[çğıöşüÇĞİÖŞÜ]/.test(s)).map(([p]) => p), "Türkçe harf").toEqual([]);
      expect(all.filter(([, s]) => /—|[“”‘’]/.test(s) || (s !== "…" && s.includes("…"))).map(([p]) => p), "uzun tire/kıvrık tırnak/üç nokta karakteri").toEqual([]);
      expect(all.filter(([, s]) => TR_KEYWORDS.test(s)).map(([p]) => p), "Türkçe anahtar sözcük").toEqual([]);
      expect(all.filter(([p, s]) => s.trim() === "" && !p.includes(".values[")).map(([p]) => p), "boş metin").toEqual([]);
    });
  }
  it("(içerik henüz boşsa) test paketi geçerli", () => expect(enContent.lessons.length).toBeGreaterThanOrEqual(0));
});
