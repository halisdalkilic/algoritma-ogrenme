"use client";

import { usePathname } from "next/navigation";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/context";
import { switchLocalePath } from "@/lib/i18n/routes";
import { SWITCHER } from "@/lib/i18n/switcher";

const pill =
  "relative grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs font-black text-muted transition-colors duration-300 hover:bg-brand-soft hover:text-brand";

/**
 * Dil seçici: bulunulan sayfanın diğer dildeki karşılığına gider. İki dil ayrı kök layout olduğundan geçiş
 * tam sayfa yüklemesidir (düz <a>). Seçim cihazda saklanır; ilk ziyaret bandı bir daha çıkmaz.
 */
export function LanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const s = SWITCHER[locale];
  return (
    <a
      href={switchLocalePath(pathname, s.target)}
      hrefLang={s.targetLang}
      lang={s.targetLang}
      className={pill}
      title={s.title}
      aria-label={s.aria}
      onClick={() => {
        try {
          localStorage.setItem(LOCALE_STORAGE_KEY, s.target);
        } catch {
          // depolama kapalıysa sadece tercih hatırlanmaz
        }
      }}
    >
      {s.label}
    </a>
  );
}
