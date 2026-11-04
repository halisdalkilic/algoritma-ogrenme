import type { MetadataRoute } from "next";
import { seoText } from "@/lib/seo";

// Statik export: manifest build anında bir kez üretilir. İngilizcesi: app/(en)/en/manifest.ts
export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  const s = seoText("tr");
  return {
    name: s.manifestName,
    short_name: s.manifestShortName,
    description: s.manifestDescription,
    start_url: `${base}/`,
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#2563eb",
    icons: [
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
