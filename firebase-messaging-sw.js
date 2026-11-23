/* Imported by sw.js, one worker owns the app scope. */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.stopImmediatePropagation();
  const raw = event.notification.data?.url || event.notification.data?.FCM_MSG?.data?.url || 'index.html';
  const url = new URL(raw, self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async list => {
    const client = list.find(c=>new URL(c.url).origin===url.origin);
    if(client){await client.navigate(url.href);return client.focus();}
    return clients.openWindow(url.href);
  }));
});
importScripts('./firebase-config.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp(self.NPH_FIREBASE);
firebase.messaging().onBackgroundMessage(payload => {
  // Notification payloads are displayed by the SDK, never display them twice.
  if(payload.notification) return;
  const d=payload.data || {};
  return self.registration.showNotification(d.title || 'إشعار جديد', {
    body:d.body || '',icon:'icon.png',badge:'notification-badge.png',dir:'rtl',lang:'ar',
    vibrate:[120,60,120],tag:d.tag || payload.messageId || 'nph-'+Date.now(),renotify:true,
    data:{url:d.url || 'index.html'}
  });
});
