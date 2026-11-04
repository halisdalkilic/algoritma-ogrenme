// /en/ (sondaki eğik çizgiyle) statik sunucuda out/en/ klasörüne düşer ve içinde index.html yoksa 404 olur.
// Ana sayfa dosyasını (en.html) klasörün içine index.html olarak da kopyalıyoruz: /en ve /en/ ikisi de çalışır.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
if (existsSync(join(OUT, "en.html"))) {
  mkdirSync(join(OUT, "en"), { recursive: true });
  copyFileSync(join(OUT, "en.html"), join(OUT, "en", "index.html"));
  console.log("en-index: out/en/index.html yazıldı (/en/ için).");
}
