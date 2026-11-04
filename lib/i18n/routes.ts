import type { Locale } from "./config";

/**
 * Sayfa adresleri tek bir tabloda. Türkçe adresler eskisi gibi kökte kalır (yer imleri ve arama motoru indeksi
 * bozulmasın); İngilizce adresler /en altında ve çevrilmiş adlarla: /en/lesson/1.1, /en/review, /en/profile.
 * Bağlantılar, dil seçici, hreflang ve sitemap hep bu tablodan beslenir.
 */
export type Route =
  | { name: "home" }
  | { name: "lesson"; id: string }
  | { name: "review" }
  | { name: "profile"; hash?: string }
  | { name: "privacy" };

const PATHS: Record<Locale, { home: string; lesson: string; review: string; profile: string; privacy: string }> = {
  tr: { home: "/", lesson: "/ders", review: "/tekrar", profile: "/profil", privacy: "/gizlilik" },
  en: { home: "/en", lesson: "/en/lesson", review: "/en/review", profile: "/en/profile", privacy: "/en/privacy" },
};

export function href(locale: Locale, route: Route): string {
  const p = PATHS[locale];
  switch (route.name) {
    case "home":
      return p.home;
    case "lesson":
      return `${p.lesson}/${route.id}`;
    case "review":
      return p.review;
    case "profile":
      return route.hash ? `${p.profile}#${route.hash}` : p.profile;
    case "privacy":
      return p.privacy;
  }
}

/** Bir adres hangi dile ve hangi sayfaya ait? Tanınmazsa null. (Sondaki "/" ve "#..." yok sayılır.) */
export function parseRoute(pathname: string): { locale: Locale; route: Route } | null {
  const path = pathname.split("#")[0].replace(/\/+$/, "") || "/";
  for (const locale of ["tr", "en"] as const) {
    const p = PATHS[locale];
    if (path === p.home) return { locale, route: { name: "home" } };
    if (path === p.review) return { locale, route: { name: "review" } };
    if (path === p.profile) return { locale, route: { name: "profile" } };
    if (path === p.privacy) return { locale, route: { name: "privacy" } };
    if (path.startsWith(p.lesson + "/")) {
      const id = path.slice(p.lesson.length + 1);
      if (id && !id.includes("/")) return { locale, route: { name: "lesson", id } };
    }
  }
  return null;
}

/** Bulunulan sayfanın hedef dildeki karşılığı (dil seçici için). Tanınmayan sayfa → hedef dilin ana sayfası. */
export function switchLocalePath(pathname: string, to: Locale): string {
  const parsed = parseRoute(pathname);
  return href(to, parsed ? parsed.route : { name: "home" });
}
