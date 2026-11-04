import Link from "next/link";
import { tr } from "@/lib/i18n/dict/tr";
import { en } from "@/lib/i18n/dict/en";
import { href } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

/** Gizlilik sayfası içeriği. Sunucu bileşeni: metinler build anında HTML'e yazılır, istemci paketine girmez. */
export function PrivacyPage({ locale }: { locale: Locale }) {
  const p = (locale === "tr" ? tr : en).privacy;
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-20 pt-8">
      <div>
        <span className="chip">{p.kicker}</span>
        <h1 className="mt-2 text-3xl font-black leading-tight">{p.heading}</h1>
        <p className="mt-2 font-semibold text-muted">{p.intro}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {p.items.map((it) => (
          <li key={it.title} className="card flex gap-4 p-5">
            <span aria-hidden className="text-3xl">
              {it.icon}
            </span>
            <div>
              <h2 className="font-black">{it.title}</h2>
              <p className="mt-1 text-[15px] font-semibold leading-relaxed text-muted">{it.body}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm font-semibold text-muted">{p.updated}</p>
      <Link href={href(locale, { name: "home" })} className="btn self-start">
        {p.back}
      </Link>
    </div>
  );
}
