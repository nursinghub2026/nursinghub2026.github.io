/* Foreground push cards. Message text is always inserted as text, never HTML. */
(function(){
'use strict';
const style=document.createElement('style');
style.textContent=`
.nph-notices{position:fixed;top:max(86px,env(safe-area-inset-top));left:20px;right:20px;z-index:1100;display:grid;gap:12px;pointer-events:none;max-width:420px;margin-inline:auto;direction:rtl}
.nph-notice{position:relative;display:flex;align-items:flex-start;gap:13px;padding:18px 16px 21px;background:var(--card,#fff);color:var(--txt,#1c2b3a);border:1px solid #d4af5a70;border-radius:22px;box-shadow:0 18px 50px #08172b2e;pointer-events:auto;overflow:hidden;animation:nph-notice-in .4s cubic-bezier(.2,.8,.2,1) both}
.nph-notice::after{content:'';position:absolute;bottom:0;right:0;width:100%;height:3px;background:linear-gradient(90deg,#d4af5a,#f0d58a);transform-origin:right;animation:nph-notice-time 12s linear forwards}
.nph-notice:hover::after,.nph-notice:focus-within::after{animation-play-state:paused}
.nph-notice-icon{width:46px;height:46px;display:grid;place-items:center;flex:none;border-radius:15px;background:linear-gradient(145deg,#102d4b,#08172b);box-shadow:inset 0 0 0 1px #d4af5a40;color:#f0d58a}
.nph-notice-icon svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.nph-notice-copy{min-width:0;flex:1}.nph-notice-brand{display:flex;align-items:center;gap:6px;margin:0 0 7px;font-size:9px;font-weight:800;letter-spacing:1.8px;color:var(--mut,#657689);direction:ltr;justify-content:flex-end}.nph-notice-brand span{width:5px;height:5px;border-radius:50%;background:#d4af5a}
.nph-notice h3{font-family:inherit;font-weight:800;font-size:15px;line-height:1.6;margin:0 0 4px;overflow-wrap:anywhere}.nph-notice p{margin:0;color:var(--txt2,#4a5f73);font-size:12px;line-height:1.9;overflow-wrap:anywhere}
.nph-notice-open{display:inline-flex;align-items:center;gap:8px;color:#8a6517;background:#fbf3de;border:1px solid #d4af5a40;border-radius:9px;padding:5px 10px;margin-top:12px;text-decoration:none;font-size:11px;font-weight:800}.nph-notice-open:hover{background:#f5e7bf}.nph-notice-open:focus-visible,.nph-notice-close:focus-visible{outline:2px solid #d4af5a;outline-offset:3px}
.nph-notice-close{border:0;background:transparent;color:var(--mut,#657689);cursor:pointer;padding:2px;font:22px/1.1 sans-serif;flex:none;width:24px;height:24px;border-radius:7px}.nph-notice-close:hover{background:#d4af5a20}
html[data-theme=dark] .nph-notice{background:#12233a;box-shadow:0 18px 50px #0006}html[data-theme=dark] .nph-notice-open{background:#d4af5a18;color:#f0d58a}
.nph-notice.leaving{animation:nph-notice-out .22s ease forwards}
@keyframes nph-notice-in{from{opacity:0;transform:translateY(-16px) scale(.97)}to{opacity:1;transform:none}}@keyframes nph-notice-out{to{opacity:0;transform:translateY(-12px)}}@keyframes nph-notice-time{to{transform:scaleX(0)}}
@media(min-width:700px){.nph-notices{left:26px;right:auto;margin:0;top:92px}}@media(prefers-reduced-motion:reduce){.nph-notice,.nph-notice.leaving,.nph-notice::after{animation:none}}
`;
document.head.append(style);
let region;
window.NPH_NOTIFY=function(payload){
 const n=payload.notification||payload.data||payload||{},d=payload.data||{};
 if(!region){region=document.createElement('section');region.className='nph-notices';region.setAttribute('aria-label','إشعارات المنصة');document.body.append(region);}
 while(region.children.length>=3)region.firstElementChild.remove();
 const card=document.createElement('article');card.className='nph-notice';card.setAttribute('role','status');
 const icon=document.createElement('div');icon.className='nph-notice-icon';icon.setAttribute('aria-hidden','true');
 icon.innerHTML='<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4M12 2v2"/></svg>';
 const copy=document.createElement('div');copy.className='nph-notice-copy';
 const brand=document.createElement('div');brand.className='nph-notice-brand';brand.textContent='FOUNDATIONS';brand.append(document.createElement('span'));
 const title=document.createElement('h3');title.textContent=n.title||'إشعار جديد';
 const body=document.createElement('p');body.textContent=n.body||'';
 copy.append(brand,title,body);
 const raw=d.url||payload.fcmOptions?.link||'index.html';let target;
 try{const u=new URL(raw,location.href);if(u.origin===location.origin&&/^https?:$/.test(u.protocol))target=u.href;}catch(e){}
 if(target){const link=document.createElement('a');link.className='nph-notice-open';link.href=target;link.textContent='افتح التفاصيل ←';copy.append(link);}
 const close=document.createElement('button');close.type='button';close.className='nph-notice-close';close.setAttribute('aria-label','إغلاق الإشعار');close.textContent='×';
 let timer,remaining=12000,started;const dismiss=()=>{clearTimeout(timer);card.classList.add('leaving');setTimeout(()=>card.remove(),230)};
 const pause=()=>{clearTimeout(timer);if(started){remaining-=Date.now()-started;started=null}};const resume=()=>{started=Date.now();timer=setTimeout(dismiss,Math.max(remaining,1000))};
 card.addEventListener('mouseenter',pause);card.addEventListener('mouseleave',resume);card.addEventListener('focusin',pause);card.addEventListener('focusout',e=>{if(!card.contains(e.relatedTarget))resume()});close.onclick=dismiss;
 card.append(icon,copy,close);region.append(card);resume();return card;
};
})();
