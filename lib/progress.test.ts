import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS,
  addXp,
  currentStreak,
  markLessonCompleted,
  shiftDate,
  withDefaults,
  type Progress,
} from "./progress";
import { RANKS, rankFor, rankProgress } from "./ranks";
import { tr } from "./i18n/dict/tr";

const at = (count: number, lastActiveDate: string): Progress => ({
  ...DEFAULT_PROGRESS,
  streak: { count, lastActiveDate },
});

describe("shiftDate", () => {
  it("ay ve yıl sınırlarını doğru geçer", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("seri (markLessonCompleted)", () => {
  it("dün çalışıldıysa bir artar", () => {
    expect(markLessonCompleted(at(4, "2026-11-02"), "0.1", 100, "2026-11-03").streak).toEqual({
      count: 5,
      lastActiveDate: "2026-11-03",
    });
  });
  it("aynı gün ikinci ders seriyi değiştirmez", () => {
    expect(markLessonCompleted(at(4, "2026-11-03"), "0.2", 100, "2026-11-03").streak.count).toBe(4);
  });
  it("gün atlandıysa 1'den yeniden başlar", () => {
    expect(markLessonCompleted(at(9, "2026-10-20"), "0.1", 100, "2026-11-03").streak.count).toBe(1);
  });
  it("hiç çalışılmamışsa 1 olur", () => {
    expect(markLessonCompleted(DEFAULT_PROGRESS, "0.1", 100, "2026-11-03").streak.count).toBe(1);
  });
});

describe("currentStreak", () => {
  it("dün ya da bugün çalışıldıysa seriyi gösterir, daha eskiyse 0", () => {
    expect(currentStreak(at(5, "2026-11-03"), "2026-11-03")).toBe(5);
    expect(currentStreak(at(5, "2026-11-02"), "2026-11-03")).toBe(5);
    expect(currentStreak(at(5, "2026-11-01"), "2026-11-03")).toBe(0);
  });
});

describe("addXp", () => {
  it("XP kazanmak (ör. tekrar sorusu) seriyi de canlı tutar", () => {
    expect(addXp(at(3, "2026-11-02"), 6, "2026-11-03").streak).toEqual({ count: 4, lastActiveDate: "2026-11-03" });
    expect(addXp(at(3, "2026-11-02"), 0, "2026-11-03").streak.count).toBe(3);
  });
  it("toplam XP'yi ve günün aktivitesini artırır", () => {
    const p = addXp(addXp(DEFAULT_PROGRESS, 10, "2026-11-03"), 15, "2026-11-03");
    expect(p.xp).toBe(25);
    expect(p.activity["2026-11-03"]).toBe(25);
  });
});

describe("withDefaults", () => {
  it("eski kayıtta olmayan yeni ayarları varsayılanla doldurur", () => {
    const old = { version: 1, xp: 50, settings: { dailyGoal: 2, heartsEnabled: true, theme: "dark" } } as unknown as Partial<Progress>;
    const p = withDefaults(old);
    // kaldırılan can ayarı eski kayıttan atılır
    expect(p.settings).toEqual({ dailyGoal: 2, theme: "dark", sound: true, haptics: true });
    expect(p.hearts).toBe(5);
    expect(p.activity).toEqual({});
    expect(p.xp).toBe(50);
  });
});

describe("rütbeler", () => {
  it("eşiklere göre doğru rütbeyi verir", () => {
    const title = (xp: number) => tr.ranks.titles[rankFor(xp).id];
    expect(title(0)).toBe("Çırak");
    expect(title(149)).toBe("Çırak");
    expect(title(150)).toBe("Kâşif");
    expect(rankFor(999_999).id).toBe(RANKS[RANKS.length - 1].id);
  });
  it("sonraki rütbeye ilerleme yüzdesini hesaplar", () => {
    expect(rankProgress(75)).toMatchObject({ into: 75, need: 150, pct: 50 });
    expect(rankProgress(5000)).toMatchObject({ next: null, pct: 100 });
  });
});
