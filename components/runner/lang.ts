/**
 * Sözde kod dili desteği (Türkçe / İngilizce).
 *
 * Tasarım: İngilizce yüzey anahtar kelimeleri tokenizer'da KANONİK (Türkçe) token değerlerine çevrilir.
 * Böylece parser'ın ve yorumlayıcının geri kalanı tek bir dili bilir. İngilizce, Türkçenin birebir aynasıdır
 * (docs/i18n/glossary.md): READ/WRITE, IF/ELSE/END, FOR ... TO ... STEP ... END_LOOP, WHILE ... END_LOOP.
 *
 * Not: Türkçe derslerde `not` bir değişken adıdır (not ← 45). Bu yüzden anahtar kelime tablosu
 * dile göre seçilir; İngilizce `NOT` yalnızca "en" modunda anahtar kelimedir.
 */

export type Lang = "tr" | "en";

/** İngilizce yüzey kelimesi → kanonik (Türkçe) token değeri. */
export const EN_KEYWORDS: Record<string, string> = {
  READ: "OKU",
  WRITE: "YAZ",
  IF: "EĞER",
  ELSE: "DEĞİLSE",
  END: "BİTİR",
  FOR: "İÇİN",
  END_LOOP: "DÖNGÜ_BİTİR",
  WHILE: "SÜRECE",
  STEP: "ADIM",
  TO: "DEN", // Türkçedeki "1'DEN 5'E" yapısının ilk yarısı; İngilizcede "TO" tek kelime
  TRUE: "DOĞRU",
  FALSE: "YANLIŞ",
  AND: "VE",
  OR: "VEYA",
  NOT: "DEĞİL",
  CONST: "SABIT",
  DIV: "DİV",
  MOD: "MOD",
  FUNCTION: "FONKSİYON",
  RETURN: "DÖNDÜR",
};

const EN_REVERSE: Record<string, string> = Object.fromEntries(Object.entries(EN_KEYWORDS).map(([en, tr]) => [tr, en]));

/** Hata mesajlarında kullanıcının yazdığı dilde anahtar kelime göstermek için. */
export function shown(lang: Lang, canonical: string): string {
  return lang === "en" ? (EN_REVERSE[canonical] ?? canonical) : canonical;
}

export type Messages = {
  unexpectedChar: (line: number, ch: string) => string;
  expected: (line: number, got: string, want: string) => string;
  invalidExpr: (line: number, got: string) => string;
  unexpected: (line: number, got: string) => string;
  stepLimit: (max: number) => string;
  expectedNumber: (line: number, found: string) => string;
  expectedBool: (line: number, found: string) => string;
  undefinedVar: (line: number, name: string) => string;
  notArrayIndex: (line: number) => string;
  indexOutOfRange: (line: number, idx: number) => string;
  undefinedFunc: (line: number, name: string) => string;
  paramCount: (line: number, name: string, expected: number, given: number) => string;
  divZero: (line: number) => string;
  unknownOp: (line: number) => string;
  constChange: (line: number, name: string) => string;
  notArrayAssign: (line: number) => string;
  cannotAssign: (line: number) => string;
  constExists: (line: number, name: string) => string;
  stepZero: (line: number) => string;
  returnOutside: string;
  undefinedValue: string;
  trueText: string;
  falseText: string;
};

const tr: Messages = {
  unexpectedChar: (n, ch) => `Satır ${n}: beklenmeyen karakter '${ch}'`,
  expected: (n, got, want) => `Satır ${n}: beklenmeyen "${got}" — "${want}" bekleniyordu.`,
  invalidExpr: (n, got) => `Satır ${n}: geçersiz ifade ("${got}").`,
  unexpected: (n, got) => `Satır ${n}: beklenmeyen "${got}".`,
  stepLimit: (max) => `İşlem sınırı aşıldı (${max} adım) — olası sonsuz döngü.`,
  expectedNumber: (n, v) => `Satır ${n}: sayısal bir değer bekleniyordu, "${v}" bulundu.`,
  expectedBool: (n, v) => `Satır ${n}: mantıksal bir değer bekleniyordu, "${v}" bulundu.`,
  undefinedVar: (n, name) => `Satır ${n}: tanımsız değişken "${name}".`,
  notArrayIndex: (n) => `Satır ${n}: dizi olmayan bir değer indekslenemez.`,
  indexOutOfRange: (n, idx) => `Satır ${n}: dizi indeksi sınırların dışında (${idx}).`,
  undefinedFunc: (n, name) => `Satır ${n}: tanımsız fonksiyon "${name}".`,
  paramCount: (n, name, exp, given) => `Satır ${n}: "${name}" fonksiyonu ${exp} parametre bekliyor, ${given} verildi.`,
  divZero: (n) => `Satır ${n}: sıfıra bölme hatası.`,
  unknownOp: (n) => `Satır ${n}: bilinmeyen operatör.`,
  constChange: (n, name) => `Satır ${n}: SABIT "${name}" değiştirilemez.`,
  notArrayAssign: (n) => `Satır ${n}: dizi olmayan bir değere indeksle atama yapılamaz.`,
  cannotAssign: (n) => `Satır ${n}: bu ifadeye atama yapılamaz.`,
  constExists: (n, name) => `Satır ${n}: SABIT "${name}" zaten tanımlı.`,
  stepZero: (n) => `Satır ${n}: döngü adımı 0 olamaz.`,
  returnOutside: "DÖNDÜR sadece bir fonksiyon içinde kullanılabilir.",
  undefinedValue: "tanımsız",
  trueText: "DOĞRU",
  falseText: "YANLIŞ",
};

const plural = (n: number, one: string, other: string) => (n === 1 ? one : other);

const en: Messages = {
  unexpectedChar: (n, ch) => `Line ${n}: unexpected character '${ch}'`,
  expected: (n, got, want) => `Line ${n}: unexpected "${got}", expected "${want}".`,
  invalidExpr: (n, got) => `Line ${n}: invalid expression ("${got}").`,
  unexpected: (n, got) => `Line ${n}: unexpected "${got}".`,
  stepLimit: (max) => `Step limit exceeded (${max} steps), possible infinite loop.`,
  expectedNumber: (n, v) => `Line ${n}: expected a number but found "${v}".`,
  expectedBool: (n, v) => `Line ${n}: expected a boolean value but found "${v}".`,
  undefinedVar: (n, name) => `Line ${n}: undefined variable "${name}".`,
  notArrayIndex: (n) => `Line ${n}: a value that is not an array cannot be indexed.`,
  indexOutOfRange: (n, idx) => `Line ${n}: array index out of range (${idx}).`,
  undefinedFunc: (n, name) => `Line ${n}: undefined function "${name}".`,
  paramCount: (n, name, exp, given) =>
    `Line ${n}: function "${name}" expects ${exp} ${plural(exp, "parameter", "parameters")}, but ${given} ${plural(given, "was", "were")} given.`,
  divZero: (n) => `Line ${n}: division by zero.`,
  unknownOp: (n) => `Line ${n}: unknown operator.`,
  constChange: (n, name) => `Line ${n}: CONST "${name}" cannot be changed.`,
  notArrayAssign: (n) => `Line ${n}: cannot assign by index to a value that is not an array.`,
  cannotAssign: (n) => `Line ${n}: cannot assign to this expression.`,
  constExists: (n, name) => `Line ${n}: CONST "${name}" is already defined.`,
  stepZero: (n) => `Line ${n}: loop step cannot be 0.`,
  returnOutside: "RETURN can only be used inside a function.",
  undefinedValue: "undefined",
  trueText: "TRUE",
  falseText: "FALSE",
};

export const MESSAGES: Record<Lang, Messages> = { tr, en };
