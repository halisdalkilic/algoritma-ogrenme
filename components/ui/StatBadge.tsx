"use client";

import { motion } from "framer-motion";

const TONES = {
  flame: "text-flame",
  xp: "text-xp",
  heart: "text-bad",
} as const;

/** İkonlar çok hafif "nefes alır". */
const ICON_MOTION = {
  flame: { scale: [1, 1.07, 1] },
  xp: { scale: [1, 1.05, 1] },
  heart: { scale: [1, 1.09, 1] },
};

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
      <motion.span
        aria-hidden
        className="inline-block text-base leading-none"
        animate={ICON_MOTION[tone]}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.span>
      {/* value değiştiğinde küçük bir "pop" — XP/seri artışını fark ettirir */}
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className={`tabular-nums ${TONES[tone]}`}
      >
        {value}
      </motion.span>
    </div>
  );
}
