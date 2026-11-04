"use client";

import { I18nProvider } from "@/lib/i18n/context";
import { en } from "@/lib/i18n/dict/en";

export function EnProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en" t={en}>
      {children}
    </I18nProvider>
  );
}
