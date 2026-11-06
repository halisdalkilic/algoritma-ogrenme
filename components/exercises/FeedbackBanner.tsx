"use client";

import { useContext, useEffect, useState } from "react";
import { Mascot } from "@/components/mascot/Mascot";
import { Burst } from "@/components/ui/Burst";
import { useProgressStore } from "@/lib/useProgressStore";
import { useT } from "@/lib/i18n/context";
import { LessonFxContext } from "@/lib/lessonFx";

/**
 * Tüm alıştırma tiplerinde tekrarlanan doğru/yanlış geri bildirim kutusu.
 * Doğru: kutu yaylanarak belirir, maskot sevinir ve etrafında kısa bir konfeti patlar.
 * Yanlış: kutu yumuşakça sarsılır, maskot üzülür. Tüm hareket CSS ile (transform/opacity) yapılır
 * ve hareket azaltma tercihinde kendiliğinden kapanır.
 * Üst üste doğru cevaplar (S1) konfetiyi büyütür ve "N üst üste" rozeti gösterir; yanlışta maskot sarsılır (S3).
 * Ses/titreşim burada tetiklenir. `role="status"` + `aria-live="polite"`: ekran okuyucu kullanıcıları,
 * odak değişmeden sonucu duyar (erişilebilirlik).
 */
export function FeedbackBanner({ correct, children }: { correct: boolean; children: React.ReactNode }) {
  const t = useT();
  const play = useProgressStore((s) => s.play);
  const { combo } = useContext(LessonFxContext);
  // Bu cevap henüz sayılmadı (Devam'a basınca sayılır): doğruysa seri bir fazlası olur.
  const streak = correct ? combo + 1 : 0;
  useEffect(() => {
    play(correct ? "correct" : "wrong");
  }, [correct, play]);

  // Başlık her gösterimde değişsin ama aynı kutu yeniden çizilirken zıplamasın.
  const [roll] = useState(() => Math.random());
  const list = !correct ? t.exercise.comforts : streak >= 3 ? t.exercise.comboCheers : t.exercise.cheers;
  const title = list[Math.floor(roll * list.length)];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-2xl border-2 p-3 pr-4 ${correct ? "fx-correct" : "fx-wrong"}`}
      style={{
        background: correct ? "var(--good-soft)" : "var(--bad-soft)",
        borderColor: correct ? "var(--good)" : "var(--bad)",
        color: correct ? "var(--good-ink)" : "var(--bad-ink)",
      }}
    >
      <div className="relative flex-none">
        {correct && <Burst count={14 + Math.min(streak, 8) * 3} radius={64 + Math.min(streak, 8) * 8} size={8 + Math.min(streak, 6)} />}
        <div className={correct ? undefined : "fx-wobble"}>
          <Mascot mood={correct ? "cheer" : "sad"} size={58} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-lg font-black leading-tight">{title}</span>
          {streak >= 2 && (
            <span className="fx-combo rounded-full bg-flame px-2 py-0.5 text-xs font-black text-white">
              🔥 {t.exercise.combo(streak)}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[14.5px] font-bold leading-snug [&_p]:mt-1">{children}</div>
      </div>
    </div>
  );
}
