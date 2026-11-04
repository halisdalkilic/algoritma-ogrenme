"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dict/tr";
import { href as hrefFor, type Route } from "./routes";

type I18n = { locale: Locale; t: Dictionary };

const I18nContext = createContext<I18n | null>(null);

/** Sağlayıcı: dile özgü sözlüğü (t) ve dili (locale) alt bileşenlere verir. components/shell/*Provider.tsx kullanır. */
export function I18nProvider({ locale, t, children }: I18n & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT/useLocale yalnızca bir I18nProvider içinde kullanılabilir (kök layout sağlar).");
  return ctx;
}

/** Çeviri sözlüğü: `const t = useT(); t.header.streak` */
export function useT(): Dictionary {
  return useI18n().t;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

/** Dile göre sayfa adresi: `const href = useHref(); href({ name: "lesson", id: "1.1" })` */
export function useHref(): (route: Route) => string {
  const locale = useLocale();
  return (route) => hrefFor(locale, route);
}
