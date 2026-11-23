/* Opt-in notifications. Permission is requested only from a user click. */
(function(){
'use strict';
if(!window.NPH_FIREBASE || !window.NPH_VAPID_KEY || !('Notification' in window) || !('serviceWorker' in navigator))return;
const ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
if(ios && !navigator.standalone && !matchMedia('(display-mode: standalone)').matches)return;
const auth=()=>{try{return JSON.parse(localStorage.getItem('NPH_AUTH_V1')||'null')}catch(e){return null}};
const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.append(s)});
let messaging,busy=false;
const noticeUI=load('notification-ui.js').catch(()=>{});
async function setup(){
 if(!window.firebase){await load('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');await load('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');}
 if(!await firebase.messaging.isSupported())throw Error('المتصفح ده مش بيدعم الإشعارات');
 if(!firebase.apps.length)firebase.initializeApp(window.NPH_FIREBASE);
 if(!messaging){messaging=firebase.messaging();messaging.onMessage(async p=>{await noticeUI;if(window.NPH_NOTIFY)NPH_NOTIFY(p);else if(window.NPH?.toast)NPH.toast(p.notification?.title||p.data?.title||'إشعار جديد');});}
 return messaging;
}
async function enable(button){
 if(busy)return;busy=true;button.disabled=true;
 try{
  const a=auth();if(!a?.token)throw Error('سجل دخولك الأول');
  // Permission request precedes asynchronous SDK loading, preserving the click gesture.
  if(await Notification.requestPermission()!=='granted')throw Error('الإشعارات مش مسموحة. تقدر تغيرها من إعدادات المتصفح');
  const m=await setup();const reg=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
  const token=await m.getToken({vapidKey:window.NPH_VAPID_KEY,serviceWorkerRegistration:reg});
  if(!token)throw Error('مقدرناش نسجل الجهاز، جرب تاني');
  const api=typeof API!=='undefined'?API:null;if(!api)throw Error('رابط الخدمة مش متاح');
  const response=await fetch(api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'stuPushToken',token:a.token,pushToken:token,platform:ios?'ios':'web'})});
  const result=await response.json();if(!result.ok)throw Error(result.error||'التسجيل فشل');
  localStorage.setItem('NPH_PUSH_OWNER',a.username);button.textContent='الإشعارات مفعّلة ✓';
 }catch(e){button.textContent=e.message||'حصل خطأ، جرب تاني';}finally{button.disabled=false;busy=false;}
}
window.NPH_PUSH_DISABLE=async()=>{try{const m=await setup();await m.deleteToken();localStorage.removeItem('NPH_PUSH_OWNER');}catch(e){throw Error('مقدرناش نوقف إشعارات الحساب على الجهاز. اتأكد من النت وجرب تاني.');}};
function mount(){
 if(!auth()?.token || document.getElementById('nphPushEnable'))return;
 const b=document.createElement('button');b.id='nphPushEnable';b.type='button';b.textContent='فعّل إشعارات المحاضرات والردود';
 b.style.cssText='position:fixed;bottom:76px;left:16px;max-width:calc(100vw - 32px);z-index:970;border:1px solid #d4af5a;border-radius:20px;padding:10px 16px;background:#0b2540;color:#fff;font:inherit;cursor:pointer';
 b.onclick=()=>enable(b);(document.getElementById("nphMenuTools")||document.body).append(b);
 if(Notification.permission==='granted' && localStorage.getItem('NPH_PUSH_OWNER')===auth()?.username){b.textContent='الإشعارات مفعّلة ✓';setup().catch(()=>{b.textContent='اضغط لتحديث تفعيل الإشعارات';});}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
window.addEventListener('storage',mount);
})();
