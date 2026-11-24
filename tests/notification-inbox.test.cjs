const path=require('path');const root=path.join(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(root,'backend/NotificationInbox.gs'),'utf8');
const stores={};
function makeSheet(name){
  const st=stores[name]||(stores[name]={rows:[]});
  if(!st.wrapper)st.wrapper={getDataRange:()=>({getValues:()=>st.rows}),appendRow:(r)=>{st.rows.push(r)}};
  return st.wrapper;
}
function makeCtx(username){
  const ctx={console,Date,JSON,Error,Object,Array,String,Number,RegExp,Math,
    SpreadsheetApp:{openById:()=>({getSheetByName:n=>(stores[n]&&stores[n].wrapper)||null,insertSheet:n=>makeSheet(n)})},
    Utilities:{getUuid:(()=>{let i=0;return()=>'uuid-'+(++i)})()},
    stuAuth_:()=>({o:{username}}),
    __stores:stores};
  vm.createContext(ctx);vm.runInContext(code,ctx);return ctx;
}
// 1. append + list: ALL visible to all, targeted only to its student, newest first
let c=makeCtx('student1');
c.inboxAppend_('','عنوان عام','نص عام','index.html');
c.inboxAppend_('student2','خاص بزياد','نص خاص','chat.html');
c.inboxAppend_('student1','خاص بي','نص لي','');
let r=c.stuInboxList_({token:'t'});
assert(r.ok&&r.items.length===2,'student1 sees ALL + own only');
assert.equal(r.items[0].title,'خاص بي');assert.equal(r.items[1].title,'عنوان عام');
assert.equal(r.unread,2);assert(!r.items[0].read);
let c2=makeCtx('student2'); // same shared stores
r=c2.stuInboxList_({token:'t'});
assert.equal(r.items.length,2);assert.equal(r.items[0].title,'خاص بزياد');
// 2. mark one read -> unread drops, read flag persists
r=c.stuInboxRead_({token:'t',ids:[c.stuInboxList_({token:'t'}).items[0].id]});
assert.equal(r.marked,1);assert.equal(r.unread,1);
r=c.stuInboxList_({token:'t'});assert(r.items[0].read&&!r.items[1].read);
// 3. marking same id again is a no-op
const before=stores['InboxReads'].rows.length;
r=c.stuInboxRead_({token:'t',ids:[c.stuInboxList_({token:'t'}).items[0].id]});
assert.equal(r.marked,0);assert.equal(stores['InboxReads'].rows.length,before);
// 4. bogus id ignored
r=c.stuInboxRead_({token:'t',ids:['nope']});assert.equal(r.marked,0);assert.equal(r.unread,1);
// 5. mark all
r=c.stuInboxRead_({token:'t',ids:'all'});assert.equal(r.marked,1);assert.equal(r.unread,0);
r=c.stuInboxList_({token:'t'});assert(r.items.every(x=>x.read));
// 6. other student's reads don't leak
r=c2.stuInboxList_({token:'t'});assert.equal(r.unread,2);
// 7. title/body trimmed to FCM limits
c.inboxAppend_('','x'.repeat(100),'y'.repeat(300),'');
r=c.stuInboxList_({token:'t'});
assert.equal(r.items[0].title.length,80);assert.equal(r.items[0].body.length,240);
// 8. Push.gs composer hook is present and guarded
const push=fs.readFileSync(path.join(root,'backend/Push.gs'),'utf8');
assert(/typeof inboxAppend_ === 'function'\) inboxAppend_\(username, title, body, noticeUrl\)/.test(push),'composer appends to inbox');
console.log('PASS: audience filter, newest-first, per-student read state, dedupe, mark-all, no cross-student leak, FCM-length trim, composer hook.');
