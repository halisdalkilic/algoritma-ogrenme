import { describe, expect, it } from "vitest";
import { lessons } from "@/content";
import { FLOW_KINDS, VISUAL_NAMES } from "./names";

// İçerik yazarı yanlış bir görsel adı yazarsa kart sessizce boş kalmasın: test kırılsın.
describe("kavram görselleri", () => {
  const blocks = lessons.flatMap((l) => l.concept.map((c, i) => ({ where: `${l.id}#${i}`, visual: c.visual })));

  it("her kavram kartının bir görseli var", () => {
    expect(blocks.filter((b) => !b.visual).map((b) => b.where)).toEqual([]);
  });

  it("görsel adları tanımlı bileşenlere karşılık gelir", () => {
    const bad = blocks.filter((b) => b.visual?.type === "animation" && !VISUAL_NAMES.includes(b.visual.component as never));
    expect(bad.map((b) => `${b.where}: ${b.visual?.component}`)).toEqual([]);
  });

  it("statik SVG görseli kalmadı (public/visuals boş; eski referanslar kırık görsel olurdu)", () => {
    expect(blocks.filter((b) => b.visual?.type === "static-svg").map((b) => b.where)).toEqual([]);
  });

  it("akış şeması sahneleri tanımlı", () => {
    const flows = blocks.filter((b) => b.visual?.component === "flow");
    for (const f of flows) expect(FLOW_KINDS).toContain(f.visual?.props?.kind);
  });
});
