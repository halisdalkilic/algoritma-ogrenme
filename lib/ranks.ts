/**
 * Toplam XP'ye göre rütbeler. Eşikler içeriğe göre ayarlandı: 47 ders × ~80 XP ≈ 3.800 XP;
 * "Efsane" tüm dersleri bitirip tekrarlarla devam edenler içindir.
 * Rütbe ADLARI dile göre değişir ve sözlüktedir: `t.ranks.titles[rank.id]` (lib/i18n/dict).
 */

export type Rank = {
  id: number;
  icon: string;
  minXp: number;
  /** Rütbe kartı gradyanı (açık → koyu) */
  colors: [string, string];
};

export const RANKS: Rank[] = [
  { id: 0, icon: "🌱", minXp: 0, colors: ["#34d399", "#059669"] },
  { id: 1, icon: "🧭", minXp: 150, colors: ["#38bdf8", "#0369a1"] },
  { id: 2, icon: "🧩", minXp: 400, colors: ["#a78bfa", "#6d28d9"] },
  { id: 3, icon: "⚙️", minXp: 900, colors: ["#f472b6", "#be185d"] },
  { id: 4, icon: "🏛️", minXp: 1600, colors: ["#fbbf24", "#b45309"] },
  { id: 5, icon: "🥋", minXp: 2600, colors: ["#fb7185", "#9f1239"] },
  { id: 6, icon: "👑", minXp: 4000, colors: ["#facc15", "#7c3aed"] },
];

export function rankFor(xp: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) if (xp >= r.minXp) current = r;
  return current;
}

/** Bir sonraki rütbeye ilerleme. Son rütbede `next` null ve yüzde 100. */
export function rankProgress(xp: number): { rank: Rank; next: Rank | null; into: number; need: number; pct: number } {
  const rank = rankFor(xp);
  const next = RANKS[rank.id + 1] ?? null;
  if (!next) return { rank, next, into: xp - rank.minXp, need: 0, pct: 100 };
  const into = xp - rank.minXp;
  const need = next.minXp - rank.minXp;
  return { rank, next, into, need, pct: Math.round((into / need) * 100) };
}
