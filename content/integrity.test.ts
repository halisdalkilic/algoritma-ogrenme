import { describe, expect, it } from "vitest";
import { outputMatches } from "@/lib/answers";
import { gradePseudoWrite } from "@/lib/grading";
import { trContent } from "./tr";
import { enContent } from "./en";

// Her alıştırmanın çözülebilir olduğunu denetler: yanlış girilmiş bir indeks ya da eksik şık,
// kullanıcıyı çözemeyeceği bir soruda bırakır. Türkçe ve İngilizce içerik için ayrı ayrı çalışır.
const LANGS = [
  ["tr", trContent.lessons],
  ["en", enContent.lessons],
] as const;

for (const [lang, lessons] of LANGS) {
  const all = lessons.flatMap((l) => l.exercises.map((e) => ({ lesson: l.id, e })));

  describe(`içerik bütünlüğü (${lang})`, () => {
    it("alıştırma id'leri tekil", () => {
      const ids = all.map(({ e }) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("çoktan seçmeli sorularda doğru indeks şıkların içinde", () => {
      for (const { lesson, e } of all) {
        if (e.type === "mcq" || e.type === "flowchart-read") {
          expect(e.correctIndex, `${lesson}/${e.id}`).toBeLessThan(e.options.length);
        }
      }
    });

    it("sıralama sorularında doğru sıra tüm adımların bir permütasyonu", () => {
      for (const { lesson, e } of all) {
        if (e.type !== "order-steps") continue;
        expect([...e.correctOrder].sort((a, b) => a - b), `${lesson}/${e.id}`).toEqual(e.steps.map((_, i) => i));
      }
    });

    it("boşluk doldurmada şablonda ___ var, seçmelide doğru cevap şıklarda", () => {
      for (const { lesson, e } of all) {
        if (e.type !== "fill-blank") continue;
        expect(e.template, `${lesson}/${e.id}`).toContain("___");
        if (e.options) expect(e.options, `${lesson}/${e.id}`).toContain(e.answer);
      }
    });

    it("izleme tablosunda her beklenen satır tüm sütunları içerir", () => {
      for (const { lesson, e } of all) {
        if (e.type !== "trace-table") continue;
        for (const row of e.expectedRows) {
          for (const col of e.columns) expect(row, `${lesson}/${e.id}`).toHaveProperty(col);
        }
      }
    });

    it("şema kurmada kenarlar var olan düğümleri bağlıyor", () => {
      for (const { lesson, e } of all) {
        if (e.type !== "flowchart-build") continue;
        const ids = new Set(e.expectedNodes.map((n) => n.id));
        for (const edge of e.expectedEdges) {
          expect(ids.has(edge.from) && ids.has(edge.to), `${lesson}/${e.id}`).toBe(true);
        }
      }
    });

    it("çıktı tahmininde beklenen çıktı boş değil ve kendi cevabıyla eşleşir", () => {
      for (const { lesson, e } of all) {
        if (e.type !== "predict-output") continue;
        expect(e.correctOutput.length, `${lesson}/${e.id}`).toBeGreaterThan(0);
        expect(outputMatches(e.correctOutput.join(", "), e.correctOutput, lang), `${lesson}/${e.id}`).toBe(true);
      }
    });

    it("sözde kod alıştırmasının örnek çözümü kendi kontrolünden geçer", () => {
      for (const { lesson, e } of all) {
        if (e.type !== "pseudo-write") continue;
        expect(gradePseudoWrite(e.sampleSolution, e.requiredKeywords, lang).correct, `${lesson}/${e.id}`).toBe(true);
      }
    });
  });
}
