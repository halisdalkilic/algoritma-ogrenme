import type { CSSProperties } from "react";

const COLORS = ["#6d4bf6", "#f4a10a", "#1fb860", "#ec4899", "#3b82f6", "#ff7a1a"];

type Piece = { dx: number; dy: number; rot: number; delay: number; color: string };

function pieces(count: number, radius: number, gravity: number): Piece[] {
  // Deterministik (SSR/CSR uyumlu): Math.random yok. Altın açı, parçacıkları eşit dağıtır.
  return Array.from({ length: count }, (_, i) => {
    const angle = i * 2.399963 + 0.5;
    const reach = radius * (0.55 + ((i * 37) % 45) / 100);
    return {
      dx: Math.round(Math.cos(angle) * reach),
      dy: Math.round(Math.sin(angle) * reach + gravity),
      rot: ((i * 83) % 540) - 270,
      delay: (i % 6) * 0.025,
      color: COLORS[i % COLORS.length],
    };
  });
}

/**
 * Tek seferlik, yalnızca CSS ile çalışan parçacık patlaması (konfeti). Yalnızca transform/opacity
 * canlandırılır; JS animasyon döngüsü yoktur, düşük cihazda da akıcıdır. Hareket azaltma tercihinde
 * animasyon anında biter ve parçacıklar görünmez kalır. Üst öğe `relative` olmalı.
 */
export function Burst({
  count = 12,
  radius = 70,
  gravity = 0,
  size = 8,
  duration = 0.8,
}: {
  count?: number;
  radius?: number;
  /** Aşağı çekim (px): büyük kutlamalarda konfeti süzülerek düşer. */
  gravity?: number;
  size?: number;
  duration?: number;
}) {
  return (
    <span aria-hidden className="fx-burst">
      {pieces(count, radius, gravity).map((p, i) => (
        <i
          key={i}
          style={
            {
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--r": `${p.rot}deg`,
              "--d": `${p.delay}s`,
              "--c": p.color,
              "--s": `${size}px`,
              "--t": `${duration}s`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
