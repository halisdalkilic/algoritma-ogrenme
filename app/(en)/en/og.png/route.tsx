import { renderOgCard } from "@/lib/ogCard";

// İngilizce paylaşım önizleme görseli: out/en/og.png (Türkçesi için bkz. app/og.png/route.tsx).
export const dynamic = "force-static";

export function GET() {
  return renderOgCard("en");
}
