const path=require('path');const root=path.join(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(root,'push.js'),'utf8');

function makeEnv(opts){
  opts=opts||{};
  const store=Object.assign({},opts.ls||{});
  const appended=[];const fetches=[];const byId={};
  const scan=c=>{if(!c)return;String(c.innerHTML||'').replace(/id="([^"]+)"/g,(m,id)=>{if(!byId[id]){byId[id]=mkEl();byId[id].id=id}return m});(c.children||[]).forEach(scan)};
  const mkEl=()=>({style:{cssText:''},children:[],id:'',type:'',disabled:false,textContent:'',innerHTML:'',
    append(c){this.children.push(c);if(c&&c.id)byId[c.id]=c;scan(c)},
    onclick:null,src:'',onload:null,onerror:null,remove(){delete byId[this.id]}});
  const ls={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
  const messaging={onMessage(){},getToken:async()=>opts.token===undefined?'tok-1':opts.token,deleteToken:async()=>{}};
  const messagingFn=()=>messaging;messagingFn.isSupported=async()=>opts.supported!==false;
  const ctx={
    console,setTimeout,JSON,Error,Object,Array,String,Number,RegExp,Math,Promise,Date,
    window:null,matchMedia:()=>({matches:!!opts.standaloneMM}),
    navigator:{userAgent:opts.ua||'Mozilla/5.0 (Linux; Android 13) Chrome/120',standalone:opts.standaloneNav},
    Notification:{permission:opts.permission||'default',requestPermission:async()=>opts.grantResult||'granted'},
    localStorage:ls,
    document:{readyState:'complete',createElement:mkEl,
      getElementById:id=>byId[id]||null,
      body:{append(c){appended.push(c);if(c&&c.id)byId[c.id]=c;scan(c)}},
      head:{append(s){setTimeout(()=>s.onload&&s.onload(),0)}},
      addEventListener(){}},
    firebase:{apps:[1],initializeApp(){},messaging:messagingFn},
    fetch:async(url,o)=>{fetches.push(JSON.parse(o.body));return{json:async()=>opts.postResult||{ok:true}}},
    addEventListener(){},
    NPH_FIREBASE:{projectId:'x'},NPH_VAPID_KEY:'key',API:'https://api.example/exec',
  };
  if(!opts.noSW)ctx.navigator.serviceWorker={register:async()=>({scope:'/'}),ready:Promise.resolve({scope:'/'})};
  if(opts.noNotification)delete ctx.Notification;
  ctx.window=ctx;
  if(opts.authToken)ls.setItem('NPH_AUTH_V1',JSON.stringify({token:'T1',username:'student1'}));
  vm.createContext(ctx);vm.runInContext(code,ctx);
  return {ctx,byId,appended,fetches,ls};
}
const flush=async()=>{for(let i=0;i<30;i++)await new Promise(r=>setTimeout(r,0))};

(async()=>{
// 1. iOS Safari (not installed PWA): guidance card, no button, no token work
let e=makeEnv({ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1',authToken:true});
assert(e.byId['nphPushIos'],'ios card shown');assert(!e.byId['nphPushEnable'],'no button on ios browser');
assert(e.byId['nphPushIos'].innerHTML.includes('الشاشة الرئيسية'));

// 2. iOS PWA installed: button mounts normally, click registers token
e=makeEnv({ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',standaloneNav:true,authToken:true});
assert(e.byId['nphPushEnable'],'button in PWA');
e.byId['nphPushEnable'].onclick();await flush();
assert.equal(e.fetches.filter(f=>f.action==='stuPushToken').length,1);
assert.equal(e.fetches.find(f=>f.action==='stuPushToken').platform,'ios');
assert.equal(e.fetches.filter(f=>f.action==='stuPushAttempt'&&f.stage==='enabled').length,1);assert.equal(e.byId['nphPushEnable'].textContent,'الإشعارات مفعّلة ✓');

// 3. Android Chrome, logged in, permission default -> prompt card shows; one tap -> granted -> token saved + attempt logged
e=makeEnv({authToken:true});
const b3=e.byId['nphPushEnable'];assert(b3);
assert(e.byId['nphPushPrompt'],'first-visit prompt card');
assert(e.byId['nphPushPrompt'].innerHTML.includes('مواقيت الصلاة'));
e.byId['nphPushPromptYes'].onclick();await flush();
assert.equal(e.fetches.filter(f=>f.action==='stuPushToken').length,1);
assert.equal(e.fetches.filter(f=>f.action==='stuPushAttempt'&&f.stage==='enabled').length,1,'success logged');
assert.equal(e.ls.getItem('NPH_PUSH_OWNER'),'student1');
assert.equal(b3.textContent,'الإشعارات مفعّلة ✓');
assert(!e.byId['nphPushPrompt'],'prompt closed after success');
assert.equal(e.ls.getItem('NPH_PUSH_PROMPT_V1'),'done');

// 3b. Dismissed prompt never returns
e=makeEnv({authToken:true,ls:{NPH_PUSH_PROMPT_V1:'later'}});
await flush();
assert(!e.byId['nphPushPrompt'],'no prompt after dismiss');

// 4. Permission prompt denied: no token, error persisted + logged
e=makeEnv({authToken:true,grantResult:'denied'});
e.byId['nphPushEnable'].onclick();await flush();
assert.equal(e.fetches.filter(f=>f.action==='stuPushToken').length,0);
assert(e.ls.getItem('NPH_PUSH_ERR_V1'),'error remembered');
assert.equal(e.fetches.filter(f=>f.action==='stuPushAttempt'&&f.stage==='enable-error').length,1,'failure logged');

// 5. Auto-heal: permission granted earlier, no owner -> silent re-register on mount, no click
e=makeEnv({authToken:true,permission:'granted'});
await flush();
assert.equal(e.fetches.filter(f=>f.action==='stuPushToken').length,1,'auto-heal posts without tap');
assert.equal(e.ls.getItem('NPH_PUSH_OWNER'),'student1');

// 6. Already enabled: no re-register, just setup
e=makeEnv({authToken:true,permission:'granted',ls:{NPH_PUSH_OWNER:'student1'}});
await flush();
assert.equal(e.fetches.filter(f=>f.action==='stuPushToken').length,0,'no duplicate token post');
assert.equal(e.byId['nphPushEnable'].textContent,'الإشعارات مفعّلة ✓');

// 7. Token POST fails: error persists and auto-heal retries next visit
e=makeEnv({authToken:true,permission:'granted',postResult:{ok:false,error:'server-down'}});
await flush();
assert.equal(e.fetches.filter(f=>f.action==='stuPushToken').length,1);assert(e.ls.getItem('NPH_PUSH_ERR_V1'));
assert(!e.ls.getItem('NPH_PUSH_OWNER'));
assert(e.byId['nphPushErr'],'error card visible');
assert.equal(e.fetches.filter(f=>f.action==='stuPushAttempt'&&f.stage==='autoheal-error').length,1,'auto-heal failure logged');
// next visit retries again (still no owner)
const store2={NPH_AUTH_V1:e.ls.getItem('NPH_AUTH_V1'),NPH_PUSH_ERR_V1:e.ls.getItem('NPH_PUSH_ERR_V1')};
e=makeEnv({authToken:false,permission:'granted',ls:store2});
await flush();
assert.equal(e.fetches.filter(f=>f.action==='stuPushToken').length,1,'retry on next visit');

// 8. In-app browser (WhatsApp WebView): no service worker -> hint card, no button
{
  const w=makeEnv({ua:'Mozilla/5.0 (Linux; Android 13; wv) Version/4.0 Chrome/120 Mobile Safari/537.36 WhatsApp/2.24.1',authToken:true,noSW:true,noNotification:true});
  assert(w.byId['nphPushWebview'],'webview hint shown');
  assert(!w.byId['nphPushEnable'],'no button in webview');
  assert(w.byId['nphPushWebview'].innerHTML.includes('كروم'));
}

// 9. Unsupported browser without WebView signature: exits quietly (no cards, no button)
{
  const w=makeEnv({authToken:true,noSW:true,noNotification:true});
  assert(!w.byId['nphPushWebview']&&!w.byId['nphPushEnable']);
}
console.log('push-enable ok');
})().catch(e=>{console.error(e);process.exit(1)});
