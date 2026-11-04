import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OUT, buildLessonsSql } from "../scripts/gen-supabase-lessons.mjs";

describe("supabase/lessons.sql", () => {
  it("içerikteki derslerle güncel (ders eklenince `npm run gen:lessons` çalıştır)", () => {
    const committed = readFileSync(OUT, "utf8").replace(/\r\n/g, "\n");
    expect(committed).toBe(buildLessonsSql());
  });
});
