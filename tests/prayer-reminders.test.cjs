const path=require('path');const root=path.join(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(root,'backend/PrayerReminders.gs'),'utf8');
function makeCtx(nowTime){
  const store={};const sends=[];
  const ctx={console,Date,JSON,Error,Object,Array,String,Number,RegExp,Math,
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>store[k]||null,setProperty:(k,v)=>{store[k]=v}})},
    Utilities:{formatDate:(d,tz,fmt)=>fmt==='HH:mm'?nowTime:'2026-11-24'},
    UrlFetchApp:{fetch:(u,o)=>{
      if(u.includes('dar-alifta.org')){ if(ctx.__failDar) return{getResponseCode:()=>500,getContentText:()=>''};
        return{getResponseCode:()=>200,getContentText:()=>'<td id="fajrpartial">05:12 ص </td><td id="shurooqpartial">06:38 ص </td><td id="dhuhrpartial">11:47 م </td><td id="asrpartial">02:47 م </td><td id="maghribpartial">05:05 م </td><td id="ishapartial">06:25 م </td>'}}
      assert(u.includes('aladhan.com'));assert(u.includes('Port%20Said'));
      return{getResponseCode:()=>200,getContentText:()=>JSON.stringify({data:{timings:{Fajr:'05:12',Sunrise:'06:38',Dhuhr:'11:47',Asr:'14:47',Maghrib:'17:05',Isha:'18:25'}}})}}},
    stuRequireAdmin_:()=>{},ScriptApp:{getProjectTriggers:()=>[],newTrigger:()=>({timeBased:()=>({everyMinutes:()=>({create:()=>({})})})})},
    pushTokensSheet_:()=>({getDataRange:()=>({getValues:()=>[['u','t'],['abdelrhman.wae1','admin-device'],['student2','student-device']]})}),
    fcmSendToTokens_:(targets,title,body,data)=>{sends.push({targets,title,body,data});return{sent:targets.length,failed:0,configured:true}},
    __store:store,__sends:sends};
  vm.createContext(ctx);vm.runInContext(code,ctx);return ctx;
}
// 1. default: disabled, nothing sent
let c=makeCtx('11:47');let r=c.prayerTick_();assert(r.ok&&r.skipped==='disabled');assert.equal(c.__sends.length,0);
// 2. enabled + testMode: only admin device, dedupe
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true});r=c.prayerTick_();assert(r.ok&&r.prayer==='Dhuhr'&&r.testMode===true);
assert.equal(c.__sends.length,1);assert.deepEqual(c.__sends[0].targets,['admin-device']);assert(c.__sends[0].title.includes('الظهر'));
r=c.prayerTick_();assert(r.ok&&r.skipped==='duplicate');assert.equal(c.__sends.length,1);
// 3. non-test mode sends to all devices
c=makeCtx('17:05');c.adminPrayerSet_({enabled:true,testMode:false});r=c.prayerTick_();assert(r.ok&&r.testMode===false);assert.equal(c.__sends[0].targets.length,2);
// 4. prayer toggle off skips
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true,prayers:{Dhuhr:false}});r=c.prayerTick_();assert(r.ok&&r.skipped==='no-prayer-now');assert.equal(c.__sends.length,0);
// 5. adminPrayerTest_ always to admin even when disabled, and get returns times
c=makeCtx('09:00');r=c.adminPrayerTest_({prayer:'Fajr'});assert(r.ok&&r.sent===1);assert(c.__sends[0].title.includes('الفجر'));assert(c.__sends[0].body.includes('تجريبية'));
r=c.adminPrayerGet_({});assert(r.ok&&r.times&&r.times.Fajr==='05:12'&&r.testMode===true);
// 6. no matching time
c=makeCtx('10:00');c.adminPrayerSet_({enabled:true});r=c.prayerTick_();assert(r.ok&&r.skipped==='no-prayer-now');
// 7. Dar Al-Ifta parsing: ص/م conversion incl. Dhuhr kept at 11, evening +12
c=makeCtx('11:47');r=c.adminPrayerGet_({});assert(r.ok);assert.equal(r.times.Fajr,'05:12');assert.equal(r.times.Dhuhr,'11:47');assert.equal(r.times.Asr,'14:47');assert.equal(r.times.Maghrib,'17:05');assert.equal(r.times.Isha,'18:25');
// 8. Dar Al-Ifta down -> Aladhan fallback supplies same times
c=makeCtx('11:47');c.__failDar=true;r=c.adminPrayerGet_({});assert(r.ok);assert.equal(r.times.Dhuhr,'11:47');assert.equal(r.times.Maghrib,'17:05');
console.log('PASS: disabled default, test-user-only, dedupe, all-devices mode, per-prayer toggle, forced test target, Dar Al-Ifta parsing (ص/م + Dhuhr quirk), Aladhan fallback.');
