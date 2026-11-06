"use client";

import { useEffect, useId } from "react";
import { m } from "framer-motion";
import { useT } from "@/lib/i18n/context";
import { playStyle, useOnScreen } from "@/components/ui/useOnScreen";
import type { Outfit } from "@/lib/mascotOutfit";

export type Mood = "idle" | "wave" | "happy" | "think" | "sad" | "cheer";

/**
 * "Algo" — uygulamanın maskotu. Ekran-yüzlü küçük bir robot; ifadesi duruma göre değişir.
 * Renkler temadan bağımsız sabit tutulur: karakter her temada aynı görünsün.
 *
 * Hareketler CSS keyframes ile yapılır (globals.css, ".algo"): JS animasyon motoru gerekmez ve maskot
 * ekranda görünmüyorken duraklar (useOnScreen). Hareket azaltma tercihi CSS'te genel olarak uygulanır.
 * `look`: imleç yakındayken gözler imleci takip eder (yalnızca ince imleçli cihazlarda). `outfit`: seri kıyafeti.
 */
const C = {
  head: ["#8b6dff", "#5b3ee0"],
  body: "#4b32c4",
  screen: "#141733",
  glow: "#6ef0c2",
  cheek: "#ff8fb1",
  bulb: "#ffc93c",
  scarf: "#ff7a1a",
  cap: "#f4a10a",
  crown: "#fbbf24",
};

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy" || mood === "cheer") {
    return (
      <g stroke={C.glow} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M42 56 q6 -8 12 0" />
        <path d="M66 56 q6 -8 12 0" />
      </g>
    );
  }
  if (mood === "sad") {
    return (
      <g fill={C.glow}>
        <path d="M42 52 l12 3 v4 a6 6 0 0 1 -12 0 z" />
        <path d="M78 52 l-12 3 v4 a6 6 0 0 0 12 0 z" />
      </g>
    );
  }
  const dx = mood === "think" ? 3 : 0;
  const dy = mood === "think" ? -3 : 0;
  return (
    <g className="a-eyes">
      <g className="a-look" fill={C.glow}>
        <ellipse cx={48 + dx} cy={55 + dy} rx="5.5" ry="6.5" />
        <ellipse cx={72 + dx} cy={55 + dy} rx="5.5" ry="6.5" />
        <circle cx={50 + dx} cy={52 + dy} r="1.8" fill="#fff" />
        <circle cx={74 + dx} cy={52 + dy} r="1.8" fill="#fff" />
      </g>
    </g>
  );
}

const MOUTHS: Record<Mood, React.ReactNode> = {
  idle: <path d="M53 66 q7 6 14 0" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" fill="none" />,
  wave: <path d="M52 65 q8 7 16 0" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" fill="none" />,
  happy: <path d="M50 63 q10 11 20 0 z" fill={C.glow} />,
  cheer: <path d="M49 62 q11 15 22 0 z" fill={C.glow} />,
  think: <path d="M55 68 h10" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" />,
  sad: <path d="M52 70 q8 -7 16 0" stroke={C.glow} strokeWidth="3.5" strokeLinecap="round" fill="none" />,
};

/** İmleci gözle takip: `--lx/--ly` (kullanıcı birimi) CSS'te `.a-look` öteler. rAF ile seyreltilir. */
function useLook(enabled: boolean, el: Element | null, visible: boolean) {
  useEffect(() => {
    if (!enabled || !el || !visible) return;
    if (!window.matchMedia("(pointer: fine)").matches) return; // dokunmatikte imleç yok
    const target = el as unknown as HTMLElement;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.45);
        const dist = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, dist / 220);
        target.style.setProperty("--lx", ((dx / dist) * 3 * k).toFixed(2));
        target.style.setProperty("--ly", ((dy / dist) * 2.5 * k).toFixed(2));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled, el, visible]);
}

function OutfitBack({ outfit }: { outfit: Outfit }) {
  if (outfit === "crown") {
    return <path d="M32 28 l6 -16 l11 11 l11 -17 l11 17 l11 -11 l6 16 z" fill={C.crown} stroke="#d98a00" strokeWidth="1.5" strokeLinejoin="round" />;
  }
  return null;
}

function OutfitFront({ outfit }: { outfit: Outfit }) {
  if (outfit === "scarf") {
    return (
      <g>
        <path d="M36 87 q24 10 48 0 v7 q-24 10 -48 0 z" fill={C.scarf} />
        <path d="M72 93 l7 15 l-7 -3 z" fill={C.scarf} />
      </g>
    );
  }
  if (outfit === "cap") {
    return (
      <g>
        <path d="M28 30 q32 -26 64 0 z" fill={C.cap} />
        <rect x="24" y="28" width="72" height="6" rx="3" fill="#d98a00" />
      </g>
    );
  }
  return null;
}

export function Mascot({
  mood = "idle",
  size = 96,
  className,
  outfit = "none",
  look = false,
}: {
  mood?: Mood;
  size?: number;
  className?: string;
  outfit?: Outfit;
  look?: boolean;
}) {
  const t = useT();
  const uid = useId().replace(/:/g, "");
  const [ref, visible, el] = useOnScreen<SVGSVGElement>();
  useLook(look, el, visible);
  const armUp = mood === "cheer";

  return (
    <svg
      ref={ref}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`algo ambient${className ? ` ${className}` : ""}`}
      data-mood={mood}
      style={playStyle(visible)}
      role="img"
      aria-label={t.common.mascotAria}
    >
      <defs>
        <linearGradient id={`algo-head-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.head[0]} />
          <stop offset="1" stopColor={C.head[1]} />
        </linearGradient>
        <radialGradient id={`algo-bulb-${uid}`}>
          <stop offset="0" stopColor="#fff6d1" />
          <stop offset="1" stopColor={C.bulb} />
        </radialGradient>
      </defs>

      {/* gölge */}
      <ellipse cx="60" cy="114" rx="26" ry="4" fill="#000" opacity="0.15" />

      {/* kollar */}
      <path
        d={armUp ? "M38 96 q-12 -6 -14 -20" : "M38 96 q-12 4 -12 14"}
        stroke={C.body}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="a-arm"
        d={armUp || mood === "wave" ? "M82 96 q12 -6 14 -20" : "M82 96 q12 4 12 14"}
        stroke={C.body}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* gövde */}
      <rect x="38" y="86" width="44" height="24" rx="11" fill={C.body} />
      <circle cx="60" cy="98" r="4" fill={C.bulb} opacity="0.9" />
      <OutfitFront outfit={outfit === "scarf" ? "scarf" : "none"} />

      {/* anten (taç varken gizlenir) */}
      {outfit !== "crown" && (
        <g className="a-antenna">
          <line x1="60" y1="26" x2="60" y2="12" stroke={C.body} strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="9" r="6" fill={`url(#algo-bulb-${uid})`} />
        </g>
      )}
      <OutfitBack outfit={outfit} />

      {/* kafa + ekran */}
      <rect x="18" y="24" width="84" height="66" rx="26" fill={`url(#algo-head-${uid})`} />
      <rect x="18" y="24" width="84" height="66" rx="26" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
      <rect x="29" y="35" width="62" height="44" rx="16" fill={C.screen} />
      <Eyes mood={mood} />
      {MOUTHS[mood]}
      {(mood === "happy" || mood === "cheer" || mood === "wave") && (
        <g fill={C.cheek} opacity="0.75">
          <ellipse cx="37" cy="68" rx="4" ry="2.6" />
          <ellipse cx="83" cy="68" rx="4" ry="2.6" />
        </g>
      )}
      <OutfitFront outfit={outfit === "cap" ? "cap" : "none"} />

      {/* düşünce noktaları */}
      {mood === "think" &&
        [0, 1, 2].map((i) => (
          <circle key={i} className="a-dot" cx={100 + i * 6} cy={22 - i * 6} r={2 + i} fill={C.head[0]} style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
    </svg>
  );
}

/** Maskot + konuşma balonu. */
export function MascotSays({
  mood,
  children,
  size = 72,
  outfit,
  look,
}: {
  mood: Mood;
  children: React.ReactNode;
  size?: number;
  outfit?: Outfit;
  look?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <Mascot mood={mood} size={size} className="flex-none" outfit={outfit} look={look} />
      <m.div
        initial={{ opacity: 0, scale: 0.9, x: -6 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.15 }}
        className="relative mb-5 rounded-2xl border-2 border-line bg-surface px-4 py-2.5 text-[15px] font-extrabold leading-snug shadow-[var(--shadow-card)]"
      >
        <span
          aria-hidden
          className="absolute -left-[9px] bottom-3 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-surface"
        />
        {children}
      </m.div>
    </div>
  );
}
