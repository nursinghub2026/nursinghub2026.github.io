/**
 * NotificationInbox.gs — صندوق إشعارات داخل الموقع (وحدة إضافية بالكامل).
 * لا تغيّر أي مسار موجود. التوجيه عبر سطرين في خريطة routeStudents_ (موثق في README).
 *
 * الفكرة: كل إشعار يبعته الأدمن من المؤلّف (adminPushSend_) يسجَّل هنا أيضًا،
 * فيقدر الطالب يرجع له من جرس الإشعارات داخل الموقع مع شارة غير المقروء.
 *
 * التخزين (إضافي فقط، لا حذف ولا تعديل):
 * - InboxNotifications: [id, ts, username, title, body, url] — username فارغ يعني لكل الطلبة.
 * - InboxReads: [username, id, ts] — سجل قراءة لكل طالب.
 */
var INBOX_DB_ID = '1L4iUQxEwJrQn4jcNc0pV0I56PS2SZK36HTh46FZY_go';
var INBOX_SHEET = 'InboxNotifications';
var INBOX_READS_SHEET = 'InboxReads';
var INBOX_LIMIT = 50;

function inboxSheet_(name, header) {
  var ss = SpreadsheetApp.openById(INBOX_DB_ID);
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); }
  return sh;
}

/* تسجيل إشعار مرسل من المؤلّف. username='' يعني لكل الطلبة */
function inboxAppend_(username, title, body, url) {
  try {
    inboxSheet_(INBOX_SHEET, ['id', 'ts', 'username', 'title', 'body', 'url'])
      .appendRow([Utilities.getUuid(), new Date().toISOString(), String(username || ''), String(title || '').slice(0, 80), String(body || '').slice(0, 240), String(url || '')]);
  } catch (e) { /* تسجيل الصندوق لا يوقف الإرسال */ }
}

function inboxUserReads_(username) {
  var rows = inboxSheet_(INBOX_READS_SHEET, ['username', 'id', 'ts']).getDataRange().getValues();
  var read = {};
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === username) read[String(rows[i][1])] = true;
  }
  return read;
}

/* قائمة إشعارات الطالب: العامة + الموجهة له، الأحدث أولًا، مع حالة القراءة */
function stuInboxList_(req) {
  var s = stuAuth_(req);
  var username = s.o.username;
  var rows = inboxSheet_(INBOX_SHEET, ['id', 'ts', 'username', 'title', 'body', 'url']).getDataRange().getValues();
  var read = inboxUserReads_(username);
  var items = [];
  for (var i = rows.length - 1; i >= 1 && items.length < INBOX_LIMIT; i--) {
    var target = String(rows[i][2] || '');
    if (target && target !== username) continue;
    var id = String(rows[i][0]);
    items.push({ id: id, ts: String(rows[i][1]), title: String(rows[i][3]), body: String(rows[i][4]), url: String(rows[i][5] || ''), read: read[id] === true });
  }
  var unread = 0;
  items.forEach(function (x) { if (!x.read) unread++; });
  return { ok: true, items: items, unread: unread };
}

/* تعليم إشعارات كمقروءة. req.ids: مصفوفة معرفات، أو 'all' */
function stuInboxRead_(req) {
  var s = stuAuth_(req);
  var username = s.o.username;
  var sh = inboxSheet_(INBOX_READS_SHEET, ['username', 'id', 'ts']);
  var read = inboxUserReads_(username);
  var list = stuInboxList_(req).items;
  var valid = {};
  list.forEach(function (x) { valid[x.id] = true; });
  var ids = req.ids === 'all' ? list.map(function (x) { return x.id; }) : (Array.isArray(req.ids) ? req.ids : []);
  var now = new Date().toISOString();
  var added = 0;
  ids.forEach(function (id) {
    id = String(id);
    if (!valid[id] || read[id]) return;
    sh.appendRow([username, id, now]);
    added++;
  });
  var unread = 0;
  list.forEach(function (x) { if (!x.read && ids.indexOf(x.id) < 0 && req.ids !== 'all') unread++; });
  return { ok: true, marked: added, unread: unread };
}
