"use client";

import { useT } from "@/lib/i18n/context";

/**
 * Alıştırma kontrol edildikten sonraki "Devam" / "Tekrar Dene" butonu.
 * Tüm alıştırma tiplerinde tekrarlandığı için tek yerde toplanmıştır (DRY).
 * Doğruda buton kısa bir "pop" ile belirir ve dikkat çeker; yanlışta sakin yükselir.
 */
export function ContinueButton({ correct, onClick }: { correct: boolean; onClick: () => void }) {
  const t = useT();
  return (
    <button type="button" onClick={onClick} className={`btn btn-block ${correct ? "btn-good fx-pop" : "btn-bad fx-rise"}`}>
      {correct ? t.exercise.continue : t.exercise.retry}
    </button>
  );
}
