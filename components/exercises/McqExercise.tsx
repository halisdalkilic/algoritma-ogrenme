"use client";

import { useState } from "react";
import type { McqExercise as McqExerciseType } from "@/content/schema";
import type { ExerciseProps } from "./types";
import { FeedbackBanner } from "./FeedbackBanner";
import { useT } from "@/lib/i18n/context";
import { ContinueButton } from "./ContinueButton";

export function McqExercise({ exercise, onResult }: ExerciseProps<McqExerciseType>) {
  const t = useT();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const isCorrect = selected === exercise.correctIndex;

  function handleCheck() {
    if (selected === null) return;
    setChecked(true);
  }

  function handleSelect(index: number) {
    if (checked) return;
    setSelected(index);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[1.35rem] font-black leading-snug">{exercise.question}</p>

      <div className="flex flex-col gap-2">
        {exercise.options.map((option, index) => {
          const isSelected = selected === index;
          const showCorrect = checked && index === exercise.correctIndex;
          const showWrong = checked && isSelected && !isCorrect;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(index)}
              disabled={checked}
              className="choice"
              aria-pressed={isSelected}
              aria-label={t.exercise.optionLabel(String.fromCharCode(65 + index), option, showCorrect ? "correct" : showWrong ? "wrong" : "idle")}
              data-state={showCorrect ? "correct" : showWrong ? "wrong" : isSelected ? "selected" : "idle"}
            >
              <span className="choice-key" aria-hidden>
                {String.fromCharCode(65 + index)}
              </span>
              <span className="min-w-0 flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {checked && (
        <FeedbackBanner correct={isCorrect}>
          {isCorrect ? exercise.feedback.correct : exercise.feedback.incorrect}
        </FeedbackBanner>
      )}

      {!checked ? (
        <button
          type="button"
          onClick={handleCheck}
          disabled={selected === null}
          className="btn btn-block"
        >
          {t.exercise.check}
        </button>
      ) : (
        <ContinueButton correct={isCorrect} onClick={() => onResult(isCorrect)} />
      )}
    </div>
  );
}
