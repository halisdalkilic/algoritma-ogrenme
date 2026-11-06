"use client";

import { useEffect, useState } from "react";

const EVENTS = ["pointerdown", "keydown", "input", "touchstart", "wheel"] as const;

/**
 * Kullanıcı `ms` boyunca hiçbir şey yapmadıysa true (S11). `resetKey` değişince (yeni alıştırma, yeni deneme)
 * sayaç yeniden başlar ve önceki "boşta" durumu geçersiz olur. Sekme gizliyken boşta sayılmaz.
 */
export function useIdle(ms: number, resetKey: string): boolean {
  const [idleFor, setIdleFor] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!document.hidden) setIdleFor(resetKey);
        else arm();
      }, ms);
    };
    const onActivity = () => {
      setIdleFor(null);
      arm();
    };
    arm();
    for (const e of EVENTS) window.addEventListener(e, onActivity, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const e of EVENTS) window.removeEventListener(e, onActivity);
    };
  }, [ms, resetKey]);

  return idleFor === resetKey;
}
