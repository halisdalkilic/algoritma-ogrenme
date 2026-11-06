# Animasyon performans ölçümleri

`node scripts/bundle-size.mjs` (önce `npm run build`) çıktıyı verir. "İlk yükleme" = sayfanın HTML'inin doğrudan istediği JS (gzip).

| Aşama | Ana sayfa | Ders 1.1 | /en | Profil |
|---|---|---|---|---|
| Başlangıç (framer tam paket) | 454,5 KB | 419,1 KB | 407,5 KB | 432,1 KB |
| Aşama 1 (LazyMotion, CSS ortam animasyonları, görseller dinamik) | 431,4 KB | 392,1 KB | 384,4 KB | 409,0 KB |

Aşama 1 değişiklikleri: `LazyMotion` (animasyon motoru ertelenmiş parça), maskot/harita/rozet/akış oku sonsuz animasyonları CSS'e taşındı ve
yalnızca görünürken çalışır (`useOnScreen`, `--play`), sekme gizliyken duraklar (`html[data-hidden]`), ilerleme çubukları
`width` yerine `scaleX`, görseller `next/dynamic` ile yüklenir, "hareketi azalt" altında sonsuz döngüler tek tur olur.
