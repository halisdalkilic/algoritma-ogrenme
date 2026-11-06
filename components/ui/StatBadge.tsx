"use client";

import { useCountUp } from "@/lib/useCountUp";
import { flightDelay } from "@/lib/xpFlight";

const TONES = {
  flame: "text-flame",
  xp: "text-xp",
  heart: "text-bad",
} as const;

export function StatBadge({
  icon,
  value,
  label,
  tone = "xp",
  xpTarget = false,
}: {
  icon: string;
  value: string | number;
  label?: string;
  tone?: keyof typeof TONES;
  /** XP uçuşunun hedefi (S2): sayı, uçan "+N" varınca akarak artar (S17). */
  xpTarget?: boolean;
}) {
  const numeric = typeof value === "number";
  const { shown, done } = useCountUp(numeric ? value : 0, { delay: xpTarget ? flightDelay : undefined });
  const text = numeric && xpTarget ? shown : value;
  return (
    <div
      className="flex h-9 items-center gap-1.5 rounded-full px-1.5 text-sm font-black min-[380px]:px-3"
      data-xp-target={xpTarget ? "" : undefined}
      title={label}
      aria-label={label ? `${label}: ${value}` : undefined}
    >
      {/* ikon çok hafif "nefes alır" (CSS: .stat-icon) */}
      <span aria-hidden className="stat-icon inline-block text-base leading-none" data-tone={tone}>
        {icon}
      </span>
      {/* value değiştiğinde küçük bir "pop" — XP/seri artışını fark ettirir */}
      <span key={xpTarget && !done ? "sayiyor" : value} className={`stat-pop inline-block tabular-nums ${TONES[tone]}`}>
        {text}
      </span>
    </div>
  );
}
