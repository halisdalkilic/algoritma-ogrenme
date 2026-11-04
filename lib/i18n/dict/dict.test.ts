import { describe, expect, it } from "vitest";
import { tr } from "./tr";
import { en } from "./en";
import { BADGES } from "../../badges";
import { RANKS } from "../../ranks";

type Node = unknown;
const isObj = (v: Node): v is Record<string, Node> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Her yaprak için yol + değer listesi çıkarır (fonksiyonlar "fn:<parametre sayısı>" olarak). */
function leaves(node: Node, path = ""): [string, Node][] {
  if (Array.isArray(node)) return node.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (isObj(node)) return Object.entries(node).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  return [[path, typeof node === "function" ? `fn:${node.length}` : node]];
}

const trLeaves = leaves(tr);
const enLeaves = leaves(en);
const enByPath = new Map(enLeaves);

// Türkçe ile AYNI olabilen değerler (özel adlar, semboller, birimler)
// Türkçe ile AYNI olabilen değerler (özel adlar, semboller, birimler, ortak sözcükler)
const SAME_ALLOWED = /^(XP|✓|🔥|🎯|Bonus)$/;

// Bilerek boş olabilen anahtarlar (cümle parçalarının bir dilde karşılığı olmayan kısmı)
const EMPTY_ALLOWED = new Set(["map.hero.titleAfter"]);

// Dilden bağımsız anahtarlar: emoji simgeleri ve sözde kod/ifade parçaları iki dilde aynıdır
const SAME_PATHS = (p: string) => p.endsWith(".icon") || ["visuals.flow.n.a5", "visuals.flow.n.aGt3"].includes(p);

describe("sözlük yapısı: tr ve en birebir aynı şekilde", () => {
  it("aynı anahtarlar (eksik ya da fazla yok)", () => {
    const trKeys = trLeaves.map(([p]) => p).sort();
    const enKeys = enLeaves.map(([p]) => p).sort();
    expect(enKeys).toEqual(trKeys);
  });

  it("fonksiyonların parametre sayısı aynı", () => {
    for (const [path, v] of trLeaves) {
      if (typeof v === "string" && v.startsWith("fn:")) expect(enByPath.get(path), path).toBe(v);
    }
  });

  it("hiçbir metin boş değil", () => {
    for (const [path, v] of [...trLeaves, ...enLeaves]) {
      if (typeof v === "string" && !v.startsWith("fn:") && !EMPTY_ALLOWED.has(path)) expect(v.trim(), path).not.toBe("");
    }
  });
});

describe("sözlük kalitesi: İngilizce metin", () => {
  it("Türkçe harf kalmamış", () => {
    const bad = enLeaves.filter(([, v]) => typeof v === "string" && /[çğıöşüÇĞİÖŞÜ]/.test(v)).map(([p]) => p);
    expect(bad).toEqual([]);
  });

  it("çevrilmemiş (Türkçeyle aynı kalmış) metin yok", () => {
    const trByPath = new Map(trLeaves);
    const same = enLeaves
      .filter(([p, v]) => typeof v === "string" && !v.startsWith("fn:") && trByPath.get(p) === v && !SAME_ALLOWED.test(v) && !SAME_PATHS(p))
      .map(([p]) => p);
    expect(same).toEqual([]);
  });

  it("uzun tire, kıvrık tırnak ve çift boşluk yok (stil rehberi)", () => {
    // placeholder'lar sözde kod örneğidir: girinti (çift boşluk) bilerek var
    const bad = enLeaves
      .filter(([p, v]) => typeof v === "string" && (/—|[“”‘’]/.test(v) || (!p.includes("placeholder") && / {2,}/.test(v))))
      .map(([p]) => p);
    expect(bad).toEqual([]);
  });
});

describe("sözlük: rütbe ve rozet sayıları uygulama verisiyle uyumlu", () => {
  it("her rütbenin her dilde adı var", () => {
    expect(tr.ranks.titles).toHaveLength(RANKS.length);
    expect(en.ranks.titles).toHaveLength(RANKS.length);
  });

  it("her rozetin her dilde adı ve açıklaması var (rozet kimlikleri kullanıcı kayıtlarında, değişmez)", () => {
    for (const b of BADGES) {
      expect(tr.badges[b.id as keyof typeof tr.badges], b.id).toBeDefined();
      expect(en.badges[b.id as keyof typeof en.badges], b.id).toBeDefined();
    }
    expect(Object.keys(tr.badges).sort()).toEqual(BADGES.map((b) => b.id).sort());
  });
});
