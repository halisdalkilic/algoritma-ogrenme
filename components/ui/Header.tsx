"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { m, useMotionValueEvent, useScroll, type Variants } from "framer-motion";
import { useProgressStore } from "@/lib/useProgressStore";
import { getDueEntries } from "@/lib/srs";
import { StatBadge } from "./StatBadge";
import { LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitch } from "./LanguageSwitch";
import { DailyGoalRing } from "./DailyGoalRing";
import { currentStreak } from "@/lib/progress";
import { useHref, useT } from "@/lib/i18n/context";

const iconButton =
  "hit44 relative grid h-9 w-9 place-items-center rounded-full text-muted transition-colors duration-300 hover:bg-brand-soft hover:text-brand";

/** Sağdaki öğeler sırayla, hafif yaylanarak içeri girer. */
const EASE = [0.22, 1, 0.36, 1] as const; // yumuşak "ease-out-expo" benzeri
const SOFT = { type: "spring", stiffness: 260, damping: 32, mass: 0.8 } as const;
const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

function IconLink({
  href,
  label,
  children,
  badge,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <m.div variants={item} whileHover={{ y: -1.5, transition: SOFT }} whileTap={{ scale: 0.95, transition: SOFT }}>
      <Link href={href} className={iconButton} title={label} aria-label={label}>
        {children}
        {badge ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[10px] font-black text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
      </Link>
    </m.div>
  );
}

export function Header() {
  const t = useT();
  const href = useHref();
  const progress = useProgressStore((s) => s.progress);
  const hydrated = useProgressStore((s) => s.hydrated);
  const hydrate = useProgressStore((s) => s.hydrate);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  const dueCount = hydrated ? getDueEntries(progress.reviewQueue).length : 0;

  return (
    <>
      {/* Dış kabuk 64px kalır (LessonPlayer yüksekliği buna göre hesaplıyor); içindeki hap yüzer. */}
      <m.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: EASE }}
        className="sticky top-0 z-20 h-16 px-3 pt-2"
      >
        <m.div
          animate={{
            scale: scrolled ? 0.99 : 1,
            boxShadow: scrolled
              ? "0 1px 2px rgba(24,27,56,0.06), 0 16px 40px -16px rgba(24,27,56,0.35)"
              : "0 1px 2px rgba(24,27,56,0.03), 0 8px 24px -14px rgba(24,27,56,0.16)",
          }}
          transition={{ duration: 0.6, ease: EASE }}
          className={`relative mx-auto flex h-12 max-w-3xl items-center justify-between gap-3 rounded-full border border-line pl-2 pr-1.5 backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-500 ${scrolled ? "bg-surface/85" : "bg-surface/55"}`}
        >
          {/* Soldan sağa solan marka rengi + açılışta bir kez geçen ışık */}
          <span aria-hidden className="header-wash pointer-events-none absolute inset-0 overflow-hidden rounded-full">
            <span className="header-sweep" />
          </span>

          <m.div whileHover="hover" initial="rest" animate="rest" className="relative">
            <Link href={href({ name: "home" })} className="hit44 flex items-center gap-2.5" aria-label={t.shell.header.homeAria}>
              <m.span
                variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -6, scale: 1.06 } }}
                transition={SOFT}
                className="block"
              >
                <LogoMark size={36} animated />
              </m.span>
              <span className="hidden whitespace-nowrap text-[1.05rem] leading-none tracking-tight sm:block">
                <span className="font-black">{t.shell.header.brandMain}</span>
                <span className="ml-1 font-extrabold text-brand">{t.shell.header.brandAccent}</span>
              </span>
            </Link>
          </m.div>

          {hydrated && (
            <m.div variants={group} initial="hidden" animate="show" className="relative flex items-center gap-0.5 rounded-full bg-surface-2 p-0.5">
              <m.div variants={item}>
                <StatBadge icon="🔥" value={currentStreak(progress)} label={t.shell.header.streak} tone="flame" />
              </m.div>
              {/* 360px altında yer kalmaz; günlük hedef Profil ayarlarında da var */}
              <m.div variants={item} className="max-[359px]:hidden">
                <DailyGoalRing />
              </m.div>
              <m.div variants={item}>
                <StatBadge icon="⭐" value={progress.xp} label={t.shell.header.totalXp} tone="xp" xpTarget />
              </m.div>
              <m.span variants={item} aria-hidden className="mx-1 h-[18px] w-px bg-line" />
              <IconLink href={href({ name: "review" })} label={t.shell.header.review} badge={dueCount}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M17 2l4 4-4 4" />
                  <path d="M3 11V9a3 3 0 0 1 3-3h15" />
                  <path d="M7 22l-4-4 4-4" />
                  <path d="M21 13v2a3 3 0 0 1-3 3H3" />
                </svg>
              </IconLink>
              <IconLink href={href({ name: "profile" })} label={t.shell.header.profile}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </IconLink>
              <m.div variants={item} whileHover={{ y: -1.5, transition: SOFT }} whileTap={{ scale: 0.95, transition: SOFT }}>
                <LanguageSwitch />
              </m.div>
              <m.div variants={item} whileHover={{ y: -1.5, transition: SOFT }} whileTap={{ scale: 0.95, transition: SOFT }}>
                <ThemeToggle />
              </m.div>
            </m.div>
          )}
        </m.div>
      </m.header>
    </>
  );
}
