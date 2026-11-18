const API="https://script.google.com/macros/s/AKfycbzAkny0ZeMMNTDTxx9Tjw5dvXQO-oe_K1TyYrRjSnkt5acZXD1bgYZFU4E7ODl42QDZpQ/exec";
const BRAND={name:"FOUNDATIONS",sub:"FUNDAMENTALS OF NURSING"};
const PAGES=[["index.html","الرئيسية","fa-house"],["Lectures.html?track=theory","النظري","fa-book-open"],["Lectures.html?track=practical","العملي","fa-hand-holding-medical"],["adhkar.html","الأدعية والأذكار","fa-hands-praying"],["tips.html","نصايح المذاكرة","fa-graduation-cap"],["suggestions.html","الاقتراحات","fa-comments"]];
function ap(e,c){if(c==null||c===false)return;if(Array.isArray(c)){c.forEach(x=>ap(e,x));return}e.appendChild(c.nodeType?c:document.createTextNode(String(c)))}
function h(t,a){const e=document.createElement(t);if(a)for(const k in a){const v=a[k];if(v==null||v===false)continue;if(k==="class")e.className=v;else if(k==="style")e.style.cssText=v;else if(k==="value")e.value=v;else if(k.slice(0,2)==="on")e[k]=v;else e.setAttribute(k,v===true?"":v)}
  for(let i=2;i<arguments.length;i++)ap(e,arguments[i]);return e}
function ic(n){return h("i",{class:"fa-solid "+n})}
function ago(t){const d=new Date(t);if(isNaN(d))return"";const m=Math.floor((Date.now()-d)/60000);if(m<1)return"الآن";if(m<60)return"منذ "+m+" دقيقة";const hr=Math.floor(m/60);if(hr<24)return"منذ "+hr+" ساعة";const dy=Math.floor(hr/24);if(dy<30)return"منذ "+dy+" يوم";return d.toLocaleDateString("ar-EG")}
function parseSg(s){let m=String(s.message||""),t=s.type||"اقتراح";const x=m.match(/^\[استفسار\]\s*/);if(x){t="استفسار";m=m.slice(x[0].length)}return{type:t,message:m}}
(function(){
  const svg="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#0b2540'/><circle cx='32' cy='32' r='25' fill='none' stroke='#d4af5a' stroke-width='2'/><text x='32' y='43' text-anchor='middle' font-family='Georgia,serif' font-size='32' font-weight='700' fill='#d4af5a'>F</text></svg>";
  let lk=document.querySelector('link[rel~="icon"]');
  if(!lk){lk=document.createElement("link");lk.rel="icon";document.head.appendChild(lk)}
  lk.type="image/svg+xml";lk.href="data:image/svg+xml,"+encodeURIComponent(svg);
  if(!document.querySelector('meta[name="theme-color"]')){const m=document.createElement("meta");m.name="theme-color";m.content="#06101f";document.head.appendChild(m)}
})();
(function(){
  const f=location.pathname.split("/").pop()||"index.html",q=location.search;
  const on=p=>{const a=p.split("?");return a[0]===f&&(a.length===1||q.indexOf(a[1])>-1)};
  const btn=h("button",{class:"mbtn",type:"button","aria-label":"القائمة","aria-expanded":"false"});
  function lab(o){btn.innerHTML="";btn.appendChild(ic(o?"fa-xmark":"fa-bars"));btn.appendChild(h("span",{class:"mt"},o?"إغلاق":"القائمة"))}
  lab(false);
  const menu=h("nav",{class:"menu"},h("div",{class:"menu-in"},PAGES.map(p=>h("a",{href:p[0],class:on(p[0])?"on":""},h("span",{class:"mi"},ic(p[2])),h("span",{class:"ml"},p[1])))));
  const scrim=h("div",{class:"scrim"});
  const nav=h("header",{class:"nav"},
    h("div",{class:"nav-in"},
      h("a",{class:"brand",href:"index.html"},h("b",null,BRAND.name),h("small",null,BRAND.sub)),
      btn),
    menu);
  document.body.prepend(scrim);
  document.body.prepend(nav);
  function setMenu(o){menu.classList.toggle("open",o);scrim.classList.toggle("show",o);btn.classList.toggle("open",o);btn.setAttribute("aria-expanded",o?"true":"false");lab(o)}
  btn.onclick=e=>{e.stopPropagation();setMenu(!menu.classList.contains("open"))};
  scrim.onclick=()=>setMenu(false);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});
  document.body.appendChild(h("footer",{class:"ft"},
    h("div",{class:"ft-b"},BRAND.name),h("div",{class:"ft-s"},BRAND.sub),
    h("div",{class:"ft-u"},"FACULTY OF NURSING",h("br"),"PORT SAID UNIVERSITY"),
    h("div",{class:"credit"},h("span",{class:"cl"},"تصميم وتطوير"),h("span",{class:"cn"},"Abdelrhman Wael"))));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08});
  function scan(){document.querySelectorAll(".rv:not(.seen)").forEach(e=>{e.classList.add("seen");io.observe(e)})}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
