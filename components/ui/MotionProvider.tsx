"use client";

import { useEffect } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/**
 * Animasyonlar için tek merkez:
 *  - LazyMotion (P1): bileşenler `motion.*` yerine hafif `m.*` kullanır (`strict` bunu zorunlu kılar); yalnızca
 *    gereken özellikler (domAnimation) pakete girer. Özellikler EŞZAMANLI yüklenir: asenkron yüklenince
 *    `initial` durumundaki öğeler (opacity 0) paket gelene kadar görünmez kalıp içerik yanıp sönüyordu.
 *  - MotionConfig (P4): işletim sisteminde "hareketi azalt" açıksa tüm transform animasyonları kapanır.
 *  - Sekme gizliyken (P3) `<html data-hidden>` işaretlenir; globals.css tüm CSS animasyonlarını duraklatır.
 */
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
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
