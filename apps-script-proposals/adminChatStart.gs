/**
 * مقترح غير مفعّل — NOT ACTIVE / REVIEW ONLY.
 * هذا الملف ليس جزءًا من الموقع المنشور، ودمج الـ PR وحده لا يفعّل أي شيء.
 * التفعيل يتطلب ٣ خطوات يدوية منفصلة من مالك المشروع بعد الموافقة:
 *   1) انسخ دالة adminChatStart_ أدناه داخل Students.gs في مشروع Apps Script،
 *      مباشرة بعد دالة adminChatSend_ الموجودة.
 *   2) أضف السطر التالي في خريطة routeStudents_ بجانب adminChats:
 *        adminChatStart: adminChatStart_,
 *   3) انشر «الإصدار الجديد» من إدارة عمليات النشر.
 * بدون هذه الخطوات يبقى زر «مراسلة» في لوحة الأدمن يفتح المحادثات الموجودة فقط.
 * السلوك: لا يرسل أي إشعار أو رسالة للطالب؛ أول رسالة تُرسل بـ adminChatSend_
 * كالمعتاد وهي وحدها التي تُشعِر الطالب. لا يغيّر أي دالة قائمة (add-only).
 */

/* فتح محادثة مع طالب من لوحة الأدمن: يرجّع أحدث محادثة موجودة أو ينشئ واحدة فاضية. */
function adminChatStart_(p) {
  stuRequireAdmin_(p);
  var username = String(p.username || '').trim();
  if (!STU_USER_RE.test(username)) return stuErr_('اسم المستخدم مش صح.');
  var sh = stuSheet_(STU_SESS_TAB, STU_SESS_HEADERS);
  var found = stuChatLatest_(sh, username);
  if (found) return { ok: true, sessionId: found.sid, existing: true };
  var stuSh = stuSheet_(STU_TAB, STU_HEADERS);
  var stuRow = stuFindRow_(stuSh, 0, username);
  if (stuRow < 0) return stuErr_('الطالب مش مسجل.');
  var name = String(stuReadRow_(stuSh, stuRow).name || '').slice(0, 60);
  var sid = Utilities.getUuid();
  var now = new Date().toISOString();
  sh.appendRow([sid, username, name, now, now, 0, '', 0]);
  stuLog_(username, 'admin_chat_start', 'by ' + (p.adminName || 'admin'));
  return { ok: true, sessionId: sid, existing: false };
}
