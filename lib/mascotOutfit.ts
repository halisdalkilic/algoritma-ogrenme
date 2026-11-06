/** Maskot "Algo"nun kıyafeti seri gününe göre açılır (S13). */
export type Outfit = "none" | "scarf" | "cap" | "crown";

export const OUTFIT_STEPS: Array<{ days: number; outfit: Exclude<Outfit, "none"> }> = [
  { days: 3, outfit: "scarf" },
  { days: 7, outfit: "cap" },
  { days: 30, outfit: "crown" },
];

export function outfitForStreak(days: number): Outfit {
  let result: Outfit = "none";
  for (const step of OUTFIT_STEPS) if (days >= step.days) result = step.outfit;
  return result;
}

/** Bir sonraki kıyafete kaç gün kaldı (hepsi açıksa null). */
export function nextOutfit(days: number): { days: number; outfit: Exclude<Outfit, "none"> } | null {
  const step = OUTFIT_STEPS.find((s) => days < s.days);
  return step ? { days: step.days - days, outfit: step.outfit } : null;
}
