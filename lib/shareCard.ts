/**
 * Paylaşılabilir başarı kartı: tarayıcıda <canvas> ile 1080×1080 PNG üretir.
 * Telefonda sistemin paylaş menüsü (WhatsApp, Instagram…) açılır; desteklenmiyorsa PNG indirilir.
 * Hiçbir veri sunucuya gitmez.
 */

export { SITE_URL } from "./seo";
import { SITE_URL } from "./seo";
import type { Locale } from "./i18n/config";

/** Paylaşım metnindeki adres: İngilizce kullanıcıya İngilizce sayfa gösterilir. */
export function shareUrl(locale: Locale): string {
  return locale === "en" ? `${SITE_URL}/en` : SITE_URL;
}

/** Kullanıcıya gösterilen sonuç mesajları ve dosya/marka adı (dile göre sözlükten: t.shell.share). */
export type ShareStrings = {
  shared: string;
  downloadedAndCopied: string;
  copied: string;
  downloaded: string;
  unsupported: string;
  brand: string;
  fileName: string;
};

export type ShareOptions = { locale: Locale; strings: ShareStrings };

export type ShareCardData = {
  /** Üstteki küçük etiket, ör. "DERS TAMAMLANDI" */
  kicker: string;
  /** Büyük başlık, ör. "Değişken Kavramı" */
  title: string;
  /** Büyük emoji/ikon */
  icon: string;
  /** Alt satırdaki istatistikler, ör. [["⭐", "540 XP"], ["🔥", "5 gün"]] */
  stats: [string, string][];
  /** Kart gradyanı [açık, koyu] */
  colors: [string, string];
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadSvg(svg: SVGSVGElement): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute("style"); // animasyon dönüşümleri karta yansımasın
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  });
}

export async function renderShareCard(data: ShareCardData, mascot: SVGSVGElement | null | undefined, opts: ShareOptions): Promise<Blob | null> {
  const S = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";

  // arka plan
  const bg = ctx.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, data.colors[0]);
  bg.addColorStop(1, data.colors[1]);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);
  // nokta deseni
  ctx.fillStyle = "rgba(255,255,255,0.09)";
  for (let x = 30; x < S; x += 54) for (let y = 30; y < S; y += 54) ctx.fillRect(x, y, 5, 5);

  // beyaz kart
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 80, 150, S - 160, 700, 56);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // ikon + maskot
  const mascotImg = mascot ? await loadSvg(mascot) : null;
  if (mascotImg) ctx.drawImage(mascotImg, S - 330, 40, 260, 260);
  // Renkli emoji fontu açıkça istenmezse tarayıcı tek renkli (soluk) glife düşebiliyor
  ctx.fillStyle = "#000000";
  ctx.font = `140px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", ${font}`;
  ctx.fillText(data.icon, S / 2, 360);

  ctx.fillStyle = data.colors[1];
  ctx.font = `900 34px ${font}`;
  ctx.fillText(data.kicker.toLocaleUpperCase(opts.locale === "tr" ? "tr-TR" : "en-US").split("").join(String.fromCharCode(8202)), S / 2, 440);

  ctx.fillStyle = "#181b38";
  ctx.font = `900 76px ${font}`;
  const lines = wrap(ctx, data.title, S - 260);
  lines.forEach((l, i) => ctx.fillText(l, S / 2, 530 + i * 84));

  // istatistik hapları
  ctx.font = `800 40px ${font}, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
  const pills = data.stats.map(([icon, text]) => `${icon} ${text}`);
  const widths = pills.map((p) => ctx.measureText(p).width + 64);
  const total = widths.reduce((a, b) => a + b, 0) + (pills.length - 1) * 20;
  let x = (S - total) / 2;
  const y = 530 + lines.length * 84 + 30;
  pills.forEach((p, i) => {
    ctx.fillStyle = "#f1effd";
    roundRect(ctx, x, y, widths[i], 76, 38);
    ctx.fill();
    ctx.fillStyle = "#3b2aa8";
    ctx.fillText(p, x + widths[i] / 2, y + 52);
    x += widths[i] + 20;
  });

  // alt bilgi
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 46px ${font}`;
  ctx.fillText(opts.strings.brand, S / 2, 950);
  ctx.font = `700 32px ${font}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText(shareUrl(opts.locale).replace("https://", ""), S / 2, 1000);
  ctx.globalAlpha = 1;

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

/** Kartı paylaşır. Dönen değer kullanıcıya gösterilecek kısa sonuç mesajıdır. */
export async function shareAchievement(data: ShareCardData, text: string, mascot: SVGSVGElement | null | undefined, opts: ShareOptions): Promise<string> {
  const s = opts.strings;
  const blob = await renderShareCard(data, mascot, opts);
  const message = `${text}\n${shareUrl(opts.locale)}`;
  if (blob) {
    const file = new File([blob], s.fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message });
        return s.shared;
      } catch (e) {
        if ((e as Error).name === "AbortError") return "";
      }
    }
    // Paylaşım menüsü yoksa (çoğu masaüstü tarayıcı): görseli indir, metni panoya kopyala
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = s.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  try {
    await navigator.clipboard.writeText(message);
    return blob ? s.downloadedAndCopied : s.copied;
  } catch {
    return blob ? s.downloaded : s.unsupported;
  }
}
