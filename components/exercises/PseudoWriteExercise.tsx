"use client";

import { useState } from "react";
import type { PseudoWriteExercise as PseudoWriteExerciseType } from "@/content/schema";
import { gradePseudoWrite } from "@/lib/grading";
import { loadDraft, saveDraft } from "@/lib/answerDraft";
import type { ExerciseProps } from "./types";
import { FeedbackBanner } from "./FeedbackBanner";
import { useLocale, useT } from "@/lib/i18n/context";
import { ContinueButton } from "./ContinueButton";

export function PseudoWriteExercise({
  exercise,
  onResult,
}: ExerciseProps<PseudoWriteExerciseType>) {
  const t = useT();
  const locale = useLocale();
  const [code, setCode] = useState(() => loadDraft<string>(exercise.id) ?? "");
  const [checked, setChecked] = useState(false);
  const [showSample, setShowSample] = useState(false);

  const result = checked ? gradePseudoWrite(code, exercise.requiredKeywords, locale) : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[1.35rem] font-black leading-snug">{exercise.question}</p>
      <p className="text-sm font-bold text-muted">{t.exercise.pseudo.intro}</p>

      <textarea
        value={code}
        disabled={checked}
        onChange={(e) => setCode(e.target.value)}
        rows={6}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        placeholder={t.exercise.pseudo.placeholder}
        className="code-block w-full resize-y !text-base focus:border-[var(--brand)] focus:outline-none"
      />

      {checked && result && (
        <FeedbackBanner correct={result.correct}>
          <div className="flex flex-col gap-2">
            <p className="font-semibold">
              {result.correct ? t.exercise.pseudo.ok : t.exercise.pseudo.missingHeader}
            </p>
            {result.missingKeywords.length > 0 && (
              <p>{t.exercise.pseudo.missingKeywords(result.missingKeywords.join(", "))}</p>
            )}
            {result.unbalancedBlocks.length > 0 && (
              <p>{t.exercise.pseudo.unbalanced(result.unbalancedBlocks.join(", "))}</p>
            )}
          </div>
        </FeedbackBanner>
      )}

      {checked && (
        <div>
          <button
            type="button"
            onClick={() => setShowSample((s) => !s)}
            className="text-sm font-black text-brand underline underline-offset-4"
          >
            {showSample ? t.exercise.pseudo.hideSample : t.exercise.pseudo.showSample}
          </button>
          {showSample && (
            <pre className="code-block mt-2">
              {exercise.sampleSolution}
            </pre>
          )}
        </div>
      )}

      {!checked ? (
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={code.trim() === ""}
          className="btn btn-block"
        >
          {t.exercise.check}
        </button>
      ) : (
        <ContinueButton
          correct={result?.correct ?? false}
          onClick={() => {
            if (!result?.correct) saveDraft(exercise.id, code);
            onResult(result?.correct ?? false);
          }}
        />
      )}
    </div>
  );
}
