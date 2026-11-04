import { ImageResponse } from "next/og";
import type { Locale } from "@/lib/i18n/config";
import { SITE_URL, seoText } from "@/lib/seo";

const size = { width: 1200, height: 630 };

const WORLDS = [
  ["🌱", "#14b8a6"],
  ["🧱", "#3b82f6"],
  ["🗺️", "#8b5cf6"],
  ["🔀", "#f59e0b"],
  ["🔁", "#22c55e"],
  ["📦", "#ec4899"],
  ["🚀", "#6366f1"],
];

/** Paylaşım önizleme görseli (1200x630). Türkçe ve İngilizce rota dosyaları bunu dile göre çağırır. */
export function renderOgCard(locale: Locale) {
  const s = seoText(locale);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #7c5cff 0%, #5b3ee0 55%, #2e1f8f 100%)",
          color: "#fff",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            🧠
          </div>
          <div style={{ fontSize: 34, letterSpacing: -0.5 }}>{s.siteName}</div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              padding: "8px 20px",
              borderRadius: 999,
              background: "#ffc93c",
              color: "#3b2aa8",
              fontSize: 26,
            }}
          >
            {s.card.free}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>{s.card.headline}</div>
          <div style={{ fontSize: 32, opacity: 0.88 }}>{s.card.sub}</div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {WORLDS.map(([emoji, color]) => (
            <div
              key={emoji}
              style={{
                display: "flex",
                width: 76,
                height: 76,
                borderRadius: 22,
                background: color,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                border: "4px solid rgba(255,255,255,0.35)",
              }}
            >
              {emoji}
            </div>
          ))}
          <div style={{ display: "flex", marginLeft: "auto", alignItems: "center", fontSize: 28, opacity: 0.85 }}>
            {new URL(SITE_URL).host}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
