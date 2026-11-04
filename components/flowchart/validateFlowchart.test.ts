import { describe, expect, it } from "vitest";
import { validateFlowchart } from "./validateFlowchart";
import type { FlowchartEdge, FlowchartNode } from "./types";

const expectedNodes: FlowchartNode[] = [
  { id: "n1", shape: "terminal", label: "Başla" },
  { id: "n2", shape: "io", label: "a, b oku" },
  { id: "n3", shape: "process", label: "toplam ← a + b" },
  { id: "n4", shape: "io", label: "toplam yaz" },
  { id: "n5", shape: "terminal", label: "Bitir" },
];

const expectedEdges: FlowchartEdge[] = [
  { from: "n1", to: "n2" },
  { from: "n2", to: "n3" },
  { from: "n3", to: "n4" },
  { from: "n4", to: "n5" },
];

describe("validateFlowchart", () => {
  it("tamamen doğru bir şemayı kabul eder", () => {
    const userNodes: FlowchartNode[] = expectedNodes.map((n, i) => ({ id: `u${i}`, shape: n.shape, label: n.label }));
    const userEdges: FlowchartEdge[] = [
      { from: "u0", to: "u1" },
      { from: "u1", to: "u2" },
      { from: "u2", to: "u3" },
      { from: "u3", to: "u4" },
    ];
    const result = validateFlowchart(userNodes, userEdges, expectedNodes, expectedEdges);
    expect(result.correct).toBe(true);
    expect(result.nodeResults).toEqual([true, true, true, true, true]);
  });

  it("yanlış etiketi tespit eder", () => {
    const userNodes: FlowchartNode[] = expectedNodes.map((n, i) => ({
      id: `u${i}`,
      shape: n.shape,
      label: i === 2 ? "YANLIŞ ETİKET" : n.label,
    }));
    const userEdges: FlowchartEdge[] = [
      { from: "u0", to: "u1" },
      { from: "u1", to: "u2" },
      { from: "u2", to: "u3" },
      { from: "u3", to: "u4" },
    ];
    const result = validateFlowchart(userNodes, userEdges, expectedNodes, expectedEdges);
    expect(result.correct).toBe(false);
    expect(result.nodeResults[2]).toBe(false);
    expect(result.nodeResults[0]).toBe(true);
  });

  it("etiket karşılaştırması büyük/küçük harf ve boşluğa duyarsızdır", () => {
    const userNodes: FlowchartNode[] = expectedNodes.map((n, i) => ({
      id: `u${i}`,
      shape: n.shape,
      label: `  ${n.label.toLocaleUpperCase("tr-TR")}  `,
    }));
    const userEdges: FlowchartEdge[] = [
      { from: "u0", to: "u1" },
      { from: "u1", to: "u2" },
      { from: "u2", to: "u3" },
      { from: "u3", to: "u4" },
    ];
    const result = validateFlowchart(userNodes, userEdges, expectedNodes, expectedEdges);
    expect(result.correct).toBe(true);
  });

  it("eksik bağlantıyı tespit eder", () => {
    const userNodes: FlowchartNode[] = expectedNodes.map((n, i) => ({ id: `u${i}`, shape: n.shape, label: n.label }));
    const userEdges: FlowchartEdge[] = [
      { from: "u0", to: "u1" },
      { from: "u1", to: "u2" },
      // u2 -> u3 bağlantısı eksik
      { from: "u3", to: "u4" },
    ];
    const result = validateFlowchart(userNodes, userEdges, expectedNodes, expectedEdges);
    expect(result.correct).toBe(false);
    expect(result.edgesCorrect).toBe(false);
  });

  it("yanlış şekli tespit eder", () => {
    const userNodes: FlowchartNode[] = expectedNodes.map((n, i) => ({
      id: `u${i}`,
      shape: i === 1 ? "process" : n.shape,
      label: n.label,
    }));
    const result = validateFlowchart(userNodes, [], expectedNodes, []);
    expect(result.nodeResults[1]).toBe(false);
  });

  it("eksik düğüm sayısı yanlış sonucu verir", () => {
    const userNodes: FlowchartNode[] = expectedNodes.slice(0, 3).map((n, i) => ({ id: `u${i}`, shape: n.shape, label: n.label }));
    const result = validateFlowchart(userNodes, [], expectedNodes, expectedEdges);
    expect(result.correct).toBe(false);
  });
});
