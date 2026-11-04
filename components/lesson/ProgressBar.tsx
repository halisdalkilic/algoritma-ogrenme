"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/context";

/** Kalın, yuvarlak, parlak çizgili ilerleme çubuğu (ders üst çubuğu). */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  const t = useT();
  const pct = total === 0 ? 0 : Math.min(100, Math.round((current / total) * 100));
  return (
    <div
      className="relative h-4 flex-1 overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={t.shell.lessonProgress}
    >
      <motion.div
        className="relative h-full rounded-full"
        style={{ background: "linear-gradient(90deg, var(--good), color-mix(in srgb, var(--good) 70%, #b6ff5c))", minWidth: pct > 0 ? 16 : 0 }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
      >
        {/* üst parlama çizgisi */}
        <span className="absolute inset-x-2 top-[3px] h-[4px] rounded-full bg-white/35" />
      </motion.div>
    </div>
  );
}
