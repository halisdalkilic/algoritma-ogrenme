"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sayıyı eski değerden yenisine akıtır (S17). rAF ile çalışır, yalnızca bir sayı metni günceller.
 * - Hareketi azalt açıksa ya da fark büyükse (sayfa yüklenirken kayıtlı XP gelmesi gibi) anında atlar.
 * - `delay`: başlamadan önce beklenecek ms (örn. XP uçuşu hedefe varana kadar).
 * - `initial`: ilk gösterilen değer (özet ekranında 0'dan sayması için).
 * `done` sayım bitince true olur; çağıran bunu "pop" tetiklemek için kullanabilir.
 */
export function useCountUp(
  value: number,
  opts: { ms?: number; delay?: () => number; initial?: number; maxJump?: number } = {},
): { shown: number; done: boolean } {
  const { ms = 600, delay, initial, maxJump = 400 } = opts;
  const [shown, setShown] = useState(initial ?? value);
  const from = useRef(initial ?? value);
  const delayRef = useRef(delay);
  useEffect(() => {
    delayRef.current = delay;
  });

  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    from.current = value;
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const instant = reduced || Math.abs(value - start) > maxJump;
    let raf = 0;
    const wait = instant ? 0 : (delayRef.current?.() ?? 0);
    const timer = setTimeout(() => {
      if (instant) {
        setShown(value);
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / ms);
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(start + (value - start) * eased));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, wait);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [value, ms, maxJump]);

  return { shown, done: shown === value };
}
