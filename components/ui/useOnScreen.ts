"use client";

import { useEffect, useState } from "react";

/**
 * Eleman ekranda görünüyor mu? (P2) Sonsuz döngülü ortam animasyonları görünmediğinde durdurulur:
 * CPU ve pil boşa harcanmaz. İlk değer `true`: sunucu çıktısı ve ilk boyama animasyonlu başlar.
 * Kullanım: `const [ref, visible, el] = useOnScreen<SVGSVGElement>();` → `ref={ref}` ve
 * `style={{ "--play": visible ? "running" : "paused" }}`.
 */
export function useOnScreen<T extends Element>(rootMargin = "80px"): [(el: T | null) => void, boolean, T | null] {
  const [el, setEl] = useState<T | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [el, rootMargin]);

  return [setEl, visible, el];
}

/** `--play` CSS değişkeni için stil nesnesi. */
export function playStyle(visible: boolean): React.CSSProperties {
  return { ["--play" as string]: visible ? "running" : "paused" };
}
