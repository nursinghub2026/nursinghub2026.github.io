/* New sheets only. Source module, NOT activated. Invoke routeCommunity_(req)
 * inside the existing doPost lock before the old admin password gate.
 * Requires db(), ADMIN_PASSWORD, STU_SHEET_ID and STU_TAB from existing app.
 */
var CP_TABS_={posts:['CommunityPostsV1',['id','json']],comments:['CommunityCommentsV1',['id','json']],reactions:['CommunityReactionsV1',['id','json']]};
var CP_EMOJI_=['❤️','👍','👏','💡','🎉'];
var CP_FONTS_=['default','serif','bold'];
function cpText_(v,max,needed){if(typeof v!=='string'||v.length>max||(needed&&!v.trim()))throw new Error('النص ناقص أو أطول من المسموح');return v.trim();}
function cpAdmin_(p){if(String(p.password||'')!==ADMIN_PASSWORD)throw new Error('غير مصرح');}
function cpRead_(kind){var sh=db().getSheetByName(CP_TABS_[kind][0]);if(!sh||sh.getLastRow()<2)return [];return sh.getRange(2,1,sh.getLastRow()-1,2).getValues().map(function(r){try{return JSON.parse(r[1]);}catch(e){return null;}}).filter(Boolean);}
function cpLatest_(kind){var map={};cpRead_(kind).forEach(function(x){map[x.id]=x;});return Object.keys(map).map(function(k){return map[k];});}
function cpAppend_(kind,x){var conf=CP_TABS_[kind],sh=db().getSheetByName(conf[0]);if(!sh){sh=db().insertSheet(conf[0]);sh.appendRow(conf[1]);sh.setFrozenRows(1);}sh.appendRow([x.id,JSON.stringify(x)]);}
function cpStudent_(p){
  var token=cpText_(p.token,300,true),sh=SpreadsheetApp.openById(STU_SHEET_ID).getSheetByName(STU_TAB);
  if(!sh||sh.getLastRow()<2)throw new Error('سجل دخولك الأول');
  var rows=sh.getDataRange().getValues(),head=rows.shift(),r=rows.filter(function(x){return String(x[head.indexOf('token')])===token;})[0];
  if(!r||r[head.indexOf('status')]!=='active'||!(new Date(r[head.indexOf('tokenExp')]).getTime()>Date.now()))throw new Error('جلستك خلصت. سجل دخولك من جديد');
  // Internal username never leaves responses, only the chosen public display name.
  return {username:String(r[head.indexOf('username')]),name:String(r[head.indexOf('name')]||'طالب').slice(0,100)};
}
function cpRate_(rows,username,seconds,dailyMax){var own=rows.filter(function(x){return x.username===username;}).sort(function(a,b){return b.at.localeCompare(a.at);}),now=Date.now();if(own.length&&now-new Date(own[0].at).getTime()<seconds*1000)throw new Error('استنى شوية قبل المحاولة التالية');if(own.filter(function(x){return now-new Date(x.at).getTime()<86400000;}).length>=dailyMax)throw new Error('وصلت للحد اليومي. ارجع بكرة');}
function cpPost_(id){id=cpText_(id,100,true);var x=cpLatest_('posts').filter(function(y){return y.id===id;})[0];if(!x||x.hidden)throw new Error('المنشور غير متاح');return x;}
function cpStyle_(s){s=s||{};var bg=String(s.bg||'#102c42'),color=String(s.color||'#ffffff'),size=Number(s.size)||24,font=String(s.font||'default');if(!/^#[0-9a-fA-F]{6}$/.test(bg)||!/^#[0-9a-fA-F]{6}$/.test(color)||CP_FONTS_.indexOf(font)<0||[18,24,30].indexOf(size)<0)throw new Error('تنسيق غير صالح');return {bg:bg,color:color,size:size,font:font};}
function cpImage_(v){if(!v)return '';v=cpText_(v,1800,true);if(!/^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/image\/upload\/[A-Za-z0-9_.,!\/~%+\-]+\.(png|jpg|jpeg|webp)$/.test(v))throw new Error('استخدم رابط صورة Cloudinary مباشر PNG/JPG/WebP');return v;}
function cpRoute_(p){
  var admin=/^admin/.test(p.action);if(admin)cpAdmin_(p);
  if(p.action==='adminCommunitySave'){
    var all=cpLatest_('posts'),old=p.id?all.filter(function(x){return x.id===p.id;})[0]:null;
    if(p.id&&!old)throw new Error('المنشور مش موجود');if(!old&&all.length>=1000)throw new Error('وصلت لحد المنشورات');
    var x={id:old?old.id:Utilities.getUuid(),text:cpText_(p.text,4000,true),style:cpStyle_(p.style),imageUrl:cpImage_(p.imageUrl),hidden:p.hidden===true,at:old?old.at:new Date().toISOString(),updatedAt:new Date().toISOString()};cpAppend_('posts',x);return {ok:true,id:x.id};
  }
  if(p.action==='adminCommunityModerate'){
    var comment=cpLatest_('comments').filter(function(x){return x.id===p.commentId;})[0];if(!comment)throw new Error('التعليق مش موجود');
    comment.hidden=p.hidden!==false;comment.moderatedAt=new Date().toISOString();cpAppend_('comments',comment);return {ok:true};
  }
  if(p.action==='communityComment'||p.action==='communityReact'){
    var u=cpStudent_(p),post=cpPost_(p.postId);
    if(p.action==='communityComment'){
      cpRate_(cpRead_('comments'),u.username,15,60);
      if(cpLatest_('comments').filter(function(c){return c.postId===post.id&&!c.hidden;}).length>=1000)throw new Error('تعليقات المنشور اكتملت');
      var c={id:Utilities.getUuid(),postId:post.id,username:u.username,name:u.name,text:cpText_(p.text,600,true),at:new Date().toISOString(),hidden:false};cpAppend_('comments',c);return {ok:true};
    }
    if(CP_EMOJI_.indexOf(p.emoji)<0)throw new Error('ريأكت غير صالح');cpRate_(cpRead_('reactions'),u.username,2,300);
    var id=Utilities.base64EncodeWebSafe(u.username+'|'+post.id),last=cpLatest_('reactions').filter(function(x){return x.id===id;})[0];
    cpAppend_('reactions',{id:id,postId:post.id,username:u.username,emoji:last&&last.emoji===p.emoji?'':p.emoji,at:new Date().toISOString()});return {ok:true};
  }
  if(p.action==='communityList'||p.action==='adminCommunityList'){
    var posts=cpLatest_('posts').filter(function(x){return admin||!x.hidden;}).sort(function(a,b){return b.at.localeCompare(a.at);}),count=posts.length;
    // Cursor uses a known post ID, no arbitrary offset or query construction.
    if(p.before){var i=posts.findIndex(function(x){return x.id===p.before;});if(i<0)throw new Error('مؤشر غير صالح');posts=posts.slice(i+1);}
    var more=posts.length>10;posts=posts.slice(0,10);var comments=cpLatest_('comments'),reactions=cpLatest_('reactions'),me=null;
    if(p.token){try{me=cpStudent_(p);}catch(e){}}
    var safe=posts.map(function(x){var cs=comments.filter(function(c){return c.postId===x.id&&(admin||!c.hidden);}).sort(function(a,b){return a.at.localeCompare(b.at);}),counts={};CP_EMOJI_.forEach(function(e){counts[e]=0;});var my='';reactions.filter(function(r){return r.postId===x.id&&CP_EMOJI_.indexOf(r.emoji)>=0;}).forEach(function(r){counts[r.emoji]++;if(me&&r.username===me.username)my=r.emoji;});
      return {id:x.id,text:x.text,style:x.style,imageUrl:x.imageUrl||'',at:x.at,hidden:x.hidden,counts:counts,myReaction:my,commentCount:cs.length,comments:(admin?cs:cs.slice(-50)).map(function(c){return {id:c.id,name:c.name,text:c.hidden?'تعليق محذوف بواسطة الإدارة':c.text,at:c.at,hidden:c.hidden};})};});
    return {ok:true,version:1,posts:safe,more:more,next:more&&posts.length?posts[posts.length-1].id:null,total:count};
  }
  throw new Error('عملية غير معروفة');
}
function routeCommunity_(p){if(['communityList','communityComment','communityReact','adminCommunityList','adminCommunitySave','adminCommunityModerate'].indexOf(p.action)<0)return null;try{return cpRoute_(p);}catch(e){return {ok:false,error:String(e.message||e)};}}
