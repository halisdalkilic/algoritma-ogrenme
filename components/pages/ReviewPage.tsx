"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useProgressStore } from "@/lib/useProgressStore";
import { getDueEntries, type ReviewEntry } from "@/lib/srs";
import type { ContentApi } from "@/content/load";
import { useHref, useT } from "@/lib/i18n/context";
import type { Exercise, Lesson } from "@/content/schema";
import { ExerciseRouter } from "@/components/exercises/ExerciseRouter";
import { ProgressBar } from "@/components/lesson/ProgressBar";
import { Mascot } from "@/components/mascot/Mascot";

type QueueItem = { entry: ReviewEntry; exercise: Exercise; lesson: Lesson };

const REVIEW_XP = 6;

/** Tekrar sayfası (aralıklı tekrar kuyruğu). İçerik dile göre dışarıdan gelir: components/pages/{tr,en}-pages.tsx. */
export function ReviewPage({ content }: { content: ContentApi }) {
  const { getExerciseById } = content;
  const t = useT();
  const href = useHref();
  const progress = useProgressStore((s) => s.progress);
  const hydrated = useProgressStore((s) => s.hydrated);
  const hydrate = useProgressStore((s) => s.hydrate);
  const reportReviewResult = useProgressStore((s) => s.reportReviewResult);
  const gainXp = useProgressStore((s) => s.gainXp);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Kuyruk, hydrate tamamlandığında BİR KERE hesaplanıp dondurulur —
  // dependency dizisi kasten sadece [hydrated]: kullanıcı bir soruyu doğru
  // cevaplayıp zamanlaması ilerlediğinde (progress.reviewQueue değiştiğinde)
  // bu liste aniden küçülüp kaymasın; oturumun geri kalanında sabit kalır.
  const queue = useMemo<QueueItem[] | null>(() => {
    if (!hydrated) return null;
    return getDueEntries(progress.reviewQueue)
      .map((entry) => {
        const resolved = getExerciseById(entry.exerciseId);
        return resolved ? { entry, exercise: resolved.exercise, lesson: resolved.lesson } : null;
      })
      .filter((x): x is QueueItem => x !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const current = queue?.[index];

  function handleResult(correct: boolean) {
    if (!current) return;
    if (correct) {
      reportReviewResult(current.entry.exerciseId, true);
      // Tekrar da öğrenmedir: günlük hedefe ve seriye katkı sağlasın (ilk denemede tam, sonra yarım)
      gainXp(attempts === 0 ? REVIEW_XP : Math.ceil(REVIEW_XP / 2));
      setIndex((i) => i + 1);
      setAttempts(0);
    } else {
      if (attempts === 0) reportReviewResult(current.entry.exerciseId, false);
      setAttempts((a) => a + 1);
    }
  }

  if (!hydrated || queue === null) {
    return <p className="p-10 text-center text-sm font-bold text-muted">{t.common.loading}</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <Mascot mood="happy" size={120} />
        <h1 className="text-3xl font-black">{t.review.emptyTitle}</h1>
        <p className="max-w-sm font-semibold text-muted">{t.review.emptyBody}</p>
        <Link href={href({ name: "home" })} className="btn mt-2">
          {t.review.backToMap}
        </Link>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <Mascot mood="cheer" size={120} />
        <h1 className="text-3xl font-black">{t.review.doneTitle}</h1>
        <p className="font-semibold text-muted">{t.review.doneBody(queue.length)}</p>
        <Link href={href({ name: "home" })} className="btn mt-2">
          {t.review.backToMap}
        </Link>
      </div>
    );
  }

  if (!current) return null; // index < queue.length garantisiyle buraya asla ulaşılmaz

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8">
      <div className="flex">
        <ProgressBar current={index} total={queue.length} />
      </div>
      <span className="chip self-start">
        {t.review.chip(index + 1, queue.length, current.lesson.title)}
      </span>
      <ExerciseRouter
        key={`${current.entry.exerciseId}-${attempts}`}
        exercise={current.exercise}
        onResult={handleResult}
      />
    </div>
  );
}
