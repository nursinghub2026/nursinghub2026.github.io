/* FCM background handler — الإعدادات بتتحط هنا مع firebase-config.js */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// PASTE_CONFIG: نفس قيم window.NPH_FIREBASE من firebase-config.js
firebase.initializeApp({
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const n = (payload && payload.notification) || {};
  self.registration.showNotification(n.title || "FOUNDATIONS", {
    body: n.body || "",
    icon: "icon-192.png",
    badge: "icon-192.png",
    dir: "rtl",
    lang: "ar",
    data: { url: (payload && payload.data && payload.data.url) || "index.html" }
  });
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "index.html";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
    return clients.openWindow(url);
  }));
});
