/* Additive theory content, deployment requires separate approval.
 * Call routeTheoryExtras_(req) inside doPost's existing lock, BEFORE the
 * existing admin-password gate, and return json(result) when non-null.
 * Requires db(), ADMIN_PASSWORD and existing Cloudinary script properties.
 * No changes to Lectures, Items, Drive files or old sheet headers.
 */
var TE_TAB_ = 'TheoryExtrasV1';
var TE_HEAD_ = ['id','lectureId','kind','payload','updatedAt','operation'];
function teError_(text) { throw new Error(text); }
function teText_(v,max,required) {
  if(typeof v!=='string' || v.length>max || (required&&!v.trim()))teError_('النص ناقص أو أطول من المسموح');
  return v.trim();
}
function teAdmin_(p) { if(String(p.password||'')!==ADMIN_PASSWORD)teError_('غير مصرح'); }
function teLecture_(id,admin) {
  id=teText_(id,100,true);
  var sh=db().getSheetByName('Lectures');if(!sh)teError_('المحاضرة مش موجودة');
  var all=sh.getDataRange().getValues(),heads=all.shift()||[];
  var row=all.filter(function(r){return String(r[heads.indexOf('id')])===id;})[0];
  if(!row || row[heads.indexOf('track')]!=='theory' || (!admin&&row[heads.indexOf('status')]!=='published'))teError_('المحتوى غير متاح');
  return id;
}
function teRows_() {
  var sh=db().getSheetByName(TE_TAB_);if(!sh||sh.getLastRow()<2)return [];
  return sh.getRange(2,1,sh.getLastRow()-1,TE_HEAD_.length).getValues();
}
function teLatest_(lectureId) {
  var map={};teRows_().forEach(function(r){if(String(r[1])===lectureId){try{map[String(r[0])]={id:String(r[0]),lectureId:String(r[1]),kind:String(r[2]),content:JSON.parse(r[3]),updatedAt:String(r[4]),hidden:r[5]==='hide'};}catch(e){}}});
  return Object.keys(map).map(function(k){return map[k];});
}
function teUrl_(v) {
  v=teText_(v,1800,true);
  if(!/^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/video\/upload\/[A-Za-z0-9_.,!\/~%+\-]+(?:\.(?:mp3|m4a|aac|ogg|wav|webm))?(?:\?[A-Za-z0-9_=&%.\-]*)?$/.test(v) && !/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/(?:view|preview)(?:\?usp=sharing)?$/.test(v))teError_('استخدم رابط صوت Cloudinary مباشر أو رابط ملف Google Drive');
  return v;
}
function teVideoUrl_(v) {
  v=teText_(v,1800,true);
  if(!/^https:\/\/(?:www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/.test(v)&&!/^https:\/\/youtu\.be\/[A-Za-z0-9_-]{11}$/.test(v)&&!/^https:\/\/drive\.google\.com\/file\/d\/[A-Za-z0-9_-]+\/(view|preview)(?:\?usp=sharing)?$/.test(v)&&!/^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/video\/upload\/[A-Za-z0-9_.,!\/~%+\-]+\.(mp4|webm)$/.test(v))teError_('استخدم رابط فيديو YouTube أوDrive أوCloudinary مباشر');
  return v;
}
function teCard_(c) {
  var out={title:teText_(c.title,160,true),question:teText_(c.question,2000,true),answer:teText_(c.answer,4000,true)};
  ['questionAr','answerAr','reference'].forEach(function(k){if(c[k])out[k]=teText_(c[k],k==='answerAr'?4000:k==='reference'?300:2000,false);});
  if(!!out.questionAr!==!!out.answerAr)teError_('اكتب السؤال والإجابة العربي مع بعض');
  return out;
}
function teHash_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text).map(function(n){return ('0'+((n+256)%256).toString(16)).slice(-2);}).join('');
}
/* Preview defaults to read-only. Commit only after separately approved activation,
 * backup and import. Caller supplies the exact reviewed plan hash. Existing cards
 * are never updated by this route. A partial failure is safe to retry. */
function teImport_(p) {
  teAdmin_(p);
  if(!Array.isArray(p.groups)||!p.groups.length||p.groups.length>20)teError_('قائمة المحاضرات غير صالحة');
  var batch=teText_(p.batch,100,true);if(!/^[a-zA-Z0-9_-]+$/.test(batch))teError_('معرف المصدر غير صالح');
  var seen={},plan=[],warnings=[],counts={},total=0,all=teRows_(),latest={};
  all.forEach(function(r){latest[String(r[0])]=r;});
  p.groups.forEach(function(g){
    var lid=teLecture_(g.lectureId,false),existing=teLatest_(lid);
    if(Object.prototype.hasOwnProperty.call(counts,lid))teError_('محاضرة مكررة داخل الدفعة');
    counts[lid]=existing.filter(function(x){return !x.hidden;}).length;
    var fingerprints={};existing.filter(function(x){return x.kind==='flashcard';}).forEach(function(x){fingerprints[JSON.stringify(teCard_(x.content))]=true;});
    if(g.mappingStatus==='provisional'&&g.mappingConfirmed!==true)warnings.push(lid);
    if(!Array.isArray(g.cards)||!g.cards.length||g.cards.length>500)teError_('قائمة الكروت غير صالحة');
    g.cards.forEach(function(c){
      total++;if(total>500)teError_('أقصى دفعة 500 كارت');
      var key=teText_(c.sourceKey,150,true),id='import-'+teHash_(batch+'|'+key),content=teCard_({title:c.title||('Flashcard '+total),question:c.q,answer:c.a,questionAr:c.qar,answerAr:c.aar,reference:c.ref});
      if(seen[id])teError_('معرف مصدر مكرر داخل الدفعة');seen[id]=true;
      var old=latest[id],state='add';
      if(old){if(String(old[1])!==lid||old[2]!=='flashcard'||old[3]!==JSON.stringify(content)||old[5]==='hide')teError_('تعارض مع كارت مستورد سابقًا، لا يتم الاستبدال تلقائيًا');state='skip';}
      var fingerprint=JSON.stringify(content);if(!old&&fingerprints[fingerprint])state='skip';fingerprints[fingerprint]=true;
      if(state==='add'){counts[lid]++;if(counts[lid]>500)teError_('تجاوز سعة المحاضرة');}
      plan.push({id:id,lectureId:lid,content:content,state:state});
    });
  });
  // The review hash identifies the exact normalized content and mapping, not
  // current skip/add state, so safe retries after partial writes use the same hash.
  var hash=teHash_(JSON.stringify(plan.map(function(x){return {id:x.id,lectureId:x.lectureId,content:x.content};})));
  var summary={ok:true,dryRun:p.commit!==true,planHash:hash,total:total,add:plan.filter(function(x){return x.state==='add';}).length,skip:plan.filter(function(x){return x.state==='skip';}).length,unconfirmedMappings:warnings};
  if(p.commit!==true)return summary;
  if(warnings.length)teError_('راجع وأكد ربط المحاضرة المؤقت أولًا');
  if(p.reviewedPlanHash!==hash)teError_('المعاينة اتغيرت، راجع الدفعة من جديد');
  var sh=db().getSheetByName(TE_TAB_);
  if(!sh&&summary.add){sh=db().insertSheet(TE_TAB_);sh.appendRow(TE_HEAD_);sh.setFrozenRows(1);}
  plan.forEach(function(x){if(x.state==='add')sh.appendRow([x.id,x.lectureId,'flashcard',JSON.stringify(x.content),new Date().toISOString(),'save']);});
  return summary;
}
function teSave_(p) {
  teAdmin_(p);var lid=teLecture_(p.lectureId,true),kind=p.kind,id=p.id?teText_(p.id,100,true):Utilities.getUuid();
  if(!/^[A-Za-z0-9_-]+$/.test(id)||['audio','flashcard','video'].indexOf(kind)<0)teError_('نوع المحتوى غير صالح');
  var old=teLatest_(lid).filter(function(x){return x.id===id;})[0];
  if(p.id&&!old)teError_('المحتوى مش موجود في المحاضرة');
  if(!old&&teRows_().some(function(r){return String(r[0])===id;}))teError_('معرف مكرر');
  if(!old&&teLatest_(lid).filter(function(x){return !x.hidden;}).length>=500)teError_('وصلت للحد الأقصى للمحاضرة');
  var c=p.content||{},content={title:teText_(c.title,160,true)};
  if(kind==='audio'||kind==='video'){content.url=kind==='video'?teVideoUrl_(c.url):teUrl_(c.url);content.description=teText_(c.description||'',1500,false);}
  else {content=teCard_(c);}
  var sh=db().getSheetByName(TE_TAB_);
  if(!sh){sh=db().insertSheet(TE_TAB_);sh.appendRow(TE_HEAD_);sh.setFrozenRows(1);}
  // Append a revision, never replace an earlier row or delete an asset.
  sh.appendRow([id,lid,kind,JSON.stringify(content),new Date().toISOString(),p.hidden===true?'hide':'save']);
  return {ok:true,id:id};
}
function teUpload_(p) {
  teAdmin_(p);teLecture_(p.lectureId,true);
  var raw=String(p.data||''),mime=String(p.mime||''),name=String(p.name||'');
  var ext=(name.split('.').pop()||'').toLowerCase();
  var types={mp3:'audio/mpeg',m4a:'audio/mp4',ogg:'audio/ogg',wav:'audio/wav',webm:'audio/webm'};
  if(!types[ext]||raw.length>11200000||!/^[A-Za-z0-9+/]+=*$/.test(raw))teError_('ملف صوت غير صالح. الحد 8 ميجا');
  var bytes=Utilities.base64Decode(raw);if(bytes.length<12||bytes.length>8*1024*1024)teError_('حجم الملف غير صالح');
  var b=bytes.map(function(n){return (n+256)%256;}),str=function(i,n){return String.fromCharCode.apply(null,b.slice(i,i+n));};
  var valid=(ext==='mp3'&&(str(0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224))) || (ext==='m4a'&&str(4,4)==='ftyp') || (ext==='ogg'&&str(0,4)==='OggS') || (ext==='wav'&&str(0,4)==='RIFF'&&str(8,4)==='WAVE') || (ext==='webm'&&b.slice(0,4).join(',')==='26,69,223,163');
  if(!valid)teError_('صيغة الملف لا تطابق امتداده');
  var props=PropertiesService.getScriptProperties(),cloud=props.getProperty('CLOUDINARY_CLOUD_NAME'),key=props.getProperty('CLOUDINARY_API_KEY'),secret=props.getProperty('CLOUDINARY_API_SECRET');
  if(!cloud||!key||!secret)teError_('استضافة الصوت لسه مش متفعلة');
  var cache=CacheService.getScriptCache();if(cache.get('te-audio-upload'))teError_('استنى 15 ثانية بين كل رفع');cache.put('te-audio-upload','1',15);
  var timestamp=String(Math.floor(Date.now()/1000)),pid='foundations-audio/'+Utilities.getUuid();
  var sign='overwrite=false&public_id='+pid+'&timestamp='+timestamp+secret;
  var signature=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1,sign).map(function(n){return ('0'+((n+256)%256).toString(16)).slice(-2);}).join('');
  var res=UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/'+cloud+'/video/upload',{method:'post',payload:{file:Utilities.newBlob(bytes,types[ext],'audio.'+ext),api_key:key,timestamp:timestamp,public_id:pid,overwrite:'false',signature:signature},muteHttpExceptions:true});
  var out;try{out=JSON.parse(res.getContentText());}catch(e){teError_('الاستضافة لم ترجع نتيجة صالحة');}
  if(res.getResponseCode()!==200||out.public_id!==pid||!String(out.secure_url||'').startsWith('https://res.cloudinary.com/'+cloud+'/video/upload/'))teError_('رفع الصوت لم ينجح. لم يتم حفظ محتوى');
  return {ok:true,url:teUrl_(out.secure_url)};
}
function routeTheoryExtras_(p) {
  if(['theoryExtrasList','adminTheoryExtrasList','adminTheoryExtrasSave','adminTheoryAudioUpload','adminTheoryFlashcardsImport'].indexOf(p.action)<0)return null;
  try{
    if(p.action==='adminTheoryFlashcardsImport')return teImport_(p);
    if(p.action==='adminTheoryExtrasSave')return teSave_(p);
    if(p.action==='adminTheoryAudioUpload')return teUpload_(p);
    var admin=p.action==='adminTheoryExtrasList';if(admin)teAdmin_(p);
    var id=teLecture_(p.lectureId,admin),items=teLatest_(id);
    if(!admin)items=items.filter(function(x){return !x.hidden;});
    return {ok:true,version:1,items:items};
  }catch(e){return {ok:false,error:String(e.message||e)};}
}
