import type { Metadata } from "next";
import Link from "next/link";
import { RootDocument } from "@/components/shell/RootDocument";
import { Mascot } from "@/components/mascot/Mascot";

export const metadata: Metadata = {
  title: "404 · Sayfa bulunamadı / Page not found",
  robots: { index: false },
};

/**
 * Tüm uygulama için 404 sayfası. İki kök layout (tr/en) olduğunda Next.js tek bir layout'tan 404 üretemez
 * (dokümandaki "multiple root layouts" durumu), bu yüzden bu dosya gerekir. Eşleşmeyen adresin hangi dile ait
 * olduğu build anında bilinmez: sayfa iki dilli gösterilir.
 */
export default function GlobalNotFound() {
  return (
    <RootDocument lang="tr">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <Mascot mood="sad" size={120} />
        <p className="text-sm font-black uppercase tracking-[0.2em] text-muted">404</p>
        <h1 className="text-3xl font-black leading-tight">Sayfa bulunamadı</h1>
        <p className="font-semibold text-muted">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
        <h2 lang="en" className="mt-4 text-2xl font-black leading-tight">
          Page not found
        </h2>
        <p lang="en" className="font-semibold text-muted">
          The page you are looking for may have moved or never existed.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn">
            Ana sayfa
          </Link>
          <Link href="/en" lang="en" className="btn btn-ghost">
            Home
          </Link>
        </div>
      </div>
    </RootDocument>
  );
}
