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
    Object.keys(def.cats).forEach(function (k) { if (!cfg.cats || !cfg.cats[k]) { cfg.cats = cfg.cats || {}; cfg.cats[k] = def.cats[k]; } });
    if (typeof cfg.enabled !== 'boolean') cfg.enabled = false;
    if (typeof cfg.testMode !== 'boolean') cfg.testMode = true;
    return cfg;
  } catch (e) { return autoDefaultCfg_(); }
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
  var items = AUTO_CONTENT[cat];
  if (!items || !items.length) return { sent: 0, error: 'no content' };
  var ptr = (st.ptr[cat] || 0) % items.length;
  var item = items[ptr];
  var targets = autoTargets_(cfg.testMode);
  if (!targets.length) return { sent: 0, noTargets: true };
  var banner = AUTO_BANNERS[cat] || 'motivation';
  var res = fcmSendToTokens_(targets, item.t, String(item.b).slice(0, 240), {
    imageUrl: 'https://nursinghub2026.github.io/notification-images/' + banner + '.png',
    url: 'adhkar.html',
    banner: banner
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
    if (now - last < AUTO_MIN_GAP_MIN * 60000) return;
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
  return { ok: true, cfg: autoCfg_(), state: autoState_(), triggerInstalled: !!autoFindTrigger_(), testUser: AUTO_TEST_USER, window: autoWindow_(), now: autoNowHHMM_() };
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
  var st = autoState_();
  var r = autoSendCat_(cat, { testMode: true }, st);
  autoProps_().setProperty(AUTO_STATE_KEY, JSON.stringify(st));
  return { ok: true, result: r };
}
