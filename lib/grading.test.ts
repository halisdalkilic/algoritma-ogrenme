import { describe, expect, it } from "vitest";
import { gradePseudoWrite } from "./grading";

describe("gradePseudoWrite", () => {
  it("tüm anahtar kelimeler varsa doğru kabul eder", () => {
    const code = "OKU sayi\nEĞER sayi > 0\n  YAZ \"Pozitif\"\nBİTİR";
    const result = gradePseudoWrite(code, ["OKU", "EĞER", "BİTİR"]);
    expect(result.correct).toBe(true);
    expect(result.missingKeywords).toEqual([]);
  });

  it("eksik anahtar kelimeyi tespit eder", () => {
    const code = "OKU sayi\nYAZ sayi";
    const result = gradePseudoWrite(code, ["OKU", "EĞER", "BİTİR"]);
    expect(result.correct).toBe(false);
    expect(result.missingKeywords).toEqual(["EĞER", "BİTİR"]);
    expect(result.foundKeywords).toEqual(["OKU"]);
  });

  it("büyük/küçük harfe duyarsızdır", () => {
    const code = "oku sayi\neğer sayi > 0\n  yaz sayi\nbitir";
    const result = gradePseudoWrite(code, ["OKU", "EĞER", "BİTİR"]);
    expect(result.correct).toBe(true);
  });

  it("kapanmayan EĞER bloğunu tespit eder", () => {
    const code = "EĞER x > 0\n  YAZ x";
    const result = gradePseudoWrite(code, ["EĞER"]);
    expect(result.correct).toBe(false);
    expect(result.unbalancedBlocks).toContain("EĞER ... BİTİR");
  });

  it("kapanmayan İÇİN döngüsünü tespit eder", () => {
    const code = "İÇİN i ← 1'DEN 5'E ADIM 1\n  YAZ i";
    const result = gradePseudoWrite(code, ["İÇİN"]);
    expect(result.correct).toBe(false);
    expect(result.unbalancedBlocks).toContain("İÇİN ... DÖNGÜ_BİTİR");
  });

  it("kullanılmayan blok tipi için uyarı vermez", () => {
    const code = "OKU sayi\nYAZ sayi";
    const result = gradePseudoWrite(code, ["OKU"]);
    expect(result.unbalancedBlocks).toEqual([]);
  });

  it("düzgün kapatılmış bloklarda hata vermez", () => {
    const code = [
      "İÇİN i ← 1'DEN 3'E ADIM 1",
      "  EĞER i mod 2 = 0",
      "    YAZ i",
      "  BİTİR",
      "DÖNGÜ_BİTİR",
    ].join("\n");
    const result = gradePseudoWrite(code, ["İÇİN", "EĞER"]);
    expect(result.unbalancedBlocks).toEqual([]);
  });

  it("Türkçe karakter yerine ASCII yazılan anahtar kelimeleri kabul eder", () => {
    const code = ["FONKSIYON f(n)", "  EGER n <= 1", "    DONDUR 1", "  BITIR", "  DONDUR n", "BITIR"].join("\n");
    expect(gradePseudoWrite(code, ["FONKSİYON", "DÖNDÜR", "BİTİR", "EĞER"]).correct).toBe(true);
  });

  it("değişken adı içindeki parçayı anahtar kelime saymaz (değer ≠ EĞER)", () => {
    // Eskiden "değer" içindeki "EĞER" hem anahtar kelime hem açılan blok sayılıp haksız yanlış çıkarıyordu.
    const noIf = gradePseudoWrite("OKU değer\nYAZ değer", ["EĞER"]);
    expect(noIf.correct).toBe(false);
    expect(noIf.missingKeywords).toEqual(["EĞER"]);
    const ok = gradePseudoWrite("OKU değer\nEĞER değer > 0\n  YAZ değer\nBİTİR", ["EĞER", "BİTİR"]);
    expect(ok.correct).toBe(true);
    expect(ok.unbalancedBlocks).toEqual([]);
  });

  it("DÖNGÜ_BİTİR, EĞER'in BİTİR'i yerine geçmez", () => {
    const code = ["İÇİN i ← 1'DEN 3'E ADIM 1", "  EĞER i > 1", "    YAZ i", "DÖNGÜ_BİTİR"].join("\n");
    const r = gradePseudoWrite(code, ["İÇİN", "EĞER"]);
    expect(r.correct).toBe(false);
    expect(r.unbalancedBlocks).toEqual(["EĞER ... BİTİR"]);
  });

  it("EĞER ve FONKSİYON aynı BİTİR'i paylaşamaz", () => {
    const r = gradePseudoWrite("FONKSİYON f(n)\n  EĞER n > 0\n    DÖNDÜR n\nBİTİR", ["FONKSİYON", "EĞER"]);
    expect(r.correct).toBe(false);
    expect(r.unbalancedBlocks).toEqual(["EĞER ... BİTİR", "FONKSİYON ... BİTİR"]);
  });

  it("tırnak içindeki metin kod sayılmaz", () => {
    const r = gradePseudoWrite('YAZ "Eğer yağmur yağarsa bitir"', ["YAZ"]);
    expect(r.correct).toBe(true);
    expect(r.unbalancedBlocks).toEqual([]);
  });

  it("küçük harfli anahtar kelimeyi (mod) tam kelime olarak arar", () => {
    expect(gradePseudoWrite("YAZ model", ["mod"]).correct).toBe(false);
    expect(gradePseudoWrite("EĞER i MOD 2 = 0", ["mod"]).foundKeywords).toEqual(["mod"]);
  });
});
