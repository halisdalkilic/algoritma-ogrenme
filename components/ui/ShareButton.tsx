"use client";

import { useRef, useState } from "react";
import { Mascot } from "@/components/mascot/Mascot";
import { shareAchievement, type ShareCardData } from "@/lib/shareCard";
import { useLocale, useT } from "@/lib/i18n/context";

/** Başarı kartını üretip paylaşan buton. Karttaki maskot, gizli bir kopyadan çizilir. */
export function ShareButton({
  card,
  text,
  className = "btn btn-ghost btn-block",
  label,
}: {
  card: ShareCardData;
  text: string;
  className?: string;
  label?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const mascotRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onShare() {
    setBusy(true);
    setMsg("");
    const result = await shareAchievement(card, text, mascotRef.current?.querySelector("svg"), { locale, strings: t.shell.share });
    setMsg(result);
    setBusy(false);
  }

  return (
    <div className="w-full">
      <div ref={mascotRef} aria-hidden className="pointer-events-none fixed -left-[9999px] top-0">
        <Mascot mood="cheer" size={260} />
      </div>
      <button type="button" onClick={onShare} disabled={busy} className={className}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v14" />
        </svg>
        {busy ? t.shell.share.preparing : (label ?? t.shell.share.share)}
      </button>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-sm font-bold text-muted">
        {msg}
      </p>
    </div>
  );
}
