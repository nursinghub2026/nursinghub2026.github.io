const path=require('path');const root=path.join(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const pushCode=fs.readFileSync(path.join(root,'backend/Push.gs'),'utf8');
const ctx={console,Date,JSON,Error,Array,String,Object,Number,RegExp,PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})},stuRequireAdmin_:()=>{}};
vm.createContext(ctx);vm.runInContext(pushCode,ctx);
// Empty log sheet
ctx.pushLogSheet_=()=>({getLastRow:()=>1});
let r=ctx.adminPushLog_({});assert(r.ok&&r.log.length===0,'empty log');
// Three rows, newest first after reverse
const rows=[['2026-11-20T10:00:00.000Z','ALL','أول','نص',5,1,true],[new Date('2026-11-22T12:00:00.000Z'),'student1','ثاني','نص',2,0,true],[new Date('2026-11-23T15:30:00.000Z'),'ALL','ثالث','نص',9,'2',false]];
ctx.pushLogSheet_=()=>({getLastRow:()=>4,getRange:(row,col,n,c)=>{assert.equal(row,2);assert.equal(n,3);assert.equal(c,7);return{getValues:()=>rows}}});
r=ctx.adminPushLog_({});assert(r.ok&&r.log.length===3);
assert.equal(r.log[0].title,'ثالث');assert.equal(r.log[0].ts,'2026-11-23T15:30:00.000Z');
assert.equal(r.log[0].failed,2,'string number coerced');assert.equal(r.log[0].configured,false);
assert.equal(r.log[2].audience,'ALL');
console.log('PASS: adminPushLog_ empty sheet, newest-first, Date ISO, coercion, range cap.');
