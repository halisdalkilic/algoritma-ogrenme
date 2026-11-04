import { describe, expect, it } from "vitest";
import { trContent } from "./tr";
import { STRUCTURE } from "./structure";

describe("content/structure.json Türkçe içerikle senkron", () => {
  it("aynı dersler, aynı dünyalar, aynı önkoşullar (eskiyse: node scripts/gen-structure.mjs)", () => {
    const fromContent = trContent.lessons
      .map((l) => ({ id: l.id, worldId: l.worldId, prerequisites: l.prerequisites }))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    expect(STRUCTURE).toEqual(fromContent);
  });

  it("her önkoşul gerçek bir ders", () => {
    const ids = new Set(STRUCTURE.map((l) => l.id));
    for (const l of STRUCTURE) for (const p of l.prerequisites) expect(ids.has(p), `${l.id} → ${p}`).toBe(true);
  });
});
