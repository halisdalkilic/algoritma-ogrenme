<div align="center">

# Algoritma Öğrenme · Algorithm Learning

Duolingo tarzı mikro derslerle algoritma, akış şeması ve sözde kod öğreten, **Türkçe ve İngilizce** web uygulaması.
A web app that teaches algorithms, flowcharts and pseudocode with short Duolingo-style lessons, in **Turkish and English**.

[**Canlı demo →**](https://halisdalkilic.github.io/algoritma-ogrenme/) · [**Live demo (English) →**](https://halisdalkilic.github.io/algoritma-ogrenme/en/)

![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-443e38)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0f172a?logo=tailwindcss&logoColor=38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-isteğe_bağlı-3ecf8e?logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-433_test-6e9f18?logo=vitest&logoColor=white)

<img src="docs/ekran-goruntuleri/masaustu-01-harita.png" width="820" alt="Ana sayfa ve ders haritası">

</div>

## Ne yapıyor?

Kullanıcı 7 "dünya" ve 47 ders boyunca ilerler, alıştırmaları çözer, XP ve rütbe kazanır. Yanlış yaptığı
sorular aralıklı tekrarla (1 / 3 / 7 gün) geri gelir. Hesap gerekmez; ilerleme tarayıcıda saklanır.
İstenirse isteğe bağlı bir hesapla telefon ve bilgisayar arasında eşitlenir.

- **İki dil:** 47 dersin tamamı Türkçe (`/`) ve İngilizce (`/en`). İngilizce sözde kod, Türkçe olanın aynadaki
  karşılığıdır (`IF` / `END`, `FOR` / `END_LOOP`); kod çalıştırıcı ikisini de çalıştırır. Eşlik testleri iki dilin
  aynı yapıda kalmasını denetler.
- **9 alıştırma tipi:** çoktan seçmeli, boşluk doldurma, sıralama, çıktı tahmini, iz tablosu, sözde kod
  yazma, akış şeması okuma ve sürükle-bırak ile akış şeması kurma
- **Hoşgörülü cevap kontrolü:** büyük/küçük harf, Türkçe karakter yerine ASCII (`dogru`, `EGER`) ve tırnak
  farkı yanlış sayılmaz
- **Sözde kod yorumlayıcısı:** tokenizer → parser (AST) → interpreter; kodu adım adım çalıştırıp
  değişkenleri gösterir
- **Kavram animasyonları:** sıralama ve arama adımları gerçek algoritmadan üretilir
- **Motivasyon:** maskot "Algo", seri takvimi, günlük hedef, rütbeler, paylaşılabilir başarı kartı
- **İsteğe bağlı hesap:** e-posta ve şifreyle giriş, cihazlar arası senkron; kayıtlar sunucuda doğrulanır,
  sahte XP ve seri reddedilir ([kurulum](KURULUM.md))
- **PWA ve erişilebilirlik:** çevrimdışı çalışır, açık/koyu tema, ekran okuyucu duyuruları, telefonda
  dokunmatik sürükleme ve 44px dokunma hedefleri

## Ekran görüntüleri

<table>
  <tr>
    <td align="center"><img src="docs/ekran-goruntuleri/02-akis-semasi.png" width="210" alt="Akış şeması kurma"><br><sub>Akış şeması kurma</sub></td>
    <td align="center"><img src="docs/ekran-goruntuleri/03-kod-calistirici.png" width="210" alt="Adım adım kod çalıştırıcı"><br><sub>Kod çalıştırıcı</sub></td>
    <td align="center"><img src="docs/ekran-goruntuleri/04-profil-acik-tema.png" width="210" alt="Profil, açık tema"><br><sub>Profil (açık tema)</sub></td>
    <td align="center"><img src="docs/ekran-goruntuleri/01-harita.png" width="210" alt="Ders haritası, mobil"><br><sub>Mobil görünüm</sub></td>
  </tr>
</table>

<details>
<summary>Masaüstü görünümler</summary>
<br>

<img src="docs/ekran-goruntuleri/masaustu-02-akis-semasi.png" alt="Akış şeması kurma, masaüstü">
<img src="docs/ekran-goruntuleri/masaustu-03-kod-calistirici.png" alt="Kod çalıştırıcı, masaüstü">
<img src="docs/ekran-goruntuleri/masaustu-04-profil-acik-tema.png" alt="Profil, açık tema, masaüstü">

</details>

## Teknik notlar

- **Statik site:** Next.js `output: "export"` ile tamamen statik üretilir; sunucuda Node süreci yoktur.
- **İçerik veri olarak:** dersler JSON'dur ve Zod şemasıyla doğrulanır; yeni ders eklemek kod yazmayı gerektirmez.
- **Hesap güvenliği:** Supabase üzerinde satır düzeyi güvenlik (RLS) ve `save_progress()` doğrulama fonksiyonu;
  tarayıcıya yalnızca herkese açık anahtar gömülür.
- **Test:** 433 birim testi; içerik bütünlüğü, çeviri eşliği, sözde kod yorumlayıcısı ve birleştirme mantığını kapsar.

## Proje yapısı

```
app/            Sayfalar: (tr) harita, /ders/[id], /tekrar, /profil, /gizlilik · (en) /en/...
components/     Alıştırmalar, akış şeması, kod çalıştırıcı, animasyonlar, maskot, hesap paneli
content/        Dersler: worlds/ (Türkçe) ve en/ (İngilizce); JSON, Zod şemasıyla doğrulanır, eşlik testleri iki dili karşılaştırır
lib/            Puanlama, aralıklı tekrar, rozet/rütbe, ilerleme store'u (Zustand), i18n, SEO, hesap ve senkron
supabase/       Veritabanı şeması ve sunucu doğrulaması (isteğe bağlı hesap için)
docs/i18n/      Çeviri sözlüğü ve üslup rehberi
```

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000  (İngilizce: /en)
npm test           # birim testleri
npm run lint:text  # yazım ve üslup denetimi (Türkçe + İngilizce)
npm run build      # out/ klasörüne statik site
```

`main` dalına yapılan her push, GitHub Actions ile test edilip GitHub Pages'te yayınlanır.

## Lisans

Tüm hakları saklıdır. Kaynak kod incelenebilir; izinsiz kullanılamaz, kopyalanamaz veya dağıtılamaz. Ayrıntılar: [LICENSE](LICENSE).
