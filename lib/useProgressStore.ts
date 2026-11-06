"use client";

import { create } from "zustand";
import {
  DAILY_GOAL_XP,
  DEFAULT_PROGRESS,
  addXp,
  applyReviewResult,
  loadProgress,
  markLessonCompleted,
  saveProgress,
  scheduleReview,
  xpOnDate,
  type Progress,
} from "./progress";
import { computeEarnedBadgeIds } from "./badges";
import { rankFor, type Rank } from "./ranks";
import { cue, type Cue } from "./feedback";

/** Seri kutlaması yapılan dönüm noktaları (Duolingo'daki gibi her gün değil, sadece bunlarda). */
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export type Celebration =
  | { kind: "streak"; days: number }
  | { kind: "rank"; rank: Rank }
  | { kind: "goal"; xp: number }
  | { kind: "badge"; id: string };

type ProgressStore = {
  progress: Progress;
  hydrated: boolean;
  /** Ekranda sırayla gösterilecek kutlamalar (CelebrationOverlay tüketir). */
  celebrations: Celebration[];
  /** Ders sürerken true: kutlamalar kuyrukta bekler, araya girmez. */
  holdCelebrations: boolean;
  /** Günlük hedef her tamamlandığında artar; başlıktaki halka bunu izleyip patlama gösterir (S6). */
  goalPulse: number;
  hydrate: () => void;
  gainXp: (amount: number) => void;
  completeLesson: (lessonId: string, score: number) => void;
  reportWrongAnswer: (exerciseId: string) => void;
  reportReviewResult: (exerciseId: string, correct: boolean) => void;
  updateSettings: (patch: Partial<Progress["settings"]>) => void;
  /** Bulutla birleşmiş ilerlemeyi yazar (kutlama/ses tetiklemez). */
  applySynced: (next: Progress) => void;
  dismissCelebration: () => void;
  play: (kind: Cue) => void;
};

export const useProgressStore = create<ProgressStore>((set, get) => {
  function commit(next: Progress, newCelebrations: Celebration[] = []) {
    saveProgress(next);
    set((s) => ({ progress: next, celebrations: [...s.celebrations, ...newCelebrations] }));
  }

  /** Seri bu işlemle bir dönüm noktasına ulaştıysa kutlama döndürür. */
  function streakMilestone(prev: Progress, next: Progress): Celebration[] {
    const changed = next.streak.lastActiveDate !== prev.streak.lastActiveDate;
    return changed && STREAK_MILESTONES.includes(next.streak.count) ? [{ kind: "streak", days: next.streak.count }] : [];
  }

  /** Bu işlemle yeni kazanılan rozetler için kutlama döndürür (S5). */
  function newBadges(prev: Progress, next: Progress): Celebration[] {
    return next.badges.filter((id) => !prev.badges.includes(id)).map((id) => ({ kind: "badge" as const, id }));
  }

  return {
    progress: DEFAULT_PROGRESS,
    hydrated: false,
    celebrations: [],
    holdCelebrations: false,
    goalPulse: 0,
    hydrate: () => {
      if (get().hydrated) return;
      set({ progress: loadProgress(), hydrated: true });
    },
    gainXp: (amount) => {
      const prev = get().progress;
      const added = addXp(prev, amount);
      const next = { ...added, badges: computeEarnedBadgeIds(added) };
      const found: Celebration[] = [...streakMilestone(prev, next), ...newBadges(prev, next)];
      const before = rankFor(prev.xp);
      const after = rankFor(next.xp);
      if (after.id > before.id) found.push({ kind: "rank", rank: after });
      const goal = DAILY_GOAL_XP[next.settings.dailyGoal];
      const goalReached = xpOnDate(prev) < goal && xpOnDate(next) >= goal;
      if (goalReached) found.push({ kind: "goal", xp: goal });
      commit(next, found);
      if (goalReached) set((s) => ({ goalPulse: s.goalPulse + 1 }));
    },
    completeLesson: (lessonId, score) => {
      const prev = get().progress;
      const afterCompletion = markLessonCompleted(prev, lessonId, score);
      const next = { ...afterCompletion, badges: computeEarnedBadgeIds(afterCompletion) };
      commit(next, [...streakMilestone(prev, next), ...newBadges(prev, next)]);
    },
    reportWrongAnswer: (exerciseId) => commit(scheduleReview(get().progress, exerciseId)),
    reportReviewResult: (exerciseId, correct) => commit(applyReviewResult(get().progress, exerciseId, correct)),
    updateSettings: (patch) => {
      const p = get().progress;
      commit({ ...p, settings: { ...p.settings, ...patch } });
    },
    applySynced: (next) => commit({ ...next, badges: computeEarnedBadgeIds(next) }),
    dismissCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),
    play: (kind) => cue(kind, get().progress.settings),
  };
});
