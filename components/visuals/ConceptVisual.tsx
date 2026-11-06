"use client";

import { useState, type ComponentType } from "react";
import { useT } from "@/lib/i18n/context";
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
// Her görsel ayrı yüklenir (P7): ders yalnızca kullandığı görselin kodunu indirir. SSR açık kalır: HTML hazır gelir.
const loadVisualFeatures = () => import("./visualFeatures").then((mod) => mod.default);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

/** "Başka örnek" (S21): aynı görselin değerlerini deterministik olarak değiştirir; yalnızca sıralama ve arama görselleri. */
function variantProps(component: string, props: Record<string, unknown> | undefined, n: number): Record<string, unknown> | undefined {
  if (!props || n === 0) return props;
  if (component === "sort" && Array.isArray(props.values)) {
    const values = props.values as number[];
    const shuffled = [...values].sort((a, b) => ((a * 31 + n * 17) % 11) - ((b * 31 + n * 17) % 11));
    const sorted = shuffled.every((v, i) => i === 0 || shuffled[i - 1] <= v);
    return { ...props, values: sorted ? [...shuffled].reverse() : shuffled };
  }
  if (component === "array" && props.target !== undefined && Array.isArray(props.values)) {
    const values = props.values as unknown[];
    return { ...props, target: values[(n * 3 + 2) % values.length] };
  }
  return props;
}

function hasVariants(component: string, props: Record<string, unknown> | undefined): boolean {
  return component === "sort" || (component === "array" && props?.target !== undefined);
}

function VisualHost({ visual, accent, label }: { visual: VisualSpec; accent: string; label: string }) {
  const t = useT();
  const [ref, visible] = useOnScreen<HTMLDivElement>("120px");
  // Her tıklamada artar: key değişince görsel baştan kurulur (S19 yeniden oynat); variant S21 için değer seçer.
  const [replay, setReplay] = useState(0);
  const [variant, setVariant] = useState(0);
  const Comp = REGISTRY[visual.component as VisualName];
  if (!Comp) return null;
  // Görsellerde `layout` animasyonu var: bu, genel (küçük) pakete değil `domMax` paketine ihtiyaç duyar.
  // Paket ayrı parçadır ve LessonPlayer ders açılırken önceden yükler (görsel ilk "Devam"dan sonra görünür);
  // böylece ilk yükleme küçük kalır ve içerik yanıp sönmez. İç içe LazyMotion dış olanın üzerine yazar.
  return (
    <div ref={ref} className="ambient relative" style={playStyle(visible)}>
      <VisibleContext.Provider value={visible}>
        <LazyMotion features={loadVisualFeatures} strict>
          <Comp key={`${replay}-${variant}`} accent={accent} label={label} {...variantProps(visual.component ?? "", visual.props, variant)} />
        </LazyMotion>
      </VisibleContext.Provider>
      <div className="absolute right-2 top-2 flex gap-1.5">
        {hasVariants(visual.component ?? "", visual.props) && (
          <button type="button" className="visual-tool" onClick={() => setVariant((v) => v + 1)} title={t.visuals.another} aria-label={t.visuals.another}>
            🎲
          </button>
        )}
        <button type="button" className="visual-tool" onClick={() => setReplay((r) => r + 1)} title={t.visuals.replay} aria-label={t.visuals.replay}>
          ⟲
        </button>
      </div>
    </div>
  );
}
