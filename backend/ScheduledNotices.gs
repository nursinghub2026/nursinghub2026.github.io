/**
 * ScheduledNotices.gs — تذكيرات ومواعيد أسبوعية يكتبها الأدمن بنفسه (وحدة إضافية بالكامل).
 * لا تغيّر أي مسار أو بيانات موجودة. التوجيه عبر أسطر typeof-guarded في خريطة routeStudents_.
 *
 * الفكرة: الأدمن يكتب تذكيرًا (عنوان/نص/صورة/جمهور/وقت إرسال)، ويظهر للطلبة
 * إشعارًا في جرس الصندوق + push في وقته. تذكيرات أسبوعية متكررة (مثل: كويز كل خميس)
 * أو مواعيد امتحانات لمرة واحدة.
 *
 * التخزين (append-only بالكامل، لا حذف ولا تعديل لأي صف):
 * - ScheduledNotices:  [id, createdAt, createdBy, title, body, url, banner, username, sendAt, weekly]
 *                      username فارغ = كل الطلبة. weekly=true يتكرر أسبوعيًا في نفس اليوم والساعة.
 * - ScheduledSends:    [id, noticeId, sentAt, sent, failed]  سجل إرسالات؛ وجود صف لـ noticeId
 *                      بنفس sendAt المجدول يعني أنه أُرسل (dedupe).
 * - ScheduledCancels:  [id, noticeId, canceledAt]  إلغاء = صف جديد هنا، لا تعديل في الأصل.
 *
 * الإرسال الفعلي متوقف افتراضيًا (SCHED_CFG.enabled=false) حتى يفعّله الأدمن بنفسه
 * من لوحة الإدارة (adminSchedSet_) — موافقته الصريحة هي مفتاح التشغيل.
 */
var SCHED_DB_ID = '1L4iUQxEwJrQn4jcNc0pV0I56PS2SZK36HTh46FZY_go';
var SCHED_SHEET = 'ScheduledNotices';
var SCHED_SENDS_SHEET = 'ScheduledSends';
var SCHED_CANCELS_SHEET = 'ScheduledCancels';
var SCHED_BANNERS = ['lecture', 'quiz', 'reply', 'motivation', 'salawat', 'hadith', 'dua', 'encouragement', 'none'];

function schedSheet_(name, header) {
  var ss = SpreadsheetApp.openById(SCHED_DB_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); }
  return sh;
}

function schedCfg_() {
  var raw = PropertiesService.getScriptProperties().getProperty('SCHED_CFG');
  var cfg = {};
  try { cfg = raw ? JSON.parse(raw) : {}; } catch (e) { cfg = {}; }
  return { enabled: cfg.enabled === true };
}

function schedRows_() {
  return schedSheet_(SCHED_SHEET, ['id', 'createdAt', 'createdBy', 'title', 'body', 'url', 'banner', 'username', 'sendAt', 'weekly']).getDataRange().getValues();
}

function schedCanceledIds_() {
  var rows = schedSheet_(SCHED_CANCELS_SHEET, ['id', 'noticeId', 'canceledAt']).getDataRange().getValues();
  var m = {};
  for (var i = 1; i < rows.length; i++) m[String(rows[i][1])] = true;
  return m;
}

function schedSentKeys_() {
  var rows = schedSheet_(SCHED_SENDS_SHEET, ['id', 'noticeId', 'sentAt', 'sent', 'failed']).getDataRange().getValues();
  var m = {};
  for (var i = 1; i < rows.length; i++) m[String(rows[i][1]) + '|' + String(rows[i][2])] = true;
  return m;
}

function schedToJson_(r, canceled, sentKeys) {
  var id = String(r[0]);
  var sendAt = String(r[8]);
  return {
    id: id, title: String(r[3]), body: String(r[4]), url: String(r[5] || ''),
    banner: String(r[6] || 'motivation'), username: String(r[7] || ''),
    sendAt: sendAt, weekly: r[9] === true || String(r[9]) === 'true',
    canceled: canceled[id] === true,
    sent: sentKeys[id + '|' + sendAt] === true
  };
}

/* إضافة تذكير (أدمن). sendAt بتوقيت القاهرة بصيغة ISO أو 'yyyy-MM-dd HH:mm'. */
function adminSchedAdd_(req) {
  stuRequireAdmin_(req);
  var title = String(req.title || '').trim().slice(0, 80);
  var body = String(req.body || '').trim().slice(0, 240);
  var username = String(req.username || '').trim();
  var sendAt = schedNormalizeTime_(req.sendAt);
  if (!title || !body) return { ok: false, error: 'العنوان والنص مطلوبين' };
  if (!sendAt) return { ok: false, error: 'وقت الإرسال مش مفهوم' };
  var banner = SCHED_BANNERS.indexOf(req.banner) >= 0 ? req.banner : 'motivation';
  var url = (/^(index\.html|Lectures\.html|Lecture\.html\?id=[a-zA-Z0-9%_-]+|adhkar\.html)$/.test(String(req.url || '')) ? String(req.url) : 'index.html');
  var id = Utilities.getUuid();
  schedSheet_(SCHED_SHEET, ['id', 'createdAt', 'createdBy', 'title', 'body', 'url', 'banner', 'username', 'sendAt', 'weekly'])
    .appendRow([id, new Date().toISOString(), 'admin', title, body, url, banner, username, sendAt, req.weekly === true || String(req.weekly) === 'true']);
  return { ok: true, id: id, sendAt: sendAt, enabled: schedCfg_().enabled };
}

/* قائمة التذكيرات (أدمن): الأحدث أولًا، مع حالة الإلغاء/الإرسال */
function adminSchedList_(req) {
  stuRequireAdmin_(req);
  var rows = schedRows_();
  var canceled = schedCanceledIds_();
  var sentKeys = schedSentKeys_();
  var items = [];
  for (var i = rows.length - 1; i >= 1 && items.length < 50; i--) items.push(schedToJson_(rows[i], canceled, sentKeys));
  return { ok: true, items: items, enabled: schedCfg_().enabled };
}

/* إلغاء تذكير (أدمن): صف جديد في ScheduledCancels، لا تعديل في الأصل */
function adminSchedCancel_(req) {
  stuRequireAdmin_(req);
  var id = String(req.id || '');
  if (!id) return { ok: false, error: 'المعرّف ناقص' };
  var rows = schedRows_();
  var found = false;
  for (var i = 1; i < rows.length; i++) if (String(rows[i][0]) === id) { found = true; break; }
  if (!found) return { ok: false, error: 'التذكير مش موجود' };
  if (schedCanceledIds_()[id]) return { ok: true, already: true };
  schedSheet_(SCHED_CANCELS_SHEET, ['id', 'noticeId', 'canceledAt']).appendRow([Utilities.getUuid(), id, new Date().toISOString()]);
  return { ok: true };
}

/* مفتاح التشغيل: لا إرسال للطلبة إلا بعد تفعيل الأدمن بنفسه */
function adminSchedSet_(req) {
  stuRequireAdmin_(req);
  var cfg = { enabled: req.enabled === true || String(req.enabled) === 'true' };
  PropertiesService.getScriptProperties().setProperty('SCHED_CFG', JSON.stringify(cfg));
  return { ok: true, enabled: cfg.enabled };
}

/* تطبيع وقت الإرسال إلى 'yyyy-MM-dd HH:mm' بتوقيت القاهرة */
function schedNormalizeTime_(v) {
  var s = String(v || '').trim();
  if (!s) return '';
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return '';
  return m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5];
}

/* إرسال واحد: push عبر القناة الموجودة + تسجيل في صندوق الإشعارات */
function schedDeliver_(username, title, body, url, banner) {
  var res = { sent: 0, failed: 0, configured: false };
  if (typeof fcmSendToTokens_ === 'function') {
    var rows = pushTokensSheet_().getDataRange().getValues();
    var targets = [];
    for (var i = 1; i < rows.length; i++) {
      var un = String(rows[i][0] || ''), tk = String(rows[i][1] || '');
      if (!tk) continue;
      if (username && un !== username) continue;
      targets.push(tk);
    }
    if (targets.length) res = fcmSendToTokens_(targets, title, body, { url: url, banner: banner, tag: 'sched' });
    else res = { sent: 0, failed: 0, configured: true, noTargets: true };
  }
  if (typeof inboxAppend_ === 'function') inboxAppend_(username, title, body, url);
  return res;
}

/* ينفَّذ من مشغّل زمني كل 5 دقائق. لا يرسل شيئًا والمفتاح مقفول */
function schedTick_() {
  if (!schedCfg_().enabled) return { ok: true, skipped: 'disabled' };
  if (typeof fcmSendToTokens_ !== 'function') return { ok: false, error: 'قناة الإرسال غير متاحة' };
  var now = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HH:mm');
  var cutoff = Utilities.formatDate(new Date(Date.now() - 864e5), 'Africa/Cairo', 'yyyy-MM-dd HH:mm');
  var rows = schedRows_();
  var canceled = schedCanceledIds_();
  var sentKeys = schedSentKeys_();
  var done = [];
  for (var i = 1; i < rows.length; i++) {
    var n = schedToJson_(rows[i], canceled, sentKeys);
    if (n.canceled) continue;
    var occ = n.sendAt;
    while (occ && occ <= now) {
      if (occ < cutoff) { occ = n.weekly ? schedAdvanceWeek_(occ) : ''; continue; }
      if (!sentKeys[n.id + '|' + occ]) {
        var r = schedDeliver_(n.username, n.title, n.body, n.url, n.banner);
        schedSheet_(SCHED_SENDS_SHEET, ['id', 'noticeId', 'sentAt', 'sent', 'failed'])
          .appendRow([Utilities.getUuid(), n.id, occ, r.sent || 0, r.failed || 0]);
        sentKeys[n.id + '|' + occ] = true;
        done.push(n.id + '@' + occ);
      }
      if (!n.weekly) break;
      occ = schedAdvanceWeek_(occ);
    }
  }
  /* المناسبات الأقدم من يوم تُتخطّى ولا تُرسل متأخرًا (لا رسائل مكدّسة عند التفعيل) */
  return { ok: true, delivered: done.length };
}

function schedAdvanceWeek_(sendAt) {
  var m = sendAt.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!m) return sendAt;
  var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + 7 * 864e5);
  var p = function (x) { return (x < 10 ? '0' : '') + x; };
  return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate()) + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
}

/* إعداد لمرة واحدة من المحرر بعد الموافقة على النشر: مشغّل كل 5 دقائق */
function schedInstallTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'schedTick_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('schedTick_').timeBased().everyMinutes(5).create();
  return { ok: true };
}
