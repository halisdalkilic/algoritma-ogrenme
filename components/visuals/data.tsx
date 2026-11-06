"use client";

import { useMemo } from "react";
import { m } from "framer-motion";
import { Frame, Pop, useTicker } from "./kit";
import { useT } from "@/lib/i18n/context";
import type { Dictionary } from "@/lib/i18n/dict/tr";

type DataText = Dictionary["visuals"]["data"];

type Base = { accent: string; label: string };
type Val = number | string;

type CellState = "idle" | "active" | "found" | "dim" | "best" | "error";
const CELL: Record<CellState, { bg: string; border: string }> = {
  idle: { bg: "var(--surface)", border: "var(--line)" },
  active: { bg: "color-mix(in srgb, var(--acc) 22%, var(--surface))", border: "var(--acc)" },
  found: { bg: "var(--good-soft)", border: "var(--good)" },
  best: { bg: "color-mix(in srgb, var(--xp) 25%, var(--surface))", border: "var(--xp)" },
  dim: { bg: "var(--surface)", border: "var(--line)" },
  error: { bg: "var(--bad-soft)", border: "var(--bad)" },
};

type Frm = { states: CellState[]; caption: string; side?: { name: string; value: Val } };

/** Dizi kareleri: her mod, gerçek algoritmanın adımlarından üretilir. */
function arrayFrames(values: Val[], mode: string, target: Val | undefined, name: string, x: DataText): Frm[] {
  const n = values.length;
  const base = (fill: CellState = "idle"): CellState[] => Array(n).fill(fill);
  const out: Frm[] = [];
  if (mode === "index") {
    values.forEach((v, i) => {
      const s = base();
      s[i] = "active";
      out.push({ states: s, caption: `${name}[${i}] = ${v}` });
    });
  } else if (mode === "scan" || mode === "bounds") {
    values.forEach((v, i) => {
      const s = base();
      s[i] = "active";
      out.push({ states: s, caption: x.scanStep(i, name, v) });
    });
    if (mode === "bounds") out.push({ states: [...base(), "error"], caption: x.boundsOut(n, name) });
    else out.push({ states: base("found"), caption: x.scanDone(n) });
  } else if (mode === "search") {
    let found = -1;
    for (let i = 0; i < n; i++) {
      const s = base();
      s[i] = "active";
      out.push({ states: s, caption: `${name}[${i}] = ${values[i]} · ${values[i] === target ? x.equal : `≠ ${target}`}` });
      if (values[i] === target) {
        found = i;
        break;
      }
    }
    const s = base("dim");
    if (found >= 0) s[found] = "found";
    out.push({ states: s, caption: found >= 0 ? x.searchFound(found) : x.searchMissing });
  } else if (mode === "max") {
    let best = 0;
    out.push({ states: Object.assign(base(), { 0: "best" }) as CellState[], caption: `enBuyuk ← ${name}[0]`, side: { name: "enBuyuk", value: values[0] } });
    for (let i = 1; i < n; i++) {
      const s = base();
      s[best] = "best";
      s[i] = "active";
      const current = values[best];
      const bigger = Number(values[i]) > Number(current);
      if (bigger) best = i;
      out.push({ states: s, caption: x.maxCompare(values[i], current, bigger), side: { name: x.largestName, value: values[best] } });
    }
    const s = base("dim");
    s[best] = "best";
    out.push({ states: s, caption: x.maxResult(x.largestName, values[best]), side: { name: x.largestName, value: values[best] } });
  } else if (mode === "binary") {
    let lo = 0;
    let hi = n - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const s = base("dim");
      for (let i = lo; i <= hi; i++) s[i] = "idle";
      s[mid] = values[mid] === target ? "found" : "active";
      const v = Number(values[mid]);
      const t = Number(target);
      out.push({
        states: s,
        caption: v === t ? x.binaryFound(v, out.length + 1) : t < v ? x.binaryLeft(v, t) : x.binaryRight(v, t),
      });
      if (v === t) break;
      if (t < v) hi = mid - 1;
      else lo = mid + 1;
    }
  }
  return out;
}

export function ArrayCells({
  accent,
  label,
  values,
  mode = "index",
  target,
  name,
  cols,
}: Base & { values: Val[]; mode?: string; target?: Val; name?: string; cols?: number }) {
  const t = useT();
  const x = t.visuals.data;
  const arrayName = name ?? x.arrayName;
  const frames = useMemo(() => {
    if (mode === "matrix" && cols) {
      const rows = Math.ceil(values.length / cols);
      const f: Frm[] = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const s: CellState[] = Array(values.length).fill("idle");
          for (let k = 0; k < cols; k++) s[r * cols + k] = "dim";
          s[r * cols + c] = "active";
          f.push({ states: s, caption: `${arrayName}[${r}][${c}] = ${values[r * cols + c]}` });
        }
      return f;
    }
    return arrayFrames(values, mode, target, arrayName, x);
  }, [values, mode, target, arrayName, cols, x]);
  const tick = useTicker(frames.length, mode === "binary" ? 1700 : 1100);
  const f = frames[tick];
  const extra = mode === "bounds" ? 1 : 0;
  // Uzun dizilerde hücreler küçülür: telefonda tek satıra sığsın
  const count = values.length + extra;
  const size = count > 8 ? "h-7 w-7 text-[11.5px] rounded-lg" : count > 6 ? "h-8 w-8 text-[12.5px] rounded-xl" : "h-11 w-11 text-[15px] rounded-xl";
  const compact = count > 6;

  const cell = (v: Val | undefined, i: number) => {
    const st = f.states[i] ?? "idle";
    return (
      <div key={i} className="flex flex-col items-center gap-1">
        <m.div
          animate={{ scale: st === "active" || st === "found" || st === "error" ? 1.1 : 1, opacity: st === "dim" ? 0.35 : 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 22 }}
          className={`grid place-items-center border-2 font-mono font-black ${size}`}
          style={{ background: CELL[st].bg, borderColor: CELL[st].border, borderStyle: v === undefined ? "dashed" : "solid" }}
        >
          {v ?? "?"}
        </m.div>
        {mode !== "matrix" && <span className="font-mono text-[10.5px] font-black text-muted">{i}</span>}
      </div>
    );
  };

  return (
    <Frame label={label} accent={accent} caption={f.caption}>
      {mode === "matrix" && cols ? (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
          {values.map((v, i) => cell(v, i))}
        </div>
      ) : (
        <div className={`flex flex-wrap items-start justify-center ${compact ? "gap-1" : "gap-1.5"}`}>
          {[...values, ...Array(extra).fill(undefined)].map((v, i) => cell(v, i))}
        </div>
      )}
      {f.side && (
        <div className="flex items-center gap-2 rounded-xl border-2 px-3 py-1" style={{ borderColor: "var(--xp)", background: "var(--surface)" }}>
          <span className="font-mono text-[12px] font-black text-muted">{f.side.name}</span>
          <Pop value={f.side.value} className="font-mono text-lg font-black" />
        </div>
      )}
    </Frame>
  );
}

/** Kabarcık / seçmeli sıralama: gerçek algoritmanın karşılaştırma ve takas adımları. */
function sortFrames(input: number[], algo: "bubble" | "selection", x: DataText) {
  const a = input.map((v, id) => ({ v, id }));
  const frames: { arr: typeof a; cmp: number[]; sortedFrom: number; sortedTo: number; caption: string }[] = [];
  const n = a.length;
  if (algo === "bubble") {
    for (let pass = 0; pass < n - 1; pass++) {
      for (let j = 0; j < n - 1 - pass; j++) {
        const swap = a[j].v > a[j + 1].v;
        frames.push({ arr: [...a], cmp: [j, j + 1], sortedFrom: n - pass, sortedTo: n, caption: x.bubbleCompare(a[j].v, a[j + 1].v, swap) });
        if (swap) [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
  } else {
    for (let i = 0; i < n - 1; i++) {
      let m = i;
      for (let j = i + 1; j < n; j++) if (a[j].v < a[m].v) m = j;
      frames.push({ arr: [...a], cmp: [i, m], sortedFrom: 0, sortedTo: i, caption: x.selectionMin(a[m].v, i) });
      [a[i], a[m]] = [a[m], a[i]];
    }
  }
  frames.push({ arr: [...a], cmp: [], sortedFrom: 0, sortedTo: n, caption: x.sorted });
  return frames;
}

export function SortBars({ accent, label, values, algo = "bubble" }: Base & { values: number[]; algo?: "bubble" | "selection" }) {
  const x = useT().visuals.data;
  const frames = useMemo(() => sortFrames(values, algo, x), [values, algo, x]);
  const tick = useTicker(frames.length, 1000);
  const f = frames[tick];
  const max = Math.max(...values);
  return (
    <Frame label={label} accent={accent} caption={f.caption}>
      <div className="flex h-28 items-end gap-2">
        {f.arr.map((item, i) => {
          const sorted = algo === "bubble" ? i >= f.sortedFrom : i < f.sortedTo;
          const cmp = f.cmp.includes(i);
          return (
            <m.div
              key={item.id}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="flex w-9 flex-col items-center justify-end rounded-t-lg pb-1 font-mono text-xs font-black text-white"
              style={{
                height: `${28 + (item.v / max) * 72}%`,
                background: sorted ? "var(--good)" : cmp ? "var(--acc)" : "var(--disabled-ink)",
              }}
            >
              {item.v}
            </m.div>
          );
        })}
      </div>
    </Frame>
  );
}

/** İzleme tablosu: her tur bir satır olarak eklenir. */
export function TraceTable({ accent, label, columns, rows }: Base & { columns: string[]; rows: Val[][] }) {
  const x = useT().visuals.data;
  const tick = useTicker(rows.length + 1, 1100);
  return (
    <Frame label={label} accent={accent} caption={tick < rows.length ? x.traceRound(tick + 1) : x.traceDone}>
      <table className="overflow-hidden rounded-xl border-2 border-line bg-surface text-center font-mono text-[13px]">
        <thead>
          <tr style={{ background: "color-mix(in srgb, var(--acc) 18%, var(--surface))" }}>
            {columns.map((c) => (
              <th key={c} className="px-4 py-1.5 font-black">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <m.tr
              key={i}
              animate={{ opacity: i <= tick ? 1 : 0.12 }}
              className="border-t-2 border-line"
              style={{ background: i === tick ? "color-mix(in srgb, var(--acc) 10%, transparent)" : undefined }}
            >
              {r.map((v, j) => (
                <td key={j} className="px-4 py-1 font-bold">{v}</td>
              ))}
            </m.tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}
