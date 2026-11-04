// İçerik JSON'larından supabase/lessons.sql üretir: sunucu doğrulaması hangi ders id'lerinin
// var olduğunu ve her dersin kaç alıştırması olduğunu buradan bilir.
// Kullanım: npm run gen:lessons  (ders eklenince/çıkarılınca yeniden çalıştır)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const worlds = join(root, "content", "worlds");
export const OUT = join(root, "supabase", "lessons.sql");

export function buildLessonsSql() {
  const rows = [];
  for (const dir of readdirSync(worlds).sort()) {
    for (const file of readdirSync(join(worlds, dir)).sort()) {
      const lesson = JSON.parse(readFileSync(join(worlds, dir, file), "utf8"));
      rows.push([lesson.id, lesson.exercises.length]);
    }
  }
  rows.sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: true }));
  const values = rows.map(([id, n]) => `  ('${id}', ${n})`).join(",\n");
  return [
    "-- Otomatik üretilir: npm run gen:lessons (elle düzenleme)",
    "insert into public.lessons (id, exercise_count) values",
    values,
    "on conflict (id) do update set exercise_count = excluded.exercise_count;",
    "",
  ].join("\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(OUT, buildLessonsSql());
  console.log("yazıldı:", OUT);
}
