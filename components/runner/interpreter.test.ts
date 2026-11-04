import { describe, expect, it } from "vitest";
import { run } from "./interpreter";

function lastOutput(source: string, inputs: number[] = []) {
  const result = run(source, inputs);
  if (!result.ok) throw new Error(`Beklenmeyen hata: ${result.error}`);
  return result.steps.at(-1)?.output ?? [];
}

describe("atama ve temel ifadeler", () => {
  it("basit atama çalışır", () => {
    const result = run("a ← 5\nYAZ a");
    expect(result.ok).toBe(true);
    expect(lastOutput("a ← 5\nYAZ a")).toEqual(["5"]);
  });

  it("kendine referanslı atama (a ← a + 1) doğru çalışır", () => {
    expect(lastOutput("a ← 5\na ← a + 1\nYAZ a")).toEqual(["6"]);
  });

  it("aritmetik öncelik doğru uygulanır (2 + 3 * 4 = 14)", () => {
    expect(lastOutput("YAZ 2 + 3 * 4")).toEqual(["14"]);
  });

  it("parantez önceliği geçersiz kılar ((2+3)*4 = 20)", () => {
    expect(lastOutput("YAZ (2 + 3) * 4")).toEqual(["20"]);
  });

  it("div tam bölüm verir", () => {
    expect(lastOutput("YAZ 17 div 5")).toEqual(["3"]);
  });

  it("mod kalanı verir", () => {
    expect(lastOutput("YAZ 17 mod 5")).toEqual(["2"]);
  });

  it("sıfıra bölme hata döndürür", () => {
    const result = run("YAZ 5 / 0");
    expect(result.ok).toBe(false);
  });
});

describe("OKU / YAZ", () => {
  it("OKU, inputs dizisinden sırayla değer okur", () => {
    expect(lastOutput("OKU a\nOKU b\nYAZ a\nYAZ b", [3, 4])).toEqual(["3", "4"]);
  });

  it("string birleştirme (+) çalışır", () => {
    expect(lastOutput('ad ← "Ali"\nYAZ "Merhaba " + ad')).toEqual(["Merhaba Ali"]);
  });
});

describe("SABIT", () => {
  it("sabit tanımlanıp okunabilir", () => {
    expect(lastOutput("SABIT PI ← 3.14\nYAZ PI")).toEqual(["3.14"]);
  });

  it("sabite yeniden atama hata verir", () => {
    const result = run("SABIT PI ← 3.14\nPI ← 4");
    expect(result.ok).toBe(false);
  });
});

describe("EĞER / DEĞİLSE", () => {
  it("EĞER doğru koşulda then dalını çalıştırır", () => {
    expect(lastOutput("EĞER 5 > 3\n  YAZ \"büyük\"\nBİTİR")).toEqual(["büyük"]);
  });

  it("EĞER yanlış koşulda DEĞİLSE dalını çalıştırır", () => {
    expect(lastOutput('EĞER 2 > 3\n  YAZ "a"\nDEĞİLSE\n  YAZ "b"\nBİTİR')).toEqual(["b"]);
  });

  it("iç içe EĞER çalışır", () => {
    const src = [
      "not ← 85",
      "EĞER not ≥ 90",
      '  YAZ "AA"',
      "DEĞİLSE",
      "  EĞER not ≥ 80",
      '    YAZ "BA"',
      "  DEĞİLSE",
      '    YAZ "CC"',
      "  BİTİR",
      "BİTİR",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["BA"]);
  });

  it("mantıksal VE operatörü doğru değerlendirilir", () => {
    expect(lastOutput('EĞER DOĞRU VE YANLIŞ\n  YAZ "a"\nDEĞİLSE\n  YAZ "b"\nBİTİR')).toEqual(["b"]);
  });

  it("mantıksal VEYA operatörü doğru değerlendirilir", () => {
    expect(lastOutput('EĞER YANLIŞ VEYA DOĞRU\n  YAZ "a"\nDEĞİLSE\n  YAZ "b"\nBİTİR')).toEqual(["a"]);
  });
});

describe("İÇİN (for) döngüsü", () => {
  it("1'den 5'e kadar sayar", () => {
    expect(lastOutput("İÇİN i ← 1'DEN 5'E ADIM 1\n  YAZ i\nDÖNGÜ_BİTİR").length).toBe(5);
  });

  it("iç içe İÇİN döngüleri doğru sırayla çalışır (çarpım tablosu)", () => {
    const src = [
      "İÇİN i ← 1'DEN 2'YE ADIM 1",
      "  İÇİN j ← 1'DEN 2'YE ADIM 1",
      "    YAZ i * j",
      "  DÖNGÜ_BİTİR",
      "DÖNGÜ_BİTİR",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["1", "2", "2", "4"]);
  });

  it("döngü sınırı olarak bir değişken içeren ifade kullanılabilir (i + 1'DEN)", () => {
    // Seçmeli sıralamanın iç döngüsünde kullanılan kalıp: İÇİN j ← i+1'DEN n'E
    const src = [
      "İÇİN i ← 0'DAN 2'YE ADIM 1",
      "  İÇİN j ← i + 1'DEN 3'E ADIM 1",
      "    YAZ i",
      "    YAZ j",
      "  DÖNGÜ_BİTİR",
      "DÖNGÜ_BİTİR",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["0", "1", "0", "2", "0", "3", "1", "2", "1", "3", "2", "3"]);
  });

  it("toplama döngüsü doğru sonuç üretir (1+2+3=6)", () => {
    const src = [
      "toplam ← 0",
      "İÇİN i ← 1'DEN 3'E ADIM 1",
      "  toplam ← toplam + i",
      "DÖNGÜ_BİTİR",
      "YAZ toplam",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["6"]);
  });

  it("adım 2 ile ilerleyen döngü doğru değerleri üretir", () => {
    const src = "İÇİN i ← 2'DEN 6'YA ADIM 2\n  YAZ i\nDÖNGÜ_BİTİR";
    expect(lastOutput(src)).toEqual(["2", "4", "6"]);
  });

  it("her tur için bir 'header' adımı + bir 'body' adımı üretir", () => {
    const result = run("İÇİN i ← 1'DEN 3'E ADIM 1\n  YAZ i\nDÖNGÜ_BİTİR");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.steps.length).toBe(6); // 3 tur * (header + body)
  });

  it("negatif adımla geriye doğru sayar ('DEN/TEN suffix normalizasyonu dahil)", () => {
    expect(lastOutput("İÇİN i ← 5'TEN 1'E ADIM -1\n  YAZ i\nDÖNGÜ_BİTİR")).toEqual([
      "5",
      "4",
      "3",
      "2",
      "1",
    ]);
  });

  it("başlangıç/bitiş, adım yönüyle uyuşmuyorsa döngü hiç çalışmaz", () => {
    expect(lastOutput("İÇİN i ← 1'DEN 10'A ADIM -1\n  YAZ i\nDÖNGÜ_BİTİR")).toEqual([]);
  });
});

describe("SÜRECE (while) döngüsü", () => {
  it("koşul sağlandığı sürece çalışır", () => {
    const src = ["i ← 0", "SÜRECE i < 3", "  YAZ i", "  i ← i + 1", "DÖNGÜ_BİTİR"].join("\n");
    expect(lastOutput(src)).toEqual(["0", "1", "2"]);
  });

  it("başta koşul sağlanmazsa gövde hiç çalışmaz", () => {
    expect(lastOutput('i ← 10\nSÜRECE i < 3\n  YAZ "asla"\nDÖNGÜ_BİTİR')).toEqual([]);
  });
});

describe("diziler", () => {
  it("dizi literal ve indeksleme çalışır", () => {
    expect(lastOutput("sayilar ← [10, 20, 30]\nYAZ sayilar[1]")).toEqual(["20"]);
  });

  it("dizi elemanına atama yapılabilir", () => {
    expect(lastOutput("sayilar ← [1, 2, 3]\nsayilar[0] ← 99\nYAZ sayilar[0]")).toEqual(["99"]);
  });

  it("dizi sınır dışı erişim hata verir", () => {
    const result = run("sayilar ← [1, 2]\nYAZ sayilar[5]");
    expect(result.ok).toBe(false);
  });

  it("döngüyle dizi toplamı hesaplanabilir", () => {
    const src = [
      "sayilar ← [1, 2, 3, 4]",
      "toplam ← 0",
      "İÇİN i ← 0'DAN 3'E ADIM 1",
      "  toplam ← toplam + sayilar[i]",
      "DÖNGÜ_BİTİR",
      "YAZ toplam",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["10"]);
  });

  it("iki boyutlu dizi (matris) çift indeksle okunabilir", () => {
    expect(lastOutput("matris ← [[1, 2, 3], [4, 5, 6]]\nYAZ matris[1][2]")).toEqual(["6"]);
  });

  it("iki boyutlu dizide bir elemana atama yapılabilir", () => {
    const src = "matris ← [[1, 2], [3, 4]]\nmatris[0][1] ← 99\nYAZ matris[0][1]";
    expect(lastOutput(src)).toEqual(["99"]);
  });

  it("iç içe döngüyle matrisin tüm elemanları toplanabilir", () => {
    const src = [
      "matris ← [[1, 2], [3, 4]]",
      "toplam ← 0",
      "İÇİN i ← 0'DAN 1'E ADIM 1",
      "  İÇİN j ← 0'DAN 1'E ADIM 1",
      "    toplam ← toplam + matris[i][j]",
      "  DÖNGÜ_BİTİR",
      "DÖNGÜ_BİTİR",
      "YAZ toplam",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["10"]);
  });
});

describe("hata durumları", () => {
  it("tanımsız değişken kullanımı hata verir", () => {
    const result = run("YAZ x");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("tanımsız değişken");
  });

  it("sonsuz döngü adım sınırında durdurulur", () => {
    const result = run("i ← 0\nSÜRECE DOĞRU\n  i ← i + 1\nDÖNGÜ_BİTİR");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("sınır");
  });

  it("sözdizimi hatası anlamlı bir mesajla döner", () => {
    const result = run("a ← ");
    expect(result.ok).toBe(false);
  });
});

describe("FONKSİYON / DÖNDÜR", () => {
  it("basit bir fonksiyon çağrısı doğru sonucu döndürür", () => {
    const src = ["FONKSİYON topla(a, b)", "  DÖNDÜR a + b", "BİTİR", "YAZ topla(3, 4)"].join("\n");
    expect(lastOutput(src)).toEqual(["7"]);
  });

  it("fonksiyon sonucu bir değişkene atanabilir", () => {
    const src = [
      "FONKSİYON kare(x)",
      "  DÖNDÜR x * x",
      "BİTİR",
      "sonuc ← kare(5)",
      "YAZ sonuc",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["25"]);
  });

  it("fonksiyon içindeki DÖNDÜR, iç içe EĞER'den de akışı doğru keser", () => {
    const src = [
      "FONKSİYON isaret(x)",
      "  EĞER x > 0",
      "    DÖNDÜR \"pozitif\"",
      "  BİTİR",
      "  DÖNDÜR \"pozitif değil\"",
      "BİTİR",
      "YAZ isaret(5)",
      "YAZ isaret(-3)",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["pozitif", "pozitif değil"]);
  });

  it("özyinelemeli (recursive) fonksiyon çağrısı doğru sonucu verir (faktöriyel)", () => {
    const src = [
      "FONKSİYON faktoriyel(n)",
      "  EĞER n ≤ 1",
      "    DÖNDÜR 1",
      "  BİTİR",
      "  DÖNDÜR n * faktoriyel(n - 1)",
      "BİTİR",
      "YAZ faktoriyel(5)",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["120"]);
  });

  it("özyinelemeli fonksiyon çağrı yığını, her çağrıda ayrı bir 'n' yereli tutar", () => {
    const src = [
      "FONKSİYON fib(n)",
      "  EĞER n ≤ 1",
      "    DÖNDÜR n",
      "  BİTİR",
      "  DÖNDÜR fib(n - 1) + fib(n - 2)",
      "BİTİR",
      "YAZ fib(7)",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["13"]);
  });

  it("yanlış sayıda argüman hata verir", () => {
    const src = ["FONKSİYON topla(a, b)", "  DÖNDÜR a + b", "BİTİR", "YAZ topla(3)"].join("\n");
    const result = run(src);
    expect(result.ok).toBe(false);
  });

  it("tanımsız fonksiyon çağrısı hata verir", () => {
    const result = run("YAZ yokFonksiyon(1)");
    expect(result.ok).toBe(false);
  });
});

describe("değişken kapsamı (scope)", () => {
  it("fonksiyon içinde aynı isimli atama, dıştaki global değişkeni ETKİLEMEZ", () => {
    const src = [
      "x ← 10",
      "FONKSİYON degistir()",
      "  x ← 20",
      "BİTİR",
      "sonuc ← degistir()",
      "YAZ x",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["10"]);
  });

  it("fonksiyon, tanımlamadığı bir global değişkeni OKUYABİLİR", () => {
    const src = ["carpan ← 3", "FONKSİYON ucKatiAl(x)", "  DÖNDÜR x * carpan", "BİTİR", "YAZ ucKatiAl(5)"].join(
      "\n",
    );
    expect(lastOutput(src)).toEqual(["15"]);
  });

  it("parametre ismi, global bir değişkenle aynı olsa bile yereldir", () => {
    const src = [
      "sayi ← 100",
      "FONKSİYON ikiKatiAl(sayi)",
      "  DÖNDÜR sayi * 2",
      "BİTİR",
      "YAZ ikiKatiAl(7)",
      "YAZ sayi",
    ].join("\n");
    expect(lastOutput(src)).toEqual(["14", "100"]);
  });
});

describe("adım (step) snapshot'ları", () => {
  it("her adımda o ana kadarki değişken durumu doğru", () => {
    const result = run("a ← 1\nb ← 2\nc ← a + b");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.steps[0].vars).toEqual({ a: 1 });
      expect(result.steps[1].vars).toEqual({ a: 1, b: 2 });
      expect(result.steps[2].vars).toEqual({ a: 1, b: 2, c: 3 });
    }
  });
});
