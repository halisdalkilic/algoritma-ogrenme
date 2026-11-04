import raw from "./structure.json";

/** Dilden bağımsız ders yapısı (id, dünya, önkoşullar). Kaynak: scripts/gen-structure.mjs. */
export type LessonStructure = { id: string; worldId: string; prerequisites: string[] };

export const STRUCTURE: LessonStructure[] = raw;

export const LESSON_COUNT = STRUCTURE.length;

export function lessonIdsByWorld(worldId: string): string[] {
  return STRUCTURE.filter((l) => l.worldId === worldId).map((l) => l.id);
}
