/* FOUNDATIONS Service Worker — PWA + offline */
const CACHE = "nph-pwa-v1";
const PRECACHE = [
  "./",
  "./index.html",
  "./Lectures.html",
  "./Lecture.html",
  "./progress.html",
  "./chat.html",
  "./style.css",
  "./nav.js",
  "./auth.js",
  "./progress.js",
  "./data.js",
  "./config.js",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon.png"
];
const FONTAWESOME = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Apps Script API: network first, cache fallback (قائمة المحاضرات أوفلاين)
  if (url.hostname.includes("script.google")) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Same-origin pages: network first, cache every visited page (المحاضرات اللي اتفتحت تفضل شغالة أوفلاين)
  if (url.origin === location.origin && req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Static assets same-origin + Font Awesome: cache first
  if (url.origin === location.origin || url.href.startsWith(FONTAWESOME)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }
});
