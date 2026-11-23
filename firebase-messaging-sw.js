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
  const kind=['lecture','quiz','reply','motivation','none'].includes(d.banner)?d.banner:/chat/.test(d.url||'')?'reply':/كويز|اختبار/.test(d.title||'')?'quiz':/محاضرة/.test(d.title||'')?'lecture':'motivation';
  const title=d.title || 'إشعار جديد';
  let customImage='';try{const u=new URL(d.imageUrl||'');if(u.protocol==='https:'&&u.hostname==='res.cloudinary.com')customImage=u.href}catch(e){}
  return self.registration.showNotification(/^FOUNDATIONS/.test(title)?title:'FOUNDATIONS • '+title, {
    body:d.body || '',...(customImage?{image:customImage}:kind==='none'?{}:{image:'notification-images/'+kind+'.png'}),icon:'icon.png',badge:'notification-badge.png',dir:'rtl',lang:'ar',
    vibrate:[120,60,120],tag:d.tag || payload.messageId || 'nph-'+Date.now(),renotify:true,
    data:{url:d.url || 'index.html'}
  });
});
