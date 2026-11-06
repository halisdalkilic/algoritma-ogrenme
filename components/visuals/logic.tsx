"use client";

import { AnimatePresence, m } from "framer-motion";
import { Frame, useTicker } from "./kit";
import { useT } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/dict/tr";

type RecursionText = Dictionary["visuals"]["logic"]["recursion"];

type Base = { accent: string; label: string };

function Lamp({ on, size = 30 }: { on: boolean; size?: number }) {
  const L = useT().visuals.logic;
  return (
    <m.span
      animate={{ scale: on ? [1, 1.15, 1] : 1 }}
      transition={{ duration: 0.35 }}
      className="grid place-items-center rounded-full border-2 font-mono text-[10px] font-black"
      style={{
        width: size,
        height: size,
        background: on ? "var(--good)" : "var(--surface)",
        borderColor: on ? "var(--good-dark)" : "var(--line)",
        color: on ? "#fff" : "var(--muted)",
        boxShadow: on ? "0 0 14px color-mix(in srgb, var(--good) 60%, transparent)" : undefined,
      }}
    >
      {on ? L.lampTrue : L.lampFalse}
    </m.span>
  );
}

const COMBOS: [boolean, boolean][] = [
  [false, false],
  [false, true],
  [true, false],
  [true, true],
];

/** VE / VEYA / DEĞİL lambaları ya da doğruluk tablosu. D = DOĞRU, Y = YANLIŞ. */
export function LogicLamps({ accent, label, view = "gates" }: Base & { view?: "gates" | "table" }) {
  const L = useT().visuals.logic;
  const tf = (v: boolean) => (v ? L.lampTrue : L.lampFalse);
  const tick = useTicker(4, 1600);
  const [a, b] = COMBOS[tick];

  if (view === "table") {
    return (
      <Frame label={label} accent={accent} caption={`A = ${tf(a)}, B = ${tf(b)} → ${L.and}: ${tf(a && b)} · ${L.or}: ${tf(a || b)}`}>
        <table className="overflow-hidden rounded-xl border-2 border-line bg-surface text-center font-mono text-[13px]">
          <thead>
            <tr style={{ background: "color-mix(in srgb, var(--acc) 18%, var(--surface))" }}>
              {["A", "B", `A ${L.and} B`, `A ${L.or} B`].map((h) => (
                <th key={h} className="px-3 py-1.5 font-black">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMBOS.map(([x, y], i) => (
              <tr key={i} className="border-t-2 border-line" style={{ background: i === tick ? "color-mix(in srgb, var(--acc) 14%, transparent)" : undefined }}>
                {[x, y, x && y, x || y].map((v, j) => (
                  <td key={j} className="px-3 py-1 font-black" style={{ color: v ? "var(--good)" : "var(--muted)" }}>
                    {tf(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Frame>
    );
  }

  const gates: { op: string; inputs: boolean[]; out: boolean }[] = [
    { op: L.and, inputs: [a, b], out: a && b },
    { op: L.or, inputs: [a, b], out: a || b },
    { op: L.not, inputs: [a], out: !a },
  ];
  return (
    <Frame label={label} accent={accent} caption={L.legend}>
      <div className="flex flex-wrap justify-center gap-3">
        {gates.map((g) => (
          <div key={g.op} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-line bg-surface px-3 py-2.5">
            <div className="flex gap-1.5">
              {g.inputs.map((v, i) => (
                <Lamp key={i} on={v} size={24} />
              ))}
            </div>
            <span className="rounded-md px-2 py-0.5 text-[12px] font-black text-white" style={{ background: "var(--acc)" }}>
              {g.op}
            </span>
            <Lamp on={g.out} size={34} />
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** faktoriyel(n): çağrılar yığına girer, taban durumdan sonra sonuçlar geri döner. */
type StackFrame = { stack: { k: number; note: string; tone: "acc" | "good" | "bad" }[]; caption: string };

function recursionFrames(n: number, noBase: boolean, x: RecursionText): StackFrame[] {
  const fact = (k: number): number => (k <= 1 ? 1 : k * fact(k - 1));
  const frames: StackFrame[] = [];
  const stack: StackFrame["stack"] = [];
  if (noBase) {
    for (let k = n; k > n - 6; k--) {
      stack.push({ k, note: `${k} × …`, tone: k < 1 ? "bad" : "acc" });
      frames.push({ stack: [...stack], caption: k < 1 ? x.noBase : x.callsItself(x.fn, k) });
    }
    return frames;
  }
  for (let k = n; k >= 1; k--) {
    stack.push({ k, note: k === 1 ? "= 1" : `${k} × …`, tone: k === 1 ? "good" : "acc" });
    frames.push({ stack: [...stack], caption: k === 1 ? x.baseCase(x.fn) : x.calls(x.fn, k) });
  }
  for (let k = 2; k <= n; k++) {
    stack.pop();
    stack[stack.length - 1] = { k, note: `= ${fact(k)}`, tone: "good" };
    frames.push({ stack: [...stack], caption: x.returned(x.fn, k, fact(k - 1), fact(k)) });
  }
  return frames;
}

export function RecursionStack({ accent, label, n = 3, noBase = false }: Base & { n?: number; noBase?: boolean }) {
  const x = useT().visuals.logic.recursion;
  const frames = recursionFrames(n, noBase, x);
  const tick = useTicker(frames.length, 1100);
  const f = frames[tick];
  const tones = { acc: ["var(--surface)", "var(--acc)"], good: ["var(--good-soft)", "var(--good)"], bad: ["var(--bad-soft)", "var(--bad)"] };
  return (
    <Frame label={label} accent={accent} caption={f.caption}>
      <div className="flex min-h-[150px] flex-col-reverse items-center justify-start gap-1">
        <AnimatePresence initial={false}>
          {f.stack.map((item) => (
            <m.div
              key={item.k}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              className="flex w-52 items-center justify-between rounded-xl border-2 px-3 py-1.5 font-mono text-[13px] font-black"
              style={{ background: tones[item.tone][0], borderColor: tones[item.tone][1] }}
            >
              <span>{x.fn}({item.k})</span>
              <span className="text-muted">{item.note}</span>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </Frame>
  );
}

/** Büyüme hızı: O(1), O(log n), O(n), O(n²) eğrileri çizilir. */
export function GrowthChart({ accent, label, lines = ["1", "n", "n2"] }: Base & { lines?: string[] }) {
  const L = useT().visuals.logic;
  const W = 260;
  const H = 130;
  const N = 10;
  const defs: Record<string, { f: (x: number) => number; color: string; name: string }> = {
    "1": { f: () => 1, color: "var(--good)", name: "O(1)" },
    log: { f: (x) => Math.log2(x + 1), color: "#3b82f6", name: "O(log n)" },
    n: { f: (x) => x, color: "var(--xp)", name: "O(n)" },
    n2: { f: (x) => x * x, color: "var(--bad)", name: "O(n²)" },
  };
  const maxY = N; // y ekseni n'e göre kırpılır: n² hızla tavana vurur
  // Eğri grafik alanını aştığı yerde kesilir (tavanda yatay devam etseydi "büyüme duruyor" gibi görünürdü)
  const toPath = (f: (x: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 80; i++) {
      const x = (i / 80) * N;
      const y = f(x);
      if (y > maxY) {
        // sınırı tam tepede kes: f(x) = maxY olan noktaya kadar uzat
        let lo = ((i - 1) / 80) * N, hi = x;
        for (let k = 0; k < 20; k++) { const mid = (lo + hi) / 2; if (f(mid) > maxY) hi = mid; else lo = mid; }
        pts.push(`L${(lo / N) * W} 0`);
        break;
      }
      pts.push(`${i ? "L" : "M"}${(x / N) * W} ${H - (y / maxY) * H}`);
    }
    return pts.join(" ");
  };
  return (
    <Frame label={label} accent={accent}>
      <div className="flex items-center gap-3">
        <svg viewBox={`-8 -6 ${W + 16} ${H + 22}`} className="w-[240px] max-w-full">
          <path d={`M0 0 V${H} H${W}`} fill="none" stroke="var(--muted)" strokeWidth="2" />
          <text x={W} y={H + 15} textAnchor="end" fontSize="10" fontWeight="800" fill="var(--muted)">{L.xAxis}</text>
          {lines.map((k, i) => (
            <m.path
              key={k}
              d={toPath(defs[k].f)}
              fill="none"
              stroke={defs[k].color}
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: i * 0.35, ease: "easeOut" }}
            />
          ))}
        </svg>
        <ul className="flex flex-col gap-1.5">
          {lines.map((k) => (
            <li key={k} className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[12px] font-black">
              <span className="h-2.5 w-4 rounded-full" style={{ background: defs[k].color }} />
              {defs[k].name}
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}
