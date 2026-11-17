const API="https://script.google.com/macros/s/AKfycbzAkny0ZeMMNTDTxx9Tjw5dvXQO-oe_K1TyYrRjSnkt5acZXD1bgYZFU4E7ODl42QDZpQ/exec";
const BRAND={name:"FOUNDATIONS",sub:"FUNDAMENTALS OF NURSING"};
const PAGES=[["index.html","الرئيسية"],["Lectures.html?track=theory","النظري"],["Lectures.html?track=practical","العملي"],["adhkar.html","الأدعية والأذكار"],["tips.html","نصايح المذاكرة"],["suggestions.html","الاقتراحات"]];
(function(){
  const f=location.pathname.split("/").pop()||"index.html",t=location.search;
  const on=p=>{const a=p.split("?");return a[0]===f&&(a.length===1||t.indexOf(a[1])>-1)};
  const n=document.createElement("header");n.className="nav";
  n.innerHTML='<div class="nav-in"><a class="brand" href="index.html"><i class="fa-solid fa-staff-snake"></i><span>'+BRAND.name+'<small>'+BRAND.sub+'</small></span></a><nav class="links">'+PAGES.map(p=>'<a href="'+p[0]+'"'+(on(p[0])?' class="on"':'')+'>'+p[1]+'</a>').join("")+'</nav></div>';
  document.body.prepend(n);
  const ft=document.createElement("footer");
  ft.innerHTML=BRAND.name+' | '+BRAND.sub+'<br>Faculty of Nursing - Port Said University<br><span style="opacity:.6;font-size:10px">Developed by Abdelrhman Wael</span>';
  document.body.appendChild(ft);
})();
