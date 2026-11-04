import { describe, expect, it } from "vitest";
import { foldTr, outputMatches, parseNumber, sameText, sameValue, shuffledIndices, splitOutput } from "./answers";

describe("foldTr / sameText", () => {
  it("büyük-küçük harfi ve Türkçe karakter farkını eşitler", () => {
    expect(sameText("DOĞRU", "doğru")).toBe(true);
    expect(sameText("DOĞRU", "dogru")).toBe(true);
    expect(sameText("YANLIŞ", "yanlis")).toBe(true);
    expect(sameText("Kaldı", "KALDI")).toBe(true);
    expect(sameText("Kaldı", "kaldi")).toBe(true);
    expect(sameText("BİTİR", "bitir")).toBe(true);
    expect(sameText("BİTİR", "BITIR")).toBe(true);
  });
  it("fazla boşluğu yok sayar ama farklı metni eşitlemez", () => {
    expect(sameText("  iç   içe ", "iç içe")).toBe(true);
    expect(sameText("iç içe", "içice")).toBe(false);
    expect(sameText("doğru", "yanlış")).toBe(false);
  });
  it("ayrışık (NFD) i-noktası sorun çıkarmaz", () => {
    expect(foldTr("İ".normalize("NFD"))).toBe("i");
  });
});

describe("parseNumber / sameValue", () => {
  it("ondalık virgül ve noktayı kabul eder, sayı olmayanı reddeder", () => {
    expect(parseNumber("3,5")).toBe(3.5);
    expect(parseNumber(" -1 ")).toBe(-1);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("1e3")).toBeNull();
    expect(parseNumber("0x10")).toBeNull();
    expect(parseNumber("")).toBeNull();
  });
  it("sayıları sayısal, metinleri metin olarak karşılaştırır", () => {
    expect(sameValue("05", "5")).toBe(true);
    expect(sameValue("2.0", "2")).toBe(true);
    expect(sameValue("Veli", "veli")).toBe(true);
    expect(sameValue("5", "6")).toBe(false);
  });
});

describe("outputMatches (çıktı tahmini)", () => {
  it("DOĞRU/YANLIŞ cevabını harf ve Türkçe karakter farkına takılmadan kabul eder", () => {
    expect(outputMatches("doğru", ["DOĞRU"])).toBe(true);
    expect(outputMatches("dogru", ["DOĞRU"])).toBe(true);
    expect(outputMatches("Yanlis", ["YANLIŞ"])).toBe(true);
    expect(outputMatches("doğru, yanlış", ["DOĞRU", "YANLIŞ"])).toBe(true);
  });
  it("ayırıcı olarak virgül, boşluk, noktalı virgül ve tırnağı tolere eder", () => {
    expect(outputMatches("2 4 6", ["2", "4", "6"])).toBe(true);
    expect(outputMatches("2,4,6", ["2", "4", "6"])).toBe(true);
    expect(outputMatches("2; 4; 6", ["2", "4", "6"])).toBe(true);
    expect(outputMatches('"Veli"', ["Veli"])).toBe(true);
  });
  it("sırayı ve sayıyı denetler", () => {
    expect(outputMatches("4 2 6", ["2", "4", "6"])).toBe(false);
    expect(outputMatches("2 4", ["2", "4", "6"])).toBe(false);
    expect(outputMatches("2 4 6 8", ["2", "4", "6"])).toBe(false);
    expect(outputMatches("", ["5"])).toBe(false);
    expect(outputMatches("-1", ["-1"])).toBe(true);
    expect(outputMatches("1", ["-1"])).toBe(false);
  });
  it("splitOutput çevreleyen tırnağı ve boş öğeleri atar", () => {
    expect(splitOutput(' "a" ,, b ')).toEqual(["a", "b"]);
  });
});

describe("shuffledIndices", () => {
  it("2 öğede bile asla çözülmüş sırayı vermez ve hepsini içerir", () => {
    for (let i = 0; i < 200; i++) {
      const s = shuffledIndices(2);
      expect(s).toEqual([1, 0]);
    }
    for (let n = 3; n <= 6; n++) {
      for (let i = 0; i < 100; i++) {
        const s = shuffledIndices(n);
        expect([...s].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, k) => k));
        expect(s.every((v, k) => v === k)).toBe(false);
      }
    }
  });
  it("tek öğede sonsuz döngüye girmez", () => {
    expect(shuffledIndices(1)).toEqual([0]);
    expect(shuffledIndices(0)).toEqual([]);
  });
});

describe("İngilizce karşılaştırma", () => {
  it("harf boyutunu ve boşluğu eşitler, Türkçe katlama uygulamaz", () => {
    expect(sameText("TRUE", "true", "en")).toBe(true);
    expect(sameText("  Hello   World ", "hello world", "en")).toBe(true);
    expect(sameText("Id", "ıd", "en")).toBe(false);
  });
  it("ondalık virgülü kabul etmez, noktayı kabul eder", () => {
    expect(parseNumber("3.5", "en")).toBe(3.5);
    expect(parseNumber("3,5", "en")).toBeNull();
    expect(parseNumber("3,5", "tr")).toBe(3.5);
  });
  it("çıktı tahmininde tırnak ve harf boyutu farkı yanlış sayılmaz", () => {
    expect(outputMatches('"Alice", 2', ["Alice", "2"], "en")).toBe(true);
    expect(outputMatches("true false", ["TRUE", "FALSE"], "en")).toBe(true);
    expect(outputMatches("1 2", ["1", "2", "3"], "en")).toBe(false);
  });
});
