const path=require('path');const root=path.join(__dirname,'..');
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(root,'content-library.js'),'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(code,ctx);
const L=ctx.window.NPHContentLibrary;
assert(Array.isArray(L)&&L.length>=5,'five categories');
let n=0;L.forEach(c=>{assert(c.cat&&c.icon&&Array.isArray(c.items)&&c.items.length,'category fields');c.items.forEach(i=>{n++;assert(i.t&&i.t.length<=80,'title limit');assert(i.b&&i.b.length<=240,'body limit');assert(typeof i.src==='string','src field')})});
const hadith=L.filter(c=>/حديث|أحاديث/.test(c.cat));assert(hadith.length&&hadith[0].items.every(i=>i.src.length>0),'hadith all sourced');
console.log('PASS: '+n+' items, limits respected, hadith sourced.');
