/**
 * Türkçe sözde kod için tokenizer (lexer).
 * Her token, kaynak metindeki satır numarasını (0-indeksli) taşır — bu,
 * StepRunner'ın çalışırken satır vurgulaması yapabilmesi için gereklidir.
 */

import { EN_KEYWORDS, MESSAGES, type Lang } from "./lang";

export type TokenType =
  | "NUMBER"
  | "STRING"
  | "IDENT"
  | "KEYWORD"
  | "OP"
  | "LPAREN"
  | "RPAREN"
  | "LBRACKET"
  | "RBRACKET"
  | "COMMA"
  | "NEWLINE"
  | "EOF";

export type Token = {
  type: TokenType;
  value: string;
  line: number;
};

const KEYWORDS = new Set([
  "OKU",
  "YAZ",
  "EĞER",
  "DEĞİLSE",
  "BİTİR",
  "İÇİN",
  "DÖNGÜ_BİTİR",
  "SÜRECE",
  "ADIM",
  "DOĞRU",
  "YANLIŞ",
  "VE",
  "VEYA",
  "DEĞİL",
  "SABIT",
  "DEN", // "1'DEN" normalize edildikten sonra
  "E", // "5'E" normalize edildikten sonra
  "DİV", // not: "div".toLocaleUpperCase("tr-TR") === "DİV" (noktalı İ), "DIV" değil
  "MOD",
  "FONKSİYON",
  "DÖNDÜR",
]);

/**
 * "1'DEN", "3'TEN", "5'E", "7'YE" gibi Türkçe ünlü uyumlu ek biçimlerini
 * tekil bir kelimeye normalize eder: "1 DEN", "3 DEN", "5 E", "7 E".
 * Böylece parser sadece DEN / E anahtar kelimelerini tanımak zorunda kalır.
 */
function normalizeSuffixes(source: string): string {
  return source.replace(/'(DEN|TEN|DAN|TAN|YE|YA|E|A)\b/gi, (_m, suffix: string) => {
    const upper = suffix.toLocaleUpperCase("tr-TR");
    const isFrom = upper === "DEN" || upper === "TEN" || upper === "DAN" || upper === "TAN";
    return " " + (isFrom ? "DEN" : "E");
  });
}

const IDENT_START = /[A-Za-zÇĞİÖŞÜçğıöşü_]/;
const IDENT_PART = /[A-Za-zÇĞİÖŞÜçğıöşü0-9_]/;

export function tokenize(source: string, lang: Lang = "tr"): Token[] {
  const msg = MESSAGES[lang];
  // "1'DEN 5'E" eki normalleştirmesi yalnızca Türkçeye özgü; İngilizcede "1 TO 5" tek kelimedir.
  const normalized = lang === "tr" ? normalizeSuffixes(source) : source;
  const lines = normalized.split("\n");
  const tokens: Token[] = [];

  for (let lineNo = 0; lineNo < lines.length; lineNo++) {
    const line = lines[lineNo];
    let i = 0;
    while (i < line.length) {
      const ch = line[i];

      if (ch === " " || ch === "\t" || ch === "\r") {
        i++;
        continue;
      }

      // Yorum: // ile başlar, satır sonuna kadar
      if (ch === "/" && line[i + 1] === "/") {
        break;
      }

      if (ch === "(") {
        tokens.push({ type: "LPAREN", value: "(", line: lineNo });
        i++;
        continue;
      }
      if (ch === ")") {
        tokens.push({ type: "RPAREN", value: ")", line: lineNo });
        i++;
        continue;
      }
      if (ch === "[") {
        tokens.push({ type: "LBRACKET", value: "[", line: lineNo });
        i++;
        continue;
      }
      if (ch === "]") {
        tokens.push({ type: "RBRACKET", value: "]", line: lineNo });
        i++;
        continue;
      }
      if (ch === ",") {
        tokens.push({ type: "COMMA", value: ",", line: lineNo });
        i++;
        continue;
      }

      // Dize (string) literal
      if (ch === '"') {
        let j = i + 1;
        let value = "";
        while (j < line.length && line[j] !== '"') {
          value += line[j];
          j++;
        }
        tokens.push({ type: "STRING", value, line: lineNo });
        i = j + 1;
        continue;
      }

      // ← atama operatörü (veya ASCII karşılığı "<-")
      if (ch === "←") {
        tokens.push({ type: "OP", value: "←", line: lineNo });
        i++;
        continue;
      }
      if (ch === "<" && line[i + 1] === "-") {
        tokens.push({ type: "OP", value: "←", line: lineNo });
        i += 2;
        continue;
      }

      // Karşılaştırma operatörleri
      if (ch === "≤" || (ch === "<" && line[i + 1] === "=")) {
        tokens.push({ type: "OP", value: "≤", line: lineNo });
        i += ch === "≤" ? 1 : 2;
        continue;
      }
      if (ch === "≥" || (ch === ">" && line[i + 1] === "=")) {
        tokens.push({ type: "OP", value: "≥", line: lineNo });
        i += ch === "≥" ? 1 : 2;
        continue;
      }
      if (ch === "≠" || (ch === "!" && line[i + 1] === "=")) {
        tokens.push({ type: "OP", value: "≠", line: lineNo });
        i += ch === "≠" ? 1 : 2;
        continue;
      }
      if ("<>=+-*/".includes(ch)) {
        tokens.push({ type: "OP", value: ch, line: lineNo });
        i++;
        continue;
      }

      // Sayı literal (ondalık dahil)
      if (/[0-9]/.test(ch)) {
        let j = i;
        while (j < line.length && /[0-9]/.test(line[j])) j++;
        if (line[j] === "." && /[0-9]/.test(line[j + 1] ?? "")) {
          j++;
          while (j < line.length && /[0-9]/.test(line[j])) j++;
        }
        tokens.push({ type: "NUMBER", value: line.slice(i, j), line: lineNo });
        i = j;
        continue;
      }

      // Kimlik (identifier) veya anahtar kelime
      if (IDENT_START.test(ch)) {
        let j = i;
        while (j < line.length && IDENT_PART.test(line[j])) j++;
        const word = line.slice(i, j);
        if (lang === "en") {
          // toUpperCase(): "tr-TR" kullanılsaydı "if" → "İF" olur ve hiçbir anahtar kelime eşleşmezdi
          const canonical = EN_KEYWORDS[word.toUpperCase()];
          if (canonical) tokens.push({ type: "KEYWORD", value: canonical, line: lineNo });
          else tokens.push({ type: "IDENT", value: word, line: lineNo });
          i = j;
          continue;
        }
        const upper = word.toLocaleUpperCase("tr-TR");
        if (KEYWORDS.has(upper)) {
          tokens.push({ type: "KEYWORD", value: upper, line: lineNo });
        } else {
          tokens.push({ type: "IDENT", value: word, line: lineNo });
        }
        i = j;
        continue;
      }

      throw new Error(msg.unexpectedChar(lineNo + 1, ch));
    }

    tokens.push({ type: "NEWLINE", value: "\\n", line: lineNo });
  }

  tokens.push({ type: "EOF", value: "", line: lines.length });
  return tokens;
}
