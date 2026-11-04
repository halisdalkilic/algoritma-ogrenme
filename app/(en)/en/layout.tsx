import type { Metadata, Viewport } from "next";
import { RootDocument } from "@/components/shell/RootDocument";
import { SITE_URL, englishIsPublic, og, seoText } from "@/lib/seo";

const s = seoText("en");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: s.defaultTitle,
    template: s.titleTemplate,
  },
  description: s.description,
  applicationName: s.siteName,
  manifest: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/en.webmanifest`,
  keywords: s.keywords,
  ...og({ title: s.defaultTitle, description: s.description, path: "/en" }, "en"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: s.appleTitle,
  },
  // İngilizce içerik (47 dersin tamamı) hazır olana kadar arama motorlarına kapalı; hazır olunca kendiliğinden açılır.
  ...(englishIsPublic() ? {} : { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: "#6d4bf6",
};

// İngilizce kök layout. İki kök layout arasında gezinmek tam sayfa yüklemesi yapar (Next.js davranışı).
export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument lang="en">
      {children}
    </RootDocument>
  );
}
