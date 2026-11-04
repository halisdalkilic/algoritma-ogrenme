/**
 * Cevap karşılaştırma yardımcıları. Amaç haksız yanlışı önlemek: büyük/küçük harf, fazla boşluk,
 * Türkçe karakter yerine ASCII yazma (telefon/İngilizce klavye: "dogru", "EGER") ve ondalık virgül
 * kullanıcının cezası olmamalı.
 *
 * İki dil: "tr" Türkçe harfleri ASCII'ye indirger ve ondalık virgülü kabul eder; "en" yalnızca harf
 * boyutunu ve boşluğu eşitler (İngilizcede virgül ondalık ayırıcı değildir).
 */

/** Karşılaştırma dili. */
export type AnswerLang = "tr" | "en";

/**
 * Türkçe harfleri ve harf boyutunu eşitler: "DOĞRU", "doğru", "Dogru" ve "DOGRU" aynı olur.
 * `ı`/`İ`/`I`/`i` bilerek birleştirilir (İngilizce klavyede "I" yazanlar için).
 */
export function foldTr(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[İIı]/g, "i")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/** Dile göre katlama: "en" Türkçe katlamayı UYGULAMAZ (İngilizce metinde "I" → "ı" gibi sürprizler olmasın). */
export function foldFor(text: string, lang: AnswerLang): string {
  return lang === "tr" ? foldTr(text) : text.normalize("NFC").toLowerCase();
}

/** Boyut, Türkçe karakter ve ardışık boşluk farkı gözetmeden iki metni karşılaştırır. */
export function sameText(a: string, b: string, lang: AnswerLang = "tr"): boolean {
  const clean = (s: string) => foldFor(s, lang).replace(/\s+/g, " ").trim();
  return clean(a) === clean(b);
}

const NUMBER = /^[-+]?\d+(?:[.,]\d+)?$/;

/** Türkçede "3,5" ve "3.5" aynı sayıdır; İngilizcede yalnızca "3.5". Sayı değilse null. */
export function parseNumber(text: string, lang: AnswerLang = "tr"): number | null {
  const t = text.trim();
  if (lang === "en" && t.includes(",")) return null;
  return NUMBER.test(t) ? Number(t.replace(",", ".")) : null;
}

/** İki değer de sayıysa sayısal, değilse metin olarak eşit mi? ("05" = "5", "Kaldı" = "kaldi"). */
export function sameValue(a: string, b: string, lang: AnswerLang = "tr"): boolean {
  const x = parseNumber(a, lang);
  const y = parseNumber(b, lang);
  if (x !== null && y !== null) return x === y;
  return sameText(a, b, lang);
}

const QUOTES = /^["'“”‘’]+|["'“”‘’]+$/g;

/** "1, 2 3;4" → ["1","2","3","4"]. Çevreleyen tırnaklar atılır ("Veli" = Veli). */
export function splitOutput(value: string): string[] {
  return value
    .split(/[\s,;]+/)
    .map((t) => t.replace(QUOTES, "").trim())
    .filter(Boolean);
}

/** Çıktı tahmini: sıra ve sayı aynı olmalı, her öğe `sameValue` ile eşleşmeli. */
export function outputMatches(userInput: string, expected: string[], lang: AnswerLang = "tr"): boolean {
  const user = splitOutput(userInput);
  const want = expected.flatMap(splitOutput);
  return user.length === want.length && user.every((token, i) => sameValue(token, want[i], lang));
}

/** Karıştırır ama (en az 2 öğede) asla zaten çözülmüş sırayı vermez: soru baştan çözülmüş açılmasın. */
export function shuffledIndices(length: number, random: () => number = Math.random): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  if (length < 2) return arr;
  const sorted = (a: number[]) => a.every((v, i) => v === i);
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (sorted(arr));
  return arr;
}
