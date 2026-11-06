"use client";

import { useEffect } from "react";
import { LazyMotion, MotionConfig } from "framer-motion";

/**
 * Animasyonlar için tek merkez:
 *  - LazyMotion (P1): animasyon motoru ilk JS paketinde değil, sayfa etkileşime girerken ayrı parça olarak
 *    yüklenir. Bu yüzden tüm bileşenler `motion.*` yerine hafif `m.*` kullanır; `strict` bunu zorunlu kılar.
 *  - MotionConfig (P4): işletim sisteminde "hareketi azalt" açıksa tüm transform animasyonları kapanır.
 *  - Sekme gizliyken (P3) `<html data-hidden>` işaretlenir; globals.css tüm CSS animasyonlarını duraklatır.
 */
const loadFeatures = () => import("./motionFeatures").then((mod) => mod.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      if (document.hidden) root.setAttribute("data-hidden", "");
      else root.removeAttribute("data-hidden");
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
