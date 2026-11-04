"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Lesson } from "@/content/schema";
import { useHref, useT } from "@/lib/i18n/context";

export type NodeState = "completed" | "current" | "unlocked" | "locked";

export const NODE_SIZE = 76;
const LABEL_GAP = 20;

function Icon({ state, checkpoint }: { state: NodeState; checkpoint: boolean }) {
  const common = {
    width: 30,
    height: 30,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (state === "completed") {
    return (
      <svg {...common}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  }
  if (state === "locked") {
    return (
      <svg {...common} strokeWidth={2.6}>
        <rect x="5" y="11" width="14" height="9" rx="2.5" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    );
  }
  if (checkpoint) {
    return (
      <svg {...common} strokeWidth={2.4}>
        <path d="M8 4h8v6a4 4 0 0 1-8 0V4z" />
        <path d="M8 6H4v1a3 3 0 0 0 4 2.8M16 6h4v1a3 3 0 0 1-4 2.8M12 14v4M8.5 20h7" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor" strokeWidth={2}>
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}

/**
 * Harita yolundaki yuvarlak ders düğümü + yanındaki başlık. `x` / `y`, düğüm
 * MERKEZİNİN yol konteynerine göre piksel konumudur (WorldSection hesaplar).
 * Başlık, yolun uzağındaki tarafa konur ki kıvrımlı çizgiyle çakışmasın.
 */
export function LessonNode({
  lesson,
  state,
  x,
  y,
  side,
  labelWidth,
  color,
  colorDark,
}: {
  lesson: Lesson;
  state: NodeState;
  x: number;
  y: number;
  side: "left" | "right";
  labelWidth: number;
  color: string;
  colorDark: string;
}) {
  const t = useT();
  const href = useHref();
  const checkpoint = lesson.title.startsWith(t.map.checkpointPrefix);
  const locked = state === "locked";
  const active = state === "current";

  const bg = locked ? "var(--disabled)" : color;
  const shadow = locked ? "color-mix(in srgb, var(--disabled) 70%, black)" : colorDark;
  const fg = locked ? "var(--disabled-ink)" : "#fff";

  const label = t.map.lessonLabel(lesson.id, lesson.title, t.map.nodeState[state]);

  const circle = (
    <motion.span
      whileHover={!locked ? { scale: 1.07 } : undefined}
      whileTap={!locked ? { scale: 0.94, y: 5 } : undefined}
      className="relative grid place-items-center rounded-full"
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        background: bg,
        color: fg,
        boxShadow: `0 7px 0 ${shadow}, inset 0 -5px 0 rgba(0,0,0,0.12), inset 0 4px 0 rgba(255,255,255,0.22)`,
        outline: checkpoint && !locked ? "4px solid #fbbf24" : undefined,
        outlineOffset: checkpoint && !locked ? 3 : undefined,
      }}
    >
      {active && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{ border: `4px solid ${color}` }}
          animate={{ scale: [1, 1.38], opacity: [0.7, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <Icon state={state} checkpoint={checkpoint} />
    </motion.span>
  );

  const labelLeft = side === "right" ? x + NODE_SIZE / 2 + LABEL_GAP : x - NODE_SIZE / 2 - LABEL_GAP - labelWidth;

  return (
    <>
      {/* düğüm */}
      <div className="absolute" style={{ left: x - NODE_SIZE / 2, top: y - NODE_SIZE / 2 }}>
        {active && (
          <motion.span
            aria-hidden
            className="absolute left-1/2 -top-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-surface px-3 py-1 text-xs font-black uppercase tracking-widest shadow-md"
            style={{ color, border: `2px solid ${color}` }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            {t.map.start}
            <span
              className="absolute left-1/2 top-full -mt-[5px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-surface"
              style={{ borderRight: `2px solid ${color}`, borderBottom: `2px solid ${color}` }}
            />
          </motion.span>
        )}

        {locked ? (
          <span role="img" aria-label={label} className="block cursor-not-allowed">
            {circle}
          </span>
        ) : (
          <Link href={href({ name: "lesson", id: lesson.id })} aria-label={label} className="block rounded-full">
            {circle}
          </Link>
        )}
      </div>

      {/* başlık */}
      <div
        aria-hidden
        className={`pointer-events-none absolute flex items-center ${side === "right" ? "justify-start text-left" : "justify-end text-right"}`}
        style={{ left: labelLeft, top: y - 32, width: labelWidth, height: 64 }}
      >
        <span className={`block text-[13px] font-extrabold leading-tight ${locked ? "text-muted/70" : "text-ink"}`}>
          {lesson.title}
          <span className="mt-1 block text-[10.5px] font-bold uppercase tracking-wider text-muted">
            {t.map.lessonMeta(lesson.id, lesson.estimatedMinutes)}
          </span>
        </span>
      </div>
    </>
  );
}
