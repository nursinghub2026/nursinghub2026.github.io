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
  const f=location.pathname.split("/").pop()||"index.html",q=location.search;
  const on=p=>{const a=p.split("?");return a[0]===f&&(a.length===1||q.indexOf(a[1])>-1)};
  const btn=h("button",{class:"mbtn",type:"button","aria-label":"القائمة","aria-expanded":"false"},ic("fa-bars"));
  const menu=h("nav",{class:"menu"},PAGES.map(p=>h("a",{href:p[0],class:on(p[0])?"on":""},ic(p[2]),p[1])));
  const nav=h("header",{class:"nav"},
    h("div",{class:"nav-in"},
      h("a",{class:"brand",href:"index.html"},
        h("span",{class:"mk"},ic("fa-staff-snake")),
        h("span",{class:"bt"},h("b",null,BRAND.name),h("small",null,BRAND.sub))),
      h("nav",{class:"links"},PAGES.map(p=>h("a",{href:p[0],class:on(p[0])?"on":""},p[1]))),
      btn),
    menu);
  document.body.prepend(nav);
  function setMenu(o){menu.classList.toggle("open",o);btn.classList.toggle("open",o);btn.setAttribute("aria-expanded",o?"true":"false");btn.innerHTML="";btn.appendChild(ic(o?"fa-xmark":"fa-bars"))}
  btn.onclick=e=>{e.stopPropagation();setMenu(!menu.classList.contains("open"))};
  document.addEventListener("click",e=>{if(!nav.contains(e.target))setMenu(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false)});
  window.addEventListener("resize",()=>{if(window.innerWidth>940)setMenu(false)});
  document.body.appendChild(h("footer",{class:"ft"},
    h("div",{class:"ft-b"},BRAND.name),h("div",{class:"ft-s"},BRAND.sub),
    h("div",{class:"ft-u"},"FACULTY OF NURSING",h("br"),"PORT SAID UNIVERSITY"),
    h("div",{class:"credit"},h("span",{class:"cl"},"تصميم وتطوير"),h("span",{class:"cn"},"Abdelrhman Wael"))));
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08});
  function scan(){document.querySelectorAll(".rv:not(.seen)").forEach(e=>{e.classList.add("seen");io.observe(e)})}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
