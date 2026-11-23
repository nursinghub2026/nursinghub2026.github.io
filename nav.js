try{if(localStorage.getItem("NPH_THEME_V1")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}
const API="https://script.google.com/macros/s/AKfycbzAkny0ZeMMNTDTxx9Tjw5dvXQO-oe_K1TyYrRjSnkt5acZXD1bgYZFU4E7ODl42QDZpQ/exec";
const BRAND={name:"FOUNDATIONS",sub:"FUNDAMENTALS OF NURSING"};
const PAGES=[["index.html","الرئيسية","fa-house"],["Lectures.html?track=theory","النظري","fa-book-open"],["Lectures.html?track=practical","العملي","fa-hand-holding-medical"],["progress.html","تقدمي","fa-chart-line"],["community.html","الإعلانات","fa-bullhorn"],["student.html","صفحتي","fa-user-graduate"],["chat.html","مراسلة الإدارة","fa-headset"],["adhkar.html","الأدعية والأذكار","fa-hands-praying"],["tips.html","نصايح المذاكرة","fa-graduation-cap"],["suggestions.html","الاقتراحات","fa-comments"]];
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
  const tbtn=h("button",{class:"tgl2",type:"button","aria-label":"الوضع الليلي"});
  function paintT(){tbtn.innerHTML="";tbtn.appendChild(ic(document.documentElement.getAttribute("data-theme")==="dark"?"fa-sun":"fa-moon"))}
  paintT();
  tbtn.onclick=e=>{e.stopPropagation();const d=document.documentElement.getAttribute("data-theme")==="dark";
    if(d)document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme","dark");
    try{localStorage.setItem("NPH_THEME_V1",d?"light":"dark")}catch(_){}
    paintT()};
  const abtn=h("button",{id:"abtn",class:"abtn2",type:"button","aria-label":"حسابي"});
  function paintAb(){
    let a=null;try{const r=localStorage.getItem("NPH_AUTH_V1");if(r)a=JSON.parse(r)}catch(e){}
    abtn.innerHTML="";
    if(a&&a.token){abtn.appendChild(ic("fa-user-graduate"));abtn.classList.add("on")}
    else{abtn.appendChild(ic("fa-user-graduate"));abtn.classList.remove("on")}
  }
  paintAb();
  abtn.onclick=e=>{e.stopPropagation();
    if(window.NPHAuth&&NPHAuth.isLoggedIn()){location.href="student.html";return}
    if(window.NPHAuth){NPHAuth.openAuth();return}
    const s=document.createElement("script");s.src="auth.js";s.onload=()=>{if(window.NPHAuth)NPHAuth.openAuth()};document.head.appendChild(s)};
  const menu=h("nav",{class:"menu"},h("div",{class:"menu-in"},PAGES.map(p=>h("a",{href:p[0],class:on(p[0])?"on":""},h("span",{class:"mi"},ic(p[2])),h("span",{class:"ml"},p[1])))));
  const scrim=h("div",{class:"scrim"});
  const nav=h("header",{class:"nav"},
    h("div",{class:"nav-in"},
      h("div",{class:"nav-side ns-l"},btn),
      h("a",{class:"brand",href:"index.html"},h("b",null,BRAND.name),h("small",null,BRAND.sub)),
      h("div",{class:"nav-side ns-r"},tbtn,abtn)),
    menu);
  const tools=h("div",{class:"menu-tools",id:"nphMenuTools"},h("button",{type:"button",onclick:()=>tbtn.click()},ic("fa-circle-half-stroke")," تغيير المظهر"));
  menu.appendChild(tools);
  const skip=h("a",{class:"skip-link",href:"#main-content"},"تخطى للمحتوى");
  const main=document.querySelector("main")||document.querySelector(".hero");if(main){if(!main.id)main.id="main-content";skip.href="#"+main.id;}
  document.body.prepend(skip);
  const dock=h("nav",{class:"student-dock","aria-label":"التنقل الرئيسي"},[
    ["index.html","الرئيسية","fa-house"],["Lectures.html?track=theory","النظري","fa-book-open"],["Lectures.html?track=practical","العملي","fa-hand-holding-medical"],["progress.html","تقدمي","fa-chart-line"]
  ].map(p=>h("a",{href:p[0],class:on(p[0])?"on":"","aria-current":on(p[0])?"page":null},ic(p[2]),h("span",null,p[1]))),h("button",{type:"button",onclick:()=>{setMenu(!menu.classList.contains("open"));btn.focus()}},ic("fa-bars"),h("span",null,"المزيد")));
  document.body.appendChild(dock);
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
  (function(){
    let g=null;try{g=JSON.parse(localStorage.getItem("NPH_GREET_V1")||"null")}catch(e){}
    if(!g||!g.n)return;
    try{localStorage.removeItem("NPH_GREET_V1")}catch(e){}
    const RM=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ov=h("div",{class:"greet",role:"dialog","aria-label":"ترحيب"},
      h("div",{class:"greet-card"},
        h("div",{class:"greet-ic"},ic(g.nw?"fa-graduation-cap":"fa-user-graduate")),
        h("div",{class:"greet-hi"},g.nw?"اتعمل حسابك يا":"ازيك يا"),
        h("div",{class:"greet-name"},g.n),
        h("div",{class:"greet-line"}),
        h("div",{class:"greet-sub"},"نورت FOUNDATIONS ",h("i",{class:"fa-solid fa-wand-magic-sparkles",style:"color:#f0d58a;margin:0 3px"}),g.nw?h("span",{style:"display:block;margin-top:6px"},"تقدّمك هيتسجل ويتزامن من أي جهاز"):null)));
    if(!RM){
      ov.appendChild(h("span",{class:"greet-beam"}));
      for(let i=0;i<14;i++){
        const d=h("span",{class:"greet-dot"});
        d.style.left=(5+Math.random()*90).toFixed(1)+"%";
        d.style.top=(20+Math.random()*70).toFixed(1)+"%";
        const sz=3+Math.random()*4;
        d.style.width=sz.toFixed(1)+"px";d.style.height=sz.toFixed(1)+"px";
        d.style.setProperty("--d",(7+Math.random()*5).toFixed(2)+"s");
        d.style.setProperty("--dl",(Math.random()*6).toFixed(2)+"s");
        ov.appendChild(d);
      }
    }
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ov.classList.add("show")});
    let gone=false;
    function bye(){if(gone)return;gone=true;ov.classList.remove("show");setTimeout(function(){ov.remove()},320)}
    ov.onclick=bye;
    setTimeout(bye,3800);
  })();
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08});
  function scan(){document.querySelectorAll(".rv:not(.seen)").forEach(e=>{e.classList.add("seen");io.observe(e)})}
  new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();

/* --- PWA (المرحلة 3): تسجيل الـ Service Worker + تفعيل تلميح الآيفون + زرار تثبيت التطبيق --- */
(function(){
  window.NPH_PUSH_ENABLED=true; // بيفعّل تلميح «ضيف الموقع للشاشة الرئيسية» على iOS
  if("serviceWorker" in navigator){
    window.addEventListener("load",function(){
      navigator.serviceWorker.register("sw.js").catch(function(){});
    });
  }
  var deferredInstall=null;
  window.addEventListener("beforeinstallprompt",function(e){
    e.preventDefault();deferredInstall=e;showInstallPill();
  });
  window.addEventListener("appinstalled",function(){var p=document.getElementById("nphInstall");if(p)p.remove();deferredInstall=null;});
  function showInstallPill(){
    if(document.getElementById("nphInstall"))return;
    if(!document.querySelector("style#nphInstCss")){
      var st=document.createElement("style");st.id="nphInstCss";
      st.textContent="#nphInstall{position:fixed;bottom:18px;left:18px;z-index:980;display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;border:1px solid rgba(212,175,90,.55);background:#0b2540;color:#f3e6c8;font:700 14px/1 inherit;box-shadow:0 10px 30px rgba(6,16,31,.45);cursor:pointer;transition:transform .2s ease}#nphInstall:hover{transform:translateY(-2px)}#nphInstall i{color:#d4af5a}";
      document.head.appendChild(st);
    }
    var b=document.createElement("button");b.id="nphInstall";b.type="button";
    b.innerHTML='<i class="fa-solid fa-mobile-screen-button"></i> ثبّت التطبيق';
    b.onclick=function(){
      if(!deferredInstall)return;
      deferredInstall.prompt();
      deferredInstall.userChoice.finally(function(){var p=document.getElementById("nphInstall");if(p)p.remove();deferredInstall=null;});
    };
    (document.getElementById("nphMenuTools")||document.body).appendChild(b);
  }
})();
