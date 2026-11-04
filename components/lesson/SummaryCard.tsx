"use client";

import { motion } from "framer-motion";
import { Mascot } from "@/components/mascot/Mascot";
import { ShareButton } from "@/components/ui/ShareButton";
import { useProgressStore } from "@/lib/useProgressStore";
import { currentStreak } from "@/lib/progress";
import { rankProgress } from "@/lib/ranks";
import { useT } from "@/lib/i18n/context";
import { Burst } from "@/components/ui/Burst";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

function Stat({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className="flex-1 overflow-hidden rounded-2xl border-2" style={{ borderColor: color }}>
      <div className="px-2 py-1 text-center text-[11px] font-black uppercase tracking-widest text-white" style={{ background: color }}>
        {label}
      </div>
      <div className="flex items-center justify-center gap-1.5 bg-surface py-3 text-2xl font-black tabular-nums" style={{ color }}>
        <span aria-hidden className="text-xl">
          {icon}
        </span>
        {value}
      </div>
    </div>
  );
}

export function SummaryCard({
  title,
  lessonId,
  accent,
  points,
  xpEarned,
  accuracy,
  onFinish,
}: {
  title: string;
  lessonId: string;
  accent: string;
  points: string[];
  xpEarned: number;
  accuracy: number;
  onFinish: () => void;
}) {
  const t = useT();
  const progress = useProgressStore((s) => s.progress);
  const { rank, next, pct } = rankProgress(progress.xp);
  const streak = currentStreak(progress);
  return (
    <div className="relative flex flex-col items-center gap-6 text-center">
      {/* konfeti */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-16 h-0 w-0">
        <Burst count={30} radius={170} gravity={120} size={10} duration={1.7} />
      </div>

      <div className="relative">
        <Mascot mood="cheer" size={132} />
        <motion.div
          aria-hidden
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.25 }}
          className="absolute -right-4 bottom-2 grid h-14 w-14 place-items-center rounded-full text-3xl"
          style={{
            background: "linear-gradient(135deg, #ffd25e, #f4a10a)",
            boxShadow: "0 5px 0 #b97a05, 0 14px 30px -10px rgba(244,161,10,0.7)",
          }}
        >
          🏆
        </motion.div>
      </div>

      <div>
        <span className="chip">{t.summary.lessonDone}</span>
        <h2 className="mt-2 text-3xl font-black leading-tight">{title}</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex w-full max-w-sm gap-3"
      >
        <Stat icon="⭐" value={`+${xpEarned}`} label={t.summary.xpEarned} color="var(--xp)" />
        <Stat icon="🎯" value={`%${accuracy}`} label={t.summary.accuracy} color="var(--good)" />
      </motion.div>

      <motion.ul
        initial="hidden"
        animate="show"
        variants={listVariants}
        className="card flex w-full max-w-md flex-col gap-3 p-5 text-left"
      >
        <li className="text-xs font-black uppercase tracking-[0.16em] text-muted">{t.summary.summaryCard}</li>
        {points.map((p, i) => (
          <motion.li key={i} variants={itemVariants} className="flex items-start gap-3 text-[15px] font-bold leading-snug">
            <span aria-hidden className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-brand" />
            {p}
          </motion.li>
        ))}
      </motion.ul>

      {/* rütbe ilerlemesi */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card flex w-full max-w-md items-center gap-3 p-4 text-left"
      >
        <span aria-hidden className="text-3xl">{rank.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-black">{t.ranks.titles[rank.id]}</span>
            <span className="text-xs font-bold text-muted">{next ? t.summary.nextRank(next.icon, t.ranks.titles[next.id], pct) : t.summary.topRank}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${rank.colors[0]}, ${rank.colors[1]})` }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      <div className="flex w-full max-w-md flex-col gap-2">
        <button type="button" onClick={onFinish} className="btn btn-good btn-block">
          {t.summary.finish}
        </button>
        <ShareButton
          card={{
            kicker: t.summary.cardKicker(lessonId),
            title,
            icon: "🏆",
            stats: [
              ["⭐", `${progress.xp} XP`],
              ...(streak > 1 ? ([["🔥", t.summary.cardDays(streak)]] as [string, string][]) : []),
              ["🎯", `%${accuracy}`],
            ],
            colors: [accent, "#3b2aa8"],
          }}
          text={t.summary.shareText(title)}
        />
      </div>
    </div>
  );
}
