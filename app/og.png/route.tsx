import { renderOgCard } from "@/lib/ogCard";

// Paylaşım önizleme görseli (WhatsApp, Twitter, Discord…). Statik export'ta build anında
// out/og.png olarak bir kez üretilir. opengraph-image konvansiyonu yerine route kullanıyoruz:
// o konvansiyon uzantısız "opengraph-image" dosyası üretiyor ve statik sunucu onu image/png olarak sunmuyor.
// Görselin kendisi lib/ogCard.tsx içinde; İngilizcesi app/(en)/en/og.png/route.tsx.
export const dynamic = "force-static";

export function GET() {
  return renderOgCard("tr");
}
