/* FOUNDATIONS Push — FCM web push (phase 3)
   بيشتغل بس لو firebase-config.js اتملى. بيحمّل الـ SDK لوحده وبيسجّل توكن الجهاز للطالب المسجل. */
(function () {
  "use strict";
  const cfg = window.NPH_FIREBASE;
  if (!cfg || !window.NPH_VAPID_KEY) return;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const installed = window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  if (isIOS && !installed) return; // على iOS الإشعارات محتاجة التطبيق متثبت

  function load(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }

  async function init() {
    const auth = (() => { try { return JSON.parse(localStorage.getItem("NPH_AUTH_V1") || "null"); } catch (e) { return null; } })();
    if (!auth || !auth.token) return;
    try {
      if (typeof firebase === "undefined") {
        await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
        await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
      }
      if (!firebase.apps.length) firebase.initializeApp(cfg);
      const messaging = firebase.messaging();
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.register("firebase-messaging-sw.js");
      const token = await messaging.getToken({ vapidKey: window.NPH_VAPID_KEY, serviceWorkerRegistration: reg });
      if (!token) return;
      if (localStorage.getItem("NPH_PUSH_TOKEN") === token) return;
      const res = await fetch(window.NPH_API, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "stuPushToken", token: auth.token, pushToken: token, platform: isIOS ? "ios" : "web" })
      });
      const j = await res.json();
      if (j && j.ok) localStorage.setItem("NPH_PUSH_TOKEN", token);
      messaging.onMessage((p) => {
        const n = (p && p.notification) || {};
        if (window.NPH && NPH.toast) NPH.toast((n.title || "إشعار جديد") + (n.body ? " — " + n.body : ""));
      });
    } catch (e) { /* silent */ }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
