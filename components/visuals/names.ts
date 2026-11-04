/** İçerikte `visual.component` olarak kullanılabilecek görsel adları (bkz. ConceptVisual). */
export const VISUAL_NAMES = [
  "ipo",
  "steps",
  "tokens",
  "vars",
  "flow",
  "loop",
  "array",
  "sort",
  "trace",
  "logic",
  "recursion",
  "growth",
] as const;

export type VisualName = (typeof VISUAL_NAMES)[number];

export const FLOW_KINDS = ["linear", "decision", "single", "switch", "open-branch", "double-exit", "while", "dowhile", "shapes"] as const;
