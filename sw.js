/*
 * Çevrimdışı önbellek. Site Chrome'da "uygulama olarak yükle" ile kurulabilsin
 * ve internetsiz açılabilsin diye. İçerik değişince VERSION değerini artır.
 */
const VERSION = "v1";
const CACHE = `dogru-yazarim-${VERSION}`;
const FILES = [
  "./",
  "index.html",
  "kisisel.html",
  "admin.html",
  "yasal.html",
  "manifest.webmanifest",
  "css/fonts.css",
  "css/style.css",
  "css/admin.css",
  "js/theme-boot.js",
  "js/data.js",
  "js/game-core.js",
  "js/store.js",
  "js/game.js",
  "js/app.js",
  "js/admin.js",
  "js/progress.js",
  "js/teams.js",
  "js/moderation.js",
  "js/firebase.js",
  "js/pwa.js",
  "assets/icon.svg",
  "assets/correct.svg",
  "assets/wrong.svg",
  "assets/team-gurbuz.jpg",
  "assets/team-suleyman.jpg",
  "assets/eclip-logo.webp",
  "assets/default-correct.webp",
  "assets/default-wrong.webp",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon-maskable-512.png",
  "assets/fonts/atkinson-hyperlegible-normal-400-latin-ext.woff2",
  "assets/fonts/atkinson-hyperlegible-normal-400-latin.woff2",
  "assets/fonts/atkinson-hyperlegible-normal-700-latin-ext.woff2",
  "assets/fonts/atkinson-hyperlegible-normal-700-latin.woff2",
  "assets/fonts/fraunces-italic-400-600-latin-ext.woff2",
  "assets/fonts/fraunces-italic-400-600-latin.woff2",
  "assets/fonts/fraunces-normal-400-800-latin-ext.woff2",
  "assets/fonts/fraunces-normal-400-800-latin.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("dogru-yazarim-") && key !== CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Firebase, Google girişi ve diğer dış istekler önbelleğe girmez.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // Ağ yoksa ve istenen dosya önbellekte yoksa ana sayfayı ver.
        if (request.mode === "navigate") {
          const home = await caches.match("index.html");
          if (home) return home;
        }
        return Response.error();
      })
  );
});
