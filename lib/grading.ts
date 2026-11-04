/**
 * `pseudo-write` alıştırması için kural tabanlı değerlendirici.
 * Anahtar kelimeleri TAM KELİME olarak arar (değişken adı `değer` içindeki "EĞER", ya da `format`
 * içindeki "OR" sayılmaz) ve çift tırnak içindeki metni yok sayar. Türkçede ASCII yazımı da kabul
 * edilir (EGER, BITIR, DONGU_BITIR).
 * Blok kontrolü: açıcı kelimeler (EĞER/FONKSİYON, İÇİN/SÜRECE; İngilizcede IF/FUNCTION, FOR/WHILE)
 * ile kapatıcılar (BİTİR / DÖNGÜ_BİTİR; END / END_LOOP) sayıca dengeli olmalı.
 * Tam esnek (AST tabanlı) değerlendirme v2 işi — bkz. plan.md bölüm 3.
 *
 * İki dil: kelime listeleri dile göre ayrıdır; "tr" Türkçe harfleri ASCII'ye indirger, "en" yalnızca
 * küçük harfe çevirir.
 */

import type { Lang } from "@/components/runner/lang";
import { foldTr } from "./answers";

export type PseudoWriteResult = {
  correct: boolean;
  foundKeywords: string[];
  missingKeywords: string[];
  unbalancedBlocks: string[];
};

/** Çift tırnaklı metinleri atar; "Eğer yağmur yağarsa" gibi bir YAZ metni kod sayılmasın. */
function stripStrings(code: string): string {
  return code.replace(/["“][^"”\n]*["”]/g, " ");
}

function wordsOf(text: string, lang: Lang): string[] {
  const folded = lang === "tr" ? foldTr(text) : text.toLowerCase();
  return folded.match(/[a-z0-9_]+/g) ?? [];
}

type Block = { label: string; opener: string; closer: string; closerLabel: string };

/** `opener` ve `closer` wordsOf çıktısı biçimindedir (küçük harf, ASCII). */
const BLOCKS: Record<Lang, Block[]> = {
  tr: [
    { label: "EĞER", opener: "eger", closer: "bitir", closerLabel: "BİTİR" },
    { label: "FONKSİYON", opener: "fonksiyon", closer: "bitir", closerLabel: "BİTİR" },
    { label: "İÇİN", opener: "icin", closer: "dongu_bitir", closerLabel: "DÖNGÜ_BİTİR" },
    { label: "SÜRECE", opener: "surece", closer: "dongu_bitir", closerLabel: "DÖNGÜ_BİTİR" },
  ],
  en: [
    { label: "IF", opener: "if", closer: "end", closerLabel: "END" },
    { label: "FUNCTION", opener: "function", closer: "end", closerLabel: "END" },
    { label: "FOR", opener: "for", closer: "end_loop", closerLabel: "END_LOOP" },
    { label: "WHILE", opener: "while", closer: "end_loop", closerLabel: "END_LOOP" },
  ],
};

export function gradePseudoWrite(code: string, requiredKeywords: string[], lang: Lang = "tr"): PseudoWriteResult {
  const words = wordsOf(stripStrings(code), lang);
  const count = (w: string) => words.reduce((n, x) => (x === w ? n + 1 : n), 0);

  const foundKeywords: string[] = [];
  const missingKeywords: string[] = [];
  for (const keyword of requiredKeywords) {
    const needed = wordsOf(keyword, lang);
    const present = needed.length > 0 && needed.every((w) => words.includes(w));
    (present ? foundKeywords : missingKeywords).push(keyword);
  }

  // Aynı kapatıcıyı paylaşan bloklar (EĞER ve FONKSİYON → BİTİR) birlikte sayılır; kullanıcının
  // hiç kullanmadığı bir blok tipi için "eksik kapanış" uyarısı verilmez.
  const blocks = BLOCKS[lang];
  const unbalancedBlocks: string[] = [];
  for (const closer of new Set(blocks.map((b) => b.closer))) {
    const group = blocks.filter((b) => b.closer === closer);
    const opened = group.reduce((n, b) => n + count(b.opener), 0);
    if (opened > count(closer)) {
      for (const b of group) {
        if (count(b.opener) > 0) unbalancedBlocks.push(`${b.label} ... ${b.closerLabel}`);
      }
    }
  }

  return {
    correct: missingKeywords.length === 0 && unbalancedBlocks.length === 0,
    foundKeywords,
    missingKeywords,
    unbalancedBlocks,
  };
}
