/** Dünyanın dilden bağımsız verisi. Başlık ve açıklama dile göre sözlüktedir: `t.worlds[id]`. */
export type WorldMeta = {
  id: string;
  /** Dünya haritasında kullanılan vurgu rengi (açık/koyu temada da okunur). */
  color: string;
  /** Koyu ton — 3D düğme/gölge için. */
  colorDark: string;
  emoji: string;
  bonus?: boolean;
};

/** Plan.md bölüm 2'deki 6 dünya + bonus. */
export const WORLDS: WorldMeta[] = [
  { id: "0", color: "#14b8a6", colorDark: "#0b7f73", emoji: "🌱" },
  { id: "1", color: "#3b82f6", colorDark: "#1f56b8", emoji: "🧱" },
  { id: "2", color: "#8b5cf6", colorDark: "#5b34c4", emoji: "🗺️" },
  { id: "3", color: "#f59e0b", colorDark: "#b46f05", emoji: "🔀" },
  { id: "4", color: "#22c55e", colorDark: "#128a3e", emoji: "🔁" },
  { id: "5", color: "#ec4899", colorDark: "#b4276f", emoji: "📦" },
  { id: "6", color: "#6366f1", colorDark: "#3f41b8", emoji: "🚀", bonus: true },
];

export function getWorldMeta(worldId: string): WorldMeta | undefined {
  return WORLDS.find((w) => w.id === worldId);
}
