export type FlowchartShape = "terminal" | "process" | "decision" | "io";

export type FlowchartNode = {
  id: string;
  shape: FlowchartShape;
  label: string;
};

export type FlowchartEdge = {
  from: string;
  to: string;
  label?: string;
};
