/**
 * localStorage tabanlı ilerleme katmanı (bkz. plan.md bölüm 6).
 * `version` alanı ileride backend'e taşırken migration için tutulur.
 *
 * Yeni alanlar (activity, settings.sound/haptics) eski kayıtlara varsayılanla eklenir;
 * bu yüzden `version` 1 olarak kalır ve mevcut kullanıcıların ilerlemesi korunur.
 */

import { recordReviewResult, recordWrongAnswer } from "./srs";

export type DailyGoal = 1 | 2 | 3;

export type Progress = {
  version: 1;
  xp: number;
  hearts: number;
  streak: { count: number; lastActiveDate: string };
  completedLessons: Record<string, { score: number; completedAt: string }>;
  reviewQueue: Array<{ exerciseId: string; dueDate: string; interval: number }>;
  badges: string[];
  /** Yerel tarih (YYYY-MM-DD) → o gün kazanılan XP. Seri takvimi ve günlük hedef için. */
  activity: Record<string, number>;
  settings: {
    /** 1 = Rahat, 2 = Normal, 3 = Yoğun (bkz. DAILY_GOAL_XP) */
    dailyGoal: DailyGoal;
    heartsEnabled: boolean;
    theme: "light" | "dark";
    sound: boolean;
    haptics: boolean;
  };
};

const STORAGE_KEY = "algoritma-app:progress";

export const DAILY_GOAL_XP: Record<DailyGoal, number> = { 1: 30, 2: 60, 3: 120 };
// Hedef etiketleri (Rahat/Normal/Yoğun) dile göre sözlüktedir: t.goalLabels

/** Takvim ve aktivite kaydında tutulan en fazla gün sayısı (kayıt büyümesin). */
const ACTIVITY_DAYS_KEPT = 400;

export const DEFAULT_PROGRESS: Progress = {
  version: 1,
  xp: 0,
  hearts: 5,
  streak: { count: 0, lastActiveDate: "" },
  completedLessons: {},
  reviewQueue: [],
  badges: [],
  activity: {},
  settings: { dailyGoal: 1, heartsEnabled: false, theme: "light", sound: true, haptics: true },
};

// ── Tarih yardımcıları: YEREL gün (UTC değil — Türkiye'de 00:00-03:00 arası önceki güne yazılmasın) ──

export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + days));
}

// ── Yükleme / kaydetme ──

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Eksik alanları varsayılanla doldurur; iç içe `settings` de alan alan birleştirilir. */
export function withDefaults(parsed: Partial<Progress>): Progress {
  return {
    ...DEFAULT_PROGRESS,
    ...parsed,
    activity: parsed.activity ?? {},
    settings: { ...DEFAULT_PROGRESS.settings, ...(parsed.settings ?? {}) },
  };
}

export function loadProgress(): Progress {
  if (!isBrowser()) return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<Progress>;
    if (parsed.version !== 1) return DEFAULT_PROGRESS; // ileride migration burada yapılır
    return withDefaults(parsed);
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: Progress): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage kullanılamıyor (gizli sekme vb.) — sessizce yok say
  }
}

// ── XP, aktivite, seri ──

/** Bugün çalışıldığını işaretler: dün de çalışıldıysa seri +1, gün atlandıysa 1'den başlar. */
export function touchStreak(progress: Progress, today: string = localDate()): Progress {
  const last = progress.streak.lastActiveDate;
  if (last === today) return progress;
  const count = last === shiftDate(today, -1) ? progress.streak.count + 1 : 1;
  return { ...progress, streak: { count, lastActiveDate: today } };
}

/** XP kazandıran her çalışma (ders ya da tekrar) seriyi de canlı tutar. */
export function addXp(progress: Progress, amount: number, today: string = localDate()): Progress {
  const activity = { ...progress.activity, [today]: (progress.activity[today] ?? 0) + amount };
  const keys = Object.keys(activity).sort();
  for (const old of keys.slice(0, Math.max(0, keys.length - ACTIVITY_DAYS_KEPT))) delete activity[old];
  const next = { ...progress, xp: progress.xp + amount, activity };
  return amount > 0 ? touchStreak(next, today) : next;
}

export function xpOnDate(progress: Progress, date: string = localDate()): number {
  return progress.activity[date] ?? 0;
}

/** Dün ya da bugün çalışılmadıysa seri bozulmuştur: ekranda 0 görünür. */
export function currentStreak(progress: Progress, today: string = localDate()): number {
  const last = progress.streak.lastActiveDate;
  return last === today || last === shiftDate(today, -1) ? progress.streak.count : 0;
}

export function loseHeart(progress: Progress): Progress {
  if (!progress.settings.heartsEnabled) return progress;
  return { ...progress, hearts: Math.max(0, progress.hearts - 1) };
}

export function markLessonCompleted(
  progress: Progress,
  lessonId: string,
  score: number,
  today: string = localDate(),
): Progress {
  return touchStreak(
    {
      ...progress,
      completedLessons: {
        ...progress.completedLessons,
        [lessonId]: { score, completedAt: new Date().toISOString() },
      },
    },
    today,
  );
}

export function isLessonUnlocked(progress: Progress, prerequisites: string[]): boolean {
  return prerequisites.every((p) => p in progress.completedLessons);
}

/** Bir alıştırma yanlış yapıldığında (ders içinde ya da /tekrar'da) çağrılır. */
export function scheduleReview(progress: Progress, exerciseId: string): Progress {
  return { ...progress, reviewQueue: recordWrongAnswer(progress.reviewQueue, exerciseId) };
}

/** /tekrar sayfasında bir tekrar sorusu cevaplandığında çağrılır. */
export function applyReviewResult(progress: Progress, exerciseId: string, correct: boolean): Progress {
  return { ...progress, reviewQueue: recordReviewResult(progress.reviewQueue, exerciseId, correct) };
}
