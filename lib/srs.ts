/**
 * Aralıklı tekrar (spaced repetition) algoritması.
 * Plan.md bölüm 4: "Yanlış yapılan sorular 1/3/7 gün sonra tekrar gelir."
 *
 * Akış: bir alıştırma yanlış yapılınca kuyruğa 0. aşamada (1 gün sonra
 * vadeli) eklenir. /tekrar sayfasında doğru cevaplanınca bir sonraki aşamaya
 * geçer (3 gün, sonra 7 gün); 7 günlük aşamada da doğru cevaplanırsa
 * "ustalaşıldı" kabul edilip kuyruktan çıkar. Tekrar sırasında yanlış
 * cevaplanırsa 0. aşamaya (1 gün) geri döner.
 */

export type ReviewEntry = { exerciseId: string; dueDate: string; interval: number };

export const INTERVALS_DAYS = [1, 3, 7] as const;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Bir alıştırma yanlış yapıldığında (ders içinde ya da tekrar sırasında) çağrılır. */
export function recordWrongAnswer(
  queue: ReviewEntry[],
  exerciseId: string,
  now: Date = new Date(),
): ReviewEntry[] {
  const dueDate = addDays(now, INTERVALS_DAYS[0]).toISOString();
  const withoutExisting = queue.filter((e) => e.exerciseId !== exerciseId);
  return [...withoutExisting, { exerciseId, dueDate, interval: 0 }];
}

/**
 * /tekrar sayfasında bir alıştırma cevaplandığında çağrılır. Kuyrukta yoksa
 * (örn. daha önce hiç yanlış yapılmamışsa) kuyruk değişmeden döner.
 */
export function recordReviewResult(
  queue: ReviewEntry[],
  exerciseId: string,
  correct: boolean,
  now: Date = new Date(),
): ReviewEntry[] {
  const existing = queue.find((e) => e.exerciseId === exerciseId);
  if (!existing) return queue;

  if (!correct) {
    return recordWrongAnswer(queue, exerciseId, now);
  }

  const nextStage = existing.interval + 1;
  if (nextStage >= INTERVALS_DAYS.length) {
    // Son aşamada da doğru cevaplandı — ustalaşıldı, kuyruktan çıkar.
    return queue.filter((e) => e.exerciseId !== exerciseId);
  }

  const dueDate = addDays(now, INTERVALS_DAYS[nextStage]).toISOString();
  return queue.map((e) =>
    e.exerciseId === exerciseId ? { ...e, interval: nextStage, dueDate } : e,
  );
}

export function getDueEntries(queue: ReviewEntry[], now: Date = new Date()): ReviewEntry[] {
  return queue.filter((e) => new Date(e.dueDate).getTime() <= now.getTime());
}
