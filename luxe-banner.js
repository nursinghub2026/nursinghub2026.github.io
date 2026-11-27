/* FOUNDATIONS luxe notification banner designs (1200x600). Pure drawing, never uploads or sends. */
(function(){
'use strict';
var THEMES={
 lecture:{a:'#0f5a8f',b:'#0b2c52',g:'\uf518',h:'محاضرة جديدة نزلت',s:'افتح المنصة وكمّل مذاكرتك',bt:'افتح دلوقتي'},
 quiz:{a:'#6a3fa0',b:'#231445',g:'\uf5dc',h:'كويز جديد جاهز',s:'اختبر نفسك قبل الامتحان',bt:'ابدأ الكويز'},
 reply:{a:'#0e7f86',b:'#0a3340',g:'\uf075',h:'ردينا على رسالتك',s:'شوف الرد جوه المنصة',bt:'افتح الرد'},
 motivation:{a:'#c0652a',b:'#4a1f12',g:'\uf0e7',h:'كمّل، انت قريب',s:'كل صفحة بتقرّبك من هدفك',bt:'كمّل'},
 salawat:{a:'#a8802c',b:'#2d2210',g:'\uf004',h:'اللهم صلّ وسلّم على نبينا محمد',s:'ولا تنسى الصلاة عليه',bt:''},
 hadith:{a:'#1f7a55',b:'#0b2e26',g:'\uf518',h:'حديث اليوم',s:'من سلك طريقًا يلتمس فيه علمًا سهّل الله له طريقًا إلى الجنة',bt:''},
 dua:{a:'#2c5aa8',b:'#0a1a3e',g:'\uf684',h:'دعاء قبل المذاكرة',s:'اللهم انفعني بما علمتني وزدني علمًا',bt:''},
 encouragement:{a:'#b8486a',b:'#40142a',g:'\uf005',h:'شاطر، كمّل',s:'انت بتعمل شغل ممتاز',bt:''}
};
function wrap(c,t,w){var ws=t.split(' '),out=[],l='';ws.forEach(function(x){var n=l?l+' '+x:x;if(c.measureText(n).width>w&&l){out.push(l);l=x}else l=n});if(l)out.push(l);return out}
function mix(h,t){var n=parseInt(h.slice(1),16),f=function(v){return Math.round(v+(255-v)*t)};return 'rgb('+f(n>>16)+','+f((n>>8)&255)+','+f(n&255)+')'}
function draw(c,key,o){
 o=o||{};var th=THEMES[key]||THEMES.lecture,W=1200,H=600,ff=o.font||'Cairo, sans-serif',photo=o.photo||null,clarity=o.clarity==null?.75:o.clarity;
 c.save();c.clearRect(0,0,W,H);
 var g=c.createLinearGradient(W,0,0,H);g.addColorStop(0,th.a);g.addColorStop(1,th.b);c.fillStyle=g;c.fillRect(0,0,W,H);
 if(photo){
  var k=Math.max(W/photo.width,H/photo.height),w=photo.width*k,h=photo.height*k;c.drawImage(photo,(W-w)/2,(H-h)/2,w,h);
  var ov=c.createLinearGradient(0,0,0,H);ov.addColorStop(0,'rgba(6,14,32,'+(0.15+0.55*(1-clarity))+')');ov.addColorStop(1,'rgba(6,14,32,'+(0.55+0.4*(1-clarity))+')');c.fillStyle=ov;c.fillRect(0,0,W,H);
 }else{
  var orb=function(x,y,rr,col,al){var q=c.createRadialGradient(x,y,0,x,y,rr);q.addColorStop(0,col.replace('rgb(','rgba(').replace(')',','+al+')'));q.addColorStop(1,col.replace('rgb(','rgba(').replace(')',',0)'));c.fillStyle=q;c.fillRect(0,0,W,H)};
  orb(180,120,640,mix(th.a,.45),.55);orb(1100,560,560,mix(th.a,.2),.45);orb(700,-40,420,'rgb(240,213,138)',.16);
  c.save();c.globalAlpha=.07;c.fillStyle='#fff';for(var gx=30;gx<W;gx+=36)for(var gy=30;gy<H;gy+=36){c.beginPath();c.arc(gx,gy,2.2,0,7);c.fill()}c.restore();
  var bm=c.createLinearGradient(0,0,W,H);bm.addColorStop(0,'rgba(255,255,255,0)');bm.addColorStop(.5,'rgba(255,255,255,.07)');bm.addColorStop(1,'rgba(255,255,255,0)');
  c.fillStyle=bm;c.beginPath();c.moveTo(300,0);c.lineTo(620,0);c.lineTo(180,H);c.lineTo(-140,H);c.closePath();c.fill();
  var cx=235,cy=300;
  [[290,.06],[225,.1],[165,.16]].forEach(function(p){c.strokeStyle='rgba(240,213,138,'+p[1]+')';c.lineWidth=2;c.beginPath();c.arc(cx,cy,p[0],0,7);c.stroke()});
  c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=40;c.shadowOffsetY=14;
  var dg=c.createLinearGradient(cx-110,cy-110,cx+110,cy+110);dg.addColorStop(0,'rgba(255,255,255,.24)');dg.addColorStop(1,'rgba(255,255,255,.04)');
  c.fillStyle=dg;c.beginPath();c.arc(cx,cy,112,0,7);c.fill();c.shadowColor='transparent';c.shadowBlur=0;c.shadowOffsetY=0;
  var rg=c.createLinearGradient(cx-112,cy-112,cx+112,cy+112);rg.addColorStop(0,'#f8e3a0');rg.addColorStop(.5,'#c99a3a');rg.addColorStop(1,'#f2d27c');
  c.strokeStyle=rg;c.lineWidth=4;c.beginPath();c.arc(cx,cy,112,0,7);c.stroke();
  c.font='900 104px "Font Awesome 6 Free"';c.textAlign='center';c.textBaseline='middle';c.direction='ltr';
  var ig=c.createLinearGradient(0,cy-50,0,cy+50);ig.addColorStop(0,'#fff4cf');ig.addColorStop(1,'#e3b857');c.fillStyle=ig;c.fillText(th.g,cx,cy+4);
  var vg=c.createRadialGradient(W/2,H/2,260,W/2,H/2,760);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.38)');c.fillStyle=vg;c.fillRect(0,0,W,H);
 }
 if(o.frame!==false){c.strokeStyle='rgba(240,213,138,.9)';c.lineWidth=3;c.strokeRect(18,18,W-36,H-36)}
 var TW=photo?900:700,head=o.head==null?th.h:o.head,sub=o.sub==null?th.s:o.sub,bt=o.btn==null?th.bt:o.btn;
 c.direction='ltr';c.textAlign='right';c.textBaseline='alphabetic';c.font='700 26px sans-serif';try{c.letterSpacing='7px'}catch(e){}
 c.fillStyle='#f0d58a';c.fillText('FOUNDATIONS',1090,92);try{c.letterSpacing='0px'}catch(e){}c.fillStyle='rgba(240,213,138,.55)';c.fillRect(1090-64,112,64,3);
 c.direction='rtl';c.textAlign='right';c.fillStyle='#fff';
 c.font='800 '+(photo?92:76)+'px '+ff;c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=18;
 var hl=wrap(c,head,TW).slice(0,2),y=235-(hl.length-1)*46;hl.forEach(function(l){c.fillText(l,1090,y);y+=108});
 c.font='500 44px '+ff;c.fillStyle='rgba(255,255,255,.88)';c.shadowBlur=10;
 wrap(c,sub,TW).slice(0,2).forEach(function(l){c.fillText(l,1090,y+6);y+=60});c.shadowBlur=0;
 if(bt){c.font='800 40px '+ff;var bw=c.measureText(bt).width+100,by=Math.max(y+34,450),bg=c.createLinearGradient(1090-bw,0,1090,0);bg.addColorStop(0,'#f6dd96');bg.addColorStop(1,'#c99a3a');
  c.fillStyle=bg;c.beginPath();c.roundRect(1090-bw,by,bw,84,42);c.fill();c.fillStyle='#2c2003';c.textAlign='center';c.fillText(bt,1090-bw/2,by+57)}
 c.restore();
}
window.LuxeBanner={THEMES:THEMES,draw:draw};
})();
