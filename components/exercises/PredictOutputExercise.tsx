"use client";

import { useState } from "react";
import type { PredictOutputExercise as PredictOutputExerciseType } from "@/content/schema";
import type { ExerciseProps } from "./types";
import { FeedbackBanner } from "./FeedbackBanner";
import { useLocale, useT } from "@/lib/i18n/context";
import { outputMatches } from "@/lib/answers";
import { loadDraft, saveDraft } from "@/lib/answerDraft";
import { ContinueButton } from "./ContinueButton";

export function PredictOutputExercise({
  exercise,
  onResult,
}: ExerciseProps<PredictOutputExerciseType>) {
  const t = useT();
  const locale = useLocale();
  const [value, setValue] = useState(() => loadDraft<string>(exercise.id) ?? "");
  const [checked, setChecked] = useState(false);

  // Büyük/küçük harf, Türkçe karakter (yalnızca Türkçede) ve tırnak farkı yanlış sayılmaz ("doğru" = DOĞRU).
  const isCorrect = outputMatches(value, exercise.correctOutput, locale);

  function finish() {
    if (!isCorrect) saveDraft(exercise.id, value);
    onResult(isCorrect);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[1.35rem] font-black leading-snug">{exercise.question}</p>

      <pre className="code-block">
        {exercise.pseudocode.join("\n")}
      </pre>

      <input
        value={value}
        disabled={checked}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t.exercise.predict.placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        className="field font-mono"
        data-state={checked ? (isCorrect ? "correct" : "wrong") : undefined}
      />

      {exercise.hint && !checked && (
        <p className="text-sm font-bold text-muted">{t.exercise.hint} {exercise.hint}</p>
      )}

      {checked && (
        <FeedbackBanner correct={isCorrect}>
          {isCorrect ? t.exercise.correct : t.exercise.correctOutput(exercise.correctOutput.join(", "))}
        </FeedbackBanner>
      )}

      {!checked ? (
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={value.trim() === ""}
          className="btn btn-block"
        >
          {t.exercise.check}
        </button>
      ) : (
        <ContinueButton correct={isCorrect} onClick={finish} />
      )}
    </div>
  );
}
