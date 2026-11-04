// Basit bir "network-first, cache fallback" service worker.
// İçerik aktif geliştirme aşamasında olduğundan (bkz. plan.md), önbelleği
// asla bayatlatmamak için ÖNCE ağı dener; ağ başarısız olursa (çevrimdışı)
// önbelleğe, o da yoksa ana sayfaya düşer. Bu, tam offline-first değil ama
// v1 için makul bir "çevrimdışıyken de bir şeyler göster" garantisidir.

const CACHE_NAME = "algoritma-app-v3";
// Yollar sw.js'in konumuna göre çözülür; site bir alt klasörde (GitHub Pages) yayında olsa da çalışır.
const APP_SHELL = ["./", "./profil/", "./tekrar/", "./en/", "./en/profile/", "./en/review/", "./icon.svg"];

// Çevrimdışı yedek sayfa dile göre: /en altındaki adresler İngilizce ana sayfaya, diğerleri Türkçe ana sayfaya düşer.
const fallbackFor = (url) => {
  const rest = new URL(url).pathname.slice(new URL(self.registration.scope).pathname.length);
  return rest === "en" || rest.startsWith("en/") ? "./en/" : "./";
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {
        // İlk yükleme sırasında bir kaynak alınamazsa kurulum başarısız olmasın.
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Başka adreslere (ör. hesap/senkron sunucusu) giden istekler önbelleğe alınmaz: giriş ve ilerleme
  // yanıtları asla bu cihazda saklanmaz.
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(request, copy))
          .catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match(fallbackFor(request.url)))),
  );
});
