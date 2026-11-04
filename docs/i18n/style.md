# Üslup ve Yazım Rehberi / Style and Spelling Guide

## Ortak kurallar
- Okura "sen" / "you" diye hitap edilir. Cümleler kısa, anlatım sade ve cesaretlendirici olur.
- Düz ASCII tırnak `"` ve `'` kullanılır (JSON ve kod bağlamı için tek tip). Üç nokta `...` olarak yazılır, `…` kullanılmaz.
- Tire: Türkçe içerikte mevcut ` — ` (boşluklu uzun tire) kullanımı korunur. İngilizcede uzun tire kullanılmaz; virgül, iki nokta veya nokta tercih edilir (`lint-text` bunu denetler).
- Cümle sonunda tek boşluk. Çift boşluk, baş ve son boşluk yok. Noktalamadan önce boşluk yok, sonra tek boşluk var.
- Başlıklarda yalnızca ilk kelime ve özel adlar büyük harfle başlar (sentence case).

## Türkçe (TDK) kontrol listesi
- **Kesme işareti:** Özel ad, sayı ve kısaltmalara gelen ekler kesmeyle ayrılır: "3.1'de", "Dünya 2'yi", "EĞER'in". Anahtar kelimeden sonra da kesme kullanılır: "BİTİR'den".
- **Ünlü uyumu (sayı ekleri):** 3'ü, 4'ü, 5'i, 6'yı, 7'yi, 8'i, 9'u, 10'u.
- **İ/ı:** Büyük harfe çevirirken `tr-TR` yerel ayarı kullanılır (i → İ, ı → I).
- **de/da:** Bağlaç ayrı yazılır ("o da geldi"), bulunma eki bitişik yazılır ("evde").
- **ki:** Bağlaç ayrı ("bil ki"), sıfat yapan -ki bitişik ("evdeki").
- **mi/mı/mu/mü:** Soru eki ayrı yazılır ve ünlü uyumuna girer ("doğru mu?", "bir problem mi?").
- **Sık yanlışlar:** her şey (ayrı), bir şey (ayrı), hiçbir şey (ayrı), ya da (ayrı), birçok (bitişik), birkaç (bitişik), yanlış, herkes, şu an (ayrı), hiç kimse (ayrı).
- **Birleşik yazım:** "iç içe" ayrı; "altprogram" ve "alt program" için tek biçim: sözlükteki "fonksiyon (altprogram)".
- **Şapka:** "Kâşif" gibi sözcüklerde tutarlı kullanım.

## English (US) checklist
- US spelling: color, behavior, center, analyze, program.
- Use the serial (Oxford) comma. Contractions are allowed ("you'll", "it's") but be consistent within a lesson.
- Avoid Turkish word order carried over ("Write to the screen the number" ✗ → "Print the number" ✓; in pseudocode use `WRITE`).
- its / it's, then / than, affect / effect, fewer / less: check each.
- Plurals: "lessons", "data" (treat as singular here), no "informations".
- Variable names inside translated pseudocode are translated too (toplam → total, sayac → counter, yas → age, not → grade).
- No leftover Turkish letters (ç ğ ı ö ş ü) in English files.
- Numbers: write numerals in exercises ("3 steps"), words only in flowing prose for one to nine.
