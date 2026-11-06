import { ViewTransition } from "react";
import "../../app/globals.css";
import { Header } from "@/components/ui/Header";
import { SyncProvider } from "@/components/ui/SyncProvider";
import { ServiceWorkerRegister } from "@/components/ui/ServiceWorkerRegister";
import { Footer } from "@/components/ui/Footer";
import { CelebrationOverlay } from "@/components/ui/CelebrationOverlay";
import { LanguageBanner } from "@/components/ui/LanguageBanner";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { TapFeedback } from "@/components/ui/TapFeedback";
import { englishIsPublic } from "@/lib/seo";
import { TrProvider } from "./TrProvider";
import { EnProvider } from "./EnProvider";
import { jetbrains, nunito } from "@/lib/fonts";
import { tr } from "@/lib/i18n/dict/tr";
import { en } from "@/lib/i18n/dict/en";

// Sayfa boyanmadan ÖNCE temayı belirler (yanıp sönmeyi önler):
// kayıtlı tercih varsa onu, yoksa sistem tercihini uygular.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("algoritma-app:theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

/**
 * Uygulamanın kök belgesi (<html> + <body> + ortak kabuk). İki kök layout (Türkçe ve İngilizce) bunu kullanır;
 * tek fark `lang` özniteliği ve sayfa metadata'sıdır. Next.js'te kök layout'lar `<html>` etiketini kendileri
 * döndürmek zorundadır, bu yüzden ortak kısım bileşen olarak paylaşılır.
 */
export function RootDocument({
  lang,
  children,
}: {
  lang: "tr" | "en";
  children: React.ReactNode;
}) {
  const Provider = lang === "tr" ? TrProvider : EnProvider;
  const skipLabel = (lang === "tr" ? tr : en).shell.skipToContent;
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${nunito.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Provider>
          <MotionProvider>
          <a
            data-own-position
            href="#icerik"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
          >
            {skipLabel}
          </a>
          <ServiceWorkerRegister />
          <SyncProvider />
          <TapFeedback />
          <Header />
          <main id="icerik" className="flex flex-1 flex-col">
            {/* S7: sayfa geçişlerinde yumuşak solma ve hafif yükselme (View Transitions; desteklenmeyen tarayıcıda
                geçiş animasyonsuz, uygulama aynı çalışır). Stiller globals.css'te ".page-in/.page-out". */}
            <ViewTransition enter="page-in" exit="page-out" default="none">
              {children}
            </ViewTransition>
          </main>
          <Footer />
          <CelebrationOverlay />
          <LanguageBanner offerEnglish={englishIsPublic()} />
          </MotionProvider>
        </Provider>
      </body>
    </html>
  );
}
