import type { NextConfig } from "next";

// GitHub Pages proje adresinde (kullanici.github.io/repo) tüm yollar "/repo" önekiyle başlar.
// Önek, Pages iş akışından PAGES_BASE_PATH ile gelir; kendi alan adında boş kalır.
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Statik export: `next build` → out/ klasörü; sunucuda Node süreci yok, sadece dosya servis edilir.
  output: "export",
  basePath,
  // /ders/2.5 → ders/2.5/index.html. Noktalı ders adresleri GitHub Pages'te de açılsın diye.
  // NO_TRAILING_SLASH=1 ile derlenirse (sayfa dosyası ders/2.5.html, adres /ders/2.5) eğik çizgisiz çıkar; canonical,
  // sitemap ve hreflang adresleri de lib/seo.ts'teki `withSlash` ile aynı anahtara uyar. GitHub Pages derlemesi anahtarı kurmaz.
  trailingSlash: process.env.NO_TRAILING_SLASH !== "1",
  // Elle yazılan yollar (service worker, manifest) için istemci tarafına da aktarılır.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // İki kök layout (tr/en) olduğu için 404 sayfası app/global-not-found.tsx'ten gelir (Next.js dokümanı: not-found.md).
  experimental: { globalNotFound: true },
};

export default nextConfig;
