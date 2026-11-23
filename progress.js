/* نظام تقدم الطالب - FOUNDATIONS
   كل البيانات بتتحفظ على جهاز الطالب نفسه (localStorage) من غير تسجيل دخول.
   بيشتغل على كل الصفحات العامة، ومبيلمسش الأدمن ولا الـ API. */
(function(){
const KEY="NPH_PROGRESS_V1";
const def=()=>({v:1,done:{},fav:{},notes:{},last:null,days:{},badges:{}});
let S=def();
try{const r=localStorage.getItem(KEY);if(r){const p=JSON.parse(r);if(p&&typeof p==="object")S=Object.assign(def(),p)}}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(window.NPH_SYNC_HOOK)try{window.NPH_SYNC_HOOK()}catch(e){}}
const pad=n=>String(n).padStart(2,"0");
const dayKey=d=>{d=d||new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};

/* --- النشاط والاستمرارية --- */
function touch(lid,tab){
  if(lid)S.last={lid:String(lid),tab:tab||"explanation",ts:Date.now()};
  const k=dayKey();S.days[k]=(S.days[k]||0)+1;
  save();
}
function getLast(){return S.last}
function streak(){
  let s=0;const d=new Date();
  if(!S.days[dayKey(d)])d.setDate(d.getDate()-1);
  while(S.days[dayKey(d)]){s++;d.setDate(d.getDate()-1)}
  return s;
}
function bestStreak(){
  const ks=Object.keys(S.days).sort();let best=0,cur=0,prev=null;
  ks.forEach(k=>{const t=new Date(k+"T00:00:00").getTime();
    cur=(prev&&t-prev===86400000)?cur+1:1;
    if(cur>best)best=cur;prev=t});
  return best;
}
function last7(){
  const out=[];const names=["أحد","اتنين","تلات","أربع","خميس","جمعة","سبت"];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);
    out.push({key:dayKey(d),label:names[d.getDay()],active:!!S.days[dayKey(d)],today:i===0})}
  return out;
}

/* --- علامات الإنجاز والمفضلة --- */
function isDone(id){return !!S.done[id]}
function toggleDone(id){
  let on;
  if(S.done[id]){delete S.done[id];on=false}
  else{S.done[id]=Date.now();on=true;const k=dayKey();S.days[k]=(S.days[k]||0)+1}
  save();
  return on;
}
function doneCount(){return Object.keys(S.done).length}
function isFav(id){return !!S.fav[id]}
function toggleFav(id){
  let on;
  if(S.fav[id]){delete S.fav[id];on=false}
  else{S.fav[id]=Date.now();on=true}
  save();
  return on;
}
function favIds(){return Object.keys(S.fav)}

/* --- الملاحظات --- */
function getNote(lid){const n=S.notes[String(lid)];return n?n.text||"":""}
function setNote(lid,text){
  lid=String(lid);
  if(!text||!text.trim())delete S.notes[lid];
  else S.notes[lid]={text:text,ts:Date.now()};
  save();
}
function notesList(){return Object.keys(S.notes).map(k=>({lid:k,text:S.notes[k].text,ts:S.notes[k].ts}))}

/* --- حساب التقدم من بيانات المحاضرات --- */
function lectureItems(l){
  const out=[];const sec=l.sections||{};
  Object.keys(sec).forEach(k=>(sec[k]||[]).forEach(it=>{if(it&&it.id)out.push({sec:k,id:it.id,title:it.title})}));
  return out;
}
function lectureProgress(l){
  const items=lectureItems(l);
  const d=items.filter(i=>S.done[i.id]).length;
  return{done:d,total:items.length,pct:items.length?Math.round(d/items.length*100):0};
}
function overall(L){
  let d=0,t=0;(L||[]).forEach(l=>{const p=lectureProgress(l);d+=p.done;t+=p.total});
  return{done:d,total:t,pct:t?Math.round(d/t*100):0};
}
function statsFor(L){
  const o=overall(L);
  const full=(L||[]).filter(l=>{const p=lectureProgress(l);return p.total>0&&p.done>=p.total}).length;
  return{done:o.done,total:o.total,pct:o.pct,fullLecs:full,streak:streak()};
}
function findItem(L,itemId){
  for(const l of (L||[])){const sec=l.sections||{};
    for(const k of Object.keys(sec)){const it=(sec[k]||[]).find(x=>x.id===itemId);
      if(it)return{lecture:l,sec:k,item:it}}}
  return null;
}

/* --- الأوسمة --- */
const BADGES=[
  {id:"first", icon:"fa-shoe-prints",      name:"أول خطوة",     desc:"خلّصت أول عنصر"},
  {id:"five",  icon:"fa-star-half-stroke", name:"خمسة وطالع",   desc:"5 عناصر مخلّصة"},
  {id:"fifteen",icon:"fa-star",            name:"مذاكر نشيط",   desc:"15 عنصر مخلّص"},
  {id:"thirty",icon:"fa-medal",            name:"ما شاء الله",  desc:"30 عنصر مخلّص"},
  {id:"lec1",  icon:"fa-book-open-reader", name:"محاضرة كاملة", desc:"خلّصت محاضرة بالكامل"},
  {id:"lec3",  icon:"fa-bolt",             name:"تالتها ثابتة", desc:"3 محاضرات كاملة"},
  {id:"streak3",icon:"fa-fire",            name:"نار المذاكرة", desc:"3 أيام مذاكرة ورا بعض"},
  {id:"streak7",icon:"fa-trophy",          name:"أسبوع كامل",   desc:"7 أيام مذاكرة ورا بعض"}
];
function badgeList(st){
  return BADGES.map(b=>({icon:b.icon,name:b.name,desc:b.desc,got:!!S.badges[b.id],ts:S.badges[b.id]||null,
    could:b.id==="first"?st.done>=1:b.id==="five"?st.done>=5:b.id==="fifteen"?st.done>=15:b.id==="thirty"?st.done>=30:
      b.id==="lec1"?st.fullLecs>=1:b.id==="lec3"?st.fullLecs>=3:b.id==="streak3"?st.streak>=3:st.streak>=7}));
}
function checkBadges(st){
  if(!st)return;
  const fresh=[];
  badgeList(st).forEach((b,i)=>{if(b.could&&!S.badges[BADGES[i].id]){S.badges[BADGES[i].id]=Date.now();fresh.push(BADGES[i])}});
  if(fresh.length){save();fresh.forEach((b,i)=>setTimeout(()=>toast("fa-award","وسام جديد: "+b.name,b.desc),i*1400))}
}

/* --- توست --- */
let toastBox=null;
function toast(icon,title,sub){
  ensureCss();
  if(!toastBox){toastBox=h("div",{class:"ptoasts"});document.body.appendChild(toastBox)}
  const t=h("div",{class:"ptoast"},h("span",{class:"pti"},ic(icon)),h("div",null,h("b",null,title),sub?h("small",null,sub):null));
  toastBox.appendChild(t);
  requestAnimationFrame(()=>t.classList.add("in"));
  setTimeout(()=>{t.classList.remove("in");setTimeout(()=>t.remove(),400)},3600);
}

/* --- تلميح الآيفون (للمرحلة الجاية مع الإشعارات) ---
   بيظهر لو إشعارات الويب اتفعلت (NPH_PUSH_ENABLED) والطالب على iOS سفاري ومش مثبت الموقع.
   للمعاينة دلوقتي: افتح أي صفحة ومعاك #ioshint في الرابط. */
function iosHint(force){
  ensureCss();
  const dismissed=(()=>{try{return localStorage.getItem("NPH_IOS_HINT_OFF")==="1"}catch(e){return false}})();
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
  const installed=window.navigator.standalone===true||window.matchMedia("(display-mode: standalone)").matches;
  const enabled=window.NPH_PUSH_ENABLED===true;
  const preview=force||location.hash==="#ioshint";
  if(!preview&&!(enabled&&isIOS&&!installed&&!dismissed))return;
  const close=()=>{try{localStorage.setItem("NPH_IOS_HINT_OFF","1")}catch(e){}sh.classList.remove("in");setTimeout(()=>sh.remove(),350)};
  const sh=h("div",{class:"pioss"},
    h("div",{class:"piosc rv"},
      h("button",{class:"piosx",type:"button","aria-label":"إغلاق",onclick:close},ic("fa-xmark")),
      h("div",{class:"piosti"},ic("fa-bell")),
      h("b",null,"عايز يوصلك إشعار أول ما محاضرة جديدة تنزل؟"),
      h("p",null,"على الآيفون: افتح الموقع من سفاري، دوس زرار المشاركة",h("span",{class:"piosic"},ic("fa-arrow-up-from-bracket")),"، وبعدها اختار «Add to Home Screen» وافتح الموقع من الأيقونة."),
      h("button",{class:"btn sm",type:"button",onclick:close},"تمام، فهمت")));
  document.body.appendChild(sh);
  requestAnimationFrame(()=>sh.classList.add("in"));
}

/* --- ستايل المكونات (بيتضاف مرة واحدة) --- */
let cssDone=false;
function ensureCss(){
  if(cssDone)return;cssDone=true;
  const css=`
.pbar{height:9px;border-radius:9px;background:rgba(13,34,56,.1);overflow:hidden}
.pbar i{display:block;height:100%;width:0;border-radius:9px;background:linear-gradient(90deg,var(--ac),var(--ac2));transition:width .5s ease}
.pbar.gold i{background:linear-gradient(90deg,var(--gold),var(--gold2))}
.pbar.sm{height:7px}
.pacts{display:flex;gap:8px;flex:none}
.pdone,.pfav{display:inline-flex;align-items:center;gap:6px;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:8px 12px;font-size:12.5px;font-weight:800;color:var(--mut);cursor:pointer;font-family:inherit;transition:.2s;-webkit-tap-highlight-color:transparent}
.pdone:hover,.pfav:hover{border-color:var(--ac);color:var(--ac)}
.pdone.on{background:linear-gradient(135deg,var(--ac),var(--ac2));border-color:transparent;color:#fff;box-shadow:0 6px 14px rgba(13,34,56,.18)}
.pfav{padding:8px 10px}
.pfav.on{background:linear-gradient(135deg,var(--gold),var(--gold2));border-color:transparent;color:#4a3608}
.ihead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.plp{margin-top:16px;display:flex;align-items:center;gap:12px}
.plp .pbar{flex:1;background:rgba(255,255,255,.22)}
.plp .pbar i{background:linear-gradient(90deg,var(--gold),var(--gold2))}
.plp .plpt{font-size:12.5px;font-weight:800;color:#eaf6f6;white-space:nowrap}
.pmini{display:flex;align-items:center;gap:10px;margin-top:12px}
.pmini .pbar{flex:1}
.pmini .ppct{font-size:12px;font-weight:900;color:var(--ac);min-width:34px;text-align:left;direction:ltr}
.pdonechip{position:absolute;top:14px;left:14px;z-index:2;display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.92);color:var(--ac);font-size:11px;font-weight:900;padding:5px 11px;border-radius:20px;box-shadow:0 4px 10px rgba(0,0,0,.15)}
.pnotec{background:#fff;border-radius:24px;padding:22px;box-shadow:var(--sh);border:1px solid rgba(13,34,56,.05)}
.pnoteh{display:flex;align-items:center;gap:8px;font-weight:900;font-size:15px;margin-bottom:10px;color:var(--ink)}
.pnoteh i{color:var(--gold)}
.pnoteh small{margin-right:auto;color:#2f9e44;font-weight:700;font-size:12px}
.ptext{width:100%;border:1.5px solid var(--line);border-radius:16px;padding:12px 14px;font-size:14.5px;line-height:1.9;resize:vertical;background:#fbfdfe;color:var(--ink);font-family:inherit}
.ptext:focus{outline:none;border-color:var(--ac);box-shadow:0 0 0 3px var(--acs)}
.pcont{display:flex;align-items:center;gap:14px;background:#fff;border-radius:24px;padding:18px;box-shadow:var(--sh);border:1px solid rgba(13,34,56,.05);transition:.25s;margin-top:16px}
.pcont:hover{transform:translateY(-3px);box-shadow:var(--sh2)}
.pcont .pci{width:52px;height:52px;flex:none;border-radius:16px;display:grid;place-items:center;font-size:22px;color:#fff;background:linear-gradient(135deg,var(--teal),var(--teal2))}
.pcont .pci.gold{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#4a3608}
.pcont .pcb{flex:1;min-width:0}
.pcont .pcb small{color:var(--mut);font-size:11.5px;font-weight:800}
.pcont .pcb b{display:block;font-size:15.5px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pcont .pbar{margin-top:8px}
.pcont .pcn{font-size:17px;font-weight:900;color:var(--ac);direction:ltr}
.ptoasts{position:fixed;bottom:18px;right:16px;left:16px;z-index:200;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none}
.ptoast{display:flex;align-items:center;gap:12px;background:linear-gradient(135deg,#0b2540,#123b5c);color:#fff;border:1px solid rgba(212,175,90,.5);border-radius:18px;padding:12px 18px;box-shadow:0 16px 40px rgba(6,16,31,.45);opacity:0;transform:translateY(14px);transition:.35s;max-width:420px}
.ptoast.in{opacity:1;transform:none}
.ptoast .pti{width:40px;height:40px;flex:none;border-radius:13px;display:grid;place-items:center;font-size:18px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#4a3608}
.ptoast b{display:block;font-size:14px}
.ptoast small{color:#c9d8e4;font-size:12px}
.pioss{position:fixed;inset:0;z-index:210;background:rgba(6,16,30,.55);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:.3s;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.pioss.in{opacity:1}
.piosc{position:relative;background:#fff;border-radius:28px 28px 0 0;padding:30px 22px 26px;max-width:480px;width:100%;text-align:center;transform:translateY(30px);transition:.3s}
.pioss.in .piosc{transform:none}
.piosc b{display:block;font-size:17px;line-height:1.7;margin-top:12px}
.piosc p{color:var(--mut);font-size:14px;line-height:2;margin:10px 0 16px}
.piosc .btn{width:100%}
.piosx{position:absolute;top:14px;left:14px;width:36px;height:36px;border-radius:12px;border:0;background:#f0f4f8;color:var(--mut);cursor:pointer;font-size:15px}
.piosti{width:60px;height:60px;margin:auto;border-radius:20px;display:grid;place-items:center;font-size:26px;color:#fff;background:linear-gradient(135deg,var(--teal),var(--teal2))}
.piosic{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;background:var(--acs);color:var(--ac);vertical-align:middle;margin:0 2px}
`;
  const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
}

/* --- تصدير --- */
window.NPH={
  touch,getLast,streak,bestStreak,last7,
  isDone,toggleDone,doneCount,isFav,toggleFav,favIds,
  getNote,setNote,notesList,
  lectureItems,lectureProgress,overall,statsFor,findItem,
  badgeList,checkBadges,toast,iosHint,ensureCss,
  reload(){try{const r=localStorage.getItem(KEY);S=r?Object.assign(def(),JSON.parse(r)):def()}catch(e){S=def()}},
  reset(){try{localStorage.removeItem(KEY)}catch(e){}S=def()}
};
ensureCss();
document.addEventListener("DOMContentLoaded",()=>{try{iosHint(false)}catch(e){}});
})();
