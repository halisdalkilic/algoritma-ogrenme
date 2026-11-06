"use client";

import { useEffect } from "react";
import Link from "next/link";
import { m } from "framer-motion";
import { useProgressStore } from "@/lib/useProgressStore";
import { DAILY_GOAL_XP, currentStreak, type DailyGoal } from "@/lib/progress";
import { nextOutfit } from "@/lib/mascotOutfit";
import { RANKS, rankProgress } from "@/lib/ranks";
import { BADGES } from "@/lib/badges";
import { lessons } from "@/content";
import { Mascot } from "@/components/mascot/Mascot";
import { ShareButton } from "@/components/ui/ShareButton";
import { StreakCalendar } from "@/components/profile/StreakCalendar";
import { AccountPanel } from "@/components/profile/AccountPanel";
import { useHref, useT } from "@/lib/i18n/context";

function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <div className="card flex flex-col items-center gap-1 px-2 py-5 text-center">
      <div
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-2xl text-2xl"
        style={{ background: `color-mix(in srgb, ${color} 16%, transparent)` }}
      >
        {icon}
      </div>
      <div className="mt-1 text-2xl font-black tabular-nums" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] font-black uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-4">
      <div>
        <div className="font-black">{label}</div>
        <div className="text-sm font-semibold text-muted">{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onChange}
        className="relative h-8 w-14 flex-none rounded-full transition-colors"
        style={{ background: on ? "var(--good)" : "var(--disabled)" }}
      >
        <span className="absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: on ? 28 : 4 }} />
      </button>
    </div>
  );
}

export function ProfilePage() {
  const t = useT();
  const href = useHref();
  const progress = useProgressStore((s) => s.progress);
  const hydrated = useProgressStore((s) => s.hydrated);
  const hydrate = useProgressStore((s) => s.hydrate);
  const updateSettings = useProgressStore((s) => s.updateSettings);
  const play = useProgressStore((s) => s.play);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <p className="p-10 text-center text-sm font-bold text-muted">{t.common.loading}</p>;
  }

  const completedCount = Object.keys(progress.completedLessons).length;
  const streak = currentStreak(progress);
  const upcomingOutfit = nextOutfit(streak);
  const { rank, next, into, need, pct } = rankProgress(progress.xp);
  const rankTitle = t.ranks.titles[rank.id];
  const s = progress.settings;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-20 pt-6 sm:pt-8">
      {/* rütbe kartı */}
      <section
        className="relative overflow-hidden rounded-[2rem] p-6 text-white"
        style={{
          background: `linear-gradient(135deg, ${rank.colors[0]} 0%, ${rank.colors[1]} 100%)`,
          boxShadow: `0 7px 0 color-mix(in srgb, ${rank.colors[1]} 70%, black), 0 26px 50px -18px ${rank.colors[1]}`,
        }}
      >
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-10 text-[9rem] opacity-15">
          {rank.icon}
        </div>
        <div className="relative flex items-center gap-4">
          <Mascot mood={progress.xp > 0 ? "happy" : "wave"} size={88} className="flex-none drop-shadow-lg" />
          <div className="min-w-0 flex-1">
            <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.16em]">
              {t.profile.rankLabel(rank.id + 1, RANKS.length)}
            </span>
            <h1 className="mt-1.5 text-2xl font-black leading-tight">
              {rank.icon} {rankTitle}
            </h1>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/25">
              <m.div
                className="h-full rounded-full bg-white"
                style={{ transformOrigin: "left center" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            <p className="mt-1.5 text-xs font-bold text-white/85">
              {next ? t.profile.rankProgress(into, need, next.icon, t.ranks.titles[next.id]) : t.profile.rankMax}
            </p>
            {upcomingOutfit && (
              <p className="mt-1 text-xs font-bold text-white/85">
                👕 {t.profile.nextOutfit(upcomingOutfit.days, t.outfits[upcomingOutfit.outfit])}
              </p>
            )}
          </div>
        </div>
        <div className="relative mt-4">
          <ShareButton
            className="btn btn-light btn-block"
            label={t.profile.shareProgress}
            card={{
              kicker: t.profile.cardKicker,
              title: t.profile.cardTitle(rankTitle, completedCount, lessons.length),
              icon: rank.icon,
              stats: [["⭐", `${progress.xp} XP`], ["🔥", t.summary.cardDays(streak)], ["🏅", t.profile.cardBadges(progress.badges.length)]],
              colors: rank.colors,
            }}
            text={t.profile.shareText(rankTitle, completedCount, progress.xp, rank.icon)}
          />
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="⭐" value={progress.xp} label={t.profile.statTotalXp} color="var(--xp)" />
        <StatCard icon="🔥" value={streak} label={t.profile.statStreak} color="var(--flame)" />
        <StatCard icon="✅" value={`${completedCount}/${lessons.length}`} label={t.profile.statLessons} color="var(--good)" />
      </div>

      <StreakCalendar progress={progress} />

      {/* rütbe yolu */}
      <section className="card p-5" aria-labelledby="rutbe-baslik">
        <h2 id="rutbe-baslik" className="mb-4 text-lg font-black">
          {t.profile.rankPath}
        </h2>
        <ol className="flex gap-2 overflow-x-auto pb-1">
          {RANKS.map((r) => {
            const reached = progress.xp >= r.minXp;
            return (
              <li
                key={r.id}
                className="flex min-w-[78px] flex-col items-center gap-1 rounded-2xl border-2 px-2 py-2.5 text-center"
                style={{
                  borderColor: r.id === rank.id ? r.colors[1] : "var(--line)",
                  background: reached ? `color-mix(in srgb, ${r.colors[0]} 16%, var(--surface))` : "var(--surface-2)",
                }}
              >
                <span aria-hidden className={`text-2xl ${reached ? "" : "opacity-30 grayscale"}`}>{r.icon}</span>
                <span className={`text-[12px] font-black leading-tight ${reached ? "text-ink" : "text-muted"}`}>{t.ranks.titles[r.id]}</span>
                <span className="text-[10.5px] font-bold text-muted">{r.minXp} XP</span>
                <span className="sr-only">{reached ? t.profile.reached : t.profile.notReached}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* rozetler */}
      <section className="card p-5" aria-labelledby="rozet-baslik">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="rozet-baslik" className="text-lg font-black">
            {t.profile.badges}
          </h2>
          <span className="chip">
            {progress.badges.length}/{BADGES.length}
          </span>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGES.map((badge) => {
            const earned = progress.badges.includes(badge.id);
            return (
              <li
                key={badge.id}
                title={t.badges[badge.id as keyof typeof t.badges].description}
                className="flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center"
                style={{
                  borderColor: earned ? "var(--xp)" : "var(--line)",
                  background: earned ? "color-mix(in srgb, var(--xp) 10%, var(--surface))" : "var(--surface-2)",
                }}
              >
                <span
                  aria-hidden
                  className={`grid h-14 w-14 place-items-center rounded-full text-3xl ${earned ? "" : "opacity-30 grayscale"}`}
                  style={{ background: earned ? "color-mix(in srgb, var(--xp) 22%, transparent)" : "var(--line)" }}
                >
                  {badge.icon}
                </span>
                <span className={`text-xs font-black leading-tight ${earned ? "text-ink" : "text-muted"}`}>{t.badges[badge.id as keyof typeof t.badges].title}</span>
                <span className="text-[11px] font-semibold leading-tight text-muted">{t.badges[badge.id as keyof typeof t.badges].description}</span>
                <span className="sr-only">{earned ? t.profile.earned : t.profile.locked}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ayarlar */}
      <section className="card divide-y-2 divide-line p-2" aria-labelledby="ayar-baslik">
        <h2 id="ayar-baslik" className="px-3 pb-2 pt-3 text-lg font-black">
          {t.profile.settings}
        </h2>

        <div id="goal" className="flex scroll-mt-24 flex-col gap-3 px-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-black">{t.profile.dailyGoal}</div>
            <div className="text-sm font-semibold text-muted">{t.profile.dailyGoalHint}</div>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label={t.profile.dailyGoal}>
            {([1, 2, 3] as DailyGoal[]).map((goal) => {
              const on = s.dailyGoal === goal;
              return (
                <button
                  key={goal}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => updateSettings({ dailyGoal: goal })}
                  className="flex min-w-[72px] flex-col items-center rounded-xl border-2 border-b-4 px-2 py-1.5 transition-colors"
                  style={{
                    background: on ? "var(--brand)" : "var(--surface)",
                    borderColor: on ? "var(--brand-dark)" : "var(--line)",
                    color: on ? "#fff" : "var(--ink)",
                  }}
                >
                  <span className="text-sm font-black">{t.goalLabels[goal]}</span>
                  <span className="text-[11px] font-bold opacity-80">{DAILY_GOAL_XP[goal]} XP</span>
                </button>
              );
            })}
          </div>
        </div>

        <Toggle
          label={t.profile.sound}
          hint={t.profile.soundHint}
          on={s.sound}
          onChange={() => {
            updateSettings({ sound: !s.sound });
            if (!s.sound) play("correct");
          }}
        />
        <Toggle label={t.profile.haptics} hint={t.profile.hapticsHint} on={s.haptics} onChange={() => updateSettings({ haptics: !s.haptics })} />
      </section>

      <AccountPanel />

      <p className="text-center text-sm font-semibold text-muted">
        {t.profile.dataNote} <Link href={href({ name: "privacy" })} className="font-black text-brand underline-offset-4 hover:underline">{t.shell.footer.privacy}</Link>
      </p>
    </div>
  );
}
