"use client";

import { create } from "zustand";
import {
  DAILY_GOAL_XP,
  DEFAULT_PROGRESS,
  addXp,
  applyReviewResult,
  loadProgress,
  loseHeart,
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
  | { kind: "goal"; xp: number };

type ProgressStore = {
  progress: Progress;
  hydrated: boolean;
  /** Ekranda sırayla gösterilecek kutlamalar (CelebrationOverlay tüketir). */
  celebrations: Celebration[];
  /** Ders sürerken true: kutlamalar kuyrukta bekler, araya girmez. */
  holdCelebrations: boolean;
  hydrate: () => void;
  gainXp: (amount: number) => void;
  loseOneHeart: () => void;
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

  return {
    progress: DEFAULT_PROGRESS,
    hydrated: false,
    celebrations: [],
    holdCelebrations: false,
    hydrate: () => {
      if (get().hydrated) return;
      set({ progress: loadProgress(), hydrated: true });
    },
    gainXp: (amount) => {
      const prev = get().progress;
      const added = addXp(prev, amount);
      const next = { ...added, badges: computeEarnedBadgeIds(added) };
      const found: Celebration[] = streakMilestone(prev, next);
      const before = rankFor(prev.xp);
      const after = rankFor(next.xp);
      if (after.id > before.id) found.push({ kind: "rank", rank: after });
      const goal = DAILY_GOAL_XP[next.settings.dailyGoal];
      if (xpOnDate(prev) < goal && xpOnDate(next) >= goal) found.push({ kind: "goal", xp: goal });
      commit(next, found);
    },
    loseOneHeart: () => commit(loseHeart(get().progress)),
    completeLesson: (lessonId, score) => {
      const prev = get().progress;
      const afterCompletion = markLessonCompleted(prev, lessonId, score);
      const next = { ...afterCompletion, badges: computeEarnedBadgeIds(afterCompletion) };
      commit(next, streakMilestone(prev, next));
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
