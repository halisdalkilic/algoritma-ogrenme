"use client";

import { m } from "framer-motion";
import { useT } from "@/lib/i18n/context";
import { DAILY_GOAL_XP, currentStreak, localDate, shiftDate, type Progress } from "@/lib/progress";

const WEEKS = 6;

/** Son 6 haftanın aktivite takvimi: çalışılan günler alev rengiyle dolar, hedefi tutan günlerde ✓ olur. */
export function StreakCalendar({ progress }: { progress: Progress }) {
  const t = useT();
  const c = t.calendar;
  const today = localDate();
  const [y, mo, d] = today.split("-").map(Number);
  const weekday = (new Date(y, mo - 1, d).getDay() + 6) % 7; // Pazartesi = 0
  const start = shiftDate(today, -(weekday + 7 * (WEEKS - 1)));
  const goal = DAILY_GOAL_XP[progress.settings.dailyGoal];
  const streak = currentStreak(progress);
  const activeDays = Object.values(progress.activity).filter((v) => v > 0).length;

  return (
    <section className="card p-5" aria-labelledby="takvim-baslik">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="takvim-baslik" className="text-lg font-black">
          {c.title}
        </h2>
        <span className="chip">{c.chip(streak, activeDays)}</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label={c.gridAria(WEEKS)}>
        {c.days.map((name) => (
          <div key={name} role="columnheader" className="text-center text-[11px] font-black uppercase text-muted">
            {name}
          </div>
        ))}
        {Array.from({ length: WEEKS * 7 }, (_, i) => {
          const date = shiftDate(start, i);
          const xp = progress.activity[date] ?? 0;
          const future = date > today;
          const isToday = date === today;
          const level = xp === 0 ? 0 : xp >= goal ? 3 : xp >= goal / 2 ? 2 : 1;
          const bg = ["var(--surface-2)", "color-mix(in srgb, var(--flame) 35%, var(--surface))", "color-mix(in srgb, var(--flame) 65%, var(--surface))", "var(--flame)"][level];
          return (
            <m.div
              key={date}
              role="gridcell"
              aria-label={`${date}: ${future ? c.cellFuture : xp ? `${xp} XP` : c.cellNone}`}
              title={`${date.split("-").reverse().join(".")} · ${xp} XP`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: future ? 0.3 : 1 }}
              transition={{ delay: i * 0.008 }}
              className="grid aspect-square place-items-center rounded-lg text-[11px] font-black"
              style={{
                background: bg,
                color: level === 3 ? "#fff" : "var(--muted)",
                outline: isToday ? "2.5px solid var(--brand)" : undefined,
                outlineOffset: 1,
              }}
            >
              {level === 3 ? "✓" : Number(date.slice(8))}
            </m.div>
          );
        })}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-muted">
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "color-mix(in srgb, var(--flame) 35%, var(--surface))" }} /> {c.legendWorked}</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded" style={{ background: "var(--flame)" }} /> {c.legendGoal}</span>
        <span className="flex items-center gap-1.5"><i className="h-3 w-3 rounded outline outline-2 outline-brand" /> {c.legendToday}</span>
      </p>
    </section>
  );
}
