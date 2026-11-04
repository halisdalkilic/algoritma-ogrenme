// Metin denetimi: Türkçe ve İngilizce içeriğin yazım/noktalama tutarlılığını tarar.
//   node scripts/lint-text.mjs            tüm içerik (tr + varsa en)
//   node scripts/lint-text.mjs --lang=tr  sadece Türkçe
//   node scripts/lint-text.mjs --warn     uyarıları da göster (varsayılan: sadece hatalar)
// Çıkış kodu: hata varsa 1. Uyarılar çıkış kodunu etkilemez (insan gözüyle bakılır).
// Kurallar docs/i18n/style.md ile birlikte okunmalıdır.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const args = process.argv.slice(2);
const only = args.find((a) => a.startsWith("--lang="))?.split("=")[1];
const showWarn = args.includes("--warn");

// Bu anahtarlar altındaki değerler kod/veri olduğu için metin kurallarından muaf tutulur.
const SKIP_KEYS = new Set([
  "id", "worldId", "type", "shape", "src", "component", "props", "pseudocode", "runnerSource", "runnerInputs",
  "template", "answer", "correctOutput", "expectedRows", "columns", "vars", "output", "requiredKeywords",
  "sampleSolution", "from", "to", "correctIndex", "correctOrder", "difficulty", "estimatedMinutes", "prerequisites",
  "line", "kind", "icons", "values", "mode", "target", "name", "algo", "variant", "view",
]);

const TR_LETTERS = /[çğıöşüÇĞİÖŞÜ]/;
const TR_KEYWORDS = /\b(EĞER|DEĞİLSE|İÇİN|SÜRECE|DÖNGÜ_BİTİR|BİTİR|YAZ|OKU|DOĞRU|YANLIŞ|FONKSİYON|DÖNDÜR)\b/;
const UK_SPELLING = /\b(colour|behaviour|centre|analyse|favourite|organise|programme|licence|grey|whilst)\b/i;

// Türkçe: sık yapılan yazım hataları (yanlış → doğru)
const TR_WRONG = [
  [/\bherşey\b/i, "her şey"], [/\bbirşey\b/i, "bir şey"], [/\bhiçbirşey\b/i, "hiçbir şey"],
  [/\byada\b/i, "ya da"], [/\bbir kaç\b/i, "birkaç"], [/\bbirkaç şey\b/i, null],
  [/\bhiç bir\b/i, "hiçbir"], [/\bher kes\b/i, "herkes"], [/\bşuan\b/i, "şu an"],
  [/\bbirçok\b/i, null], [/\byanlız\b/i, "yalnız"], [/\bdoğuru\b/i, "doğru"],
  [/\bbirden çok\b/i, null], [/\bdeğişkenin ismi\b/i, null], [/\bortalama(sı)?nı bul\b/i, null],
  [/\bkarşılaştırıyor(sun)?\b/i, null], [/\bdeyil\b/i, "değil"], [/\btamammen\b/i, "tamamen"],
  [/\bve yada\b/i, "ve/veya"], [/\bgerçekte(n)? de\b/i, null],
].filter(([, fix]) => fix !== null);

// Sayıdan sonra kesmesiz ek: "3de", "5i", "10u"
const NO_APOSTROPHE = /(^|[^\w.,'/-])\d+(de|da|den|dan|e|a|i|ı|u|ü|yi|yı|yu|yü|ye|ya|in|ın|un|ün|nin|nın)\b/;

const issues = [];
const add = (level, file, path, rule, text) => issues.push({ level, file, path, rule, text });

// Türkçede ikileme doğrudur ("tek tek", "adım adım"): tekrarlanan kelime kuralından muaf
const TR_REDUPLICATION = new Set(["tek", "adım", "satır", "tekrar", "sıra", "kat", "tane", "parça", "gün", "tur", "bir", "tek", "hep", "yavaş", "derin", "çok", "az"]);

function checkCommon(lang, file, path, s) {
  if (s.trim() === "") return add("error", file, path, "boş metin", JSON.stringify(s));
  // Başında girinti olan satır, sözde kod girintisidir (sıralama alıştırması adımları): boşluk kurallarından muaf
  const isIndentedCode = /^ {2,}\S/.test(s);
  if (!isIndentedCode && s !== s.trim()) add("error", file, path, "baş/son boşluk", JSON.stringify(s));
  if (!isIndentedCode && / {2,}/.test(s)) add("error", file, path, "çift boşluk", s);
  if (/\s[,;:!?.](?!\.)(\s|$)/.test(s) && !/\s\.\.\./.test(s)) add("error", file, path, "noktalama öncesi boşluk", s);
  if (/[,;!?][A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) add("error", file, path, "noktalama sonrası boşluk eksik", s);
  // "1) Kartı tak 2) Parayı al" gibi numaralı listelerde işaretteki ")" parantez sayılmaz.
  // Yalnızca 1) ve 2) birlikte geçiyorsa liste kabul edilir; "(indeks 1)" gibi normal parantezlere dokunulmaz.
  const isNumberedList = /(^|[\s"])1\) /.test(s) && /\s2\) /.test(s);
  const noMarkers = isNumberedList ? s.replace(/(^|[\s"])\d\) /g, "$1 ") : s;
  const open = (noMarkers.match(/\(/g) || []).length, close = (noMarkers.match(/\)/g) || []).length;
  if (open !== close) add("error", file, path, "eşleşmeyen parantez", s);
  if ((s.match(/"/g) || []).length % 2 === 1) add("error", file, path, "eşleşmeyen tırnak", s);
  if (/[“”‘’]/.test(s)) add("error", file, path, "kıvrık tırnak (düz tırnak kullan)", s);
  if (/…/.test(s)) add("warn", file, path, "… yerine ... kullan", s);
  // Mevcut Türkçe içerik " — " kullanıyor ve doğru bir kullanım: Türkçede korunur.
  // İngilizcede virgül, iki nokta ya da nokta tercih edilir (docs/i18n/style.md).
  if (lang === "en" && /—/.test(s)) add("error", file, path, "uzun tire: İngilizcede virgül/iki nokta/nokta kullan", s);
  const rep = s.match(/\b([\p{L}]{3,})\s+\1\b/iu);
  const isKeyword = rep && rep[1] === rep[1].toLocaleUpperCase("tr-TR"); // BİTİR BİTİR: iç içe blok kapanışı
  if (rep && !isKeyword && !(lang === "tr" && TR_REDUPLICATION.has(rep[1].toLocaleLowerCase("tr-TR")))) {
    add("error", file, path, `tekrarlanan kelime: "${rep[1]}"`, s);
  }
}

function checkTr(file, path, s) {
  for (const [re, fix] of TR_WRONG) if (re.test(s)) add("error", file, path, `yazım: "${s.match(re)[0]}" → "${fix}"`, s);
  if (NO_APOSTROPHE.test(s)) add("error", file, path, "sayıdan sonra kesme işareti eksik", s);
  if (/\b[A-ZÇĞİÖŞÜ_]{3,}(den|dan|ten|tan|in|ın|un|ün|e|a)\b/.test(s)) add("error", file, path, "anahtar kelimeden sonra kesme eksik", s);
  if (/[\p{L}]{3,}(mı|mi|mu|mü)\s*\?/u.test(s)) add("warn", file, path, "soru eki bitişik mi? (ayrı yazılır)", s);
  if (/\b(de|da)\b/.test(s)) { /* bağlaç/ek ayrımı insan gözü ister; sadece bilgi */ }
}

function checkEn(file, path, s) {
  if (TR_LETTERS.test(s)) add("error", file, path, "Türkçe harf kalmış", s);
  if (TR_KEYWORDS.test(s)) add("error", file, path, "Türkçe anahtar kelime kalmış", s);
  if (UK_SPELLING.test(s)) add("error", file, path, `UK yazımı: "${s.match(UK_SPELLING)[0]}" (ABD yazımı kullan)`, s);
  if (/\binformations\b|\bit's own\b|\bthe the\b/i.test(s)) add("error", file, path, "bilinen İngilizce hata", s);
  if (/\b(its|it's)\b/i.test(s)) add("warn", file, path, "its / it's kontrol et", s);
}

// Kod alanlarında dil bazlı denetim (İngilizce dosyada Türkçe anahtar kelime / harf olmamalı)
function checkCode(lang, file, path, s) {
  if (lang === "en") {
    if (TR_KEYWORDS.test(s)) add("error", file, path, "kodda Türkçe anahtar kelime", s);
    if (TR_LETTERS.test(s)) add("error", file, path, "kodda Türkçe harf", s);
  }
}

function walk(lang, file, node, path, inSkipped) {
  if (typeof node === "string") {
    if (inSkipped) return checkCode(lang, file, path, node);
    checkCommon(lang, file, path, node);
    return lang === "tr" ? checkTr(file, path, node) : checkEn(file, path, node);
  }
  if (Array.isArray(node)) return node.forEach((v, i) => walk(lang, file, v, `${path}[${i}]`, inSkipped));
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walk(lang, file, v, path ? `${path}.${k}` : k, inSkipped || SKIP_KEYS.has(k));
  }
}

function jsonFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? jsonFiles(p) : p.endsWith(".json") ? [p] : [];
  });
}

const targets = [];
if (!only || only === "tr") targets.push(["tr", join(ROOT, "content", "worlds")]);
if (!only || only === "en") targets.push(["en", join(ROOT, "content", "en", "worlds")]);

let files = 0;
for (const [lang, dir] of targets) {
  for (const f of jsonFiles(dir)) {
    files++;
    walk(lang, relative(ROOT, f).replaceAll("\\", "/"), JSON.parse(readFileSync(f, "utf8")), "", false);
  }
}

const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");
for (const i of [...errors, ...(showWarn ? warns : [])]) {
  console.log(`${i.level === "error" ? "✖" : "⚠"} ${i.file} · ${i.path}\n    ${i.rule}\n    ${String(i.text).slice(0, 140)}`);
}
console.log(`\n${files} dosya tarandı · ${errors.length} hata · ${warns.length} uyarı${showWarn ? "" : " (uyarılar için --warn)"}`);
process.exit(errors.length ? 1 : 0);
