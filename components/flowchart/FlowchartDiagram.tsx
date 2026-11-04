import { NodeShape } from "./NodeShape";
import type { FlowchartNode } from "./types";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;
const GAP = 36;

/**
 * Dikey, doğrusal bir akış şemasını statik olarak çizer (v1: dallanma yok —
 * bkz. plan.md "Animasyona hazır boşluk" ilkesi, karmaşık dallanan şemalar v2'de).
 * `statusFor` verilirse her düğüm için doğru/yanlış/nötr renklendirme uygulanır.
 */
export function FlowchartDiagram({
  nodes,
  statusFor,
}: {
  nodes: FlowchartNode[];
  statusFor?: (index: number) => "neutral" | "correct" | "wrong";
}) {
  const width = NODE_WIDTH + 40;
  const height = nodes.length * (NODE_HEIGHT + GAP) - GAP + 20;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto w-full max-w-xs">
      <defs>
        <marker id="fc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--muted)" />
        </marker>
      </defs>

      {nodes.map((node, i) => {
        const y = 10 + i * (NODE_HEIGHT + GAP);
        const x = 20;
        return (
          <g key={node.id}>
            {i > 0 && (
              <line
                x1={x + NODE_WIDTH / 2}
                y1={y - GAP + 4}
                x2={x + NODE_WIDTH / 2}
                y2={y - 4}
                stroke="var(--muted)"
                strokeWidth={2}
                markerEnd="url(#fc-arrow)"
              />
            )}
            <NodeShape
              shape={node.shape}
              x={x}
              y={y}
              width={NODE_WIDTH}
              height={NODE_HEIGHT}
              label={node.label}
              status={statusFor ? statusFor(i) : "neutral"}
            />
          </g>
        );
      })}
    </svg>
  );
}
