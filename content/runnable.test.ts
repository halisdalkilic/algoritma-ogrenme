import { describe, expect, it } from "vitest";
import { run } from "@/components/runner";
import { gradePseudoWrite } from "@/lib/grading";
import { trContent } from "./tr";
import { enContent } from "./en";

/**
 * İngilizce sözde kod gerçekten ÇALIŞIR ve Türkçeyle aynı davranır: adım adım çalıştırıcı örnekleri aynı satır
 * dizisini izler, "çıktıyı tahmin et" cevapları yorumlayıcının gerçek çıktısıyla birebir eşleşir.
 */
const READS = /\b(OKU|READ)\b/i;
const trById = new Map(trContent.lessons.map((l) => [l.id, l]));

describe("İngilizce içerik: çalıştırılabilirlik", () => {
  for (const l of enContent.lessons) {
    const t = trById.get(l.id)!;

    it(`ders ${l.id}: runnerSource Türkçeyle aynı adımları izler`, () => {
      l.workedExamples.forEach((w, i) => {
        if (!w.runnerSource) return;
        const en = run(w.runnerSource, w.runnerInputs ?? [], { lang: "en" });
        const tw = t.workedExamples[i];
        const tr = run(tw.runnerSource!, tw.runnerInputs ?? [], { lang: "tr" });
        // bilerek hata veren örnekler (sonsuz döngü dersi) İngilizcede de aynı şekilde hata vermeli
        expect(en.ok, `${l.id} workedExamples[${i}]: ${en.ok ? "" : en.error}`).toBe(tr.ok);
        if (en.ok && tr.ok) {
          expect(en.steps.map((s) => s.line)).toEqual(tr.steps.map((s) => s.line));
          expect(en.steps.at(-1)!.output.length).toBe(tr.steps.at(-1)!.output.length);
        }
      });
    });

    it(`ders ${l.id}: "çıktıyı tahmin et" İngilizce kodu Türkçesiyle aynı çıktıyı üretir`, () => {
      l.exercises.forEach((e, i) => {
        const te = t.exercises[i];
        if (e.type !== "predict-output" || te.type !== "predict-output" || READS.test(e.pseudocode.join("\n"))) return; // girdiye bağlı olanlar soru metnindeki değerle çalışır
        const en = run(e.pseudocode.join("\n"), [], { lang: "en" });
        const tr = run(te.pseudocode.join("\n"), [], { lang: "tr" });
        expect(en.ok, `${e.id}: ${en.ok ? "" : en.error}`).toBe(true);
        expect(tr.ok, e.id).toBe(true);
        if (!en.ok || !tr.ok) return;
        const enOut = en.steps.at(-1)!.output;
        const trOut = tr.steps.at(-1)!.output;
        expect(enOut.length, e.id).toBe(trOut.length);
        // sayı/sembol içeren çıktı satırları birebir aynı; sözcük içerenler çevrildiği için serbest
        trOut.forEach((line, k) => {
          if (!/\p{L}/u.test(line)) expect(enOut[k], `${e.id} satır ${k}`).toBe(line);
        });
        // cevap anahtarı yorumlayıcının gerçek çıktısıyla aynıysa (düz "ne yazar?" soruları) İngilizcesi de aynı olmalı
        if (JSON.stringify(trOut) === JSON.stringify(te.correctOutput)) expect(enOut, e.id).toEqual(e.correctOutput);
      });
    });

    it(`ders ${l.id}: örnek çözüm kendi ölçütünü geçer`, () => {
      for (const e of l.exercises) {
        if (e.type !== "pseudo-write") continue;
        expect(gradePseudoWrite(e.sampleSolution, e.requiredKeywords, "en").correct, e.id).toBe(true);
      }
    });
  }

  it("içerik sayısı geçerli", () => expect(enContent.lessons.length).toBeLessThanOrEqual(trContent.lessons.length));
});
