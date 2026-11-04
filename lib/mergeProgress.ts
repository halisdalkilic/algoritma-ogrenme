/**
 * Yerel ve bulut ilerlemesini birleştirir. Amaç hiçbir cihazın emeğini kaybetmemek:
 * her alan için "daha ileri olan" kazanır, iki kayıt da kısmen doğruysa ikisi de korunur.
 */

import { withDefaults, type Progress } from "./progress";

type Lessons = Progress["completedLessons"];

function mergeLessons(a: Lessons, b: Lessons): Lessons {
  const out: Lessons = { ...a };
  for (const [id, mine] of Object.entries(b)) {
    const theirs = out[id];
    // Yüksek puan kazanır; eşitse ilk tamamlanma tarihi korunur.
    if (!theirs || mine.score > theirs.score || (mine.score === theirs.score && mine.completedAt < theirs.completedAt)) {
      out[id] = mine;
    }
  }
  return out;
}

function mergeActivity(a: Progress["activity"], b: Progress["activity"]): Progress["activity"] {
  const out = { ...a };
  for (const [day, xp] of Object.entries(b)) out[day] = Math.max(out[day] ?? 0, xp);
  return out;
}

function mergeReviewQueue(a: Progress["reviewQueue"], b: Progress["reviewQueue"]): Progress["reviewQueue"] {
  const byId = new Map(a.map((e) => [e.exerciseId, e]));
  for (const e of b) {
    const cur = byId.get(e.exerciseId);
    // Daha geç vadeli kayıt, soruyu daha yakın zamanda tekrar etmiş cihazdan gelir.
    if (!cur || e.dueDate > cur.dueDate) byId.set(e.exerciseId, e);
  }
  return [...byId.values()];
}

function mergeStreak(a: Progress["streak"], b: Progress["streak"]): Progress["streak"] {
  if (a.lastActiveDate !== b.lastActiveDate) return a.lastActiveDate > b.lastActiveDate ? a : b;
  return a.count >= b.count ? a : b;
}

/** `local` cihazın kendi ayarları (tema, ses, can) korunur; ilerleme alanları birleşir. */
export function mergeProgress(local: Progress, remote: Progress): Progress {
  const activity = mergeActivity(local.activity, remote.activity);
  const activityXp = Object.values(activity).reduce((sum, v) => sum + v, 0);
  return {
    ...local,
    xp: Math.max(local.xp, remote.xp, activityXp),
    streak: mergeStreak(local.streak, remote.streak),
    completedLessons: mergeLessons(local.completedLessons, remote.completedLessons),
    reviewQueue: mergeReviewQueue(local.reviewQueue, remote.reviewQueue),
    badges: [...new Set([...local.badges, ...remote.badges])],
    activity,
  };
}

/** Sunucudan gelen JSON'u güvenle Progress'e çevirir; tanınmayan sürümde null. */
export function parseRemote(data: unknown): Progress | null {
  if (!data || typeof data !== "object") return null;
  const raw = data as Partial<Progress>;
  if (raw.version !== 1) return null;
  return withDefaults(raw);
}
