// İngilizce PWA manifesti. Statik export'ta build anında out/en.webmanifest olarak üretilir; yollar
// GitHub Pages proje adresindeki önekle (NEXT_PUBLIC_BASE_PATH) birlikte yazılır. Türkçesi: app/manifest.ts
export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function GET() {
  const manifest = {
    name: "Algorithm Learning",
    short_name: "Algorithm",
    description: "Learn algorithms and flowcharts with Duolingo-style micro-lessons.",
    lang: "en",
    start_url: `${base}/en/`,
    scope: `${base}/en/`,
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#2563eb",
    icons: [
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: `${base}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
  return new Response(JSON.stringify(manifest, null, 2), { headers: { "Content-Type": "application/manifest+json" } });
}
