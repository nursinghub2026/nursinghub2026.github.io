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
    pushUploadImage_:(b64)=>'https://res.cloudinary.com/demo/image/upload/v1/foundations-notices/'+String(b64).length+'.png',
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
c=makeCtx('17:05');c.adminPrayerSet_({enabled:true,testMode:false});r=c.prayerTick_();assert(r.ok&&r.testMode===false);assert.equal(c.__sends[0].targets.length,2);assert(c.__sends[0].body.includes('5:05 م'),'12h evening format');
// 4. prayer toggle off skips
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true,prayers:{Dhuhr:false}});r=c.prayerTick_();assert(r.ok&&r.skipped==='no-prayer-now');assert.equal(c.__sends.length,0);
// 5. adminPrayerTest_ always to admin even when disabled, and get returns times
c=makeCtx('09:00');r=c.adminPrayerTest_({prayer:'Fajr'});assert(r.ok&&r.sent===1);assert(c.__sends[0].title.includes('الفجر'));assert(c.__sends[0].body.includes('تجريبية'));assert(c.__sends[0].body.includes('5:12 ص'),'12h Arabic format');
r=c.adminPrayerGet_({});assert(r.ok&&r.times&&r.times.Fajr==='05:12'&&r.testMode===true);
// 6. no matching time
c=makeCtx('10:00');c.adminPrayerSet_({enabled:true});r=c.prayerTick_();assert(r.ok&&r.skipped==='no-prayer-now');
// 7. Dar Al-Ifta parsing: ص/م conversion incl. Dhuhr kept at 11, evening +12
c=makeCtx('11:47');r=c.adminPrayerGet_({});assert(r.ok);assert.equal(r.times.Fajr,'05:12');assert.equal(r.times.Dhuhr,'11:47');assert.equal(r.times.Asr,'14:47');assert.equal(r.times.Maghrib,'17:05');assert.equal(r.times.Isha,'18:25');
// 8. Dar Al-Ifta down -> Aladhan fallback supplies same times
c=makeCtx('11:47');c.__failDar=true;r=c.adminPrayerGet_({});assert(r.ok);assert.equal(r.times.Dhuhr,'11:47');assert.equal(r.times.Maghrib,'17:05');
// 9. per-prayer images: default file, none, ready-made, custom upload, clear, invalid rejected
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true});r=c.prayerTick_();
assert(c.__sends[0].data.imageUrl.endsWith('prayer-dhuhr.png')); // الافتراضي
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true,images:{Dhuhr:'none'}});r=c.prayerTick_();assert.equal(c.__sends[0].data.imageUrl,'');
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true,images:{Dhuhr:'hadith'}});r=c.prayerTick_();assert(c.__sends[0].data.imageUrl.endsWith('/hadith.png'));
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true,images:{Dhuhr:'javascript:x'}});r=c.prayerTick_();assert(c.__sends[0].data.imageUrl.endsWith('prayer-dhuhr.png')); // قيمة غريبة → الافتراضي
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true,images:{Dhuhr:'custom'}});r=c.prayerTick_();assert(c.__sends[0].data.imageUrl.endsWith('prayer-dhuhr.png')); // custom بدون رفع مرفوض
c=makeCtx('11:47');c.adminPrayerSet_({enabled:true});r=c.adminPrayerImage_({prayer:'Dhuhr',imagePng:'AAAA'});
assert(r.ok&&r.kind==='custom'&&r.preview.includes('res.cloudinary.com'));r=c.prayerTick_();assert(c.__sends[0].data.imageUrl.includes('res.cloudinary.com'));
r=c.adminPrayerImage_({prayer:'Dhuhr'});assert(r.ok&&r.kind==='default'&&r.preview.endsWith('prayer-dhuhr.png')); // إزالة → افتراضي
r=c.adminPrayerImage_({prayer:'Nope'});assert.equal(r.ok,false);
r=c.adminPrayerGet_({});assert(r.ok&&r.images&&r.images.Fajr.kind==='default'&&r.images.Fajr.preview.endsWith('prayer-fajr.png')&&typeof r.imageHosting==='boolean');
// التجربة الفورية تستخدم نفس صورة الصلاة المختارة
c=makeCtx('09:00');c.adminPrayerSet_({images:{Fajr:'none'}});r=c.adminPrayerTest_({prayer:'Fajr'});assert.equal(c.__sends[0].data.imageUrl,'');
console.log('PASS: disabled default, test-user-only, dedupe, all-devices mode, per-prayer toggle, forced test target, Dar Al-Ifta parsing (ص/م + Dhuhr quirk), Aladhan fallback, per-prayer images (default/none/ready/custom/clear/validation).');
// 13. window matching: fires a few minutes after the adhan even when the 5-min trigger never hits the exact minute
c=makeCtx('18:28');c.adminPrayerSet_({enabled:true});r=c.prayerTick_();assert(r.ok&&r.prayer==='Isha'&&r.lateMin===3,'fires within window at phase-misaligned minute');assert.equal(c.__sends.length,1);
r=c.prayerTick_();assert(r.ok&&r.skipped==='duplicate','second tick in window does not resend');assert.equal(c.__sends.length,1);
// 14. beyond the 30-min window: no send
c=makeCtx('19:00');c.adminPrayerSet_({enabled:true});r=c.prayerTick_();assert(r.ok&&r.skipped==='no-prayer-now','35 min late is outside the window');assert.equal(c.__sends.length,0);
// 15. legacy exact-match record migrates: a prayer already sent today before the fix is not resent
c=makeCtx('18:28');c.__store['PRAYER_LAST']='2026-11-24:Isha';c.adminPrayerSet_({enabled:true});r=c.prayerTick_();assert(r.ok&&r.skipped==='duplicate','legacy record prevents resend');assert.equal(c.__sends.length,0);
// 16. per-prayer dedupe survives across the day: Asr sent, Isha still fires later
c=makeCtx('14:50');c.adminPrayerSet_({enabled:true});r=c.prayerTick_();assert(r.ok&&r.prayer==='Asr'&&r.lateMin===3);
