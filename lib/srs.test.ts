import { describe, expect, it } from "vitest";
import { getDueEntries, recordReviewResult, recordWrongAnswer } from "./srs";

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("recordWrongAnswer", () => {
  it("yeni bir girdiyi 1 gün sonrasına planlar", () => {
    const queue = recordWrongAnswer([], "ex1", NOW);
    expect(queue).toHaveLength(1);
    expect(queue[0].interval).toBe(0);
    expect(queue[0].dueDate).toBe("2026-01-02T00:00:00.000Z");
  });

  it("aynı alıştırma tekrar yanlış yapılırsa 0. aşamaya sıfırlanır", () => {
    let queue = recordWrongAnswer([], "ex1", NOW);
    queue = recordReviewResult(queue, "ex1", true, NOW); // → aşama 1 (3 gün)
    queue = recordWrongAnswer(queue, "ex1", NOW); // tekrar yanlış → aşama 0
    expect(queue).toHaveLength(1);
    expect(queue[0].interval).toBe(0);
  });
});

describe("recordReviewResult", () => {
  it("doğru cevapta bir sonraki aşamaya (3 gün) geçer", () => {
    let queue = recordWrongAnswer([], "ex1", NOW);
    queue = recordReviewResult(queue, "ex1", true, NOW);
    expect(queue[0].interval).toBe(1);
    expect(queue[0].dueDate).toBe("2026-01-04T00:00:00.000Z");
  });

  it("son aşamada doğru cevap kuyruktan çıkarır (ustalaşıldı)", () => {
    let queue = recordWrongAnswer([], "ex1", NOW); // aşama 0
    queue = recordReviewResult(queue, "ex1", true, NOW); // aşama 1
    queue = recordReviewResult(queue, "ex1", true, NOW); // aşama 2 (son)
    queue = recordReviewResult(queue, "ex1", true, NOW); // ustalaşıldı
    expect(queue).toHaveLength(0);
  });

  it("yanlış cevap 0. aşamaya geri döner", () => {
    let queue = recordWrongAnswer([], "ex1", NOW);
    queue = recordReviewResult(queue, "ex1", true, NOW); // aşama 1
    queue = recordReviewResult(queue, "ex1", false, NOW); // aşama 0'a döner
    expect(queue[0].interval).toBe(0);
  });

  it("kuyrukta olmayan bir alıştırma için kuyruğu değiştirmez", () => {
    const queue = recordReviewResult([], "ex-yok", true, NOW);
    expect(queue).toEqual([]);
  });
});

describe("getDueEntries", () => {
  it("vadesi gelmiş girdileri döner", () => {
    const queue = recordWrongAnswer([], "ex1", NOW);
    const due = getDueEntries(queue, new Date("2026-01-02T00:00:00.000Z"));
    expect(due).toHaveLength(1);
  });

  it("vadesi gelmemiş girdileri dönmez", () => {
    const queue = recordWrongAnswer([], "ex1", NOW);
    const due = getDueEntries(queue, new Date("2026-01-01T12:00:00.000Z"));
    expect(due).toHaveLength(0);
  });
});
