"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { tr } from "@/lib/i18n/dict/tr";

// Dile özgü ayrı sağlayıcı modülleri: Türkçe sayfa İngilizce sözlüğü, İngilizce sayfa Türkçe sözlüğü indirmez.
export function TrProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="tr" t={tr}>
      {children}
    </I18nProvider>
  );
}
