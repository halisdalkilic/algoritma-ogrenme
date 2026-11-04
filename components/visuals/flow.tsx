"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { Frame, Pop, useTicker } from "./kit";
import { useT } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/dict/tr";

type FlowText = Dictionary["visuals"]["flow"];

type Base = { accent: string; label: string };
type Shape = "terminal" | "process" | "decision" | "io";
type Node = { x: number; y: number; w: number; h: number; shape: Shape; text: string; error?: boolean };
type Edge = { d: string; text?: string; tx?: number; ty?: number; error?: boolean };
type Scene = { h: number; nodes: Node[]; edges: Edge[]; paths: string[]; captions?: string[]; dotMs?: number };

const FILL: Record<Shape, [string, string]> = {
  terminal: ["var(--fc-terminal-fill)", "var(--fc-terminal-stroke)"],
  process: ["var(--fc-process-fill)", "var(--fc-process-stroke)"],
  decision: ["var(--fc-decision-fill)", "var(--fc-decision-stroke)"],
  io: ["var(--fc-io-fill)", "var(--fc-io-stroke)"],
};

function ShapeEl({ n }: { n: Node }) {
  const [fill, stroke0] = FILL[n.shape];
  const stroke = n.error ? "var(--bad)" : stroke0;
  const { x, y, w, h } = n;
  const l = x - w / 2, t = y - h / 2;
  const common = { fill, stroke, strokeWidth: 2.5 };
  const shape =
    n.shape === "decision" ? (
      <polygon points={`${x},${t} ${l + w},${y} ${x},${t + h} ${l},${y}`} {...common} />
    ) : n.shape === "io" ? (
      <polygon points={`${l + 10},${t} ${l + w},${t} ${l + w - 10},${t + h} ${l},${t + h}`} {...common} />
    ) : (
      <rect x={l} y={t} width={w} height={h} rx={n.shape === "terminal" ? h / 2 : 6} {...common} />
    );
  return (
    <g>
      {shape}
      <text x={x} y={y + 4} textAnchor="middle" fontSize="11.5" fontWeight="800" fill="var(--ink)" fontFamily="var(--font-jetbrains), monospace">
        {n.text}
      </text>
    </g>
  );
}

// Ortak düğümler
const START = (f: FlowText, y = 18): Node => ({ x: 150, y, w: 86, h: 26, shape: "terminal", text: f.n.start });
const END = (f: FlowText, y: number): Node => ({ x: 150, y, w: 86, h: 26, shape: "terminal", text: f.n.end });

function buildScenes(f: FlowText): Record<string, Scene> {
  return {
  linear: {
    h: 268,
    nodes: [
      START(f),
      { x: 150, y: 70, w: 112, h: 28, shape: "io", text: f.n.readAB },
      { x: 150, y: 128, w: 136, h: 28, shape: "process", text: f.n.sumAB },
      { x: 150, y: 186, w: 112, h: 28, shape: "io", text: f.n.writeTotal },
      END(f, 244),
    ],
    edges: [{ d: "M150 31 V56" }, { d: "M150 84 V114" }, { d: "M150 142 V172" }, { d: "M150 200 V231" }],
    paths: ["M150 18 V244"],
    dotMs: 3200,
  },
  decision: {
    h: 238,
    nodes: [
      START(f),
      { x: 150, y: 80, w: 124, h: 54, shape: "decision", text: f.n.ageGe18 },
      { x: 238, y: 150, w: 96, h: 28, shape: "process", text: f.n.canEnter },
      { x: 62, y: 150, w: 96, h: 28, shape: "process", text: f.n.cannotEnter },
      END(f, 214),
    ],
    edges: [
      { d: "M150 31 V53" },
      { d: "M212 80 H238 V136", text: f.yes, tx: 230, ty: 72 },
      { d: "M88 80 H62 V136", text: f.no, tx: 70, ty: 72 },
      { d: "M238 164 V214 H193" },
      { d: "M62 164 V214 H107" },
    ],
    paths: ["M150 18 V80 H238 V214 H150", "M150 18 V80 H62 V214 H150"],
    captions: f.captions.decision,
  },
  // Tek dallı EĞER: Hayır dalı hiçbir şey yapmadan doğrudan Bitir'e gider
  single: {
    h: 238,
    nodes: [
      START(f),
      { x: 150, y: 80, w: 124, h: 54, shape: "decision", text: f.n.ageGe18 },
      { x: 238, y: 150, w: 104, h: 28, shape: "process", text: f.n.writeCanEnter },
      END(f, 214),
    ],
    edges: [
      { d: "M150 31 V53" },
      { d: "M212 80 H238 V136", text: f.yes, tx: 230, ty: 72 },
      { d: "M238 164 V214 H193" },
      { d: "M88 80 H52 V214 H107", text: f.no, tx: 70, ty: 72 },
    ],
    paths: ["M150 18 V80 H238 V214 H150", "M150 18 V80 H52 V214 H150"],
    captions: f.captions.single,
  },
  switch: {
    h: 238,
    nodes: [
      START(f),
      { x: 150, y: 74, w: 112, h: 46, shape: "decision", text: f.n.choice },
      { x: 52, y: 150, w: 84, h: 28, shape: "process", text: f.n.opt1 },
      { x: 150, y: 150, w: 84, h: 28, shape: "process", text: f.n.opt2 },
      { x: 248, y: 150, w: 84, h: 28, shape: "process", text: f.n.optOther },
      END(f, 214),
    ],
    edges: [
      { d: "M150 31 V51" },
      { d: "M150 97 V118 H52 V136" },
      { d: "M150 118 V136" },
      { d: "M150 118 H248 V136" },
      { d: "M52 164 V214 H107" },
      { d: "M150 164 V201" },
      { d: "M248 164 V214 H193" },
    ],
    paths: ["M150 18 V118 H52 V214 H150", "M150 18 V118 V214", "M150 18 V118 H248 V214 H150"],
    captions: f.captions.switch,
  },
  "open-branch": {
    h: 200,
    nodes: [
      START(f),
      { x: 150, y: 80, w: 124, h: 54, shape: "decision", text: f.n.gradeGe50 },
      { x: 238, y: 150, w: 96, h: 28, shape: "process", text: f.n.passed },
    ],
    edges: [
      { d: "M150 31 V53" },
      { d: "M212 80 H238 V136", text: f.yes, tx: 230, ty: 72 },
      { d: "M88 80 H52 V130", text: f.no, tx: 70, ty: 72, error: true },
    ],
    paths: ["M150 18 V80 H52 V130"],
    captions: f.captions.openBranch,
  },
  "double-exit": {
    h: 200,
    nodes: [
      START(f),
      { x: 150, y: 82, w: 136, h: 30, shape: "process", text: f.n.sumAB, error: true },
      { x: 70, y: 156, w: 96, h: 28, shape: "io", text: f.n.writeTotal },
      { x: 230, y: 156, w: 96, h: 28, shape: "io", text: f.n.writeA },
    ],
    edges: [{ d: "M150 31 V67" }, { d: "M120 97 L70 142", error: true }, { d: "M180 97 L230 142", error: true }],
    paths: ["M150 18 V82 L70 156", "M150 18 V82 L230 156"],
    captions: f.captions.doubleExit,
  },
  while: {
    h: 252,
    nodes: [
      START(f),
      { x: 150, y: 80, w: 128, h: 52, shape: "decision", text: f.n.counterLe3 },
      { x: 150, y: 150, w: 140, h: 28, shape: "process", text: f.n.counterInc },
      END(f, 228),
    ],
    edges: [
      { d: "M150 31 V54" },
      { d: "M150 106 V136", text: f.yes, tx: 172, ty: 124 },
      { d: "M150 164 V184 H262 V80 H214" },
      { d: "M86 80 H38 V228 H107", text: f.no, tx: 62, ty: 72 },
    ],
    paths: [
      "M150 18 V150 V184 H262 V80 H150 V150 V184 H262 V80 H150 V150 V184 H262 V80 H150 H38 V228 H150",
    ],
    captions: f.captions.while,
    dotMs: 7000,
  },
  dowhile: {
    h: 252,
    nodes: [
      START(f),
      { x: 150, y: 72, w: 140, h: 28, shape: "process", text: f.n.counterInc },
      { x: 150, y: 146, w: 128, h: 52, shape: "decision", text: f.n.counterLe3 },
      END(f, 228),
    ],
    edges: [
      { d: "M150 31 V58" },
      { d: "M150 86 V120" },
      { d: "M214 146 H262 V72 H220", text: f.yes, tx: 238, ty: 138 },
      { d: "M150 172 V215", text: f.no, tx: 172, ty: 196 },
    ],
    paths: ["M150 18 V146 H262 V72 H150 V146 H262 V72 H150 V146 H262 V72 H150 V228"],
    captions: f.captions.dowhile,
    dotMs: 6500,
  },
  shapes: {
    h: 120,
    nodes: [
      { x: 42, y: 50, w: 72, h: 28, shape: "terminal", text: f.n.start },
      { x: 118, y: 50, w: 70, h: 30, shape: "process", text: f.n.a5 },
      { x: 194, y: 50, w: 70, h: 50, shape: "decision", text: f.n.aGt3 },
      { x: 266, y: 50, w: 66, h: 30, shape: "io", text: f.n.readA },
    ],
    edges: [],
    paths: [],
    captions: f.captions.shapes,
  },
  };
}

export function FlowMini({ accent, label, kind }: { kind: string } & Base) {
  const flowText = useT().visuals.flow;
  const scenes = useMemo(() => buildScenes(flowText), [flowText]);
  const scene = scenes[kind] ?? scenes.linear;
  const reduce = useReducedMotion();
  const count = Math.max(scene.paths.length, scene.captions?.length ?? 1);
  const tick = useTicker(count, scene.dotMs ?? 2600);
  const path = scene.paths[tick % Math.max(1, scene.paths.length)];
  const highlight = kind === "shapes" ? tick : -1;

  return (
    <Frame label={label} accent={accent} caption={scene.captions?.[tick % scene.captions.length]}>
      <svg viewBox={`0 0 300 ${scene.h}`} className="w-full max-w-[330px]" style={{ maxHeight: 260 }}>
        <defs>
          <marker id="fc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--muted)" />
          </marker>
        </defs>
        {scene.edges.map((e, i) => (
          <g key={i}>
            <path
              d={e.d}
              fill="none"
              stroke={e.error ? "var(--bad)" : "var(--muted)"}
              strokeWidth="2"
              strokeDasharray={e.error ? "5 4" : undefined}
              markerEnd={e.error ? undefined : "url(#fc-arrow)"}
            />
            {e.text && (
              <text x={e.tx} y={e.ty} textAnchor="middle" fontSize="10.5" fontWeight="900" fill={e.error ? "var(--bad)" : "var(--muted)"}>
                {e.text}
              </text>
            )}
          </g>
        ))}
        {/* akış noktası düğümlerin ALTINDA: oklarda görünür, düğüm yazılarını kapatmaz */}
        {path && !reduce && (
          <motion.circle
            key={`${kind}-${tick}`}
            r="6.5"
            fill="var(--acc)"
            stroke="#fff"
            strokeWidth="2"
            style={{ offsetPath: `path("${path}")`, offsetRotate: "0deg" }}
            initial={{ offsetDistance: "0%" }}
            animate={{ offsetDistance: "100%" }}
            transition={{ duration: ((scene.dotMs ?? 2600) - 300) / 1000, ease: "easeInOut" }}
          />
        )}
        {scene.nodes.map((n, i) => (
          <motion.g
            key={i}
            animate={{ scale: highlight === i ? 1.12 : 1, opacity: highlight === -1 || highlight === i ? 1 : 0.5 }}
            style={{ originX: `${n.x}px`, originY: `${n.y}px` }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <ShapeEl n={n} />
          </motion.g>
        ))}
        {scene.nodes.some((n) => n.error) || scene.edges.some((e) => e.error) ? (
          <motion.g animate={reduce ? undefined : { scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ originX: "270px", originY: "26px" }}>
            <circle cx="270" cy="26" r="13" fill="var(--bad)" />
            <path d="M264 20 l12 12 M276 20 l-12 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        ) : null}
      </svg>
    </Frame>
  );
}

/** Döngü: sayaçlı (for), sonsuz ve iç içe varyantları. */
export function LoopCycle({
  accent,
  label,
  variant = "for",
  from = 1,
  to = 5,
  rows = 3,
  cols = 3,
}: Base & { variant?: "for" | "infinite" | "nested"; from?: number; to?: number; rows?: number; cols?: number }) {
  const L = useT().visuals.flow.loop;
  const reduce = useReducedMotion();
  const total = variant === "nested" ? rows * cols + 1 : variant === "infinite" ? 12 : to - from + 2;
  const tick = useTicker(total, variant === "nested" ? 650 : 900);

  if (variant === "nested") {
    const done = tick;
    const r = Math.min(rows - 1, Math.floor(Math.max(0, done - 1) / cols));
    const c = Math.max(0, done - 1) % cols;
    return (
      <Frame label={label} accent={accent} caption={done === 0 ? L.nestedStart : done > rows * cols ? L.nestedDone(rows, cols) : L.nestedStep(r + 1, c + 1)}>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `auto repeat(${cols}, 2.4rem)` }}>
          <span />
          {Array.from({ length: cols }, (_, j) => (
            <span key={j} className="text-center font-mono text-[11px] font-black text-muted">j={j + 1}</span>
          ))}
          {Array.from({ length: rows }, (_, i) => [
            <span key={`l${i}`} className="self-center pr-1 font-mono text-[11px] font-black text-muted">i={i + 1}</span>,
            ...Array.from({ length: cols }, (_, j) => {
              const idx = i * cols + j + 1;
              const on = idx <= done;
              return (
                <motion.span
                  key={`${i}-${j}`}
                  animate={{ scale: idx === done ? 1.15 : 1 }}
                  className="grid h-9 place-items-center rounded-lg border-2 font-mono text-xs font-black"
                  style={{
                    background: on ? "color-mix(in srgb, var(--acc) 22%, var(--surface))" : "var(--surface)",
                    borderColor: on ? "var(--acc)" : "var(--line)",
                  }}
                >
                  {on ? (i + 1) * (j + 1) : ""}
                </motion.span>
              );
            }),
          ])}
        </div>
      </Frame>
    );
  }

  const infinite = variant === "infinite";
  const value = infinite ? 1 + tick * (tick + 1) * 7 : Math.min(from + tick, to);
  const finished = !infinite && tick === total - 1;
  return (
    <Frame
      label={label}
      accent={accent}
      caption={infinite ? L.infinite : finished ? L.finished(to) : L.value(value)}
    >
      <div className="flex items-center gap-5">
        <div className="relative grid h-28 w-28 place-items-center">
          <motion.svg
            viewBox="0 0 100 100"
            className="absolute inset-0"
            animate={reduce || finished ? undefined : { rotate: 360 }}
            transition={{ duration: infinite ? 1.2 : 3.6, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="50" cy="50" r="40" fill="none" stroke={infinite ? "var(--bad)" : "var(--acc)"} strokeWidth="7" strokeDasharray="200 52" strokeLinecap="round" />
            <path d="M84 30 l6 -12 l5 13" fill="none" stroke={infinite ? "var(--bad)" : "var(--acc)"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </motion.svg>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted">{L.counter}</span>
            <Pop value={finished ? "✓" : value} className="font-mono text-3xl font-black" />
          </div>
        </div>
        {!infinite && (
          <ul className="flex flex-col gap-1.5 text-[12.5px] font-extrabold">
            <li className="rounded-lg bg-surface px-2.5 py-1">{L.startLabel} <b className="font-mono">{from}</b></li>
            <li className="rounded-lg bg-surface px-2.5 py-1">{L.stopLabel} <b className="font-mono">{to}</b></li>
            <li className="rounded-lg bg-surface px-2.5 py-1">{L.stepLabel} <b className="font-mono">+1</b></li>
          </ul>
        )}
      </div>
    </Frame>
  );
}
