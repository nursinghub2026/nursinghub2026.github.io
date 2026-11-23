/* Optional image hosting, add-only assets. Secrets stay in Script Properties.
 * CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 * No unsigned preset, no client-side key, no existing asset overwrite.
 */
function pushImageConfigured_() {
  const p=PropertiesService.getScriptProperties();
  return ['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'].every(k=>!!p.getProperty(k));
}
function pushUploadImage_(base64) {
  if(!pushImageConfigured_()) throw new Error('استضافة الصور المخصصة لسه مش متظبطة، اختار صورة جاهزة مؤقتًا');
  const raw=String(base64||'');
  if(raw.length>1000000 || !/^[A-Za-z0-9+/]+=*$/.test(raw))throw new Error('صورة الإشعار غير صالحة أو كبيرة');
  const bytes=Utilities.base64Decode(raw);
  if(bytes.length<24 || bytes.slice(0,8).map(b=>(b+256)%256).join(',')!=='137,80,78,71,13,10,26,10')throw new Error('الصورة لازم تكون PNG');
  const num=(i)=>{let n=0;for(let j=0;j<4;j++)n=n*256+(bytes[i+j]+256)%256;return n;};
  if(num(16)!==1200 || num(20)!==600)throw new Error('مقاس الصورة لازم يكون 1200×600');
  const p=PropertiesService.getScriptProperties(),cloud=p.getProperty('CLOUDINARY_CLOUD_NAME');
  if(!/^[a-z0-9_-]+$/.test(cloud))throw new Error('إعداد استضافة الصور غير صالح');
  const timestamp=String(Math.floor(Date.now()/1000));
  const publicId='foundations-notices/'+Utilities.getUuid();
  const sign='overwrite=false&public_id='+publicId+'&timestamp='+timestamp+p.getProperty('CLOUDINARY_API_SECRET');
  const signature=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1,sign).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
  const res=UrlFetchApp.fetch('https://api.cloudinary.com/v1_1/'+cloud+'/image/upload',{method:'post',payload:{file:Utilities.newBlob(bytes,'image/png','notice.png'),api_key:p.getProperty('CLOUDINARY_API_KEY'),timestamp,public_id:publicId,overwrite:'false',signature},muteHttpExceptions:true});
  let result;try{result=JSON.parse(res.getContentText())}catch(e){throw new Error('استضافة الصورة لم ترجع نتيجة صالحة، لم يتم إرسال الإشعار')}
  if(res.getResponseCode()!==200 || !result.secure_url || result.public_id!==publicId || !String(result.secure_url).startsWith('https://res.cloudinary.com/'+cloud+'/image/upload/'))throw new Error('رفع الصورة فشل، لم يتم إرسال الإشعار');
  return result.secure_url;
}
