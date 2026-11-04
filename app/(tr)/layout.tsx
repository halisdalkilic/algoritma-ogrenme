import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/shell/RootDocument";
import { SITE_URL, og, seoText } from "@/lib/seo";

const s = seoText("tr");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: s.defaultTitle,
    template: s.titleTemplate,
  },
  description: s.description,
  applicationName: s.siteName,
  keywords: s.keywords,
  ...og({ title: s.defaultTitle, description: s.description, path: "/" }, "tr"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: s.appleTitle,
  },
};

export const viewport: Viewport = {
  themeColor: "#6d4bf6",
};

// Türkçe kök layout. Rota grubu "(tr)" URL'de görünmez: sayfalar eskisi gibi /, /ders/1.1, /profil adreslerinde kalır.
export default function TurkishRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument lang="tr">
      {children}
    </RootDocument>
  );
}
