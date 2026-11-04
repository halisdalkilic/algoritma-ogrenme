import { describe, expect, it } from "vitest";
import { href, parseRoute, switchLocalePath } from "./routes";

describe("rota tablosu", () => {
  it("Türkçe adresler eskisi gibi", () => {
    expect(href("tr", { name: "home" })).toBe("/");
    expect(href("tr", { name: "lesson", id: "1.1" })).toBe("/ders/1.1");
    expect(href("tr", { name: "review" })).toBe("/tekrar");
    expect(href("tr", { name: "profile", hash: "hedef" })).toBe("/profil#hedef");
    expect(href("tr", { name: "privacy" })).toBe("/gizlilik");
  });

  it("İngilizce adresler /en altında ve çevrilmiş", () => {
    expect(href("en", { name: "home" })).toBe("/en");
    expect(href("en", { name: "lesson", id: "1.1" })).toBe("/en/lesson/1.1");
    expect(href("en", { name: "review" })).toBe("/en/review");
    expect(href("en", { name: "profile", hash: "goal" })).toBe("/en/profile#goal");
    expect(href("en", { name: "privacy" })).toBe("/en/privacy");
  });

  it("her adres kendi dilinde geri çözülür (gidiş-dönüş)", () => {
    for (const locale of ["tr", "en"] as const) {
      for (const route of [{ name: "home" }, { name: "lesson", id: "4.2" }, { name: "review" }, { name: "profile" }, { name: "privacy" }] as const) {
        expect(parseRoute(href(locale, route))).toEqual({ locale, route });
      }
    }
  });

  it("sondaki eğik çizgi ve # yok sayılır; tanınmayan adres null", () => {
    expect(parseRoute("/en/")).toEqual({ locale: "en", route: { name: "home" } });
    expect(parseRoute("/profil#hedef")).toEqual({ locale: "tr", route: { name: "profile" } });
    expect(parseRoute("/yok")).toBeNull();
    expect(parseRoute("/ders/1.1/fazla")).toBeNull();
  });

  it("dil değiştirme karşılık gelen sayfaya gider", () => {
    expect(switchLocalePath("/ders/1.1", "en")).toBe("/en/lesson/1.1");
    expect(switchLocalePath("/en/lesson/1.1", "tr")).toBe("/ders/1.1");
    expect(switchLocalePath("/profil", "en")).toBe("/en/profile");
    expect(switchLocalePath("/en/privacy", "tr")).toBe("/gizlilik");
    expect(switchLocalePath("/bilinmeyen", "en")).toBe("/en");
  });
});
