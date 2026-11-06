"use client";

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
}: {
  icon: string;
  value: string | number;
  label?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div
      className="flex h-9 items-center gap-1.5 rounded-full px-1.5 text-sm font-black min-[380px]:px-3"
      title={label}
      aria-label={label ? `${label}: ${value}` : undefined}
    >
      {/* ikon çok hafif "nefes alır" (CSS: .stat-icon) */}
      <span aria-hidden className="stat-icon inline-block text-base leading-none" data-tone={tone}>
        {icon}
      </span>
      {/* value değiştiğinde küçük bir "pop" — XP/seri artışını fark ettirir */}
      <span key={value} className={`stat-pop inline-block tabular-nums ${TONES[tone]}`}>
        {value}
      </span>
    </div>
  );
}
