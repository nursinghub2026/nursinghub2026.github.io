const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

function pngSize(file) {
  const b = fs.readFileSync(path.join(root, file));
  assert.deepStrictEqual([...b.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], file + ' is not a PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

const PRAYER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const CATS = ['salawat', 'hadith', 'dua', 'encouragement'];

test('five prayer images and four category images exist at 1200x600', () => {
  for (const k of PRAYER) {
    const { w, h } = pngSize(`notification-images/prayer-${k}.png`);
    assert.strictEqual(w, 1200); assert.strictEqual(h, 600);
  }
  for (const c of CATS) {
    const { w, h } = pngSize(`notification-images/${c}.png`);
    assert.strictEqual(w, 1200); assert.strictEqual(h, 600);
  }
});

test('Push.gs accepts the new banner kinds in both whitelists', () => {
  const s = read('backend/Push.gs');
  const matches = s.match(/\['lecture','quiz','reply','motivation','salawat','hadith','dua','encouragement','none'\]/g) || [];
  assert.strictEqual(matches.length, 2, 'both the send validation and the kind resolution lists carry the new kinds');
});

test('prayer reminders pass a per-prayer hosted image', () => {
  const s = read('backend/PrayerReminders.gs');
  assert.ok(s.includes("notification-images/prayer-' + imageKey + '.png"), 'image URL built per prayer key');
  assert.ok(s.includes('prayerSend_(title, body, cfg.testMode, k.toLowerCase(), prayerImg_(cfg, k))'), 'tick passes the prayer key with its resolved image');
  assert.ok(s.includes('prayerSend_(title, body, true, k.toLowerCase(), prayerImg_(prayerCfg_(), k))'), 'admin test passes the prayer key with its resolved image');
  assert.ok(s.includes("notification-images/prayer-' + k.toLowerCase() + '.png"), 'default resolves to the per-prayer hosted image');
  assert.ok(s.includes("banner: 'motivation'"), 'motivation stays as fallback banner');
});

test('every prayer key has a matching image file', () => {
  const s = read('backend/PrayerReminders.gs');
  const m = s.match(/PRAYER_KEYS_\s*=\s*\[([^\]]+)\]/);
  assert.ok(m, 'PRAYER_KEYS_ found');
  for (const k of PRAYER) assert.ok(m[1].includes("'" + k[0].toUpperCase() + k.slice(1) + "'"), 'key present: ' + k);
});

test('admin composer offers the new kinds and the library presets pick them', () => {
  const admin = read('admin.html');
  for (const c of CATS) assert.ok(admin.includes(`<option value="${c}">`), 'select option: ' + c);
  assert.ok(admin.includes('if(c.banner){$("pushBanner").value=c.banner;'), 'library insert sets the banner');
  const lib = read('content-library.js');
  const expected = { 'صلاة على النبي ﷺ': 'salawat', 'أحاديث صحيحة': 'hadith', 'أدعية': 'dua', 'جمل تشجيعية': 'encouragement', 'تحفيز مذاكرة': 'motivation' };
  for (const [cat, banner] of Object.entries(expected)) {
    const i = lib.indexOf("{ cat: '" + cat + "'");
    assert.ok(i > -1, 'category present: ' + cat);
    assert.ok(lib.slice(i, i + 120).includes(`banner: '${banner}'`), cat + ' maps to ' + banner);
  }
});

test('existing banner kinds and images are untouched', () => {
  for (const k of ['lecture', 'quiz', 'reply', 'motivation']) pngSize(`notification-images/${k}.png`);
});
