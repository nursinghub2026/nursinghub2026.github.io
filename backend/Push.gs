/**
 * Push.gs — إشعارات الويب عبر Firebase Cloud Messaging (المرحلة 3)
 * ملف جديد إضافي بالكامل — لا يغيّر أي منطق موجود.
 * التخزين: تبويب جديد PushTokens في نفس شيت قاعدة البيانات.
 * الإرسال: FCM HTTP v1 باستخدام Service Account محفوظ في Script Properties باسم FCM_SA (JSON).
 *   لو FCM_SA مش موجود، الطلبات تنجح وتسجّل الإشعار في سجل PushLog من غير إرسال فعلي (configured=false).
 */

const PUSH_DB_ID = '1L4iUQxEwJrQn4jcNc0pV0I56PS2SZK36HTh46FZY_go';
const PUSH_TOKENS_SHEET = 'PushTokens';
const PUSH_LOG_SHEET = 'PushLog';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

function pushSs_() { return SpreadsheetApp.openById(PUSH_DB_ID); }

function pushTokensSheet_() {
  const ss = pushSs_();
  let sh = ss.getSheetByName(PUSH_TOKENS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PUSH_TOKENS_SHEET);
    sh.appendRow(['username', 'token', 'platform', 'updatedAt']);
  }
  return sh;
}

function pushLogSheet_() {
  const ss = pushSs_();
  let sh = ss.getSheetByName(PUSH_LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PUSH_LOG_SHEET);
    sh.appendRow(['ts', 'audience', 'title', 'body', 'sent', 'failed', 'configured']);
  }
  return sh;
}

/* حفظ/تحديث توكن جهاز طالب */
function stuPushToken_(req) {
  const s = stuAuth_(req); // بيرمي خطأ لو الجلسة مش صالحة
  const t = String(req.pushToken || '').trim();
  if (!t) return { ok: false, error: 'التوكن ناقص' };
  const sh = pushTokensSheet_();
  const rows = sh.getDataRange().getValues();
  const now = new Date();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][1]) === t) {
      sh.getRange(i + 1, 1, 1, 4).setValues([[s.o.username, t, String(req.platform || 'web'), now]]);
      return { ok: true };
    }
  }
  sh.appendRow([s.o.username, t, String(req.platform || 'web'), now]);
  return { ok: true };
}

/* قائمة الأجهزة المسجلة للوحة الإدارة */
function adminPushList_(req) {
  stuRequireAdmin_(req);
  const rows = pushTokensSheet_().getDataRange().getValues();
  const users = {};
  let total = 0;
  for (let i = 1; i < rows.length; i++) {
    if (!String(rows[i][1] || '').trim()) continue;
    total++;
    users[String(rows[i][0])] = true;
  }
  return { ok: true, total, users: Object.keys(users).sort(), configured: !!fcmSa_() };
}

/* إرسال إشعار: لكل الطلبة أو لطالب واحد */
function adminPushSend_(req) {
  stuRequireAdmin_(req);
  const title = String(req.title || '').trim().slice(0, 80);
  const body = String(req.body || '').trim().slice(0, 240);
  const username = String(req.username || '').trim();
  if (!title || !body) return { ok: false, error: 'العنوان والنص مطلوبين' };
  const rows = pushTokensSheet_().getDataRange().getValues();
  const targets = [];
  for (let i = 1; i < rows.length; i++) {
    const un = String(rows[i][0] || ''), tk = String(rows[i][1] || '');
    if (!tk) continue;
    if (username && un !== username) continue;
    targets.push(tk);
  }
  if (!targets.length) return { ok: false, error: username ? 'مفيش جهاز مسجل للطالب ده' : 'مفيش أجهزة مسجلة لسه' };
  const res = fcmSendToTokens_(targets, title, body, { url: 'index.html', banner: ['lecture','quiz','reply','motivation','none'].indexOf(req.banner) >= 0 ? req.banner : 'lecture' });
  pushLogSheet_().appendRow([new Date(), username || 'ALL', title, body, res.sent, res.failed, res.configured]);
  return { ok: true, sent: res.sent, failed: res.failed, configured: res.configured };
}

/* إشعار تلقائي لطالب واحد (بيستدعى من ردود الإدارة في الشات) */
function pushToUser_(username, title, body) {
  try {
    const rows = pushTokensSheet_().getDataRange().getValues();
    const targets = [];
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === username && String(rows[i][1] || '')) targets.push(String(rows[i][1]));
    }
    if (!targets.length) return { sent: 0, failed: 0, configured: false };
    return fcmSendToTokens_(targets, title, body, { url: 'chat.html' });
  } catch (e) { return { sent: 0, failed: 0, configured: false }; }
}

/* ===== FCM HTTP v1 ===== */

function fcmSa_() {
  try {
    const raw = PropertiesService.getScriptProperties().getProperty('FCM_SA');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function fcmAccessToken_(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: FCM_SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  const b64 = (o) => Utilities.base64EncodeWebSafe(JSON.stringify(o)).replace(/=+$/, '');
  const toSign = b64(header) + '.' + b64(claim);
  const sig = Utilities.computeRsaSha256Signature(toSign, sa.private_key);
  const jwt = toSign + '.' + Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '');
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + encodeURIComponent(jwt),
    muteHttpExceptions: true
  });
  const j = JSON.parse(r.getContentText());
  if (!j.access_token) throw new Error('FCM auth failed');
  return j.access_token;
}

function fcmSendToTokens_(tokens, title, body, data) {
  const sa = fcmSa_();
  if (!sa) return { sent: 0, failed: 0, configured: false };
  let sent = 0, failed = 0;
  let bearer = null;
  const url = 'https://fcm.googleapis.com/v1/projects/' + sa.project_id + '/messages:send';
  tokens.forEach((tk) => {
    try {
      if (!bearer) bearer = fcmAccessToken_(sa);
      const noticeKind = data && ['lecture','quiz','reply','motivation','none'].indexOf(data.banner) >= 0 ? data.banner : /chat/.test(String(data && data.url)) ? 'reply' : /كويز|اختبار/.test(title) ? 'quiz' : /محاضرة/.test(title) ? 'lecture' : 'motivation';
      const noticeTitle = /^FOUNDATIONS/.test(title) ? title : 'FOUNDATIONS • ' + title;
      const msg = {
        message: {
          token: tk,
          notification: { title: noticeTitle, body },
          webpush: {
            notification: { title: noticeTitle, body, icon: 'https://nursinghub2026.github.io/icon.png', badge: 'https://nursinghub2026.github.io/notification-badge.png', dir: 'rtl', lang: 'ar', vibrate: [120, 60, 120], tag: String((data && data.tag) || 'nph-' + Date.now()), renotify: true, data: { url: (data && data.url) || 'index.html' } },
            fcm_options: { link: 'https://nursinghub2026.github.io/' + ((data && data.url) || 'index.html') }
          },
          data: data ? Object.keys(data).reduce((m, k) => { m[k] = String(data[k]); return m; }, {}) : {}
        }
      };
      if (noticeKind !== 'none') msg.message.webpush.notification.image = 'https://nursinghub2026.github.io/notification-images/' + noticeKind + '.png';
      const r = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + bearer },
        payload: JSON.stringify(msg),
        muteHttpExceptions: true
      });
      const code = r.getResponseCode();
      if (code >= 200 && code < 300) sent++;
      else {
        failed++;
        // توكن ميت → امسحه
        const txt = r.getContentText();
        if (code === 404 || /UNREGISTERED|NOT_FOUND/.test(txt)) pushRemoveToken_(tk);
      }
    } catch (e) { failed++; }
  });
  return { sent, failed, configured: true };
}

function pushRemoveToken_(tk) {
  const sh = pushTokensSheet_();
  const rows = sh.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][1]) === tk) sh.deleteRow(i + 1);
  }
}
