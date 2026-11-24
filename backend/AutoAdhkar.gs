/**
 * AutoAdhkar.gs — تذكيرات تلقائية مجدولة (أذكار الصباح/المساء، صلاة على النبي، حديث، دعاء، تشجيع)
 * ملف جديد إضافي بالكامل — لا يغيّر أي منطق موجود.
 *
 * الأمان:
 * - كل حاجة مقفولة افتراضيًا: enabled=false و testMode=true (يرسل لحساب الأدمن فقط).
 * - لا يصل أي إشعار تلقائي للطلبة إلا بعد ما الأدمن يفعّل الفئة ويطفي وضع الاختبار بنفسه.
 * - الإرسال بين الفجر والعشاء فقط (من مواقيت اليوم المخزنة من PrayerReminders، أو نافذة احتياطية ثابتة).
 * - تدوير بلا تكرار: مؤشر لكل فئة محفوظ، لا يعيد العنصر إلا بعد استنفاد كل عناصر الفئة.
 * - كل إرسال يصل كمان لجرس الإشعارات داخل الموقع (inbox) كبديل مضمون.
 *
 * التشغيل: أضف الملف، ثم 3 أسطر توجيه في routeStudents_ (انظر backend/README.md)، ثم انشر نسخة جديدة.
 * التفعيل من لوحة الإدارة (adminAutoSet) هو اللي ينصّب المؤقّت الزمني (كل 30 دقيقة)؛ التعطيل يحذفه.
 */

var AUTO_CFG_KEY = 'AUTO_ADHKAR_CFG_V1';
var AUTO_STATE_KEY = 'AUTO_ADHKAR_STATE_V1';
var AUTO_TEST_USER = 'abdelrhman.wae1';
var AUTO_TRIGGER_HANDLER = 'autoAdhkarTick_';
var AUTO_MIN_GAP_MIN = 90; // أقل فاصل بين إشعارين من نفس الفئة

var AUTO_CONTENT = {
  morning: [
    { t: 'أذكار الصباح', b: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ' },
    { t: 'أذكار الصباح', b: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ' },
    { t: 'سيد الاستغفار', b: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ... فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ' },
    { t: 'أذكار الصباح', b: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا (٣ مرات)' },
    { t: 'أذكار الصباح', b: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ (٣ مرات)' },
    { t: 'أذكار الصباح', b: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ (٣ مرات)' }
  ],
  evening: [
    { t: 'أذكار المساء', b: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ' },
    { t: 'أذكار المساء', b: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ' },
    { t: 'أذكار المساء', b: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ (٣ مرات)' },
    { t: 'أذكار المساء', b: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ (١٠ مرات)' }
  ],
  salawat: [
    { t: 'صلوا على النبي ﷺ', b: 'اللهم صلِّ وسلم وبارك على سيدنا محمد وعلى آله وصحبه أجمعين' },
    { t: 'الصلاة الإبراهيمية', b: 'اللهم صلِّ على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد' },
    { t: 'فضل الصلاة على النبي ﷺ', b: 'قال رسول الله ﷺ: «من صلى عليّ صلاة واحدة صلى الله عليه بها عشرًا» (رواه مسلم). اللهم صلِّ وسلم على نبينا محمد ﷺ' },
    { t: 'يوم الجمعة', b: 'قال رسول الله ﷺ: «إن من أفضل أيامكم يوم الجمعة، فأكثروا عليّ من الصلاة فيه، فإن صلاتكم معروضة عليّ» (رواه أبو داود وصححه الألباني)' }
  ],
  hadith: [
    { t: 'إنما الأعمال بالنيات', b: 'قال رسول الله ﷺ: «إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى» (متفق عليه). ابدأ مذاكرتك النهارده بنية صادقة' },
    { t: 'طريق الجنة', b: 'قال رسول الله ﷺ: «من سلك طريقًا يلتمس فيه علمًا سهّل الله له به طريقًا إلى الجنة» (رواه مسلم)' },
    { t: 'خيركم من تعلم القرآن وعلّمه', b: 'قال رسول الله ﷺ: «خيركم من تعلم القرآن وعلّمه» (رواه البخاري)' },
    { t: 'طلب العلم فريضة', b: 'قال رسول الله ﷺ: «طلب العلم فريضة على كل مسلم» (رواه ابن ماجه وصححه الألباني)' },
    { t: 'الكلمة الطيبة صدقة', b: 'قال رسول الله ﷺ: «والكلمة الطيبة صدقة» (متفق عليه). كلمة حلوة منك ممكن تفرح حد النهارده' },
    { t: 'حب لأخيك ما تحب لنفسك', b: 'قال رسول الله ﷺ: «لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه» (متفق عليه)' },
    { t: 'المسلم من سلم المسلمون', b: 'قال رسول الله ﷺ: «المسلم من سلم المسلمون من لسانه ويده» (متفق عليه)' },
    { t: 'فضل الذكر', b: 'قال رسول الله ﷺ: «مثل الذي يذكر ربه والذي لا يذكر ربه مثل الحي والميت» (رواه البخاري)' },
    { t: 'سبحان الله وبحمده', b: 'قال رسول الله ﷺ: «من قال سبحان الله وبحمده في يوم مائة مرة حُطَّت خطاياه وإن كانت مثل زبد البحر» (متفق عليه)' }
  ],
  dua: [
    { t: 'دعاء التيسير', b: 'اللهم لا سهل إلا ما جعلته سهلًا، وأنت تجعل الحزن إذا شئت سهلًا' },
    { t: 'دعاء موسى عليه السلام', b: 'رَبِّ اشْرَحْ لِي صَدْرِي * وَيَسِّرْ لِي أَمْرِي (سورة طه ٢٥-٢٦)' },
    { t: 'دعاء زيادة العلم', b: 'اللهم انفعني بما علمتني، وعلمني ما ينفعني، وزدني علمًا (رواه الترمذي وقال حسن صحيح)' },
    { t: 'دعاء العافية', b: 'اللهم إني أسألك العفو والعافية في الدنيا والآخرة (رواه ابن ماجه وصححه الألباني)' },
    { t: 'دعاء ذي النون', b: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ (سورة الأنبياء ٨٧)' }
  ],
  encouragement: [
    { t: 'إنت قدها', b: 'التفوق مش موهبة.. التفوق عادة يومية. خطوة النهارده أهم من خطة بكرة، ابدأ ولو صفحة واحدة' },
    { t: 'افتكر هدفك', b: 'كل يوم مذاكرة بيقرّبك من حلمك. افتكر ليه بدأت.. وكمّل يا بطل' },
    { t: 'فخورين بيكم', b: 'شغلكم ومثابرتكم على المنصة واضحة.. استمروا، المجهود ده بيتحسب' }
  ]
};

var AUTO_BANNERS = {
  morning: 'dua', evening: 'dua', // لافتات مخصصة للأذكار جاية في PR الصور
  salawat: 'salawat', hadith: 'hadith', dua: 'dua', encouragement: 'encouragement'
};

/* صور مسموح بها لكل فئة: default=لافتة الفئة، none=بدون صورة، custom=صورة مرفوعة على الاستضافة المجانية */
var AUTO_BANNER_IDS = ['default', 'none', 'lecture', 'quiz', 'reply', 'motivation', 'salawat', 'hadith', 'dua', 'encouragement', 'custom'];

function autoProps_() { return PropertiesService.getScriptProperties(); }

function autoDefaultCfg_() {
  return {
    enabled: false,
    testMode: true,
    cats: {
      morning: { on: false, perDay: 1 },
      evening: { on: false, perDay: 1 },
      salawat: { on: false, perDay: 3 },
      hadith: { on: false, perDay: 1 },
      dua: { on: false, perDay: 1 },
      encouragement: { on: false, perDay: 1 }
    }
  };
}

function autoCfg_() {
  try {
    var raw = autoProps_().getProperty(AUTO_CFG_KEY);
    if (!raw) return autoDefaultCfg_();
    var cfg = JSON.parse(raw);
    var def = autoDefaultCfg_();
    Object.keys(def.cats).forEach(function (k) {
      if (!cfg.cats || !cfg.cats[k]) { cfg.cats = cfg.cats || {}; cfg.cats[k] = def.cats[k]; }
      var c = cfg.cats[k];
      if (typeof c.banner !== 'string' || AUTO_BANNER_IDS.indexOf(c.banner) < 0) c.banner = 'default';
      if (typeof c.customImage !== 'string' || !/^https:\/\/res\.cloudinary\.com\//.test(c.customImage)) c.customImage = '';
      c.gapMin = Math.max(30, Math.min(720, parseInt(c.gapMin, 10) || AUTO_MIN_GAP_MIN));
    });
    if (typeof cfg.enabled !== 'boolean') cfg.enabled = false;
    if (typeof cfg.testMode !== 'boolean') cfg.testMode = true;
    return cfg;
  } catch (e) { return autoDefaultCfg_(); }
}

/* ==== محتوى الفئات القابل للتعديل (ورقة AutoContent الجديدة — تُنشأ عند أول حفظ فقط) ==== */

function autoContentSheet_(create) {
  var ss = pushSs_();
  var sh = ss.getSheetByName('AutoContent');
  if (!sh && create) {
    sh = ss.insertSheet('AutoContent');
    sh.appendRow(['cat', 'title', 'body']);
  }
  return sh;
}

/* عناصر الفئة الفعلية: تعديلات الأدمن إن وُجدت، وإلا المكتبة المدمجة */
function autoItems_(cat) {
  try {
    var sh = autoContentSheet_(false);
    if (sh) {
      var rows = sh.getDataRange().getValues(), out = [];
      for (var i = 1; i < rows.length && out.length < 30; i++) {
        if (String(rows[i][0]) === cat && String(rows[i][1] || '') && String(rows[i][2] || '')) {
          out.push({ t: String(rows[i][1]).slice(0, 80), b: String(rows[i][2]).slice(0, 240) });
        }
      }
      if (out.length) return out;
    }
  } catch (e) {}
  return AUTO_CONTENT[cat] || [];
}

function autoHasCustom_(cat) {
  try {
    var sh = autoContentSheet_(false);
    if (!sh) return false;
    var rows = sh.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) if (String(rows[i][0]) === cat) return true;
  } catch (e) {}
  return false;
}

/* استبدال عناصر فئة بالكامل داخل ورقة AutoContent فقط — لا يمس أي ورقة أخرى */
function autoContentWrite_(cat, items) {
  var sh = autoContentSheet_(true);
  var rows = sh.getDataRange().getValues();
  for (var i = rows.length - 1; i >= 1; i--) if (String(rows[i][0]) === cat) sh.deleteRow(i + 1);
  (items || []).forEach(function (it) { sh.appendRow([cat, it.t, it.b]); });
}

/* صورة الفئة الفعلية: default→لافتة الفئة، none→بدون، جاهزة→ملف الموقع، custom→رابط الاستضافة */
function autoCatImage_(catCfg, cat) {
  var b = (catCfg && catCfg.banner) || 'default';
  if (b === 'default') b = AUTO_BANNERS[cat] || 'motivation';
  if (b === 'custom') {
    var u = (catCfg && catCfg.customImage) || '';
    return /^https:\/\/res\.cloudinary\.com\//.test(u) ? { url: u, banner: 'motivation' } : { url: '', banner: 'none' };
  }
  if (b === 'none') return { url: '', banner: 'none' };
  if (AUTO_BANNER_IDS.indexOf(b) < 0) b = AUTO_BANNERS[cat] || 'motivation';
  return { url: 'https://nursinghub2026.github.io/notification-images/' + b + '.png', banner: b };
}

function autoState_() {
  var today = autoTodayStr_();
  try {
    var raw = autoProps_().getProperty(AUTO_STATE_KEY);
    var st = raw ? JSON.parse(raw) : null;
    if (!st || st.date !== today) st = { date: today, counts: {}, lastAt: {}, ptr: (st && st.ptr) || {} };
    return st;
  } catch (e) { return { date: today, counts: {}, lastAt: {}, ptr: {} }; }
}

function autoTz_() { try { return Session.getScriptTimeZone() || 'Africa/Cairo'; } catch (e) { return 'Africa/Cairo'; } }
function autoNowHHMM_() { return Utilities.formatDate(new Date(), autoTz_(), 'HH:mm'); }
function autoTodayStr_() { return Utilities.formatDate(new Date(), autoTz_(), 'yyyy-MM-dd'); }
function autoMin_(hhmm) { var p = String(hhmm || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); }

/* نافذة الإرسال: من الفجر للعشاء — من مواقيت اليوم اللي بيخزنها PrayerReminders، أو احتياطي ثابت */
function autoWindow_() {
  var fallback = { fajr: 5 * 60, dhuhr: 12 * 60, asr: 15 * 60 + 30, isha: 20 * 60 };
  try {
    var old = JSON.parse(autoProps_().getProperty('PRAYER_TIMES') || 'null');
    if (old && old.times && old.date === autoTodayStr_()) {
      return {
        fajr: autoMin_(old.times.Fajr),
        dhuhr: autoMin_(old.times.Dhuhr),
        asr: autoMin_(old.times.Asr),
        isha: autoMin_(old.times.Isha) + 30 // سماحية نص ساعة بعد الأذان
      };
    }
  } catch (e) {}
  return fallback;
}

/* هل الفئة داخل فترتها دلوقتي؟ الصباح: الفجر→الظهر، المساء: العصر→العشاء، الباقي: الفجر→العشاء */
function autoCatInWindow_(cat, nowMin, w) {
  if (nowMin < w.fajr || nowMin > w.isha) return false;
  if (cat === 'morning') return nowMin <= w.dhuhr;
  if (cat === 'evening') return nowMin >= w.asr;
  return true;
}

function autoTargets_(testMode) {
  var rows = pushTokensSheet_().getDataRange().getValues();
  var targets = [];
  for (var i = 1; i < rows.length; i++) {
    var un = String(rows[i][0] || ''), tk = String(rows[i][1] || '');
    if (!tk) continue;
    if (testMode && un !== AUTO_TEST_USER) continue;
    targets.push(tk);
  }
  return targets;
}

function autoSendCat_(cat, cfg, st) {
  var items = autoItems_(cat);
  if (!items || !items.length) return { sent: 0, error: 'no content' };
  var ptr = (st.ptr[cat] || 0) % items.length;
  var item = items[ptr];
  var targets = autoTargets_(cfg.testMode);
  if (!targets.length) return { sent: 0, noTargets: true };
  var img = autoCatImage_(cfg.cats && cfg.cats[cat], cat);
  var res = fcmSendToTokens_(targets, item.t, String(item.b).slice(0, 240), {
    imageUrl: img.url,
    url: 'adhkar.html',
    banner: img.banner
  });
  if (typeof inboxAppend_ === 'function') inboxAppend_(cfg.testMode ? AUTO_TEST_USER : '', item.t, String(item.b).slice(0, 240), 'adhkar.html');
  st.ptr[cat] = (ptr + 1) % items.length;
  return res;
}

/* المؤقّت الزمني بينادي دي كل 30 دقيقة */
function autoAdhkarTick_() {
  var cfg = autoCfg_();
  if (!cfg.enabled) return { ok: true, skipped: 'disabled' };
  var w = autoWindow_();
  var nowMin = autoMin_(autoNowHHMM_());
  if (nowMin < w.fajr || nowMin > w.isha) return { ok: true, skipped: 'quiet-hours' };
  var st = autoState_();
  var now = Date.now();
  var results = {};
  Object.keys(cfg.cats).forEach(function (cat) {
    var c = cfg.cats[cat];
    if (!c || !c.on) return;
    var count = st.counts[cat] || 0;
    if (count >= Math.max(1, Math.min(5, c.perDay || 1))) return;
    if (!autoCatInWindow_(cat, nowMin, w)) return;
    var last = st.lastAt[cat] || 0;
    var gap = Math.max(30, Math.min(720, parseInt(c.gapMin, 10) || AUTO_MIN_GAP_MIN));
    if (now - last < gap * 60000) return;
    var r = autoSendCat_(cat, cfg, st);
    if (r && (r.sent > 0 || r.noTargets)) {
      st.counts[cat] = count + 1;
      st.lastAt[cat] = now;
    }
    results[cat] = r;
  });
  autoProps_().setProperty(AUTO_STATE_KEY, JSON.stringify(st));
  return { ok: true, results: results };
}

function autoFindTrigger_() {
  var trg = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trg.length; i++) if (trg[i].getHandlerFunction() === AUTO_TRIGGER_HANDLER) return trg[i];
  return null;
}

/* ==== لوحة الإدارة ==== */

function adminAutoGet_(req) {
  stuRequireAdmin_(req);
  return { ok: true, cfg: autoCfg_(), state: autoState_(), triggerInstalled: !!autoFindTrigger_(), testUser: AUTO_TEST_USER, window: autoWindow_(), now: autoNowHHMM_(), imageHosting: (typeof pushImageConfigured_ === 'function') ? pushImageConfigured_() : false };
}

function adminAutoSet_(req) {
  stuRequireAdmin_(req);
  var cfg = autoCfg_();
  if (typeof req.enabled === 'boolean') cfg.enabled = req.enabled;
  if (typeof req.testMode === 'boolean') cfg.testMode = req.testMode;
  if (req.cats && typeof req.cats === 'object') {
    Object.keys(cfg.cats).forEach(function (k) {
      var c = req.cats[k];
      if (!c) return;
      if (typeof c.on === 'boolean') cfg.cats[k].on = c.on;
      if (c.perDay) cfg.cats[k].perDay = Math.max(1, Math.min(5, parseInt(c.perDay, 10) || 1));
      if (typeof c.banner === 'string' && AUTO_BANNER_IDS.indexOf(c.banner) >= 0 && (c.banner !== 'custom' || cfg.cats[k].customImage)) cfg.cats[k].banner = c.banner;
      if (c.gapMin) cfg.cats[k].gapMin = Math.max(30, Math.min(720, parseInt(c.gapMin, 10) || AUTO_MIN_GAP_MIN));
    });
  }
  autoProps_().setProperty(AUTO_CFG_KEY, JSON.stringify(cfg));
  var trg = autoFindTrigger_();
  if (cfg.enabled && !trg) {
    ScriptApp.newTrigger(AUTO_TRIGGER_HANDLER).timeBased().everyMinutes(30).create();
  } else if (!cfg.enabled && trg) {
    ScriptApp.deleteTrigger(trg);
  }
  return { ok: true, cfg: cfg, triggerInstalled: !!autoFindTrigger_() };
}

/* إرسال تجريبي فوري لفئة واحدة — دايمًا لحساب الأدمن فقط */
function adminAutoTest_(req) {
  stuRequireAdmin_(req);
  var cat = String(req.cat || '');
  if (!AUTO_CONTENT[cat]) return { ok: false, error: 'فئة غير معروفة' };
  var cfg = autoCfg_();
  cfg.testMode = true;
  var st = autoState_();
  var r = autoSendCat_(cat, cfg, st);
  autoProps_().setProperty(AUTO_STATE_KEY, JSON.stringify(st));
  return { ok: true, result: r };
}

/* تعديل نصوص فئة: get (الفعلية + الافتراضية) / set (استبدال كامل بعد تحقق) / reset (رجوع للمكتبة) */
function adminAutoContent_(req) {
  stuRequireAdmin_(req);
  var cat = String(req.cat || '');
  if (!AUTO_CONTENT[cat]) return { ok: false, error: 'فئة غير معروفة' };
  var act = String(req.contentAction || 'get');
  if (act === 'get') {
    return { ok: true, cat: cat, items: autoItems_(cat), defaults: AUTO_CONTENT[cat], custom: autoHasCustom_(cat) };
  }
  if (act === 'reset') {
    autoContentWrite_(cat, null);
    return { ok: true, items: AUTO_CONTENT[cat], custom: false };
  }
  if (act === 'set') {
    var items = Array.isArray(req.items) ? req.items : [];
    var clean = [];
    for (var i = 0; i < items.length && clean.length < 30; i++) {
      var t = String((items[i] && items[i].t) || '').trim().slice(0, 80);
      var b = String((items[i] && items[i].b) || '').trim().slice(0, 240);
      if (t && b) clean.push({ t: t, b: b });
    }
    if (!clean.length) return { ok: false, error: 'أضف عنصرًا واحدًا على الأقل بعنوان ونص' };
    autoContentWrite_(cat, clean);
    return { ok: true, items: clean, custom: true };
  }
  return { ok: false, error: 'إجراء غير معروف' }
}

/* رفع صورة مخصصة لفئة (نفس مسار الاستضافة المجانية بتاع المؤلف) أو إزالتها */
function adminAutoImage_(req) {
  stuRequireAdmin_(req);
  var cat = String(req.cat || '');
  if (!AUTO_CONTENT[cat]) return { ok: false, error: 'فئة غير معروفة' };
  var cfg = autoCfg_();
  if (req.imagePng) {
    if (typeof pushUploadImage_ !== 'function') return { ok: false, error: 'رفع الصور غير متاح حاليًا' };
    var url = pushUploadImage_(String(req.imagePng)); // يرمي خطأ عربي واضح عند صورة غير صالحة
    if (!/^https:\/\/res\.cloudinary\.com\//.test(url)) return { ok: false, error: 'فشل رفع الصورة' };
    cfg.cats[cat].customImage = url;
    cfg.cats[cat].banner = 'custom';
  } else {
    cfg.cats[cat].customImage = '';
    if (cfg.cats[cat].banner === 'custom') cfg.cats[cat].banner = 'default';
  }
  autoProps_().setProperty(AUTO_CFG_KEY, JSON.stringify(cfg));
  return { ok: true, cfg: cfg };
}
