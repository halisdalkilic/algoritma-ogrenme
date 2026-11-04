"use client";

import Link from "next/link";
import { useHref, useT } from "@/lib/i18n/context";

export function Footer() {
  const t = useT();
  const href = useHref();
  return (
    <footer className="mx-auto mt-6 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 pb-8 pt-4 text-[13px] font-bold text-muted">
      <span>{t.shell.footer.copyright}</span>
      <span aria-hidden>·</span>
      <span>🔒 {t.shell.footer.noAccount}</span>
      <span aria-hidden>·</span>
      <Link href={href({ name: "privacy" })} className="-my-3 px-2 py-3 underline-offset-4 hover:text-brand hover:underline">
        {t.shell.footer.privacy}
      </Link>
    </footer>
  );
}
