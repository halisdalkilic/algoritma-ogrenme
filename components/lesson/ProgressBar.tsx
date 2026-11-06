"use client";

import { m } from "framer-motion";
import { useT } from "@/lib/i18n/context";

/** Kalın, yuvarlak, parlak çizgili ilerleme çubuğu (ders üst çubuğu). */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const t = useT();
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));
  const near = pct >= 80 && pct < 100;
  return (
    <div
      className="relative h-4 flex-1 overflow-hidden rounded-full bg-line"
      data-near={near ? "" : undefined}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t.shell.lessonProgress}
    >
      <m.div
        className="relative h-full rounded-full"
        style={{ background: "linear-gradient(90deg, var(--good), color-mix(in srgb, var(--good) 70%, #b6ff5c))", transformOrigin: "left center", width: "100%" }}
        initial={false}
        animate={{ scaleX: pct > 0 ? Math.max(pct / 100, 0.05) : 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
      >
        {/* üst parlama çizgisi */}
        <span className="absolute inset-x-2 top-[3px] h-[4px] rounded-full bg-white/35" />
        {/* her ilerlemede içinden geçen ışık (S4); bitişe yaklaşınca nabız gibi atan parıltı */}
        {pct > 0 && <span key={pct} aria-hidden className="bar-shine" />}
        {near && <span aria-hidden className="bar-glow" />}
      </m.div>
    </div>
  );
}
