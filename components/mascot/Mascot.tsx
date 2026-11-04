"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useT } from "@/lib/i18n/context";

export type Mood = "idle" | "wave" | "happy" | "think" | "sad" | "cheer";

/**
 * "Algo" — uygulamanın maskotu. Ekran-yüzlü küçük bir robot; ifadesi duruma göre değişir.
 * Renkler temadan bağımsız sabit tutulur: karakter her temada aynı görünsün.
 */
const C = {
  head: ["#8b6dff", "#5b3ee0"],
  body: "#4b32c4",
  screen: "#141733",
  glow: "#6ef0c2",
  cheek: "#ff8fb1",
  bulb: "#ffc93c",
};

function Eyes({ mood }: { mood: Mood }) {
  const reduce = useReducedMotion();
  if (mood === "happy" || mood === "cheer") {
    return (
      <g stroke={C.glow} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M42 56 q6 -8 12 0" />
        <path d="M66 56 q6 -8 12 0" />
      </g>
    );
  }
  if (mood === "sad") {
    return (
      <g fill={C.glow}>
        <path d="M42 52 l12 3 v4 a6 6 0 0 1 -12 0 z" />
        <path d="M78 52 l-12 3 v4 a6 6 0 0 0 12 0 z" />
      </g>
    );
  }
  const dx = mood === "think" ? 3 : 0;
  const dy = mood === "think" ? -3 : 0;
  return (
    <motion.g
      fill={C.glow}
      style={{ originY: "55px" }}
      animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{ duration: 4.2, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
    >
      <ellipse cx={48 + dx} cy={55 + dy} rx="5.5" ry="6.5" />
      <ellipse cx={72 + dx} cy={55 + dy} rx="5.5" ry="6.5" />
      <circle cx={50 + dx} cy={52 + dy} r="1.8" fill="#fff" />
      <circle cx={74 + dx} cy={52 + dy} r="1.8" fill="#fff" />
    </motion.g>
  );
}

const MOUTHS: Record<Mood, React.ReactNode> = {
  idle: <path d="M53 66 q7 6 14 0" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" fill="none" />,
  wave: <path d="M52 65 q8 7 16 0" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" fill="none" />,
  happy: <path d="M50 63 q10 11 20 0 z" fill={C.glow} />,
  cheer: <path d="M49 62 q11 15 22 0 z" fill={C.glow} />,
  think: <path d="M55 68 h10" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" />,
  sad: <path d="M52 70 q8 -7 16 0" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" fill="none" />,
};

export function Mascot({ mood = "idle", size = 96, className }: { mood?: Mood; size?: number; className?: string }) {
  const t = useT();
  const reduce = useReducedMotion();
  const float = reduce
    ? undefined
    : mood === "cheer"
      ? { y: [0, -10, 0], rotate: [0, -4, 4, 0] }
      : mood === "sad"
        ? { y: [0, 2, 0], rotate: -3 }
        : { y: [0, -3, 0] };
  const armUp = mood === "cheer";
  const uid = useId().replace(/:/g, "");

  return (
    <motion.svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={t.common.mascotAria}
      animate={float}
      transition={{ duration: mood === "cheer" ? 0.9 : 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id={`algo-head-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.head[0]} />
          <stop offset="1" stopColor={C.head[1]} />
        </linearGradient>
        <radialGradient id={`algo-bulb-${uid}`}>
          <stop offset="0" stopColor="#fff6d1" />
          <stop offset="1" stopColor={C.bulb} />
        </radialGradient>
      </defs>

      {/* gölge */}
      <ellipse cx="60" cy="114" rx="26" ry="4" fill="#000" opacity="0.15" />

      {/* kollar */}
      <motion.path
        d={armUp ? "M38 96 q-12 -6 -14 -20" : "M38 96 q-12 4 -12 14"}
        stroke={C.body}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <motion.path
        d={armUp || mood === "wave" ? "M82 96 q12 -6 14 -20" : "M82 96 q12 4 12 14"}
        stroke={C.body}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
        style={{ originX: "82px", originY: "96px" }}
        animate={mood === "wave" && !reduce ? { rotate: [0, 18, -6, 18, 0] } : undefined}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6 }}
      />

      {/* gövde */}
      <rect x="38" y="86" width="44" height="24" rx="11" fill={C.body} />
      <circle cx="60" cy="98" r="4" fill={C.bulb} opacity="0.9" />

      {/* anten */}
      <motion.g
        style={{ originX: "60px", originY: "26px" }}
        animate={mood === "sad" ? { rotate: 22 } : reduce ? undefined : { rotate: [-6, 6, -6] }}
        transition={{ duration: 2.4, repeat: mood === "sad" ? 0 : Infinity, ease: "easeInOut" }}
      >
        <line x1="60" y1="26" x2="60" y2="12" stroke={C.body} strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="9" r="6" fill={`url(#algo-bulb-${uid})`} />
      </motion.g>

      {/* kafa + ekran */}
      <rect x="18" y="24" width="84" height="66" rx="26" fill={`url(#algo-head-${uid})`} />
      <rect x="18" y="24" width="84" height="66" rx="26" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
      <rect x="29" y="35" width="62" height="44" rx="16" fill={C.screen} />
      <Eyes mood={mood} />
      {MOUTHS[mood]}
      {(mood === "happy" || mood === "cheer" || mood === "wave") && (
        <g fill={C.cheek} opacity="0.75">
          <ellipse cx="37" cy="68" rx="4" ry="2.6" />
          <ellipse cx="83" cy="68" rx="4" ry="2.6" />
        </g>
      )}

      {/* düşünce noktaları */}
      {mood === "think" &&
        [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={100 + i * 6}
            cy={22 - i * 6}
            r={2 + i}
            fill={C.head[0]}
            animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
    </motion.svg>
  );
}

/** Maskot + konuşma balonu. */
export function MascotSays({ mood, children, size = 72 }: { mood: Mood; children: React.ReactNode; size?: number }) {
  return (
    <div className="flex items-end gap-2">
      <Mascot mood={mood} size={size} className="flex-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: -6 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.15 }}
        className="relative mb-5 rounded-2xl border-2 border-line bg-surface px-4 py-2.5 text-[15px] font-extrabold leading-snug shadow-[var(--shadow-card)]"
      >
        <span
          aria-hidden
          className="absolute -left-[9px] bottom-3 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-surface"
        />
        {children}
      </motion.div>
    </div>
  );
}
