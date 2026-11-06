"use client";

import { Fragment } from "react";
import { m } from "framer-motion";
import { Arrow, Frame, Pop, TONE, useTicker, type Tone } from "./kit";
import { useT } from "@/lib/i18n/context";

type Base = { accent: string; label: string };

/** Girdi → İşlem → Çıktı (ya da fonksiyon makinesi, OKU/YAZ kapıları). */
export function IpoFlow({ accent, label, items, icons }: Base & { items: string[]; icons?: string[] }) {
  const tick = useTicker(items.length + 1, 1000);
  return (
    <Frame label={label} accent={accent}>
      {/* Kutular esnek: dar ekranda daralır, uzun etiketler satır kırar (taşmaz) */}
      <div className="flex w-full max-w-md items-center justify-center gap-1 sm:gap-2">
        {items.map((text, i) => {
          const on = tick >= i + 1 || tick === items.length;
          return (
            <Fragment key={i}>
              {i > 0 && <Arrow active={on} />}
              <m.div
                animate={{ scale: tick === i + 1 ? 1.08 : 1, opacity: on ? 1 : 0.45 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex min-w-0 max-w-[120px] flex-1 flex-col items-center gap-1 rounded-2xl border-2 px-1.5 py-2.5 text-center"
                style={{ borderColor: on ? "var(--acc)" : "var(--line)", background: "var(--surface)" }}
              >
                {icons?.[i] && <span className="text-2xl leading-none">{icons[i]}</span>}
                <span className="text-[11.5px] font-black leading-tight [overflow-wrap:anywhere] sm:text-[13px]">{text}</span>
              </m.div>
            </Fragment>
          );
        })}
      </div>
    </Frame>
  );
}

/**
 * Numaralı adımlar sırayla yanar. `wrongOrder` verilirse doğru sıra ile yanlış sıra
 * dönüşümlü gösterilir (ör. "çorap → ayakkabı" ✓ / "ayakkabı → çorap" ✗).
 */
export function StepList({ accent, label, steps, wrongOrder }: Base & { steps: string[]; wrongOrder?: string[] }) {
  const t = useT();
  const n = steps.length;
  const tick = useTicker(wrongOrder ? 2 : n + 1, wrongOrder ? 2200 : 900);
  const showWrong = wrongOrder && tick === 1;
  const list = showWrong ? wrongOrder : steps;
  return (
    <Frame label={label} accent={accent} caption={wrongOrder ? (showWrong ? t.visuals.basic.wrongOrder : t.visuals.basic.rightOrder) : undefined}>
      <ol className="flex w-full max-w-xs flex-col gap-1.5">
        {list.map((s, i) => {
          const on = wrongOrder ? true : i < tick;
          const tone: Tone = wrongOrder ? (showWrong ? "bad" : "good") : on ? "accent" : "neutral";
          return (
            <m.li
              key={s}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="flex items-center gap-2.5 rounded-xl border-2 px-3 py-1.5 text-[13.5px] font-extrabold"
              style={{ background: TONE[tone].bg, borderColor: TONE[tone].border, color: TONE[tone].ink }}
            >
              <span
                className="grid h-6 w-6 flex-none place-items-center rounded-full text-[11px] font-black text-white transition-colors"
                style={{ background: on ? (wrongOrder ? TONE[tone].border : "var(--acc)") : "var(--disabled)" }}
              >
                {on && !wrongOrder && i < tick - 1 ? "✓" : i + 1}
              </span>
              {s}
            </m.li>
          );
        })}
      </ol>
    </Frame>
  );
}

/** Kartlar sırayla belirir (tipler, operatörler, özellikler, kurallar). */
export function TokenGrid({
  accent,
  label,
  items,
}: Base & { items: { label: string; sub?: string; tone?: Tone }[] }) {
  return (
    <Frame label={label} accent={accent}>
      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {items.map((it, i) => {
          const tone = TONE[it.tone ?? "accent"];
          return (
            <m.div
              key={i}
              initial={{ opacity: 0, scale: 0.6, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 340, damping: 22, delay: i * 0.08 }}
              className="flex min-w-[88px] flex-col items-center rounded-xl border-2 px-3 py-2 text-center"
              style={{ background: tone.bg, borderColor: tone.border, color: tone.ink }}
            >
              <span className="font-mono text-[15px] font-black leading-tight">{it.label}</span>
              {it.sub && <span className="mt-0.5 text-[11.5px] font-bold leading-tight opacity-80">{it.sub}</span>}
            </m.div>
          );
        })}
      </div>
    </Frame>
  );
}

/**
 * Etiketli değişken kutuları. Her kutunun `values` dizisi kareler boyunca değişir;
 * `captions` aynı karelerde altta hangi satırın çalıştığını gösterir.
 */
export function VarBoxes({
  accent,
  label,
  boxes,
  captions,
  ms,
}: Base & {
  boxes: { name: string; values: (string | number)[]; tag?: string; tone?: Tone }[];
  captions?: string[];
  ms?: number;
}) {
  const frames = Math.max(captions?.length ?? 0, ...boxes.map((b) => b.values.length));
  const tick = useTicker(frames, ms ?? 1500);
  return (
    <Frame label={label} accent={accent} caption={captions ? captions[Math.min(tick, captions.length - 1)] : undefined}>
      <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-5">
        {boxes.map((b, bi) => {
          const v = b.values[Math.min(tick, b.values.length - 1)];
          const tone = TONE[b.tone ?? "accent"];
          return (
            <div key={bi} className="flex flex-col items-center gap-1.5">
              {b.tag && <span className="text-[10.5px] font-black uppercase tracking-wider text-muted">{b.tag}</span>}
              {/* kutu: üstü açık, içinde değer */}
              <div
                className="relative grid h-[62px] w-[74px] place-items-center rounded-b-2xl rounded-t-md border-2 border-t-[6px]"
                style={{ background: tone.bg, borderColor: tone.border }}
              >
                <Pop value={v === "" ? "·" : v} className="font-mono text-2xl font-black text-ink" />
              </div>
              <span
                className="rounded-md px-2 py-0.5 font-mono text-[13px] font-black text-white"
                style={{ background: tone.border }}
              >
                {b.name}
              </span>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
