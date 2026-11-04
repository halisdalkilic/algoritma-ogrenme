import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Statik export: build anında robots.txt olarak üretilir.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
