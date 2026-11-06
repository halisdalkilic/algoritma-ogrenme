import type { Metadata } from "next";
import { LESSON_COUNT } from "@/content/structure";
import { enContent } from "@/content/en";
import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/dict/en";
import { tr } from "@/lib/i18n/dict/tr";
import { href, parseRoute } from "@/lib/i18n/routes";

/**
 * Ortak SEO/paylaşım ayarları. Next.js metadata'yı segmentler arasında YÜZEYSEL birleştirir:
 * bir alt sayfa `openGraph` tanımlarsa üst seviyedekinin tamamını ezer. Bu yüzden her sayfa
 * openGraph'ı `og()` ile kurar; site adı, dil ve önizleme görseli hiçbir sayfada kaybolmaz.
 */
// Sitenin tam adresi. Pages iş akışı bunu configure-pages'in base_url çıktısından verir;
// kendi alan adı bağlanınca kendiliğinden o adres olur.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://halisdalkilic.github.io/algoritma-ogrenme").replace(/\/$/, "");
export const SITE_NAME = tr.seo.siteName;

/** Dile göre SEO metinleri (sunucu tarafı; istemci paketine girmez). */
export const seoText = (locale: Locale) => (locale === "tr" ? tr : en).seo;

/**
 * İngilizce sürüm herkese açık mı? Yalnızca bütün dersler çevrildiğinde (47/47) true olur:
 * o zamana kadar /en arama motorlarına kapalıdır, sitemap'e ve hreflang'a girmez.
 */
export function englishIsPublic(): boolean {
  return enContent.lessons.length === LESSON_COUNT;
}

const OG_IMAGE_PATH: Record<Locale, string> = { tr: "/og.png", en: "/en/og.png" };

/**
 * Sayfanın gerçek adresi: trailingSlash açıkken "/" ile biter (GitHub Pages derlemesi), NO_TRAILING_SLASH=1 ile
 * derlenen sürümde (kendi sunucumuz) bitmez. next.config.ts aynı anahtarı okur.
 */
export function withSlash(p: string): string {
  if (process.env.NO_TRAILING_SLASH === "1") return p.length > 1 ? p.replace(/\/+$/, "") : p;
  return p.endsWith("/") ? p : `${p}/`;
}

export function og(
  page: { title: string; description: string; path: string },
  locale: Locale = "tr",
): Pick<Metadata, "openGraph" | "twitter" | "alternates"> {
  const s = seoText(locale);
  const image = { url: OG_IMAGE_PATH[locale], width: 1200, height: 630, type: "image/png", alt: s.defaultTitle };
  const parsed = parseRoute(page.path);
  // hreflang: yalnızca İngilizce sürüm yayındayken ve sayfanın iki dilde karşılığı varsa
  const languages =
    parsed && englishIsPublic()
      ? { tr: href("tr", parsed.route), en: href("en", parsed.route), "x-default": href("tr", parsed.route) }
      : undefined;
  const slash = withSlash;
  const canonical = slash(page.path);
  return {
    alternates: { canonical, ...(languages ? { languages: Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, slash(v)])) } : {}) },
    openGraph: {
      type: "website",
      locale: s.ogLocale,
      siteName: s.siteName,
      title: page.title,
      description: page.description,
      url: canonical,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: page.title, description: page.description, images: [image.url] },
  };
}

/**
 * Kişisel (cihaza özel) sayfalar: profil ve tekrar. Arama motorunda yeri yok, bu yüzden noindex; ama kendi başlığı
 * ve kendi canonical adresi olur (aksi halde ana sayfanın canonical/hreflang bilgisini miras alırlardı).
 */
export function privatePage(locale: Locale, kind: "profile" | "review", path: string): Metadata {
  const s = seoText(locale);
  const title = (locale === "tr" ? tr : en).shell.header[kind];
  return { title, robots: { index: false, follow: true }, ...og({ title: `${title} · ${s.siteName}`, description: s.description, path }, locale) };
}
