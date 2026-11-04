"use client";

import type { FlowchartShape } from "./types";
import { useT } from "@/lib/i18n/context";

/**
 * Bölüm 2.1'deki dört şema sembolü: terminal (oval), süreç (dikdörtgen),
 * karar (eşkenar dörtgen), girdi/çıktı (paralelkenar). Her sembolün kendi
 * rengi vardır (globals.css → --fc-*), böylece şemalar bir bakışta okunur.
 */
export function NodeShape({
  shape,
  x,
  y,
  width,
  height,
  label,
  status = "neutral",
  dashed = false,
}: {
  shape: FlowchartShape;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  status?: "neutral" | "correct" | "wrong";
  dashed?: boolean;
}) {
  const t = useT();
  const cx = x + width / 2;
  const cy = y + height / 2;

  const stroke =
    status === "correct"
      ? "var(--good)"
      : status === "wrong"
        ? "var(--bad)"
        : dashed
          ? "var(--muted)"
          : `var(--fc-${shape}-stroke)`;
  const fill =
    status === "correct"
      ? "var(--good-soft)"
      : status === "wrong"
        ? "var(--bad-soft)"
        : dashed
          ? "var(--surface-2)"
          : `var(--fc-${shape}-fill)`;

  const commonProps = {
    fill,
    stroke,
    strokeWidth: 2.5,
    strokeDasharray: dashed ? "6 5" : undefined,
    strokeLinejoin: "round" as const,
  };

  let shapeEl: React.ReactNode;
  switch (shape) {
    case "terminal":
      shapeEl = <rect x={x} y={y} width={width} height={height} rx={height / 2} ry={height / 2} {...commonProps} />;
      break;
    case "process":
      shapeEl = <rect x={x} y={y} width={width} height={height} rx={8} {...commonProps} />;
      break;
    case "decision": {
      const points = `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
      shapeEl = <polygon points={points} {...commonProps} />;
      break;
    }
    case "io": {
      const skew = width * 0.18;
      const points = `${x + skew},${y} ${x + width},${y} ${x + width - skew},${y + height} ${x},${y + height}`;
      shapeEl = <polygon points={points} {...commonProps} />;
      break;
    }
  }

  return (
    <g>
      {shapeEl}
      <foreignObject x={x + 8} y={y} width={width - 16} height={height}>
        <div
          className="flex h-full w-full items-center justify-center text-center text-[12.5px] font-extrabold leading-tight"
          style={{ color: "var(--ink)" }}
        >
          {label || <span style={{ color: "var(--muted)" }}>{t.common.empty}</span>}
        </div>
      </foreignObject>
    </g>
  );
}
