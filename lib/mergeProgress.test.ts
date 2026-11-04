import { describe, expect, it } from "vitest";
import { mergeProgress, parseRemote } from "./mergeProgress";
import { DEFAULT_PROGRESS, type Progress } from "./progress";

const make = (patch: Partial<Progress>): Progress => ({ ...DEFAULT_PROGRESS, ...patch });

describe("mergeProgress", () => {
  it("iki cihazın tamamladığı dersleri birleştirir, yüksek puanı korur", () => {
    const phone = make({ completedLessons: { "1.1": { score: 60, completedAt: "2026-11-01T10:00:00Z" }, "1.2": { score: 90, completedAt: "2026-11-02T10:00:00Z" } } });
    const pc = make({ completedLessons: { "1.1": { score: 100, completedAt: "2026-11-03T10:00:00Z" }, "2.1": { score: 70, completedAt: "2026-11-03T11:00:00Z" } } });
    const m = mergeProgress(phone, pc);
    expect(Object.keys(m.completedLessons).sort()).toEqual(["1.1", "1.2", "2.1"]);
    expect(m.completedLessons["1.1"].score).toBe(100);
  });

  it("eşit puanda ilk tamamlanma tarihini korur", () => {
    const a = make({ completedLessons: { "1.1": { score: 80, completedAt: "2026-11-03T10:00:00Z" } } });
    const b = make({ completedLessons: { "1.1": { score: 80, completedAt: "2026-11-01T10:00:00Z" } } });
    expect(mergeProgress(a, b).completedLessons["1.1"].completedAt).toBe("2026-11-01T10:00:00Z");
  });

  it("günlük etkinlikte gün başına büyük olanı alır ve XP hiç düşmez", () => {
    const a = make({ xp: 100, activity: { "2026-11-01": 40, "2026-11-02": 60 } });
    const b = make({ xp: 90, activity: { "2026-11-02": 30, "2026-11-03": 60 } });
    const m = mergeProgress(a, b);
    expect(m.activity).toEqual({ "2026-11-01": 40, "2026-11-02": 60, "2026-11-03": 60 });
    expect(m.xp).toBe(160); // etkinlik toplamı (40+60+60), iki kaydın XP'sinden büyük
  });

  it("seride daha yeni günü, eşitlikte daha büyük sayıyı seçer", () => {
    const old = make({ streak: { count: 9, lastActiveDate: "2026-11-01" } });
    const fresh = make({ streak: { count: 2, lastActiveDate: "2026-11-03" } });
    expect(mergeProgress(old, fresh).streak).toEqual({ count: 2, lastActiveDate: "2026-11-03" });
    const same = make({ streak: { count: 5, lastActiveDate: "2026-11-03" } });
    expect(mergeProgress(fresh, same).streak.count).toBe(5);
  });

  it("tekrar kuyruğunu soru bazında birleştirir", () => {
    const a = make({ reviewQueue: [{ exerciseId: "q1", dueDate: "2026-11-04", interval: 1 }, { exerciseId: "q2", dueDate: "2026-11-05", interval: 1 }] });
    const b = make({ reviewQueue: [{ exerciseId: "q1", dueDate: "2026-11-10", interval: 7 }, { exerciseId: "q3", dueDate: "2026-11-06", interval: 1 }] });
    const m = mergeProgress(a, b);
    expect(m.reviewQueue.map((e) => e.exerciseId).sort()).toEqual(["q1", "q2", "q3"]);
    expect(m.reviewQueue.find((e) => e.exerciseId === "q1")?.interval).toBe(7);
  });

  it("yerel ayarları (tema, ses) bulut kaydıyla ezmez", () => {
    const local = make({ settings: { ...DEFAULT_PROGRESS.settings, theme: "dark" } });
    const remote = make({ settings: { ...DEFAULT_PROGRESS.settings, theme: "light" } });
    expect(mergeProgress(local, remote).settings.theme).toBe("dark");
  });

  it("birleştirme tekrar uygulanınca değişmez (idempotent)", () => {
    const a = make({ xp: 50, activity: { "2026-11-03": 50 }, completedLessons: { "1.1": { score: 80, completedAt: "2026-11-03T10:00:00Z" } } });
    const b = make({ xp: 70, activity: { "2026-11-02": 70 } });
    const once = mergeProgress(a, b);
    expect(mergeProgress(once, b)).toEqual(once);
    expect(mergeProgress(once, a)).toEqual(once);
  });
});

describe("parseRemote", () => {
  it("eksik alanları varsayılanla doldurur", () => {
    const p = parseRemote({ version: 1, xp: 10 });
    expect(p?.xp).toBe(10);
    expect(p?.activity).toEqual({});
  });
  it("bilinmeyen sürümü ya da çöp veriyi reddeder", () => {
    expect(parseRemote({ version: 2 })).toBeNull();
    expect(parseRemote(null)).toBeNull();
    expect(parseRemote("x")).toBeNull();
  });
});
