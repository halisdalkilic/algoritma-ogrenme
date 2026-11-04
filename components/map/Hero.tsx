"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useHref, useT } from "@/lib/i18n/context";

function Ring({ pct }: { pct: number }) {
  const t = useT();
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-36 w-36 flex-none place-items-center" role="img" aria-label={t.map.hero.ringAria(pct)}>
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="13" />
        <motion.circle
          cx="72"
          cy="72"
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute text-center text-white">
        <div className="text-4xl font-black leading-none tabular-nums">{pct}%</div>
        <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/80">{t.map.hero.ringLabel}</div>
      </div>
    </div>
  );
}

// Özellik metinleri sözlükten (t.map.hero.features), simgeler burada; sıra aynı.
const FEATURE_ICONS = ["⚡", "▶️", "🗺️", "🔁"];

export function Hero({
  completed,
  total,
  nextLesson,
}: {
  completed: number;
  total: number;
  nextLesson: { id: string; title: string } | null;
}) {
  const t = useT();
  const href = useHref();
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] p-6 text-white sm:p-8"
      style={{
        background: "linear-gradient(135deg, #7c5cff 0%, #5b3ee0 55%, #3b2aa8 100%)",
        boxShadow: "0 7px 0 #33238f, 0 26px 50px -18px rgba(91,62,224,0.65)",
      }}
    >
      {/* dekoratif akış şeması sembolleri */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]" viewBox="0 0 600 300" preserveAspectRatio="xMaxYMid slice" fill="none" stroke="white" strokeWidth="3">
        <rect x="430" y="20" width="110" height="46" rx="23" />
        <path d="M485 66v36" />
        <rect x="425" y="102" width="120" height="50" rx="8" />
        <path d="M485 152v30" />
        <path d="M485 182l52 34-52 34-52-34z" />
        <path d="M537 216h40v-90" strokeDasharray="6 8" />
        <circle cx="60" cy="260" r="70" />
        <circle cx="60" cy="260" r="44" />
      </svg>

      <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] backdrop-blur-sm">
            {t.map.hero.badge}
          </span>
          <h1 className="mt-3 text-[2rem] font-black leading-[1.1] tracking-tight sm:text-4xl">
            {t.map.hero.titleBefore}<span className="text-amber-300">{t.map.hero.titleAccent}</span>{t.map.hero.titleAfter}
          </h1>
          <p className="mt-2 max-w-md text-[15px] font-semibold leading-snug text-white/85">
            {t.map.hero.text(total)}
          </p>

          <ul className="mt-4 flex flex-wrap gap-2">
            {t.map.hero.features.map((text, i) => (
              <li
                key={text}
                className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 text-xs font-extrabold backdrop-blur-sm"
              >
                <span aria-hidden>{FEATURE_ICONS[i]}</span>
                {text}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            {nextLesson ? (
              <Link href={href({ name: "lesson", id: nextLesson.id })} className="btn btn-light">
                {completed === 0 ? t.map.hero.startNow : t.map.hero.continue}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            ) : (
              <span className="btn btn-light pointer-events-none">{t.map.hero.allDone}</span>
            )}
            {nextLesson && (
              <p className="mt-3 text-xs font-bold text-white/75">
                {t.map.hero.next(nextLesson.id, nextLesson.title)}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:flex-col sm:gap-2">
          <Ring pct={pct} />
          <div className="text-right text-sm font-extrabold sm:text-center">
            <span className="text-2xl font-black tabular-nums">{completed}</span>
            <span className="text-white/70">{t.map.hero.lessonsOf(total)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
