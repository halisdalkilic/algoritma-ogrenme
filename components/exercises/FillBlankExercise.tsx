"use client";

import { useState } from "react";
import type { FillBlankExercise as FillBlankExerciseType } from "@/content/schema";
import type { ExerciseProps } from "./types";
import { FeedbackBanner } from "./FeedbackBanner";
import { useLocale, useT } from "@/lib/i18n/context";
import { sameText } from "@/lib/answers";
import { loadDraft, saveDraft } from "@/lib/answerDraft";
import { ContinueButton } from "./ContinueButton";

export function FillBlankExercise({
  exercise,
  onResult,
}: ExerciseProps<FillBlankExerciseType>) {
  const t = useT();
  const locale = useLocale();
  // Seçmeli sorularda seçim her denemede sıfırlanır; serbest yazımda yazılan metin korunur.
  const [value, setValue] = useState(() => (exercise.options ? "" : (loadDraft<string>(exercise.id) ?? "")));
  const [checked, setChecked] = useState(false);

  const isCorrect = sameText(value, exercise.answer, locale);
  const [before, after] = exercise.template.split("___");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[1.35rem] font-black leading-snug">{exercise.question}</p>

      <div className="code-block flex flex-wrap items-center gap-2.5 text-[0.95rem]">
        <span>{before}</span>
        {exercise.options ? (
          <div className="flex flex-wrap gap-2">
            {exercise.options.map((opt) => {
              const picked = value === opt;
              const state = picked ? (checked ? (isCorrect ? "good" : "bad") : "pick") : "idle";
              const styles = {
                idle: { background: "#1f2447", border: "#363d75", color: "#e7e9ff" },
                pick: { background: "#3b2fa3", border: "#8b74ff", color: "#fff" },
                good: { background: "#14532d", border: "#35d27c", color: "#d9ffe8" },
                bad: { background: "#5a1a16", border: "#ff6c61", color: "#ffe3e0" },
              }[state];
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={checked}
                  onClick={() => setValue(opt)}
                  className="min-h-11 rounded-xl border-2 border-b-4 px-3.5 py-1 font-bold transition-transform active:translate-y-0.5 disabled:cursor-default"
                  style={{ background: styles.background, borderColor: styles.border, color: styles.color }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          <input
            value={value}
            disabled={checked}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-11 min-w-[6rem] rounded-xl border-2 border-[#363d75] bg-[#1f2447] px-3 py-1 text-base font-bold text-white focus:border-[#8b74ff] focus:outline-none"
            placeholder="?"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
          />
        )}
        <span>{after}</span>
      </div>

      {exercise.hint && !checked && (
        <p className="text-sm font-bold text-muted">{t.exercise.hint} {exercise.hint}</p>
      )}

      {checked && (
        <FeedbackBanner correct={isCorrect}>
          {isCorrect ? t.exercise.correct : t.exercise.correctAnswer(exercise.answer)}
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
        <ContinueButton
          correct={isCorrect}
          onClick={() => {
            if (!isCorrect && !exercise.options) saveDraft(exercise.id, value);
            onResult(isCorrect);
          }}
        />
      )}
    </div>
  );
}
