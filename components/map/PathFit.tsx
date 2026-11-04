"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};

/**
 * Ders yolunun düğümleri ve SVG eğrisi 360px'lik sabit bir yerleşime göre piksel hassasiyetinde
 * çizilir. Ekran 360px'ten darsa (320px'lik küçük telefonlar) yatay kaydırma çıkmasın diye bütün yol
 * orantılı küçültülür; geniş ekranda ölçek 1'dir ve hiçbir şey değişmez.
 */
export function PathFit({ width, height, children }: { width: number; height: number; children: React.ReactNode }) {
  const scale = useSyncExternalStore(
    subscribe,
    () => Math.min(1, Math.round((document.documentElement.clientWidth / width) * 1000) / 1000),
    () => 1,
  );
  return (
    <div className="relative mt-2" style={{ width: width * scale, height: height * scale }}>
      <div
        className="relative"
        style={{ width, height, transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
