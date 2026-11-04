import { describe, expect, it } from "vitest";
import { trContent } from "./tr";
import { enContent } from "./en";
import { STRUCTURE } from "./structure";
import type { Exercise, Lesson } from "./schema";

/**
 * İngilizce dersler Türkçe derslerin YAPISAL aynasıdır: aynı kimlikler, aynı sayıda alıştırma/adım, aynı doğru
 * cevap indeksleri, aynı sayısal değerler. Yalnızca insan metni serbesttir. Bu testler, çeviri sırasında
 * bir doğru cevabın kaymasını ya da bir alıştırmanın eksik kalmasını yakalar.
 */

const trById = new Map(trContent.lessons.map((l) => [l.id, l]));

// Görsel bileşen özelliklerinde, çevrilmemesi gereken ("enum" gibi) metin alanları: bunlar birebir aynı olmalı.
const STRICT_KEYS = new Set(["tone", "kind", "view", "mode", "variant", "algo", "lines", "icons", "src", "component", "type"]);

/** İki değerin şekli aynı mı? Metinler (harf içerenler) serbest; sayı/mantıksal/dizi uzunluğu/anahtarlar aynı olmalı. */
function shapeDiff(a: unknown, b: unknown, path: string, key = ""): string[] {
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return [`${path}: dizi bekleniyordu`];
    if (a.length !== b.length) return [`${path}: uzunluk ${a.length} ≠ ${b.length}`];
    return a.flatMap((x, i) => shapeDiff(x, b[i], `${path}[${i}]`, key));
  }
  if (a !== null && typeof a === "object") {
    if (b === null || typeof b !== "object" || Array.isArray(b)) return [`${path}: nesne bekleniyordu`];
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (ka.join() !== kb.join()) return [`${path}: anahtarlar ${ka.join()} ≠ ${kb.join()}`];
    return ka.flatMap((k) => shapeDiff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, k));
  }
  if (typeof a === "string") {
    if (typeof b !== "string") return [`${path}: metin bekleniyordu`];
    if (STRICT_KEYS.has(key) || !/\p{L}/u.test(a)) return a === b ? [] : [`${path}: "${a}" ≠ "${b}"`];
    return b.trim() === "" ? [`${path}: boş metin`] : [];
  }
  return a === b ? [] : [`${path}: ${String(a)} ≠ ${String(b)}`];
}

function exerciseDiff(t: Exercise, e: Exercise, p: string): string[] {
  const d: string[] = [];
  if (t.id !== e.id) d.push(`${p}: id ${t.id} ≠ ${e.id}`);
  if (t.type !== e.type) return [...d, `${p}: tür ${t.type} ≠ ${e.type}`];
  if (t.difficulty !== e.difficulty) d.push(`${p}: zorluk`);
  if ((t.hint === undefined) !== (e.hint === undefined)) d.push(`${p}: ipucu var/yok`);
  switch (t.type) {
    case "mcq": {
      const x = e as typeof t;
      if (t.options.length !== x.options.length) d.push(`${p}: seçenek sayısı`);
      if (t.correctIndex !== x.correctIndex) d.push(`${p}: correctIndex ${t.correctIndex} ≠ ${x.correctIndex}`);
      break;
    }
    case "order-steps": {
      const x = e as typeof t;
      if (t.steps.length !== x.steps.length) d.push(`${p}: adım sayısı`);
      if (t.correctOrder.join() !== x.correctOrder.join()) d.push(`${p}: correctOrder`);
      break;
    }
    case "fill-blank": {
      const x = e as typeof t;
      if (t.template.split("___").length !== x.template.split("___").length) d.push(`${p}: boşluk sayısı`);
      if ((t.options === undefined) !== (x.options === undefined)) d.push(`${p}: seçenekli/serbest`);
      if (t.options && x.options) {
        if (t.options.length !== x.options.length) d.push(`${p}: seçenek sayısı`);
        if (t.options.indexOf(t.answer) !== x.options.indexOf(x.answer)) d.push(`${p}: doğru seçeneğin sırası`);
        if (x.options.indexOf(x.answer) < 0) d.push(`${p}: answer seçeneklerde yok`);
      }
      break;
    }
    case "trace-table": {
      const x = e as typeof t;
      if (t.columns.length !== x.columns.length) d.push(`${p}: sütun sayısı`);
      if (t.pseudocode.length !== x.pseudocode.length) d.push(`${p}: sözde kod satır sayısı`);
      if (t.expectedRows.length !== x.expectedRows.length) d.push(`${p}: satır sayısı`);
      else {
        t.expectedRows.forEach((row, i) =>
          t.columns.forEach((col, c) => {
            if (String(row[col]) !== String(x.expectedRows[i][x.columns[c]])) d.push(`${p}: tablo satır ${i} sütun ${c}: ${row[col]} ≠ ${x.expectedRows[i][x.columns[c]]}`);
          }),
        );
      }
      break;
    }
    case "predict-output": {
      const x = e as typeof t;
      if (t.pseudocode.length !== x.pseudocode.length) d.push(`${p}: sözde kod satır sayısı`);
      d.push(...shapeDiff(t.correctOutput, x.correctOutput, `${p}.correctOutput`));
      break;
    }
    case "flowchart-build": {
      const x = e as typeof t;
      d.push(...shapeDiff(t.expectedNodes.map((n) => [n.id, n.shape]), x.expectedNodes.map((n) => [n.id, n.shape]), `${p}.nodes`));
      d.push(...shapeDiff(t.expectedEdges.map((g) => [g.from, g.to, g.label !== undefined]), x.expectedEdges.map((g) => [g.from, g.to, g.label !== undefined]), `${p}.edges`));
      break;
    }
    case "flowchart-read": {
      const x = e as typeof t;
      if (t.options.length !== x.options.length) d.push(`${p}: seçenek sayısı`);
      if (t.correctIndex !== x.correctIndex) d.push(`${p}: correctIndex`);
      d.push(...shapeDiff((t.nodes ?? []).map((n) => [n.id, n.shape]), (x.nodes ?? []).map((n) => [n.id, n.shape]), `${p}.nodes`));
      d.push(...shapeDiff((t.edges ?? []).map((g) => [g.from, g.to, g.label !== undefined]), (x.edges ?? []).map((g) => [g.from, g.to, g.label !== undefined]), `${p}.edges`));
      break;
    }
    case "pseudo-write": {
      const x = e as typeof t;
      if (t.requiredKeywords.length !== x.requiredKeywords.length) d.push(`${p}: requiredKeywords sayısı`);
      break;
    }
  }
  return d;
}

export function lessonDiff(t: Lesson, e: Lesson): string[] {
  const d: string[] = [];
  for (const k of ["id", "worldId", "estimatedMinutes"] as const) if (t[k] !== e[k]) d.push(`${k}: ${t[k]} ≠ ${e[k]}`);
  if (t.prerequisites.join() !== e.prerequisites.join()) d.push("prerequisites");
  if (t.objectives.length !== e.objectives.length) d.push("objectives sayısı");
  if (t.summary.length !== e.summary.length) d.push("summary sayısı");
  if (t.title.startsWith("Kontrol Noktası") !== e.title.startsWith("Checkpoint")) d.push("kontrol noktası başlığı (Checkpoint ile başlamalı)");
  d.push(...shapeDiff(t.hook.visual ?? null, e.hook.visual ?? null, "hook.visual"));
  if (t.concept.length !== e.concept.length) d.push("concept blok sayısı");
  else t.concept.forEach((c, i) => d.push(...shapeDiff(c.visual ?? null, e.concept[i].visual ?? null, `concept[${i}].visual`)));
  if (t.workedExamples.length !== e.workedExamples.length) d.push("workedExamples sayısı");
  else
    t.workedExamples.forEach((w, i) => {
      const x = e.workedExamples[i];
      const p = `workedExamples[${i}]`;
      if (w.pseudocode.length !== x.pseudocode.length) d.push(`${p}: sözde kod satır sayısı`);
      if (w.steps.length !== x.steps.length) d.push(`${p}: adım sayısı`);
      else
        w.steps.forEach((s, j) => {
          const y = x.steps[j];
          if (s.line !== y.line) d.push(`${p}.steps[${j}]: line`);
          if ((s.vars === undefined) !== (y.vars === undefined)) d.push(`${p}.steps[${j}]: vars var/yok`);
          if (s.vars && y.vars) {
            const tv = Object.values(s.vars);
            const ev = Object.values(y.vars);
            if (tv.length !== ev.length) d.push(`${p}.steps[${j}]: vars sayısı`);
            else d.push(...shapeDiff(tv.filter((v) => typeof v !== "string"), ev.filter((v) => typeof v !== "string"), `${p}.steps[${j}].vars`));
          }
          if ((s.output?.length ?? 0) !== (y.output?.length ?? 0)) d.push(`${p}.steps[${j}]: output sayısı`);
        });
      if ((w.runnerSource === undefined) !== (x.runnerSource === undefined)) d.push(`${p}: runnerSource var/yok`);
      if (JSON.stringify(w.runnerInputs ?? []) !== JSON.stringify(x.runnerInputs ?? []) && (w.runnerInputs ?? []).every((v) => typeof v !== "string")) d.push(`${p}: runnerInputs`);
    });
  if (t.exercises.length !== e.exercises.length) d.push(`alıştırma sayısı ${t.exercises.length} ≠ ${e.exercises.length}`);
  else t.exercises.forEach((ex, i) => d.push(...exerciseDiff(ex, e.exercises[i], `exercises[${i}]`)));
  return d;
}

describe("İngilizce içerik: Türkçenin yapısal aynası", () => {
  it("her İngilizce dersin Türkçe karşılığı var ve kimlikler benzersiz", () => {
    const ids = enContent.lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(trById.has(id), id).toBe(true);
  });

  it("dünya ve önkoşullar structure.json ile uyumlu", () => {
    for (const l of enContent.lessons) {
      const s = STRUCTURE.find((x) => x.id === l.id)!;
      expect(l.worldId, l.id).toBe(s.worldId);
      expect(l.prerequisites, l.id).toEqual(s.prerequisites);
    }
  });

  for (const e of enContent.lessons) {
    it(`ders ${e.id}: yapı Türkçeyle birebir`, () => {
      expect(lessonDiff(trById.get(e.id)!, e)).toEqual([]);
    });
  }

  it("ilerleme: İngilizcesi hazır ders sayısı toplamı aşmaz", () => {
    expect(enContent.lessons.length).toBeLessThanOrEqual(STRUCTURE.length);
  });
});
