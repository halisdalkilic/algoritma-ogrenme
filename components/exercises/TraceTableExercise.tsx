"use client";

import { useState } from "react";
import type { TraceTableExercise as TraceTableExerciseType } from "@/content/schema";
import type { ExerciseProps } from "./types";
import { FeedbackBanner } from "./FeedbackBanner";
import { useLocale, useT } from "@/lib/i18n/context";
import { parseNumber, sameText } from "@/lib/answers";
import { loadDraft, saveDraft } from "@/lib/answerDraft";
import type { Locale } from "@/lib/i18n/config";
import { ContinueButton } from "./ContinueButton";

function cellsMatch(userValue: string, expected: string | number, locale: Locale): boolean {
  if (typeof expected === "number") return parseNumber(userValue, locale) === expected; // Türkçede "3,5" = 3.5; "abc" yanlış
  return sameText(userValue, String(expected), locale);
}

export function TraceTableExercise({
  exercise,
  onResult,
}: ExerciseProps<TraceTableExerciseType>) {
  const t = useT();
  const locale = useLocale();
  const rowCount = exercise.expectedRows.length;
  const [grid, setGrid] = useState<string[][]>(
    () => loadDraft<string[][]>(exercise.id) ?? Array.from({ length: rowCount }, () => exercise.columns.map(() => "")),
  );
  const [checked, setChecked] = useState(false);

  function setCell(row: number, col: number, value: string) {
    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      next[row][col] = value;
      return next;
    });
  }

  const results = grid.map((row, r) =>
    row.map((value, c) => cellsMatch(value, exercise.expectedRows[r][exercise.columns[c]], locale)),
  );
  const isCorrect = results.every((row) => row.every(Boolean));
  const allFilled = grid.every((row) => row.every((v) => v.trim() !== ""));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[1.35rem] font-black leading-snug">{t.exercise.trace.prompt}</p>

      <pre className="code-block">
        {exercise.pseudocode.join("\n")}
      </pre>

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-center text-sm">
          <thead>
            <tr>
              <th className="px-2 text-xs font-black uppercase tracking-wider text-muted">{t.exercise.trace.turn}</th>
              {exercise.columns.map((col) => (
                <th key={col} className="px-2 font-mono text-sm font-black text-brand">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                <td className="text-sm font-black text-muted">{r + 1}</td>
                {row.map((value, c) => (
                  <td key={c}>
                    <input
                      value={value}
                      disabled={checked}
                      inputMode="decimal"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      aria-label={`Tur ${r + 1}, ${exercise.columns[c]}`}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className="field min-h-11 w-20 !px-2 !py-2 text-center font-mono !text-base"
                      data-state={checked ? (results[r][c] ? "correct" : "wrong") : undefined}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {exercise.hint && !checked && (
        <p className="text-sm font-bold text-muted">{t.exercise.hint} {exercise.hint}</p>
      )}

      {checked && (
        <FeedbackBanner correct={isCorrect}>
          {isCorrect ? t.exercise.trace.ok : t.exercise.trace.wrong}
        </FeedbackBanner>
      )}

      {!checked ? (
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={!allFilled}
          className="btn btn-block"
        >
          {t.exercise.check}
        </button>
      ) : (
        <ContinueButton
          correct={isCorrect}
          onClick={() => {
            if (!isCorrect) saveDraft(exercise.id, grid);
            onResult(isCorrect);
          }}
        />
      )}
    </div>
  );
}
