import { LessonSchema, type Lesson } from "./schema";

/** Bir dilin ders içeriği ve ona erişim fonksiyonları. İki dilde de aynı şekil: bileşenler dilden habersiz çalışır. */
export type ContentApi = {
  lessons: Lesson[];
  getLessonById: (id: string) => Lesson | undefined;
  getLessonsByWorld: (worldId: string) => Lesson[];
  /** Tekrar kuyruğu (srs.ts) bir alıştırmayı yalnızca id'siyle saklar; tekrar sayfası onu (ve dersini) bu fonksiyonla bulur. */
  getExerciseById: (exerciseId: string) => { exercise: Lesson["exercises"][number]; lesson: Lesson } | undefined;
};

/**
 * Ham JSON listesini zod şemasıyla doğrular ve içerik API'sini kurar.
 * Şemayı geçmeyen bir ders derlemeyi kırar: bozuk içerik yayına çıkamaz.
 */
export function createContent(raw: unknown[], label: string): ContentApi {
  const lessons: Lesson[] = raw.map((item, i) => {
    const result = LessonSchema.safeParse(item);
    if (!result.success) {
      throw new Error(`İçerik doğrulama hatası (${label}, index ${i}): ${result.error.message}`);
    }
    return result.data;
  });

  return {
    lessons,
    getLessonById: (id) => lessons.find((l) => l.id === id),
    getLessonsByWorld: (worldId) =>
      lessons
        .filter((l) => l.worldId === worldId)
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
    getExerciseById: (exerciseId) => {
      for (const lesson of lessons) {
        const exercise = lesson.exercises.find((e) => e.id === exerciseId);
        if (exercise) return { exercise, lesson };
      }
      return undefined;
    },
  };
}
