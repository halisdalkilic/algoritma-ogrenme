import { describe, expect, it } from "vitest";
import { lessons } from "@/content";
import { gradePseudoWrite } from "@/lib/grading";
import { run, stringifyValue } from ".";
import { tokenize } from "./tokenizer";
import { trToEn } from "./translate";
import type { Value } from "./ast";

function runEn(src: string, inputs: Value[] = []) {
  const r = run(src, inputs, { lang: "en" });
  if (!r.ok) throw new Error(`Unexpected error: ${r.error}`);
  return r;
}
const lastVars = (r: ReturnType<typeof runEn>) => r.steps[r.steps.length - 1].vars;
const lastOut = (r: ReturnType<typeof runEn>) => r.steps[r.steps.length - 1].output;

describe("English pseudocode: keywords", () => {
  it("assignment, WRITE and arithmetic", () => {
    const r = runEn(`a ← 5\nb ← a * 2 + 1\nWRITE b`);
    expect(lastVars(r)).toMatchObject({ a: 5, b: 11 });
    expect(lastOut(r)).toEqual(["11"]);
  });

  it("keywords are case-insensitive and 'if' is not broken by Turkish casing (i → İ)", () => {
    const r = runEn(`x ← 3\nif x > 2\n  write "big"\nend`);
    expect(lastOut(r)).toEqual(["big"]);
  });

  it("IF / ELSE / END", () => {
    const r = runEn(`age ← 15\nIF age >= 18\n  WRITE "adult"\nELSE\n  WRITE "minor"\nEND`);
    expect(lastOut(r)).toEqual(["minor"]);
  });

  it("FOR ... TO ... STEP ... END_LOOP (no Turkish suffix tokens)", () => {
    const r = runEn(`total ← 0\nFOR i ← 1 TO 4 STEP 1\n  total ← total + i\nEND_LOOP\nWRITE total`);
    expect(lastOut(r)).toEqual(["10"]);
  });

  it("FOR with negative step", () => {
    const r = runEn(`FOR i ← 3 TO 1 STEP -1\n  WRITE i\nEND_LOOP`);
    expect(lastOut(r)).toEqual(["3", "2", "1"]);
  });

  it("WHILE ... END_LOOP", () => {
    const r = runEn(`n ← 1\nWHILE n < 4\n  n ← n + 1\nEND_LOOP\nWRITE n`);
    expect(lastOut(r)).toEqual(["4"]);
  });

  it("READ takes values from inputs in order", () => {
    const r = runEn(`READ a\nREAD b\nWRITE a + b`, [3, 4]);
    expect(lastOut(r)).toEqual(["7"]);
  });

  it("AND / OR / NOT and TRUE / FALSE", () => {
    const r = runEn(`a ← TRUE\nb ← FALSE\nWRITE a AND b\nWRITE a OR b\nWRITE NOT b`);
    expect(lastOut(r)).toEqual(["FALSE", "TRUE", "TRUE"]);
  });

  it("DIV and MOD", () => {
    const r = runEn(`WRITE 17 DIV 5\nWRITE 17 MOD 5`);
    expect(lastOut(r)).toEqual(["3", "2"]);
  });

  it("CONST cannot be reassigned", () => {
    const r = run(`CONST PI ← 3.14\nPI ← 3`, [], { lang: "en" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Line 2: CONST "PI" cannot be changed.');
  });

  it("FUNCTION / RETURN, including recursion", () => {
    const r = runEn(`FUNCTION fact(n)\n  IF n <= 1\n    RETURN 1\n  END\n  RETURN n * fact(n - 1)\nEND\nWRITE fact(5)`);
    expect(lastOut(r)).toEqual(["120"]);
  });

  it("arrays: literal, index, assignment", () => {
    const r = runEn(`scores ← [70, 85, 90]\nscores[1] ← 100\nWRITE scores[1]`);
    expect(lastOut(r)).toEqual(["100"]);
  });
});

describe("English pseudocode: Turkish keywords are NOT keywords, and vice versa", () => {
  it("'not' is an ordinary variable in Turkish mode but the NOT operator in English mode", () => {
    // Turkish lessons use `not` as a variable name (not ← 45); that must keep working.
    const tr = run(`not ← 45\nYAZ not`);
    expect(tr.ok).toBe(true);
    const en = run(`not ← 45`, [], { lang: "en" });
    expect(en.ok).toBe(false); // NOT is a keyword in English mode, so it cannot be a variable
  });

  it("Turkish keywords are plain identifiers in English mode", () => {
    const tokens = tokenize(`YAZ x`, "en");
    expect(tokens.map((t) => t.type).slice(0, 2)).toEqual(["IDENT", "IDENT"]);
  });

  it("English keywords are plain identifiers in Turkish mode", () => {
    const tokens = tokenize(`WRITE x`, "tr");
    expect(tokens.map((t) => t.type).slice(0, 2)).toEqual(["IDENT", "IDENT"]);
  });
});

describe("English pseudocode: error messages", () => {
  const err = (src: string, inputs: Value[] = []) => {
    const r = run(src, inputs, { lang: "en" });
    if (r.ok) throw new Error("expected an error");
    return r.error;
  };

  it("undefined variable", () => expect(err(`WRITE zzz`)).toBe('Line 1: undefined variable "zzz".'));
  it("index out of range", () => expect(err(`a ← [1, 2]\nWRITE a[5]`)).toContain("out of range"));
  it("division by zero", () => expect(err(`WRITE 1 / 0`)).toBe("Line 1: division by zero."));
  it("step limit", () => expect(err(`n ← 1\nWHILE TRUE\n  n ← n + 1\nEND_LOOP`)).toContain("Step limit exceeded"));
  it("parse error names the keyword in English, not Turkish", () => {
    const e = err(`IF 1 < 2\n  WRITE 1`);
    expect(e).toContain('expected "END"');
    expect(e).not.toContain("BİTİR");
  });
  it("RETURN outside a function", () => expect(err(`RETURN 1`)).toBe("RETURN can only be used inside a function."));
  it("function parameter count uses correct plural", () => {
    expect(err(`FUNCTION f(a, b)\n  RETURN a\nEND\nWRITE f(1)`)).toBe(
      'Line 4: function "f" expects 2 parameters, but 1 was given.',
    );
  });
});

describe("stringifyValue", () => {
  it("formats booleans and undefined per language", () => {
    expect(stringifyValue(true, "en")).toBe("TRUE");
    expect(stringifyValue(false, "en")).toBe("FALSE");
    expect(stringifyValue(undefined, "en")).toBe("undefined");
    expect(stringifyValue([true, 1], "en")).toBe("[TRUE, 1]");
    expect(stringifyValue(true)).toBe("DOĞRU");
    expect(stringifyValue(undefined)).toBe("tanımsız");
  });
});

describe("gradePseudoWrite (English)", () => {
  it("accepts a correct program and counts blocks by whole words", () => {
    const code = `IF x > 1\n  WRITE "a"\nEND\nFOR i ← 1 TO 3 STEP 1\n  WRITE i\nEND_LOOP`;
    const r = gradePseudoWrite(code, ["IF", "FOR", "WRITE"], "en");
    expect(r.correct).toBe(true);
  });

  it("'OR' is not found inside 'FOR', and 'END' is not counted inside 'END_LOOP'", () => {
    expect(gradePseudoWrite(`FOR i ← 1 TO 3 STEP 1\nEND_LOOP`, ["OR"], "en").missingKeywords).toEqual(["OR"]);
    // an IF closed only by END_LOOP is unbalanced: END_LOOP must not satisfy IF ... END
    const r = gradePseudoWrite(`IF a\nEND_LOOP`, [], "en");
    expect(r.unbalancedBlocks).toEqual(["IF ... END"]);
  });

  it("is case-insensitive without Turkish casing problems", () => {
    expect(gradePseudoWrite(`if x\nwrite 1\nend`, ["IF", "WRITE"], "en").correct).toBe(true);
  });

  it("Turkish grading is unchanged by the new parameter", () => {
    expect(gradePseudoWrite(`EĞER x\n  YAZ 1\nBİTİR`, ["EĞER", "YAZ"]).correct).toBe(true);
  });
});

// Türkçe derslerde `not` bir değişken adı; İngilizcede NOT anahtar kelimesi olduğu için çeviride yeniden adlandırılır.
const RENAMES: Record<string, string> = { not: "grade" };

describe("round trip: every Turkish runnerSource in the content behaves identically in English", () => {
  const programs = lessons.flatMap((l) =>
    l.workedExamples.flatMap((w, i) => (w.runnerSource ? [{ id: `${l.id}#${i}`, src: w.runnerSource, inputs: (w.runnerInputs ?? []) as Value[] }] : [])),
  );

  it("there are runnable programs to check", () => {
    expect(programs.length).toBeGreaterThanOrEqual(15);
  });

  for (const p of programs) {
    it(`program ${p.id}`, () => {
      const tr = run(p.src, p.inputs);
      const en = run(trToEn(p.src, RENAMES), p.inputs, { lang: "en" });
      expect(en.ok, en.ok ? "" : (en as { error: string }).error).toBe(tr.ok);
      expect(en.steps.length).toBe(tr.steps.length);
      // Compare line numbers and variable values step by step; map boolean output text between languages.
      const mapOut = (o: string) => o.replace(/\bDOĞRU\b/g, "TRUE").replace(/\bYANLIŞ\b/g, "FALSE").replace(/\btanımsız\b/g, "undefined");
      tr.steps.forEach((s, k) => {
        expect(en.steps[k].line).toBe(s.line);
        const renamed = Object.fromEntries(Object.entries(s.vars).map(([key, v]) => [RENAMES[key] ?? key, v]));
        expect(en.steps[k].vars).toEqual(renamed);
        expect(en.steps[k].output).toEqual(s.output.map(mapOut));
      });
    });
  }
});
