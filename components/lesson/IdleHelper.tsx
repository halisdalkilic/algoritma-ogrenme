"use client";

import { AnimatePresence, m } from "framer-motion";
import { Mascot } from "@/components/mascot/Mascot";
import { useIdle } from "@/lib/useIdle";
import { useT } from "@/lib/i18n/context";

/**
 * Alıştırmada 20 saniye hiçbir şey yapılmazsa maskot esner ve konuşma balonuyla ipucu verir (S11 + S12).
 * Alıştırmanın `hint` alanı varsa onu gösterir, yoksa sakinleştirici genel bir cümle. Kullanıcı bir şeye
 * dokunur dokunmaz kaybolur. Düzeni yukarıdan aşağıya itmez: alıştırmanın ALTINDA belirir.
 */
export function IdleHelper({ hint, resetKey }: { hint?: string; resetKey: string }) {
  const t = useT();
  const idle = useIdle(20000, resetKey);
  return (
    <AnimatePresence>
      {idle && (
        <m.div
          key="idle-helper"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-end gap-2"
        >
          <div className="idle-stretch flex-none">
            <Mascot mood="think" size={64} />
          </div>
          <div className="relative mb-4 rounded-2xl border-2 border-line bg-surface px-4 py-2.5 text-[14.5px] font-bold leading-snug shadow-[var(--shadow-card)]">
            <span
              aria-hidden
              className="absolute -left-[9px] bottom-3 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-surface"
            />
            {hint ? t.lesson.idleHint(hint) : t.lesson.idlePlain}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
