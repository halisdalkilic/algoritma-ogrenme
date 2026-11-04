"use client";

import type { ComponentType } from "react";
import { IpoFlow, StepList, TokenGrid, VarBoxes } from "./basic";
import { FlowMini, LoopCycle } from "./flow";
import { ArrayCells, SortBars, TraceTable } from "./data";
import { GrowthChart, LogicLamps, RecursionStack } from "./logic";
import type { VisualName } from "./names";

/**
 * İçerikteki `concept[].visual` alanını bileşene çevirir:
 *   { "type": "animation", "component": "array", "props": { "values": [70, 85, 90], "mode": "index" } }
 * Tanınmayan bileşen ya da eksik görsel → hiçbir şey çizilmez (kart sadece metinle kalır).
 */
// Record<VisualName, …>: names.ts'e eklenen her ad burada da karşılık bulmak ZORUNDA (tip hatası verir).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<VisualName, ComponentType<any>> = {
  ipo: IpoFlow,
  steps: StepList,
  tokens: TokenGrid,
  vars: VarBoxes,
  flow: FlowMini,
  loop: LoopCycle,
  array: ArrayCells,
  sort: SortBars,
  trace: TraceTable,
  logic: LogicLamps,
  recursion: RecursionStack,
  growth: GrowthChart,
};

export type VisualSpec = {
  type: "static-svg" | "animation";
  src?: string;
  component?: string;
  props?: Record<string, unknown>;
};

export function ConceptVisual({ visual, accent, label }: { visual?: VisualSpec; accent: string; label: string }) {
  if (!visual || visual.type !== "animation" || !visual.component) return null;
  const Comp = REGISTRY[visual.component as VisualName];
  if (!Comp) return null;
  return <Comp accent={accent} label={label} {...visual.props} />;
}
