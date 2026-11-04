// Next.js 16 statik export'unun Windows hatasını düzeltir (`npm run build` sonrası otomatik çalışır).
//
// Next, segment prefetch dosyalarını `__next.<segment yolu>.txt` olarak üretmek ister ve yoldaki
// "/" karakterlerini "." yapar (next/dist/export/index.js → convertSegmentPathToStaticExportFilename).
// Windows'ta yol ayırıcı "\" olduğu için değiştirilmez; dosya `__next.tekrar\__PAGE__.txt` gibi bir
// KLASÖRE yazılır ve tarayıcının istediği `__next.tekrar.__PAGE__.txt` 404 döner.
// Bu script o klasörleri düzleştirir. Linux/macOS'ta böyle klasör oluşmaz, script hiçbir şey yapmaz.
import { readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
let fixed = 0;

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (!name.startsWith("__next.")) {
      walk(p);
      continue;
    }
    for (const file of filesUnder(p)) {
      const flat = relative(dir, file).split(sep).join(".");
      renameSync(file, join(dir, flat));
      fixed++;
    }
    rmSync(p, { recursive: true, force: true });
  }
}

walk(OUT);
if (fixed) console.log(`fix-export-segments: ${fixed} segment dosyası düzleştirildi (Windows yol ayırıcı hatası).`);
