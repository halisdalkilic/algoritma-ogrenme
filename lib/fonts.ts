import { Nunito, JetBrains_Mono } from "next/font/google";

// Nunito: yuvarlak, samimi hatlar (öğrenme uygulamaları için ideal).
// latin-ext: Türkçe karakterler (ğ, ş, ı, İ) için gerekli. İngilizce de aynı fontu kullanır.
// Fontlar tek yerde tanımlı: iki kök layout (tr ve en) aynı örnekleri paylaşır, derlemede çift font dosyası oluşmaz.
export const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "800", "900"],
});

export const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
});
