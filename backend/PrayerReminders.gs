/**
 * PrayerReminders.gs — تذكير بمواقيت الصلاة لطلبة بورسعيد (وحدة إضافية بالكامل).
 * لا تغيّر أي مسار موجود. التوجيه عبر سطرين في خريطة routeStudents_ (موثق في README).
 *
 * الأمان:
 * - الوضع الافتراضي: enabled=false و testMode=true — لا يصل أي شيء للطلبة
 *   حتى يفعّل الأدمن المفتاح العام بنفسه، وطالما testMode=true كل الإرسال
 *   (المجدول والتجريبي) يذهب لحساب الأدمن فقط (PRAYER_TEST_USER ثابت هنا).
 * - منع التكرار: آخر صلاة مُرسلة محفوظة في Script Properties.
 * - المواقيت: دار الإفتاء المصرية (مصدر أساسي، يتحدّث يوميًا) مع الرجوع التلقائي
 *   إلى Aladhan API المجاني (طريقة الهيئة المصرية العامة للمساحة، method=5)،
 *   يُخزَّن يوميًا؛ عند تعذر المصدرين تُستخدم آخر مواقيت محفوظة.
 */
var PRAYER_KEYS_ = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
var PRAYER_NAMES_ = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
var PRAYER_TEST_USER = 'abdelrhman.wae1'; // حساب الأدمن — وجهة كل الاختبارات، لا تُقبل من العميل
var PRAYER_API_ = 'https://api.aladhan.com/v1/timingsByCity?city=Port%20Said&country=Egypt&method=5';
var PRAYER_API_DARALIFTA_ = 'https://www.dar-alifta.org/ar/Prayer/GetPrayer?town=' + encodeURIComponent('بورسعيد');

function prayerProps_() { return PropertiesService.getScriptProperties(); }

function prayerCfg_() {
  try {
    var raw = prayerProps_().getProperty('PRAYER_CFG');
    var c = raw ? JSON.parse(raw) : {};
    var prayers = {};
    PRAYER_KEYS_.forEach(function (k) { prayers[k] = !(c.prayers && c.prayers[k] === false); });
    return { enabled: c.enabled === true, testMode: c.testMode !== false, prayers: prayers };
  } catch (e) {
    return { enabled: false, testMode: true, prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true } };
  }
}

/* مواقيت اليوم بتوقيت القاهرة، مع تخزين يومي واستخدام المخزن عند تعذر الشبكة */
function prayerTimes_() {
  var today = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd');
  try {
    var cached = JSON.parse(prayerProps_().getProperty('PRAYER_TIMES') || 'null');
    if (cached && cached.date === today && cached.times) return cached.times;
  } catch (e) {}
  var times = prayerTimesDarAlIfta_() || prayerTimesAladhan_();
  if (times) {
    prayerProps_().setProperty('PRAYER_TIMES', JSON.stringify({ date: today, times: times }));
    return times;
  }
  try {
    var old = JSON.parse(prayerProps_().getProperty('PRAYER_TIMES') || 'null');
    if (old && old.times) return old.times;
  } catch (e2) {}
  return null;
}

/* المصدر الأساسي: دار الإفتاء المصرية — صف HTML لبورسعيد فيه صف اليوم بمعرفات ثابتة */
function prayerTimesDarAlIfta_() {
  try {
    var res = UrlFetchApp.fetch(PRAYER_API_DARALIFTA_ + '&t=' + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('bad response');
    var html = res.getContentText();
    var ids = { Fajr: 'fajrpartial', Dhuhr: 'dhuhrpartial', Asr: 'asrpartial', Maghrib: 'maghribpartial', Isha: 'ishapartial' };
    var times = {};
    var ok = true;
    PRAYER_KEYS_.forEach(function (k) {
      var m = html.match(new RegExp('id="' + ids[k] + '"[^>]*>\\s*(\\d{1,2}):(\\d{2})\\s*([صم])'));
      if (!m) { ok = false; return; }
      var h = parseInt(m[1], 10);
      /* الموقع يوسم الظهر بـ «م» رغم أنه قبل الظهر: الظهر يبقى كما هو، والباقي «م» تعني مساءً */
      if (m[3] === 'م' && k !== 'Dhuhr' && h < 12) h += 12;
      times[k] = (h < 10 ? '0' : '') + h + ':' + m[2];
    });
    if (!ok) throw new Error('parse failed');
    return times;
  } catch (e) { return null; }
}

/* الرجوع التلقائي: Aladhan API المجاني (هيئة المساحة المصرية، method=5) */
function prayerTimesAladhan_() {
  try {
    var res = UrlFetchApp.fetch(PRAYER_API_ + '&t=' + Date.now(), { muteHttpExceptions: true });
    var data = JSON.parse(res.getContentText());
    if (res.getResponseCode() !== 200 || !data.data || !data.data.timings) throw new Error('bad response');
    var times = {};
    PRAYER_KEYS_.forEach(function (k) { times[k] = String(data.data.timings[k]).slice(0, 5); });
    return times;
  } catch (e) { return null; }
}

function prayerSend_(title, body, onlyTestUser, imageKey) {
  if (typeof fcmSendToTokens_ !== 'function') return { sent: 0, failed: 0, configured: false };
  var rows = pushTokensSheet_().getDataRange().getValues();
  var targets = [];
  for (var i = 1; i < rows.length; i++) {
    var un = String(rows[i][0] || ''), tk = String(rows[i][1] || '');
    if (!tk) continue;
    if (onlyTestUser && un !== PRAYER_TEST_USER) continue;
    targets.push(tk);
  }
  /* يظهر التذكير كمان في جرس الإشعارات داخل الموقع — بديل مضمون للطلبة اللي لسه مفعّلوش الإشعارات */
  if (typeof inboxAppend_ === 'function') inboxAppend_(onlyTestUser ? PRAYER_TEST_USER : '', title, body, 'adhkar.html');
  if (!targets.length) return { sent: 0, failed: 0, configured: true, noTargets: true };
  var img = imageKey ? ('https://nursinghub2026.github.io/notification-images/prayer-' + imageKey + '.png') : '';
  return fcmSendToTokens_(targets, title, body, { url: 'adhkar.html', banner: 'motivation', tag: 'prayer', imageUrl: img });
}

/* ينفَّذ من مشغّل زمني كل 5 دقائق. لا يرسل للطلبة إلا بالمفتاح العام وخارج وضع التجربة */
function prayerTick_() {
  var cfg = prayerCfg_();
  if (!cfg.enabled) return { ok: true, skipped: 'disabled' };
  var times = prayerTimes_();
  if (!times) return { ok: false, error: 'المواقيت غير متاحة' };
  var now = Utilities.formatDate(new Date(), 'Africa/Cairo', 'HH:mm');
  var today = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd');
  var lastSent = prayerProps_().getProperty('PRAYER_LAST') || '';
  for (var i = 0; i < PRAYER_KEYS_.length; i++) {
    var k = PRAYER_KEYS_[i];
    if (!cfg.prayers[k] || times[k] !== now) continue;
    if (lastSent === today + ':' + k) return { ok: true, skipped: 'duplicate' };
    var title = 'حان الآن وقت صلاة ' + PRAYER_NAMES_[k] + ' 🕌';
    var body = 'بتوقيت بورسعيد (' + times[k] + '). تقبّل الله طاعتكم 🤍';
    var r = prayerSend_(title, body, cfg.testMode, k.toLowerCase());
    prayerProps_().setProperty('PRAYER_LAST', today + ':' + k);
    return { ok: true, prayer: k, sent: r.sent, failed: r.failed, testMode: cfg.testMode };
  }
  return { ok: true, skipped: 'no-prayer-now' };
}

/* إعداد لمرة واحدة من المحرر: ينشئ المشغّل الزمني (كل 5 دقائق) بعد الموافقة على النشر */
function prayerInstallTrigger_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'prayerTick_') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('prayerTick_').timeBased().everyMinutes(5).create();
  return { ok: true };
}

/* ===== مسارات الإدارة (قراءة/ضبط/تجربة) ===== */

function adminPrayerGet_(req) {
  stuRequireAdmin_(req);
  var cfg = prayerCfg_();
  var times = prayerTimes_();
  return { ok: true, enabled: cfg.enabled, testMode: cfg.testMode, prayers: cfg.prayers, times: times, testUser: PRAYER_TEST_USER };
}

function adminPrayerSet_(req) {
  stuRequireAdmin_(req);
  var cfg = prayerCfg_();
  if (typeof req.enabled === 'boolean') cfg.enabled = req.enabled;
  if (typeof req.testMode === 'boolean') cfg.testMode = req.testMode;
  if (req.prayers && typeof req.prayers === 'object') {
    PRAYER_KEYS_.forEach(function (k) { if (typeof req.prayers[k] === 'boolean') cfg.prayers[k] = req.prayers[k]; });
  }
  prayerProps_().setProperty('PRAYER_CFG', JSON.stringify(cfg));
  return { ok: true, enabled: cfg.enabled, testMode: cfg.testMode, prayers: cfg.prayers };
}

/* تجربة فورية: تصل لحساب الأدمن فقط دائمًا، مهما كان وضع التشغيل */
function adminPrayerTest_(req) {
  stuRequireAdmin_(req);
  var k = PRAYER_KEYS_.indexOf(req.prayer) >= 0 ? req.prayer : 'Dhuhr';
  var times = prayerTimes_() || {};
  var title = 'حان الآن وقت صلاة ' + PRAYER_NAMES_[k] + ' 🕌';
  var body = 'بتوقيت بورسعيد (' + (times[k] || '--:--') + '). تقبّل الله طاعتكم 🤍 — رسالة تجريبية';
  var r = prayerSend_(title, body, true, k.toLowerCase());
  return { ok: true, sent: r.sent, failed: r.failed, noTargets: r.noTargets === true };
}
