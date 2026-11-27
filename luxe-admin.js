/* FOUNDATIONS luxe admin skin + notification gallery (trial page admin-new.html only). Never sends or saves anything itself. */
(function(){
'use strict';
var d=document,b=d.body,h=d.documentElement;
b.classList.add('fd','adm');
function theme(){b.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'dark':'light')}
theme();new MutationObserver(theme).observe(h,{attributes:true,attributeFilter:['data-theme']});
function screen(){var a=d.getElementById('app');b.setAttribute('data-screen',a&&!a.classList.contains('hidden')?'app':'login')}
screen();var ap=d.getElementById('app');if(ap)new MutationObserver(screen).observe(ap,{attributes:true,attributeFilter:['class']});
/* sky */
var s='<div class="sk-bg"></div><div class="sk-bg n"></div>',i,k;
for(k=0;k<46;k++){var st=[(k*37+11)%97+1,(k*53+9)%520+6,(k%4===0?3:2),(k*0.7)%5];s+='<i class="sk-s" style="left:'+st[0]+'%;top:'+st[1]+'px;width:'+st[2]+'px;height:'+st[2]+'px;animation-delay:'+st[3]+'s;animation-duration:'+(2+st[3]%3)+'s"></i>'}
for(k=0;k<16;k++){var sh=[30+(k*29)%75,(k*41)%260+8,3.2+(k*7)%6*0.9,(k*1.9)%7,70+(k*13)%70];s+='<b class="sk-sh" style="left:'+sh[0]+'%;top:'+sh[1]+'px;animation-duration:'+sh[2]+'s;animation-delay:-'+sh[3]+'s;width:'+sh[4]+'px"></b>'}
s+='<div class="sk-c c1"></div><div class="sk-c c2"></div>';
var sky=d.createElement('div');sky.className='fd-sky';sky.setAttribute('aria-hidden','true');sky.innerHTML=s;b.insertBefore(sky,b.firstChild);
/* day/night pill */
var pill='<span class="tg-sky"></span><span class="tg-night"></span><span class="tg-st"><i></i><i></i><i></i><i></i><i></i><i></i><b></b></span><span class="tg-cl"><i></i><i></i><i></i><i></i><i></i></span><span class="tg-kn"><span class="tg-sun"></span><span class="tg-moon"><u></u><u></u><u></u></span></span>';
d.querySelectorAll('[data-theme-toggle]').forEach(function(t){t.classList.add('fd-tg');t.innerHTML=pill;t.setAttribute('aria-label','تبديل النهار والليل')});
/* notification image gallery bound to the real #pushBanner select */
var sel=d.getElementById('pushBanner');if(!sel||!window.LuxeBanner)return;
var T=LuxeBanner.THEMES,names={lecture:'محاضرة',quiz:'كويز',reply:'رد',motivation:'تحفيز',salawat:'صلاة على النبي',hadith:'حديث',dua:'دعاء',encouragement:'تشجيع'},ico={lecture:'fa-book-open',quiz:'fa-brain',reply:'fa-comment-dots',motivation:'fa-bolt',salawat:'fa-heart',hadith:'fa-scroll',dua:'fa-hands-praying',encouragement:'fa-star'};
var g=d.createElement('div');g.className='pg';g.setAttribute('role','listbox');g.setAttribute('aria-label','اختار صورة الإشعار');
var html='<button type="button" class="pg-t pg-up" data-k="custom" style="--a:#3a4668;--b:#141c33"><i class="fa-solid fa-image"></i><span>صورتك</span></button>';
Object.keys(T).forEach(function(key){html+='<button type="button" class="pg-t" data-k="'+key+'" style="--a:'+T[key].a+';--b:'+T[key].b+'"><i class="fa-solid '+ico[key]+'"></i><span>'+names[key]+'</span></button>'});
html+='<button type="button" class="pg-t" data-k="none" style="--a:#4a5568;--b:#1a202c"><i class="fa-solid fa-ban"></i><span>بدون صورة</span></button>';
g.innerHTML=html;sel.parentNode.insertBefore(g,sel);
function mark(){g.querySelectorAll('.pg-t').forEach(function(x){x.classList.toggle('on',x.dataset.k===sel.value)})}
function setPrev(){var im=d.getElementById('pushPreviewImage');if(!im)return;var v=sel.value;if(v!=='custom'&&v!=='none'&&T[v]){im.src='notification-images/v2/'+v+'.png'}}
g.addEventListener('click',function(e){var t=e.target.closest('.pg-t');if(!t)return;sel.value=t.dataset.k;sel.dispatchEvent(new Event('change',{bubbles:true}));if(window.NPHBanner&&NPHBanner.setTheme&&T[t.dataset.k])NPHBanner.setTheme(t.dataset.k)});
sel.addEventListener('change',function(){mark();setPrev()});mark();setPrev();
})();
