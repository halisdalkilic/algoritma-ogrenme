import { WORLDS } from "@/content/worlds";
import { lessonIdsByWorld } from "@/content/structure";
import type { Progress } from "./progress";

/** Rozet kimliği ve ikonu. Görünen ad/açıklama dile göre sözlüktedir: `t.badges[id]` (lib/i18n/dict). */
export type BadgeDef = {
  id: string;
  icon: string;
};

export const BADGES: BadgeDef[] = [
  { id: "ilk-ders", icon: "🌱" },
  { id: "dunya-0", icon: "🔥" },
  { id: "dunya-1", icon: "🧱" },
  { id: "dunya-2", icon: "🗺️" },
  { id: "dunya-3", icon: "🔀" },
  { id: "dunya-4", icon: "🔁" },
  { id: "dunya-5", icon: "📦" },
  { id: "seri-7", icon: "🏅" },
];

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

/**
 * Mevcut ilerleme durumuna göre hak edilmiş tüm rozet id'lerini hesaplar.
 * Saf fonksiyon: tamamlanan ders sayısı hiç azalmadığından, dönen liste her
 * zaman önceki listenin bir üst kümesidir — "kaybedilen" rozet olmaz.
 */
export function computeEarnedBadgeIds(progress: Progress): string[] {
  const earned: string[] = [];
  const completedCount = Object.keys(progress.completedLessons).length;

  if (completedCount >= 1) earned.push("ilk-ders");

  for (const world of WORLDS) {
    const ids = lessonIdsByWorld(world.id);
    if (ids.length > 0 && ids.every((id) => id in progress.completedLessons)) {
      earned.push(`dunya-${world.id}`);
    }
  }

  if (progress.streak.count >= 7) earned.push("seri-7");

  return earned;
}
