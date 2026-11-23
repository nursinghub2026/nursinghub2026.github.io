/* Admin-only canvas composer. Rendering never uploads or sends by itself. */
(function(){
'use strict';
const $=id=>document.getElementById(id);let photo=null,ready=false,renderId=0;
const fields=['bannerHeadline','bannerSubtitle','bannerButton'];
const panel=document.createElement('section');panel.id='bannerStudio';panel.hidden=true;
panel.innerHTML='<div class="banner-studio"><h3>اكتب جوّه الصورة</h3><p>النص هنا جزء من الصورة نفسها. عنوان الإشعار ونصه فوق منفصلين عنه.</p><label for="bannerHeadline">العنوان على الصورة</label><input id="bannerHeadline" maxlength="55" value="مراجعة جديدة جاهزة"><label for="bannerSubtitle">سطر توضيحي</label><input id="bannerSubtitle" maxlength="100" value="افتح المنصة وكمّل مذاكرتك"><label for="bannerButton">عبارة الزر داخل الصورة (اختياري)</label><input id="bannerButton" maxlength="24" value="افتح دلوقتي"><small>الزر مرسوم داخل الصورة، والضغط يفتح المنصة من الإشعار.</small><label for="bannerPhoto">صورة من جهازك (اختياري)</label><input type="file" id="bannerPhoto" accept="image/png,image/jpeg,image/webp"><small>PNG أو JPG أو WebP لحد 5MB. الصورة هتتقص من المنتصف بمقاس 1200×600، ومن غير بلور. تقدر تتحكم في تعتيمها تحت.</small><label for="bannerClarity">وضوح صورة الخلفية <output id="bannerClarityValue">75%</output></label><input type="range" id="bannerClarity" min="20" max="100" step="5" value="75"><small>زود الوضوح عشان تفاصيل الصورة تبان، أو قلله لو الكتابة مش واضحة. 100% يعرض الصورة من غير تعتيم.</small><button type="button" id="bannerRemove">استخدم الخلفية الكحلي</button><canvas id="bannerCanvas" width="1200" height="600" role="img" aria-label="معاينة نص صورة الإشعار"></canvas><div class="banner-actions"><button type="button" id="bannerDownload">تنزيل الصورة PNG</button></div><p id="bannerHosting">الصورة هتتحفظ برابط متاح لأي شخص يملكه عشان الجهاز يقدر يعرضها. متحطش فيها بيانات خاصة.</p><p id="bannerError" role="status"></p></div>';
$('pushBanner').after(panel);
const canvas=$('bannerCanvas'),ctx=canvas.getContext('2d');
function line(text,y,size,maxWidth,color,right=1110){
 ctx.font='800 '+size+'px Cairo, sans-serif';ctx.fillStyle=color;ctx.textAlign='right';ctx.direction='rtl';
 while(ctx.measureText(text).width>maxWidth && size>22){size-=1;ctx.font='800 '+size+'px Cairo, sans-serif'}
 ctx.save();if(photo&&color!=='#0b2540'){ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=2;ctx.shadowOffsetY=2;ctx.lineJoin='round';ctx.lineWidth=1.5;ctx.strokeStyle='rgba(6,16,31,.8)';ctx.strokeText(text,right,y,maxWidth)}ctx.fillText(text,right,y,maxWidth);ctx.restore();
}
async function render(){
 const id=++renderId;ready=false;
 try{await document.fonts.ready;if(id!==renderId)return;
 const g=ctx.createLinearGradient(0,0,1200,600);g.addColorStop(0,'#06101f');g.addColorStop(1,'#143e58');ctx.fillStyle=g;ctx.fillRect(0,0,1200,600);
 if(photo){const scale=Math.max(1200/photo.width,600/photo.height),w=photo.width*scale,h=photo.height*scale;ctx.drawImage(photo,(1200-w)/2,(600-h)/2,w,h);const clarity=Math.min(100,Math.max(20,Number($('bannerClarity').value)||75));ctx.fillStyle='rgba(6,16,31,'+(1-clarity/100)+')';ctx.fillRect(0,0,1200,600)}
 ctx.strokeStyle='#d4af5a';ctx.lineWidth=3;ctx.strokeRect(28,28,1144,544);
 ctx.textAlign='left';ctx.direction='ltr';ctx.fillStyle='#f0d58a';ctx.font='700 27px Georgia, serif';ctx.fillText('FOUNDATIONS',80,92);
 ctx.beginPath();ctx.arc(1040,100,29,0,Math.PI*2);ctx.stroke();ctx.textAlign='center';ctx.font='700 35px Georgia, serif';ctx.fillText('F',1040,112);
 line($('bannerHeadline').value.trim(),255,74,1010,'#fff');line($('bannerSubtitle').value.trim(),345,42,1010,'#d9e5ee');
 const button=$('bannerButton').value.trim();if(button){ctx.fillStyle='#d4af5a';ctx.beginPath();ctx.roundRect(780,420,330,80,22);ctx.fill();line(button,473,32,285,'#0b2540',1085)}
 const data=canvas.toDataURL('image/png');if(data.length>1000000)throw Error('الصورة كبيرة بعد التجهيز، جرّب صورة أبسط');
 ready=true;$('bannerError').textContent='';if($('pushBanner').value==='custom'){$('pushPreviewImage').src=data;$('pushPreviewImage').style.display='block';$('pushPreviewImage').hidden=false;}
 }catch(e){$('bannerError').textContent=e.message||'تعذر تجهيز الصورة';}
}
$('bannerClarity').addEventListener('input',()=>{$('bannerClarityValue').textContent=$('bannerClarity').value+'%';render()});
fields.forEach(id=>$(id).addEventListener('input',render));
$('bannerPhoto').onchange=async()=>{const f=$('bannerPhoto').files[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>5*1024*1024){$('bannerError').textContent='اختار PNG أو JPG أو WebP لحد 5MB';$('bannerPhoto').value='';return}
 const url=URL.createObjectURL(f);try{const img=new Image();img.src=url;await img.decode();if(img.width>12000||img.height>12000)throw Error();photo=img;await render()}catch(e){$('bannerError').textContent='تعذر قراءة الصورة';}finally{URL.revokeObjectURL(url)}};
$('bannerRemove').onclick=()=>{photo=null;$('bannerPhoto').value='';render()};
$('bannerDownload').onclick=async()=>{await render();if(!ready)return;const a=document.createElement('a');a.download='foundations-notification.png';a.href=canvas.toDataURL('image/png');a.click()};
$('pushBanner').addEventListener('change',()=>{panel.hidden=$('pushBanner').value!=='custom';if(!panel.hidden)render()});
window.NPHBanner={preview:()=>{if($('pushBanner').value==='custom')render()},data:async()=>{await render();if(!ready)throw Error('راجع صورة الإشعار الأول');return canvas.toDataURL('image/png').split(',')[1]},setHosting:enabled=>{$('bannerHosting').textContent=enabled?'الصورة هتترفع تلقائيًا عند الإرسال برابط متاح لأي شخص يملكه. تجنّب البيانات الخاصة.':'الرفع التلقائي لسه محتاج إعداد استضافة الصور على السيرفر. تقدر تصمم وتنزّل الصورة الآن، لكن إرسال الصورة المخصصة متوقف لحد اكتمال الإعداد.'}};
})();
