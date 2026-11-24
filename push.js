/* Opt-in notifications. Permission is requested only from a user click.
   v2: auto-heal when permission was granted but the token never saved,
   persistent states instead of transient button text, iOS PWA guidance,
   in-app browser hint. Additive: same backend action (stuPushToken). */
(function(){
'use strict';
var LS_ERR='NPH_PUSH_ERR_V1';
var auth=function(){try{return JSON.parse(localStorage.getItem('NPH_AUTH_V1')||'null')}catch(e){return null}};
var ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
var standalone=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
var inApp=/FBAN|FBAV|Instagram|WhatsApp|Telegram|TikTok|Line\//.test(navigator.userAgent);
var supported=('Notification' in window)&&('serviceWorker' in navigator);

if(!window.NPH_FIREBASE||!window.NPH_VAPID_KEY)return;

/* Always the body: the side menu is display:none until opened, which used to hide the button. */
function host(){return document.body}
function card(id,html){
 var d=document.getElementById(id);if(d){d.innerHTML=html;return d}
 d=document.createElement('div');d.id=id;
 d.style.cssText='position:fixed;bottom:76px;left:16px;right:16px;max-width:520px;margin:auto;z-index:971;background:#0b2540;color:#fff;border:1px solid #d4af5a;border-radius:18px;padding:14px 16px;font-size:13.5px;line-height:1.9;box-shadow:0 12px 28px rgba(0,0,0,.35)';
 d.innerHTML=html;host().append(d);return d;
}
function removeCard(id){var d=document.getElementById(id);if(d&&d.remove)d.remove()}

/* Push activation control: lives inside the inbox panel (#nphPushSlot).
   No floating bottom element anywhere. States: idle / busy / on / retry / refresh. */
(function(){
 var css='#nphPushCtl{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px 14px;border-radius:14px;border:1px solid rgba(212,175,90,.55);background:linear-gradient(135deg,#d4af5a,#f0d58a);color:#08172b;font:800 13px/1.4 inherit;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}'
 +'#nphPushCtl i{font-size:14px}'
 +'#nphPushCtl.on{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#7fe3ae;font-weight:800;cursor:default}'
 +'#nphPushCtl.on i{color:#7fe3ae}'
 +'#nphPushCtl.warn{border-color:rgba(212,175,90,.5);background:linear-gradient(135deg,#8a6a1c,#b48a2a);color:#fff}'
 +'#nphPushCtl.warn i{color:#ffe9b0}'
 +'#nphPushCtl:disabled{opacity:.75;cursor:wait}';
 var st=document.createElement('style');st.textContent=css;document.head.append(st);
})();
function setBtn(b,state){
 if(!b)return;
 b.classList.remove('on','warn');
 if(state==='on'){b.classList.add('on');b.innerHTML='<i class="fa-solid fa-circle-check"></i><span>الإشعارات مفعّلة على جهازك</span>';}
 else if(state==='busy'){b.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i><span>جاري تفعيل الإشعارات…</span>';}
 else if(state==='retry'){b.classList.add('warn');b.innerHTML='<i class="fa-solid fa-rotate-right"></i><span>اضغط للمحاولة تاني</span>';}
 else if(state==='refresh'){b.classList.add('warn');b.innerHTML='<i class="fa-solid fa-rotate-right"></i><span>اضغط لتحديث تفعيل الإشعارات</span>';}
 else{b.innerHTML='<i class="fa-solid fa-bell"></i><span>فعّل إشعارات المحاضرات والردود</span>';}
}

/* iOS outside the installed PWA: no push is possible. Say so instead of hiding. */
if(ios&&!standalone){
 card('nphPushIos','<b>الإشعارات على آيفون 📱</b><br>إشعارات الموقع بتشتغل من التطبيق بس:<br>١. افتح الموقع في <b>سفاري</b><br>٢. اضغط <b>مشاركة</b> ← <b>«إضافة إلى الشاشة الرئيسية»</b><br>٣. افتح التطبيق اللي اتثبّت، سجّل دخولك، وفعّل الإشعارات منه');
 return;
}
/* In-app browsers (WhatsApp/Telegram/Facebook): no service worker. Point to a real browser. */
if(!supported){
 if(inApp)card('nphPushWebview','<b>الإشعارات مش بتشتغل من المتصفح المدمج ده</b><br>افتح الرابط من قائمة <b>⋮</b> في <b>كروم</b> (أندرويد) أو <b>سفاري</b> (آيفون) وبعدين فعّل الإشعارات.');
 return;
}

var load=function(src){return new Promise(function(resolve,reject){var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.append(s)})};
var messaging=null,busy=false;
var noticeUI=load('notification-ui.js').catch(function(){});
async function setup(){
 if(!window.firebase){await load('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');await load('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');}
 if(!await firebase.messaging.isSupported())throw Error('المتصفح ده مش بيدعم الإشعارات');
 if(!firebase.apps.length)firebase.initializeApp(window.NPH_FIREBASE);
 if(!messaging){messaging=firebase.messaging();messaging.onMessage(async function(p){await noticeUI;if(window.NPH_NOTIFY)NPH_NOTIFY(p);else if(window.NPH&&NPH.toast)NPH.toast((p.notification&&p.notification.title)||(p.data&&p.data.title)||'إشعار جديد');});}
 return messaging;
}
/* The actual registration. Needs auth + granted permission; no user gesture required. */
async function register(){
 var a=auth();if(!a||!a.token)throw Error('سجل دخولك الأول');
 var m=await setup();
 var reg=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
 var token=await m.getToken({vapidKey:window.NPH_VAPID_KEY,serviceWorkerRegistration:reg});
 if(!token)throw Error('مقدرناش نسجل الجهاز، جرب تاني');
 var api=typeof API!=='undefined'?API:null;if(!api)throw Error('رابط الخدمة مش متاح');
 var response=await fetch(api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'stuPushToken',token:a.token,pushToken:token,platform:ios?'ios':'web'})});
 var result=await response.json();if(!result.ok)throw Error(result.error||'التسجيل فشل');
 localStorage.setItem('NPH_PUSH_OWNER',a.username);
 localStorage.removeItem(LS_ERR);
 removeCard('nphPushErr');
 logAttempt('enabled','ok');
 return token;
}
function rememberError(e){try{localStorage.setItem(LS_ERR,JSON.stringify({m:String((e&&e.message)||e),at:Date.now()}))}catch(_){}}
function lastError(){try{return JSON.parse(localStorage.getItem(LS_ERR)||'null')}catch(e){return null}}
/* Fire-and-forget diagnostic: why enabling failed on this device (append-only PushAttempts sheet). */
function logAttempt(stage,msg){
 try{
  var a=auth();var api=typeof API!=='undefined'?API:null;if(!api)return;
  fetch(api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'stuPushAttempt',token:a&&a.token?a.token:'',stage:String(stage||'').slice(0,40),message:String(msg||'').slice(0,180),ua:String(navigator.userAgent||'').slice(0,180)})}).catch(function(){});
 }catch(e){}
}

async function enable(button){
 if(busy)return;busy=true;button.disabled=true;setBtn(button,'busy');
 try{
  var a=auth();if(!a||!a.token)throw Error('سجل دخولك الأول');
  // Permission request precedes asynchronous SDK loading, preserving the click gesture.
  if(Notification.permission!=='granted'&&await Notification.requestPermission()!=='granted')throw Error('الإشعارات مش مسموحة');
  await register();
  setBtn(button,'on');
  return true;
 }catch(e){
  rememberError(e);showError(button,e);logAttempt('enable-error',e&&e.message);
  return false;
 }finally{button.disabled=false;busy=false;}
}
function showError(button,e){
 setBtn(button,'retry');
 card('nphPushErr','<b>الإشعارات لسه مش متفعلة على الجهاز ده</b><br>'+String((e&&e.message)||e)+'<br><small>لو الإذن متظبط والرسالة بتتكرر، جرب تفتح الموقع في كروم أو سفاري على نت ثابت.</small>');
}
window.NPH_PUSH_DISABLE=async function(){try{var m=await setup();await m.deleteToken();localStorage.removeItem('NPH_PUSH_OWNER');}catch(e){throw Error('مقدرناش نوقف إشعارات الحساب على الجهاز. اتأكد من النت وجرب تاني.');}};

function wire(b){
 if(Notification.permission==='granted'){
  var a=auth();
  if(a&&localStorage.getItem('NPH_PUSH_OWNER')===a.username){
   setBtn(b,'on');
   setup().catch(function(){setBtn(b,'refresh');});
   b.onclick=function(){enable(b)};
  }else{
   /* Auto-heal: permission was granted before but the token never saved. Retry silently, no tap needed. */
   setBtn(b,'busy');b.disabled=true;
   register().then(function(){setBtn(b,'on');b.disabled=false;b.onclick=function(){enable(b)};})
    .catch(function(e){b.disabled=false;rememberError(e);showError(b,e);logAttempt('autoheal-error',e&&e.message);b.onclick=function(){enable(b)};});
  }
 }else if(Notification.permission==='denied'){
  setBtn(b,'warn');
  b.onclick=function(){card('nphPushErr','<b>الإشعارات محظورة للموقع من المتصفح</b><br>اضغط أيقونة القفل 🔒 جنب الرابط ← إعدادات الموقع ← الإشعارات ← <b>سماح</b>، وبعدين ارجع اضغط هنا.');setBtn(b,'idle');b.onclick=function(){enable(b)};};
 }else{
  var err=lastError();if(err)setBtn(b,'retry');
  b.onclick=function(){enable(b)};
  maybePrompt(b);
 }
}
/* The activation control lives inside the inbox panel; nothing floats at the bottom of pages. */
window.NPH_PUSH_MOUNT=function(container){
 if(!container||document.getElementById('nphPushCtl'))return;
 var b=document.createElement('button');b.id='nphPushCtl';b.type='button';setBtn(b,'idle');
 container.appendChild(b);
 wire(b);
};
function mount(){
 var a=auth();if(!a||!a.token)return;
 var slot=document.getElementById('nphPushSlot');
 if(slot)window.NPH_PUSH_MOUNT(slot);
}
/* First-visit prompt: one clear tap. Once per device; dismissible. */
function maybePrompt(button){
 try{if(localStorage.getItem('NPH_PUSH_PROMPT_V1'))return}catch(e){return}
 var d=card('nphPushPrompt','<b>🔔 فعّل الإشعارات</b><br>يوصلك تنبيه أول ما تنزل محاضرة جديدة، رد الإدارة على سؤالك، وتذكير بمواقيت الصلاة.<br><div style="display:flex;gap:8px;margin-top:10px"><button id="nphPushPromptYes" type="button" style="flex:1;border:0;border-radius:14px;padding:10px 14px;background:#d4af5a;color:#08172b;font:inherit;font-weight:900;cursor:pointer">فعّل دلوقتي</button><button id="nphPushPromptNo" type="button" style="border:1px solid rgba(255,255,255,.35);border-radius:14px;padding:10px 14px;background:transparent;color:#fff;font:inherit;cursor:pointer">لاحقًا</button></div>');
 d.style.bottom='130px';
 document.getElementById('nphPushPromptNo').onclick=function(){
  try{localStorage.setItem('NPH_PUSH_PROMPT_V1','later')}catch(e){}
  removeCard('nphPushPrompt');
 };
 document.getElementById('nphPushPromptYes').onclick=async function(){
  var ok=await enable(button);
  if(ok){try{localStorage.setItem('NPH_PUSH_PROMPT_V1','done')}catch(e){};removeCard('nphPushPrompt');}
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
window.addEventListener('storage',mount);
})();
