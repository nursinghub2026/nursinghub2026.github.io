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

console.log('PASS: disabled-by-default, category gating, admin-only test mode, min-gap, perDay cap, quiet hours Fajr-Isha, morning/evening windows, rotation without repeats + wrap, forced test target, trigger install/remove.');
