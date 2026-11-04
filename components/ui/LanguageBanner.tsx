"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/context";
import { parseRoute, switchLocalePath } from "@/lib/i18n/routes";
import { BANNER, SWITCHER } from "@/lib/i18n/switcher";

const noopSubscribe = () => () => {};

/**
 * İlk ziyaret bandı: tarayıcı dili sayfanın dilinden farklıysa, diğer dili önerir. Otomatik yönlendirme YOK
 * (arama motorları ve paylaşılan bağlantılar bozulmasın). Kapatılınca ya da dil seçilince cihazda hatırlanır.
 * `offerEnglish`: İngilizce sürüm yayında değilse Türkçe sayfada öneri çıkmaz.
 */
export function LanguageBanner({ offerEnglish }: { offerEnglish: boolean }) {
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const [dismissed, setDismissed] = useState(false);

  // Tarayıcıya bağlı karar: sunucuda/ilk boyamada false (HTML'e hiç girmez), tarayıcıda gerçek değer.
  const eligible = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        if (localStorage.getItem(LOCALE_STORAGE_KEY)) return false;
      } catch {
        return false;
      }
      const primary = (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase();
      const prefersTurkish = primary.startsWith("tr");
      const wantsOther = locale === "tr" ? !prefersTurkish && offerEnglish : prefersTurkish;
      // Ders sırasında dikkat dağıtma
      return wantsOther && parseRoute(pathname)?.route.name !== "lesson";
    },
    () => false,
  );

  if (!eligible || dismissed) return null;
  const b = BANNER[locale];
  const s = SWITCHER[locale];
  const remember = (value: string) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, value);
    } catch {
      // depolama kapalıysa sadece tercih hatırlanmaz
    }
  };
  return (
    <div
      role="region"
      aria-label={b.text}
      lang={b.lang}
      className="fixed inset-x-3 bottom-3 z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-sm font-bold shadow-lg"
    >
      <span className="flex-1">{b.text}</span>
      <a href={switchLocalePath(pathname, s.target)} className="btn !px-3 !py-1.5 text-sm" onClick={() => remember(s.target)}>
        {b.action}
      </a>
      <button
        type="button"
        className="rounded-full px-2 py-1 text-muted hover:text-brand"
        onClick={() => {
          remember(locale);
          setDismissed(true);
        }}
      >
        {b.dismiss}
      </button>
    </div>
  );
}
