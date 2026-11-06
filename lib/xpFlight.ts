/**
 * Kazanılan XP'nin ekranda yükselip üst çubuktaki XP rozetine uçması (S2). React dışında, Web Animations API ile
 * (yalnızca transform/opacity) çalışır: depo güncellemesinden bağımsız, takılma yaratmaz. Hareketi azalt açıksa
 * hiçbir şey yapmaz. Hedef: `[data-xp-target]` (StatBadge XP).
 */
const FLIGHT_MS = 850;
let landsAt = 0;

/** Uçuş devam ediyorsa hedefe varmasına kalan süre (ms); yoksa 0. Sayaç bunu bekler. */
export function flightDelay(): number {
  return Math.max(0, landsAt - performance.now());
}

export function launchXpFlight(amount: number, from?: Element | null) {
  if (typeof document === "undefined" || amount <= 0) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.querySelector("[data-xp-target]");
  if (!target) return;
  const to = target.getBoundingClientRect();
  if (to.width === 0) return; // dar ekranda gizli
  const src = (from ?? document.activeElement)?.getBoundingClientRect?.();
  const sx = src && src.width > 0 ? src.left + src.width / 2 : window.innerWidth / 2;
  const sy = src && src.height > 0 ? src.top : window.innerHeight - 90;
  const tx = to.left + to.width / 2;
  const ty = to.top + to.height / 2;

  const el = document.createElement("div");
  el.setAttribute("data-own-position", "");
  el.setAttribute("aria-hidden", "true");
  el.textContent = `+${amount}`;
  Object.assign(el.style, {
    position: "fixed",
    left: "0",
    top: "0",
    zIndex: "60",
    pointerEvents: "none",
    fontWeight: "900",
    fontSize: "20px",
    color: "var(--xp)",
    textShadow: "0 2px 0 rgba(0,0,0,0.25)",
    willChange: "transform, opacity",
    transform: `translate(${sx}px, ${sy}px)`,
    opacity: "0",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);

  landsAt = performance.now() + FLIGHT_MS;
  const anim = el.animate(
    [
      { transform: `translate(${sx - 14}px, ${sy}px) scale(0.7)`, opacity: 0 },
      { transform: `translate(${sx - 14}px, ${sy - 46}px) scale(1.25)`, opacity: 1, offset: 0.28 },
      { transform: `translate(${tx - 14}px, ${ty - 10}px) scale(0.75)`, opacity: 0.9 },
    ],
    { duration: FLIGHT_MS, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
  );
  const cleanup = () => el.remove();
  anim.onfinish = cleanup;
  anim.oncancel = cleanup;
}
