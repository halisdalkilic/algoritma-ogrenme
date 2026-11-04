import { sameText } from "@/lib/answers";
import type { FlowchartEdge, FlowchartNode } from "./types";

export type FlowchartValidationResult = {
  correct: boolean;
  /** Beklenen dizideki her pozisyon için kullanıcının doğru olup olmadığı. */
  nodeResults: boolean[];
  edgesCorrect: boolean;
};

/**
 * Kullanıcının kurduğu şemayı (userNodes/userEdges) beklenen yapıyla
 * (expectedNodes/expectedEdges) karşılaştırır.
 *
 * Karşılaştırma DİZİ SIRASINA göre yapılır: userNodes[i], expectedNodes[i]
 * ile eşleştirilir (id'ler farklı olabilir — önemli olan şekil ve etikettir).
 * Kenarlar da aynı şekilde, expectedEdges'teki id'ler expectedNodes
 * dizisindeki POZİSYONA çevrilip userEdges'te aynı pozisyonlar arasında bir
 * bağlantı olup olmadığı kontrol edilir. Bu, kullanıcı arayüzünün id
 * üretme biçiminden bağımsız, basit ve öngörülebilir bir doğrulama sağlar.
 */
export function validateFlowchart(
  userNodes: FlowchartNode[],
  userEdges: FlowchartEdge[],
  expectedNodes: FlowchartNode[],
  expectedEdges: FlowchartEdge[],
): FlowchartValidationResult {
  const nodeResults = expectedNodes.map((expected, i) => {
    const actual = userNodes[i];
    if (!actual) return false;
    return actual.shape === expected.shape && sameText(actual.label, expected.label);
  });

  const expectedIndexOf = new Map(expectedNodes.map((n, i) => [n.id, i]));
  const userPairSet = new Set(
    userEdges.map((e) => {
      const fromIdx = userNodes.findIndex((n) => n.id === e.from);
      const toIdx = userNodes.findIndex((n) => n.id === e.to);
      return `${fromIdx}->${toIdx}`;
    }),
  );

  const edgesCorrect = expectedEdges.every((e) => {
    const fromIdx = expectedIndexOf.get(e.from);
    const toIdx = expectedIndexOf.get(e.to);
    if (fromIdx === undefined || toIdx === undefined) return false;
    return userPairSet.has(`${fromIdx}->${toIdx}`);
  });

  const correct =
    userNodes.length === expectedNodes.length && nodeResults.every(Boolean) && edgesCorrect;

  return { correct, nodeResults, edgesCorrect };
}
