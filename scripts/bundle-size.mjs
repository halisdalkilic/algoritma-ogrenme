// out/ içindeki JS ve CSS boyutlarını (ham ve gzip) raporlar: animasyon değişikliklerini kıyaslamak için.
//   node scripts/bundle-size.mjs            tabloyu yazar
//   node scripts/bundle-size.mjs --json     docs/perf/ölçüm için JSON
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const root = "out/_next/static";
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(root).filter((f) => /\.(js|css)$/.test(f));
const rows = files.map((f) => {
  const buf = readFileSync(f);
  return { file: f.replace(root + "/", ""), raw: buf.length, gzip: gzipSync(buf).length, kind: f.endsWith(".css") ? "css" : "js" };
});
const sum = (k, key) => rows.filter((r) => r.kind === k).reduce((n, r) => n + r[key], 0);
const result = {
  jsRaw: sum("js", "raw"), jsGzip: sum("js", "gzip"), cssRaw: sum("css", "raw"), cssGzip: sum("css", "gzip"),
  jsFiles: rows.filter((r) => r.kind === "js").length,
  largest: rows.filter((r) => r.kind === "js").sort((a, b) => b.gzip - a.gzip).slice(0, 5).map((r) => ({ file: r.file, gzip: r.gzip })),
};
if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
else {
  const kb = (n) => (n / 1024).toFixed(1) + " KB";
  console.log(`JS   : ${kb(result.jsRaw)} ham · ${kb(result.jsGzip)} gzip · ${result.jsFiles} dosya`);
  console.log(`CSS  : ${kb(result.cssRaw)} ham · ${kb(result.cssGzip)} gzip`);
  console.log("En büyük JS parçaları (gzip):");
  for (const r of result.largest) console.log(`  ${kb(r.gzip).padStart(9)}  ${r.file}`);
}

// Sayfa başına "ilk yükleme" JS'i: HTML'in doğrudan <script src> ile istediği dosyalar (ertelenenler hariç).
if (!process.argv.includes("--json")) {
  const pages = ["index.html", "ders/1.1.html", "en/index.html", "profil.html"];
  const kb = (n) => (n / 1024).toFixed(1) + " KB";
  console.log("İlk yükleme JS'i (gzip):");
  for (const p of pages) {
    try {
      const html = readFileSync(join("out", p), "utf8");
      const srcs = [...new Set([...html.matchAll(/<script[^>]*src="([^"]+\.js)[^"]*"/g)].map((x) => x[1]))];
      let total = 0;
      for (const s of srcs) {
        try { total += gzipSync(readFileSync(join("out", s.replace(/^\//, "")))).length; } catch {}
      }
      console.log(`  ${p.padEnd(16)} ${kb(total).padStart(9)}  (${srcs.length} dosya)`);
    } catch { console.log(`  ${p.padEnd(16)} (yok)`); }
  }
}
