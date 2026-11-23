/* FOUNDATIONS Service Worker — PWA + offline */
const CACHE = "nph-pwa-theme-review-v12";
try { importScripts("./firebase-messaging-sw.js"); } catch (e) { /* Offline remains available if push SDK is unreachable. */ }
const PRECACHE = [
  "./",
  "./index.html",
  "./Lectures.html", "./lecture-extra-counts.js",
  "./Lecture.html",
  "./community.html",
  "./community.js",
  "./community.css",
  "./theory-extras.js",
  "./theory-extras.css",
  "./progress.html",
  "./chat.html",
  "./style.css",
  "./theme.css",
  "./theme.js",
  "./mobile.css",
  "./nav.js",
  "./navigation.css",
  "./home-announcements.js",
  "./auth.js",
  "./progress.js",
  "./data.js",
  "./config.js",
  "./firebase-config.js",
  "./notification-ui.js",
  "./notification-badge.png",
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
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("nph-pwa-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin && /\/admin\.html$/.test(url.pathname)) return;

  // Google Apps Script API: network first, cache fallback (قائمة المحاضرات أوفلاين)
  if (["script.google.com", "script.googleusercontent.com"].includes(url.hostname) && !url.search) {
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

  // Static assets: network first, allowing fixes to reach installed apps.
  if (url.origin === location.origin || url.href.startsWith(FONTAWESOME)) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
});
