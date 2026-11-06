"use client";

import type { ComponentType } from "react";
import { LazyMotion } from "framer-motion";
import { playStyle, useOnScreen } from "@/components/ui/useOnScreen";
import { VisibleContext } from "./kit";
import dynamic from "next/dynamic";
import type { VisualName } from "./names";

/**
 * İçerikteki `concept[].visual` alanını bileşene çevirir:
 *   { "type": "animation", "component": "array", "props": { "values": [70, 85, 90], "mode": "index" } }
 * Tanınmayan bileşen ya da eksik görsel → hiçbir şey çizilmez (kart sadece metinle kalır).
 */
// Record<VisualName, …>: names.ts'e eklenen her ad burada da karşılık bulmak ZORUNDA (tip hatası verir).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Her görsel ayrı yüklenir (P7): ders yalnızca kullandığı görselin kodunu indirir. SSR açık kalır: HTML hazır gelir.
const REGISTRY: Record<VisualName, ComponentType<any>> = {
  ipo: dynamic(() => import("./basic").then((mod) => mod.IpoFlow)),
  steps: dynamic(() => import("./basic").then((mod) => mod.StepList)),
  tokens: dynamic(() => import("./basic").then((mod) => mod.TokenGrid)),
  vars: dynamic(() => import("./basic").then((mod) => mod.VarBoxes)),
  flow: dynamic(() => import("./flow").then((mod) => mod.FlowMini)),
  loop: dynamic(() => import("./flow").then((mod) => mod.LoopCycle)),
  array: dynamic(() => import("./data").then((mod) => mod.ArrayCells)),
  sort: dynamic(() => import("./data").then((mod) => mod.SortBars)),
  trace: dynamic(() => import("./data").then((mod) => mod.TraceTable)),
  logic: dynamic(() => import("./logic").then((mod) => mod.LogicLamps)),
  recursion: dynamic(() => import("./logic").then((mod) => mod.RecursionStack)),
  growth: dynamic(() => import("./logic").then((mod) => mod.GrowthChart)),
};

const loadVisualFeatures = () => import("./visualFeatures").then((mod) => mod.default);

export type VisualSpec = {
  type: "static-svg" | "animation";
  src?: string;
  component?: string;
  props?: Record<string, unknown>;
};

export function ConceptVisual({ visual, accent, label }: { visual?: VisualSpec; accent: string; label: string }) {
  if (!visual || visual.type !== "animation" || !visual.component) return null;
  return <VisualHost visual={visual} accent={accent} label={label} />;
}

function VisualHost({ visual, accent, label }: { visual: VisualSpec; accent: string; label: string }) {
  const [ref, visible] = useOnScreen<HTMLDivElement>("120px");
  const Comp = REGISTRY[visual.component as VisualName];
  if (!Comp) return null;
  // Görsellerde `layout` animasyonu var: bu, genel (küçük) pakete değil, yalnızca görsel gösterilirken
  // yüklenen `domMax` paketine ihtiyaç duyar. İç içe LazyMotion dış olanın üzerine yazar.
  return (
    <div ref={ref} className="ambient" style={playStyle(visible)}>
      <VisibleContext.Provider value={visible}>
        <LazyMotion features={loadVisualFeatures} strict>
          <Comp accent={accent} label={label} {...visual.props} />
        </LazyMotion>
      </VisibleContext.Provider>
    </div>
  );
}
