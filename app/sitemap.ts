import type { MetadataRoute } from "next";
import { lessons } from "@/content";
import { SITE_URL, englishIsPublic, withSlash } from "@/lib/seo";
import { href, type Route } from "@/lib/i18n/routes";

// Statik export: build anında sitemap.xml olarak üretilir.
export const dynamic = "force-static";

const BASE = SITE_URL;

type Entry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  const english = englishIsPublic();
  // Her sayfa için Türkçe adres; İngilizce yayındaysa karşılıklı hreflang bağlantılarıyla birlikte İngilizce adres de eklenir.
  const page = (route: Route, changeFrequency: Entry["changeFrequency"], priority: number): Entry[] => {
    const slash = withSlash;
    const tr = BASE + slash(href("tr", route));
    const en = BASE + slash(href("en", route));
    const alternates = english ? { languages: { tr, en, "x-default": tr } } : undefined;
    return [
      { url: tr, changeFrequency, priority, alternates },
      ...(english ? [{ url: en, changeFrequency, priority, alternates }] : []),
    ];
  };
  return [
    ...page({ name: "home" }, "weekly", 1),
    ...lessons.flatMap((l) => page({ name: "lesson", id: l.id }, "monthly", 0.7)),
    ...page({ name: "privacy" }, "yearly", 0.2),
  ];
}
