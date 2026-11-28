/* FOUNDATIONS luxe student skin (trial). Visual only: sky + day/night pill. */
(function(){'use strict';
var d=document,b=d.body,h=d.documentElement;b.classList.add('fd');
function theme(){b.setAttribute('data-theme',h.getAttribute('data-theme')==='dark'?'dark':'light')}
theme();new MutationObserver(theme).observe(h,{attributes:true,attributeFilter:['data-theme']});
var s='<div class="sk-bg"></div><div class="sk-bg n"></div>',k;
for(k=0;k<46;k++){var st=[(k*37+11)%97+1,(k*53+9)%560+6,(k%4===0?3:2),(k*0.7)%5];s+='<i class="sk-s" style="left:'+st[0]+'%;top:'+st[1]+'px;width:'+st[2]+'px;height:'+st[2]+'px;animation-delay:'+st[3]+'s;animation-duration:'+(2+st[3]%3)+'s"></i>'}
for(k=0;k<34;k++){var sh=[25+(k*29)%85,(k*41)%520+6,3+(k*7)%6*0.7,(k*1.37)%9,90+(k*13)%110];s+='<b class="sk-sh" style="left:'+sh[0]+'%;top:'+sh[1]+'px;animation-duration:'+sh[2]+'s;animation-delay:-'+sh[3]+'s;width:'+sh[4]+'px"></b>'}
for(k=0;k<30;k++){s+='<i class="sk-s g'+(k%3)+'" style="left:'+((k*61+7)%97+1)+'%;top:'+((k*83+40)%700+6)+'px;width:2px;height:2px;animation-delay:'+((k*0.9)%5)+'s"></i>'}
s+='<div class="sk-c c1"></div><div class="sk-c c2"></div><div class="sk-c c3"></div>';
var sky=d.createElement('div');sky.className='fd-sky';sky.setAttribute('aria-hidden','true');sky.innerHTML=s;b.insertBefore(sky,b.firstChild);
var pill='<span class="tg-sky"></span><span class="tg-night"></span><span class="tg-st"><i></i><i></i><i></i><i></i><i></i><i></i><b></b></span><span class="tg-cl"><i></i><i></i><i></i><i></i><i></i></span><span class="tg-kn"><span class="tg-sun"></span><span class="tg-moon"><u></u><u></u><u></u></span></span>';
function dress(t){t.classList.add('fd-tg');if(!t.querySelector('.tg-sky')){t.innerHTML=pill}t.setAttribute('aria-label','تبديل النهار والليل')}
function find(){var t=d.querySelector('.tgl2');if(t){dress(t);new MutationObserver(function(){if(!t.querySelector('.tg-sky'))dress(t)}).observe(t,{childList:true})}return !!t}
if(!find()){var n=0,iv=setInterval(function(){if(find()||++n>40)clearInterval(iv)},150)}
/* trial only: keep navigation inside the -new copies */
var PG=/^(?:\.\/)?(index|Lectures|Lecture|progress|chat|adhkar|tips|suggestions|student|community)\.html(?=$|[?#])/;
function rw(root){(root||d).querySelectorAll('a[href]').forEach(function(a){var v=a.getAttribute('href');if(!v)return;if(v==='./'||v==='/'||v==='index.html'){a.setAttribute('href','index-new.html');return}var m=v.match(PG);if(m)a.setAttribute('href',v.replace(PG,m[1]+'-new.html'))})}
rw();new MutationObserver(function(){rw()}).observe(d.body,{childList:true,subtree:true});
/* mark active dock item when the page code did not */
function dockOn(){var dk=d.querySelector('.student-dock');if(!dk||dk.querySelector('.on'))return;var f=location.pathname.split('/').pop(),q=location.search,m=null;dk.querySelectorAll('a').forEach(function(a){var h=a.getAttribute('href')||'',pg=h.split('?')[0];if(pg===f&&(h.indexOf('?')<0||q.indexOf(h.split('?')[1])>-1))m=a});if(!m&&(f==='Lecture-new.html'||f==='Lectures-new.html')){dk.querySelectorAll('a').forEach(function(a){if(!m&&(a.getAttribute('href')||'').indexOf('Lectures-new')===0)m=a})}if(m)m.classList.add('on')}
setTimeout(dockOn,600);setTimeout(dockOn,2000);
})();
;(function(){var m=/[?&]v=(16[ab])/.exec(location.search);if(m)document.documentElement.classList.add('v'+m[1])})();
/* trial: account button goes to trial student page */
document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('#abtn');if(a&&window.NPHAuth&&NPHAuth.isLoggedIn&&NPHAuth.isLoggedIn()){e.preventDefault();e.stopImmediatePropagation();location.href='student-new.html'}},true);

/* trial header: 2 buttons each side (menu + bell | theme + profile) */
(function(){function mv(){var l=document.querySelector('.nav-side.ns-l'),b=document.querySelector('.nav-side.ns-r .inbox-bell');var m=l&&l.querySelector('.mbtn');if(l&&b&&m&&b.parentNode!==l){m.insertAdjacentElement('afterend',b);return true}return !!(b&&b.parentNode===l)}
if(!mv()){var n=0,t=setInterval(function(){if(mv()||++n>40)clearInterval(t)},150)}})();
