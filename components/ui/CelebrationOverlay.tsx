"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useProgressStore, type Celebration } from "@/lib/useProgressStore";
import { RANKS } from "@/lib/ranks";
import { Mascot } from "@/components/mascot/Mascot";
import { Burst } from "./Burst";
import { ShareButton } from "./ShareButton";
import type { ShareCardData } from "@/lib/shareCard";
import { useT } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/dict/tr";

function describe(
  c: Celebration,
  xp: number,
  t: Dictionary,
): {
  icon: string;
  kicker: string;
  title: string;
  body: string;
  card: ShareCardData;
  text: string;
} {
  const cel = t.celebration;
  if (c.kind === "streak") {
    return {
      icon: "🔥",
      kicker: cel.streak.kicker,
      title: cel.streak.title(c.days),
      body: c.days >= 30 ? cel.streak.bodyHabit : cel.streak.bodyShort,
      card: {
        kicker: cel.streak.cardKicker,
        title: cel.streak.cardTitle(c.days),
        icon: "🔥",
        stats: [["⭐", `${xp} XP`]],
        colors: ["#ff9a3c", "#e0420f"],
      },
      text: cel.streak.shareText(c.days),
    };
  }
  if (c.kind === "rank") {
    const next = RANKS[c.rank.id + 1];
    const title = t.ranks.titles[c.rank.id];
    return {
      icon: c.rank.icon,
      kicker: cel.rank.kicker,
      title,
      body: next ? cel.rank.next(next.icon, t.ranks.titles[next.id], next.minXp) : cel.rank.max,
      card: {
        kicker: cel.rank.cardKicker,
        title,
        icon: c.rank.icon,
        stats: [["⭐", `${xp} XP`]],
        colors: c.rank.colors,
      },
      text: cel.rank.shareText(title, c.rank.icon),
    };
  }
  return {
    icon: "🎯",
    kicker: cel.goal.kicker,
    title: cel.goal.title,
    body: cel.goal.body(c.xp),
    card: {
      kicker: cel.goal.cardKicker,
      title: cel.goal.cardTitle,
      icon: "🎯",
      stats: [["⭐", `${xp} XP`]],
      colors: ["#34d399", "#047857"],
    },
    text: cel.goal.shareText,
  };
}

/** Seri, rütbe ve günlük hedef kutlamaları. Kuyruktaki ilk kutlamayı gösterir; ders sürerken bekler. */
export function CelebrationOverlay() {
  const t = useT();
  const current = useProgressStore((s) =>
    s.holdCelebrations ? undefined : s.celebrations[0],
  );
  const xp = useProgressStore((s) => s.progress.xp);
  const dismiss = useProgressStore((s) => s.dismissCelebration);
  const play = useProgressStore((s) => s.play);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!current) return;
    play("celebrate");
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, dismiss, play]);

  const d = current ? describe(current, xp, t) : null;

  return (
    // data-own-position: globals.css'teki `body > *` kuralı `fixed`'i ezmesin
    <div data-own-position>
      <AnimatePresence>
        {current && d && (
          <m.div
            key={JSON.stringify(current)}
            className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && dismiss()}
          >
            <m.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="celebration-title"
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              className="card relative flex w-full max-w-sm flex-col items-center gap-3 overflow-hidden px-6 pb-6 pt-8 text-center"
            >
              <div aria-hidden className="pointer-events-none absolute left-1/2 top-28">
                <Burst count={34} radius={150} gravity={110} size={9} duration={1.6} />
              </div>
              <div className="relative">
                <m.div
                  aria-hidden
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: [0, 1.25, 1], rotate: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="text-7xl"
                >
                  {d.icon}
                </m.div>
                <Mascot
                  mood="cheer"
                  size={70}
                  className="absolute -bottom-3 -right-14"
                />
              </div>
              <span className="chip mt-2">{d.kicker}</span>
              <h2
                id="celebration-title"
                className="text-3xl font-black leading-tight"
              >
                {d.title}
              </h2>
              <p className="font-semibold text-muted">{d.body}</p>
              <div className="mt-2 flex w-full flex-col gap-2">
                <button
                  ref={closeRef}
                  type="button"
                  onClick={dismiss}
                  className="btn btn-good btn-block"
                >
                  {t.celebration.continue}
                </button>
                <ShareButton card={d.card} text={d.text} />
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
