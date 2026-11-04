"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Kavram görsellerinin ortak parçaları.
 * Her görsel "kare" (frame) mantığıyla çalışır: useTicker 0..count-1 arasında döner.
 * "Hareketi azalt" açıksa animasyon durur ve SON kare (en öğretici hâl) sabit gösterilir.
 */
export function useTicker(count: number, ms = 1300): number {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduce || count <= 1) return;
    const id = setInterval(() => setTick((t) => (t + 1) % count), ms);
    return () => clearInterval(id);
  }, [count, ms, reduce]);
  return reduce ? Math.max(0, count - 1) : tick;
}

/** Görselin çerçevesi. `label` ekran okuyucular için görselin ne anlattığını söyler. */
export function Frame({
  label,
  accent,
  children,
  caption,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
  caption?: React.ReactNode;
}) {
  return (
    <figure
      role="img"
      aria-label={label}
      className="relative overflow-hidden rounded-2xl border-2 border-line bg-surface-2 px-4 py-5"
      style={{ ["--acc" as string]: accent }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(circle, color-mix(in srgb, var(--acc) 22%, transparent) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div aria-hidden className="relative flex min-h-[132px] flex-col items-center justify-center gap-3">
        {children}
      </div>
      {caption !== undefined && (
        <figcaption aria-hidden className="relative mt-3 flex min-h-6 justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={String(caption)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="rounded-full bg-surface px-3 py-1 font-mono text-[13px] font-bold text-ink shadow-sm"
            >
              {caption}
            </motion.span>
          </AnimatePresence>
        </figcaption>
      )}
    </figure>
  );
}

/** Değeri değiştiğinde "pop" yapan küçük kutu içeriği. */
export function Pop({ value, className }: { value: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={String(value)}
        initial={{ scale: 0.4, opacity: 0, y: -8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.4, opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
        className={className}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

/** Yatay ok (işlem akışı). */
export function Arrow({ active = true }: { active?: boolean }) {
  return (
    <svg width="22" height="16" viewBox="0 0 28 16" className="flex-none" aria-hidden>
      <motion.path
        d="M2 8 H22 M16 2 L23 8 L16 14"
        fill="none"
        stroke={active ? "var(--acc)" : "var(--line)"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 4"
        animate={active ? { strokeDashoffset: [16, 0] } : undefined}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
    </svg>
  );
}

export const TONE = {
  good: { bg: "var(--good-soft)", border: "var(--good)", ink: "var(--good-ink)" },
  bad: { bg: "var(--bad-soft)", border: "var(--bad)", ink: "var(--bad-ink)" },
  neutral: { bg: "var(--surface)", border: "var(--line)", ink: "var(--ink)" },
  accent: { bg: "color-mix(in srgb, var(--acc) 14%, var(--surface))", border: "var(--acc)", ink: "var(--ink)" },
} as const;
export type Tone = keyof typeof TONE;
