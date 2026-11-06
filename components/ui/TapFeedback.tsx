"use client";

import { useEffect } from "react";
import { cue } from "@/lib/feedback";
import { useProgressStore } from "@/lib/useProgressStore";

/**
 * Dokunmatik ekranda butonlara/seçeneklere dokunulunca çok hafif titreşim (S18). Yalnızca "Titreşim" ayarı açıksa
 * ve dokunma/kalem girdisinde çalışır (fare yok). Ses çalmaz. Render etmez.
 */
export function TapFeedback() {
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const el = (e.target as Element | null)?.closest?.("button, [role=button], a.btn, .choice");
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      const { haptics } = useProgressStore.getState().progress.settings;
      cue("tap", { sound: false, haptics });
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
