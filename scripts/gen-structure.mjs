// content/worlds/ içindeki Türkçe ders JSON'larından dilden bağımsız yapıyı üretir: content/structure.json
//   node scripts/gen-structure.mjs        (yeni ders eklenince çalıştır; content/structure.test.ts eşitliği denetler)
// Amaç: rozet hesabı ve profil sayfası gibi yerler yalnızca "hangi ders hangi dünyada" bilgisine ihtiyaç duyar;
// bunun için tüm ders metinlerini (yaklaşık 700 KB) istemciye indirmek gerekmez.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../content/worlds", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const files = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? files(join(d, n)) : n.endsWith(".json") ? [join(d, n)] : []));

const lessons = files(ROOT)
  .map((f) => JSON.parse(readFileSync(f, "utf8")))
  .map((l) => ({ id: l.id, worldId: l.worldId, prerequisites: l.prerequisites }))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

const out = new URL("../content/structure.json", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
writeFileSync(out, JSON.stringify(lessons, null, 2) + "\n");
console.log(`${lessons.length} ders yapısı yazıldı: content/structure.json`);
