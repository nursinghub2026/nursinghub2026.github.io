const path=require('path');const root=path.join(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(root,'backend/ScheduledNotices.gs'),'utf8');

function makeCtx(now){
  const sheets={}; const props={}; const sends=[]; const inbox=[];
  function sheet(name){
    if(!sheets[name]) sheets[name]={rows:[[]]};
    return {
      getDataRange:()=>({getValues:()=>sheets[name].rows.map(r=>r.slice())}),
      appendRow:(r)=>{sheets[name].rows.push(r)}
    };
  }
  const ctx={console,Date,JSON,Error,Object,Array,String,Number,RegExp,Math,
    SpreadsheetApp:{openById:()=>({getSheetByName:n=>sheets[n]?sheet(n):null,insertSheet:n=>{sheets[n]={rows:[]};return sheet(n)}})},
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v}})},
    Utilities:{formatDate:(d,tz,fmt)=>fmt==='yyyy-MM-dd HH:mm'?(fmt.length&&d&&d.__cut?'2026-11-23 10:00':now):now,getUuid:()=>'id-'+Math.random().toString(36).slice(2,10)},
    stuRequireAdmin_:()=>{},ScriptApp:{getProjectTriggers:()=>[],newTrigger:()=>({timeBased:()=>({everyMinutes:()=>({create:()=>({})})})})},
    pushTokensSheet_:()=>({getDataRange:()=>({getValues:()=>[['u','t'],['abdelrhman.wae1','admin-device'],['student2','student-device'],['student3','student-device-3']]})}),
    fcmSendToTokens_:(targets,title,body,data)=>{sends.push({targets,title,body,data});return{sent:targets.length,failed:0,configured:true}},
    inboxAppend_:(username,title,body,url)=>{inbox.push({username,title,body,url})},
    __sheets:sheets,__sends:sends,__inbox:inbox};
  // cutoff: Date.now()-864e5 handled by marking via real Date — instead stub formatDate per call count is fragile; use fixed strings:
  ctx.Utilities.formatDate=(d,tz,fmt)=>{ if(fmt!=='yyyy-MM-dd HH:mm') return now; return (d instanceof Date && (Date.now()-d.getTime()>80000000)) ? '2026-11-23 10:00' : now; };
  vm.createContext(ctx);vm.runInContext(code,ctx);return ctx;
}

const NOW='2026-11-24 10:00';

// 1. disabled by default: tick sends nothing
let c=makeCtx(NOW);
let r=c.schedTick_();assert(r.ok&&r.skipped==='disabled');assert.equal(c.__sends.length,0);

// 2. add + list + validation
c=makeCtx(NOW);
assert.strictEqual(c.adminSchedAdd_({title:'',body:'x',sendAt:NOW}).ok,false);
assert.strictEqual(c.adminSchedAdd_({title:'x',body:'y',sendAt:'bad'}).ok,false);
let add=c.adminSchedAdd_({title:'كويز الأسبوع',body:'الكويز يوم الخميس',banner:'quiz',sendAt:NOW});
assert(add.ok&&add.enabled===false);
let lst=c.adminSchedList_({});assert.equal(lst.items.length,1);assert.equal(lst.items[0].sent,false);assert.equal(lst.items[0].canceled,false);
assert.equal(lst.items[0].banner,'quiz');

// 3. enabled tick at due time: sends to all devices + inbox, dedupe on second tick
c.adminSchedSet_({enabled:true});
r=c.schedTick_();assert(r.ok&&r.delivered===1);
assert.equal(c.__sends.length,1);assert.equal(c.__sends[0].targets.length,3);assert.equal(c.__sends[0].data.banner,'quiz');
assert.equal(c.__inbox.length,1);assert.equal(c.__inbox[0].title,'كويز الأسبوع');
r=c.schedTick_();assert(r.ok&&r.delivered===0);assert.equal(c.__sends.length,1);
lst=c.adminSchedList_({});assert.equal(lst.items[0].sent,true);

// 4. targeted audience reaches only that student
c=makeCtx(NOW);c.adminSchedSet_({enabled:true});
c.adminSchedAdd_({title:'لزيزو',body:'رسالة',sendAt:NOW,username:'student2'});
r=c.schedTick_();assert.equal(c.__sends[0].targets.length,1);assert.deepEqual(c.__sends[0].targets,['student-device']);
assert.equal(c.__inbox[0].username,'student2');

// 5. cancel stops delivery
c=makeCtx(NOW);c.adminSchedSet_({enabled:true});
add=c.adminSchedAdd_({title:'ملغي',body:'x',sendAt:NOW});
assert(c.adminSchedCancel_({id:add.id}).ok);
assert(c.adminSchedCancel_({id:add.id}).already===true);
r=c.schedTick_();assert.equal(c.__sends.length,0);
assert.strictEqual(c.adminSchedCancel_({id:'nope'}).ok,false);

// 6. weekly: only the latest occurrence within a day is delivered, no backlog blast
c=makeCtx(NOW);c.adminSchedSet_({enabled:true});
c.adminSchedAdd_({title:'أسبوعي',body:'x',sendAt:'2026-11-10 10:00',weekly:true});
r=c.schedTick_();assert.equal(c.__sends.length,1,'one catch-up send only');
assert.equal(c.__sends[0].targets.length,3);

// 7. stale one-time notice (older than a day) is never sent
c=makeCtx(NOW);c.adminSchedSet_({enabled:true});
c.adminSchedAdd_({title:'قديم',body:'x',sendAt:'2026-11-20 10:00'});
r=c.schedTick_();assert.equal(c.__sends.length,0);

// 8. future notice waits
c=makeCtx(NOW);c.adminSchedSet_({enabled:true});
c.adminSchedAdd_({title:'بكره',body:'x',sendAt:'2026-11-25 10:00'});
r=c.schedTick_();assert.equal(c.__sends.length,0);

// 9. time normalization + week advance
c=makeCtx(NOW);
assert.equal(c.schedNormalizeTime_('2026-11-24T10:00'),'2026-11-24 10:00');
assert.equal(c.schedNormalizeTime_('junk'),'');
assert.equal(c.schedAdvanceWeek_('2026-11-24 10:00'),'2026-12-01 10:00');

// 10. install trigger registers the 5-minute tick
c=makeCtx(NOW);assert(c.schedInstallTrigger_().ok);

console.log('scheduled-notices ok');
