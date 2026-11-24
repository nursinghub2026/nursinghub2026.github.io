const path=require('path');const root=path.join(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(root,'backend/AutoAdhkar.gs'),'utf8');

function makeCtx(nowTime){
  const store={};const sends=[];let triggers=[];
  const ctx={console,Date,JSON,Error,Object,Array,String,Number,RegExp,Math,
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>store[k]!==undefined?store[k]:null,setProperty:(k,v)=>{store[k]=v}})},
    Utilities:{formatDate:(d,tz,fmt)=>fmt==='HH:mm'?nowTime:'2026-11-24'},
    Session:{getScriptTimeZone:()=>'Africa/Cairo'},
    stuRequireAdmin_:()=>{},
    ScriptApp:{
      getProjectTriggers:()=>triggers.slice(),
      newTrigger:(fn)=>({timeBased:()=>({everyMinutes:()=>({create:()=>{const t={getHandlerFunction:()=>fn};triggers.push(t);return t}})})}),
      deleteTrigger:(t)=>{triggers=triggers.filter(x=>x!==t)}
    },
    pushTokensSheet_:()=>({getDataRange:()=>({getValues:()=>[['u','t'],['abdelrhman.wae1','admin-device'],['student2','student-device']]})}),
    __sheets:{},
    pushSs_:function(){return{getSheetByName:(n)=>ctx.__sheets[n]||null,insertSheet:(n)=>{const rows=[['cat','title','body']];const s={getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())}),appendRow:(r)=>rows.push(r.slice()),deleteRow:(i)=>rows.splice(i-1,1)};ctx.__sheets[n]=s;return s}}},
    pushUploadImage_:(b64)=>{ctx.__uploads=(ctx.__uploads||0)+1;return'https://res.cloudinary.com/demo/image/upload/v1/foundations-notices/'+b64.length+'.png'},
    fcmSendToTokens_:(targets,title,body,data)=>{sends.push({targets,title,body,data});return{sent:targets.length,failed:0,configured:true}},
    inboxAppend_:()=>{},
    __store:store,__sends:sends,__triggers:()=>triggers};
  vm.createContext(ctx);vm.runInContext(code,ctx);return ctx;
}
function clearGap(ctx,cat){const st=JSON.parse(ctx.__store.AUTO_ADHKAR_STATE_V1);st.lastAt[cat]=0;ctx.__store.AUTO_ADHKAR_STATE_V1=JSON.stringify(st)}

// 1. default: fully disabled, nothing sent, no trigger
let c=makeCtx('10:00');let r=c.autoAdhkarTick_();assert(r.ok&&r.skipped==='disabled');assert.equal(c.__sends.length,0);

// 2. enabled but no category on -> nothing
c=makeCtx('10:00');c.adminAutoSet_({enabled:true});r=c.autoAdhkarTick_();assert(r.ok);assert.equal(c.__sends.length,0);
assert.equal(c.__triggers().length,1); // enabling installed the trigger

// 3. salawat on, testMode default: admin device only
c.adminAutoSet_({cats:{salawat:{on:true,perDay:2}}});r=c.autoAdhkarTick_();
assert.equal(c.__sends.length,1);assert.deepEqual(c.__sends[0].targets,['admin-device']);
assert(c.__sends[0].data.imageUrl.includes('salawat'));

// 4. min-gap blocks immediate resend; after clearing gap, perDay allows second, pointer rotates (different item)
r=c.autoAdhkarTick_();assert.equal(c.__sends.length,1);
clearGap(c,'salawat');r=c.autoAdhkarTick_();assert.equal(c.__sends.length,2);
assert.notEqual(c.__sends[1].body,c.__sends[0].body);

// 5. perDay cap: third send refused even with gap cleared
clearGap(c,'salawat');r=c.autoAdhkarTick_();assert.equal(c.__sends.length,2);

// 6. quiet hours: after Isha nothing goes out
c=makeCtx('22:00');c.adminAutoSet_({enabled:true,cats:{salawat:{on:true}}});r=c.autoAdhkarTick_();
assert(r.ok&&r.skipped==='quiet-hours');assert.equal(c.__sends.length,0);

// 7. morning category only before Dhuhr, evening only after Asr (fallback window: Fajr 05:00, Dhuhr 12:00, Asr 15:30, Isha 20:00)
c=makeCtx('08:00');c.adminAutoSet_({enabled:true,cats:{morning:{on:true},evening:{on:true}}});r=c.autoAdhkarTick_();
assert.equal(c.__sends.length,1);assert(c.__sends[0].title.includes('الصباح'));
c=makeCtx('17:00');c.adminAutoSet_({enabled:true,cats:{morning:{on:true},evening:{on:true}}});r=c.autoAdhkarTick_();
assert.equal(c.__sends.length,1);assert(c.__sends[0].title.includes('المساء'));

// 8. testMode off: all devices
c=makeCtx('10:00');c.adminAutoSet_({enabled:true,testMode:false,cats:{hadith:{on:true}}});r=c.autoAdhkarTick_();
assert.equal(c.__sends[0].targets.length,2);

// 9. full rotation without repeats, then wrap
c=makeCtx('10:00');c.adminAutoSet_({enabled:true,cats:{dua:{on:true,perDay:5}}});
const bodies=[];
for(let i=0;i<5;i++){r=c.autoAdhkarTick_();clearGap(c,'dua');}
c.__sends.forEach(s=>bodies.push(s.body));
assert.equal(new Set(bodies).size,5); // 5 sends, all unique (dua has exactly 5 items)
c.adminAutoSet_({cats:{dua:{on:true,perDay:5}}});
// next day state resets counts but pointer persists -> wrap to first item
ctx_store_next_day(c);
function ctx_store_next_day(ctx){const st=JSON.parse(ctx.__store.AUTO_ADHKAR_STATE_V1);st.date='1999-01-01';ctx.__store.AUTO_ADHKAR_STATE_V1=JSON.stringify(st)}
r=c.autoAdhkarTick_();assert.equal(c.__sends[c.__sends.length-1].body,bodies[0]);

// 10. adminAutoTest_ always to admin even when disabled; unknown cat rejected
c=makeCtx('10:00');r=c.adminAutoTest_({cat:'hadith'});assert(r.ok&&r.result.sent===1);
assert.deepEqual(c.__sends[0].targets,['admin-device']);
r=c.adminAutoTest_({cat:'nope'});assert.equal(r.ok,false);

// 11. disabling removes the trigger; get exposes cfg+state
c=makeCtx('10:00');c.adminAutoSet_({enabled:true});assert.equal(c.__triggers().length,1);
r=c.adminAutoSet_({enabled:false});assert.equal(r.triggerInstalled,false);assert.equal(c.__triggers().length,0);
r=c.adminAutoGet_({});assert(r.ok&&r.cfg&&r.state&&r.window&&typeof r.triggerInstalled==='boolean');

// 12. content override: set -> tick uses custom item, custom flag; reset -> back to library
c=makeCtx('10:00');c.adminAutoSet_({enabled:true,cats:{salawat:{on:true}}});
r=c.adminAutoContent_({cat:'salawat',contentAction:'set',items:[{t:'عنوان مخصص',b:'نص مخصص من الأدمن'},{t:'تجاهل بدون نص',b:''}]});
assert(r.ok&&r.custom===true&&r.items.length===1); // عناصر ناقصة تُستبعد
r=c.autoAdhkarTick_();assert.equal(c.__sends[0].title,'عنوان مخصص');
r=c.adminAutoContent_({cat:'salawat',contentAction:'get'});assert(r.ok&&r.custom===true&&r.items[0].t==='عنوان مخصص'&&r.defaults.length===4);
r=c.adminAutoContent_({cat:'salawat',contentAction:'reset'});assert(r.ok&&r.custom===false);
r=c.adminAutoContent_({cat:'salawat',contentAction:'get'});assert(r.custom===false&&r.items.length===4); // المكتبة المدمجة
r=c.adminAutoContent_({cat:'salawat',contentAction:'set',items:[]});assert.equal(r.ok,false); // رفض القائمة الفارغة
r=c.adminAutoContent_({cat:'nope',contentAction:'get'});assert.equal(r.ok,false);

// 13. per-category image: none -> no imageUrl; custom only via upload; bad URLs rejected
c=makeCtx('10:00');c.adminAutoSet_({enabled:true,cats:{hadith:{on:true,perDay:2,banner:'none'}}});
r=c.autoAdhkarTick_();assert.equal(c.__sends[0].data.imageUrl,'');assert.equal(c.__sends[0].data.banner,'none');
r=c.adminAutoSet_({cats:{hadith:{banner:'custom'}}});assert.equal(r.cfg.cats.hadith.banner,'none'); // custom بدون رفع مرفوض
r=c.adminAutoImage_({cat:'hadith',imagePng:'AAAA'});assert(r.ok&&r.cfg.cats.hadith.banner==='custom'&&r.cfg.cats.hadith.customImage.includes('res.cloudinary.com'));
clearGap(c,'hadith');r=c.autoAdhkarTick_();assert(c.__sends[1].data.imageUrl.includes('res.cloudinary.com'));assert.equal(c.__sends[1].data.banner,'motivation');
r=c.adminAutoImage_({cat:'hadith'});assert(r.ok&&r.cfg.cats.hadith.banner==='default'&&r.cfg.cats.hadith.customImage==='');
r=c.adminAutoSet_({cats:{hadith:{banner:'javascript:x'}}});assert.equal(r.cfg.cats.hadith.banner,'default'); // قيم غريبة مرفوضة

// 14. gapMin: per-category recurrence honored and clamped (30..720)
c=makeCtx('10:00');c.adminAutoSet_({enabled:true,cats:{salawat:{on:true,perDay:5,gapMin:30}}});
r=c.autoAdhkarTick_();assert.equal(c.__sends.length,1);
let st14=JSON.parse(c.__store.AUTO_ADHKAR_STATE_V1);st14.lastAt.salawat=Date.now()-31*60000;c.__store.AUTO_ADHKAR_STATE_V1=JSON.stringify(st14);
r=c.autoAdhkarTick_();assert.equal(c.__sends.length,2); // 31 دقيقة > 30 → يُرسل
r=c.adminAutoSet_({cats:{salawat:{gapMin:5}}});assert.equal(r.cfg.cats.salawat.gapMin,30); // أقل من الحد → 30
r=c.adminAutoSet_({cats:{salawat:{gapMin:9999}}});assert.equal(r.cfg.cats.salawat.gapMin,720); // أعلى من الحد → 720
r=c.adminAutoGet_({});assert(r.imageHosting===false); // لا توجد PushImages.gs في سياق الاختبار

console.log('PASS: disabled-by-default, category gating, admin-only test mode, min-gap, perDay cap, quiet hours Fajr-Isha, morning/evening windows, rotation without repeats + wrap, forced test target, trigger install/remove, content override set/get/reset, per-category images (none/custom/upload/clear/validation), per-category recurrence gapMin.');
