"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { DAILY_GOAL_XP, xpOnDate } from "@/lib/progress";
import { useProgressStore } from "@/lib/useProgressStore";
import { useHref, useT } from "@/lib/i18n/context";
import { Burst } from "./Burst";

/** Başlıktaki günlük hedef halkası: bugün kazanılan XP / hedef. Tıklayınca profildeki hedef ayarı açılır. */
export function DailyGoalRing() {
  const t = useT();
  const href = useHref();
  const progress = useProgressStore((s) => s.progress);
  const goalPulse = useProgressStore((s) => s.goalPulse);
  const goal = DAILY_GOAL_XP[progress.settings.dailyGoal];
  const today = xpOnDate(progress);
  const pct = Math.min(1, today / goal);
  const done = pct >= 1;
  const r = 13;
  const c = 2 * Math.PI * r;

  return (
    <Link
      href={href({ name: "profile", hash: "goal" })}
      className="hit44 relative grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-brand-soft"
      title={t.shell.goal.title(today, goal)}
      aria-label={t.shell.goal.aria(today, goal)}
    >
      <svg width="34" height="34" viewBox="0 0 34 34" className="absolute -rotate-90" aria-hidden>
        <circle cx="17" cy="17" r={r} fill="none" stroke="var(--line)" strokeWidth="3.5" />
        <m.circle
          cx="17"
          cy="17"
          r={r}
          fill="none"
          stroke={done ? "var(--good)" : "var(--brand)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      {/* hedef tamamlanınca halkanın etrafında kısa konfeti (S6); goalPulse her tamamlanışta artar */}
      {goalPulse > 0 && (
        <span key={goalPulse} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
          <Burst count={18} radius={46} size={6} duration={0.9} />
        </span>
      )}
      <m.span
        aria-hidden
        key={done ? "done" : "todo"}
        initial={{ scale: done ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        className="text-[13px] leading-none"
      >
        {done ? "✅" : "🎯"}
      </m.span>
    </Link>
  );
}
