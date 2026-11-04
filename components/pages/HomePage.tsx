"use client";

import { useEffect } from "react";
import { WORLDS } from "@/content/worlds";
import type { ContentApi } from "@/content/load";
import { useT } from "@/lib/i18n/context";
import { useProgressStore } from "@/lib/useProgressStore";
import { isLessonUnlocked } from "@/lib/progress";
import { WorldSection } from "@/components/map/WorldSection";
import { Hero } from "@/components/map/Hero";

/** Dünya haritası (ana sayfa). İçerik dile göre dışarıdan gelir: components/pages/{tr,en}-pages.tsx. */
export function HomePage({ content }: { content: ContentApi }) {
  const { lessons, getLessonsByWorld } = content;
  const t = useT();
  const progress = useProgressStore((s) => s.progress);
  const hydrated = useProgressStore((s) => s.hydrated);
  const hydrate = useProgressStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const completed = Object.keys(progress.completedLessons).length;

  // Sıradaki ders: harita sırasıyla, açık ve henüz tamamlanmamış ilk ders
  // (ucuz bir tarama; memoization gerekmez)
  let nextLesson: { id: string; title: string } | null = null;
  outer: for (const world of WORLDS) {
    for (const lesson of getLessonsByWorld(world.id)) {
      if (!(lesson.id in progress.completedLessons) && isLessonUnlocked(progress, lesson.prerequisites)) {
        nextLesson = { id: lesson.id, title: lesson.title };
        break outer;
      }
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-24 pt-6 sm:pt-8">
      <Hero completed={completed} total={lessons.length} nextLesson={nextLesson} />

      {!hydrated ? (
        <p className="text-center text-sm font-bold text-muted">{t.common.loading}</p>
      ) : (
        <div className="flex flex-col gap-14">
          {WORLDS.map((world) => (
            <WorldSection
              key={world.id}
              world={world}
              lessons={getLessonsByWorld(world.id)}
              progress={progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
