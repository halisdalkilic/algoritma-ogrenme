// content/en.ts dosyasını content/en/worlds altındaki ders dosyalarından üretir (kayıt listesini elle güncelleme derdi yok).
//   node scripts/gen-en-index.mjs
import { readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const base = join(ROOT, "en", "worlds");

const files = [];
for (const dir of readdirSync(base).sort()) {
  for (const f of readdirSync(join(base, dir)).sort()) {
    if (!f.endsWith(".json")) continue;
    const id = f.split("-")[0]; // "1.2-veri-tipleri.json" → "1.2"
    files.push({ id, path: `./en/worlds/${dir}/${f}` });
  }
}
files.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const imports = files.map((x) => `import lesson_${x.id.replace(".", "_")} from "${x.path}";`).join("\n");
const list = files.map((x) => `  lesson_${x.id.replace(".", "_")},`).join("\n");

writeFileSync(
  join(ROOT, "en.ts"),
  `import { createContent } from "./load";

// İngilizce ders içeriği. BU DOSYA ÜRETİLİR: \`node scripts/gen-en-index.mjs\` (content/en/worlds altındaki dosyaları listeler).
// Her ders Türkçesiyle aynı dizin ve dosya adına sahiptir; yapı eşitliği content/parity.test.ts ile zorunlu kılınır.
${imports}

const RAW_LESSONS: unknown[] = [
${list}
];

export const enContent = createContent(RAW_LESSONS, "en");
`,
);
console.log(`${files.length} İngilizce ders kaydedildi.`);
