/* FOUNDATIONS luxe student skin (trial). Visual only: sky + day/night pill. */
(function(){'use strict';
var d=document,b=d.body,h=d.documentElement;b.classList.add('fd');
function theme(){b.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'dark':'light')}
theme();new MutationObserver(theme).observe(h,{attributes:true,attributeFilter:['data-theme']});
var s='<div class="sk-bg"></div><div class="sk-bg n"></div>',k;
for(k=0;k<46;k++){var st=[(k*37+11)%97+1,(k*53+9)%560+6,(k%4===0?3:2),(k*0.7)%5];s+='<i class="sk-s" style="left:'+st[0]+'%;top:'+st[1]+'px;width:'+st[2]+'px;height:'+st[2]+'px;animation-delay:'+st[3]+'s;animation-duration:'+(2+st[3]%3)+'s"></i>'}
for(k=0;k<16;k++){var sh=[30+(k*29)%75,(k*41)%300+8,3.2+(k*7)%6*0.9,(k*1.9)%7,70+(k*13)%70];s+='<b class="sk-sh" style="left:'+sh[0]+'%;top:'+sh[1]+'px;animation-duration:'+sh[2]+'s;animation-delay:-'+sh[3]+'s;width:'+sh[4]+'px"></b>'}
s+='<div class="sk-c c1"></div><div class="sk-c c2"></div><div class="sk-c c3"></div>';
var sky=d.createElement('div');sky.className='fd-sky';sky.setAttribute('aria-hidden','true');sky.innerHTML=s;b.insertBefore(sky,b.firstChild);
var pill='<span class="tg-sky"></span><span class="tg-night"></span><span class="tg-st"><i></i><i></i><i></i><i></i><i></i><i></i><b></b></span><span class="tg-cl"><i></i><i></i><i></i><i></i><i></i></span><span class="tg-kn"><span class="tg-sun"></span><span class="tg-moon"><u></u><u></u><u></u></span></span>';
function dress(t){t.classList.add('fd-tg');if(!t.querySelector('.tg-sky')){t.innerHTML=pill}t.setAttribute('aria-label','تبديل النهار والليل')}
function find(){var t=d.querySelector('.tgl2');if(t){dress(t);new MutationObserver(function(){if(!t.querySelector('.tg-sky'))dress(t)}).observe(t,{childList:true})}return !!t}
if(!find()){var n=0,iv=setInterval(function(){if(find()||++n>40)clearInterval(iv)},150)}
})();
