/* ===================== notification-inbox.js — جرس الإشعارات داخل الموقع =====================
   صندوق إشعارات للطالب: جرس في الشريط العلوي بشارة غير المقروء، لوحة تعرض
   إشعارات الإدارة (الأحدث أولًا)، حالة قراءة لكل طالب. يشتغل فقط لو الطالب
   مسجل دخوله. لا يغيّر أي ملف موجود — بيضيف الجرس جوّه الـ nav الحالي.
*/
(function () {
  if (!window.fetch) return;
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = 'notification-inbox.css';
  document.head.appendChild(css);

  const INBOX_API_ = (typeof API !== 'undefined') ? API :  null;
  const state = { items: [], unread: 0, open: false, loaded: false, busy: false };

  function auth() {
    try { const a = JSON.parse(localStorage.getItem('NPH_AUTH_V1') || 'null'); return a && a.token ? a : null; }
    catch (e) { return null; }
  }
  async function call(action, p) {
    const r = await fetch(INBOX_API_, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ action: action }, p || {}))
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || 'حصل خطأ');
    return d;
  }
  function ago(t) {
    const d = new Date(t); if (isNaN(d)) return '';
    const m = Math.floor((Date.now() - d) / 60000);
    if (m < 1) return 'الآن';
    if (m < 60) return 'منذ ' + m + ' دقيقة';
    const hr = Math.floor(m / 60);
    if (hr < 24) return 'منذ ' + hr + ' ساعة';
    const dy = Math.floor(hr / 24);
    if (dy < 30) return 'منذ ' + dy + ' يوم';
    return d.toLocaleDateString('ar-EG');
  }
  function h(t, a) {
    const e = document.createElement(t);
    if (a) for (const k in a) {
      const v = a[k]; if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on') e[k] = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i]; if (c == null || c === false) continue;
      if (Array.isArray(c)) { c.forEach(x => { if (x != null) e.appendChild(x.nodeType ? x : document.createTextNode(String(x))) }); continue; }
      e.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  }

  /* ---------- العناصر ---------- */
  const badge = h('span', { class: 'inbox-badge', hidden: true });
  const bell = h('button', { class: 'inbox-bell', type: 'button', 'aria-label': 'الإشعارات', hidden: true },
    h('i', { class: 'fa-solid fa-bell' }), badge);
  const list = h('div', { class: 'inbox-list' });
  const panel = h('div', { class: 'inbox-panel', role: 'dialog', 'aria-label': 'الإشعارات', hidden: true },
    h('div', { class: 'inbox-head' },
      h('div', { class: 'inbox-title' }, h('i', { class: 'fa-solid fa-bell' }), ' الإشعارات'),
      h('button', { class: 'inbox-all', type: 'button', onclick: markAll }, 'قرأت الكل')),
    list,
    h('div', { class: 'inbox-foot' }, 'إشعارات الإدارة تظهر هنا أول بأول'));
  const scrim = h('div', { class: 'inbox-scrim', hidden: true, onclick: () => setOpen(false) });

  function paintBadge() {
    if (state.unread > 0) {
      badge.hidden = false;
      badge.textContent = state.unread > 9 ? '9+' : String(state.unread);
    } else badge.hidden = true;
  }

  function paintList() {
    list.innerHTML = '';
    if (!state.loaded) { list.appendChild(h('div', { class: 'inbox-empty' }, 'جاري التحميل…')); return; }
    if (!state.items.length) {
      list.appendChild(h('div', { class: 'inbox-empty' },
        h('i', { class: 'fa-regular fa-bell-slash' }), h('p', null, 'مفيش إشعارات لسه'), h('small', null, 'أول ما الإدارة تبعت حاجة هتلاقيها هنا')));
      return;
    }
    state.items.forEach(x => {
      list.appendChild(h('button', { class: 'inbox-item' + (x.read ? '' : ' unread'), type: 'button', onclick: () => openItem(x) },
        h('span', { class: 'inbox-dot', 'aria-hidden': 'true' }),
        h('span', { class: 'inbox-body' },
          h('b', null, x.title),
          h('span', { class: 'inbox-text' }, x.body),
          h('small', null, ago(x.ts)))));
    });
  }

  /* ---------- البيانات ---------- */
  async function refresh() {
    const a = auth(); if (!a || !INBOX_API_) return;
    if (state.busy) return; state.busy = true;
    try {
      const d = await call('stuInboxList', { token: a.token });
      state.items = d.items || []; state.unread = d.unread || 0; state.loaded = true;
      paintBadge(); paintList();
    } catch (e) { state.loaded = true; list.innerHTML = ''; list.appendChild(h('div', { class: 'inbox-empty' }, 'تعذر تحميل الإشعارات')); }
    state.busy = false;
  }
  async function markIds(ids) {
    const a = auth(); if (!a) return;
    try {
      const d = await call('stuInboxRead', { token: a.token, ids: ids });
      state.unread = d.unread;
      const set = {}; (Array.isArray(ids) ? ids : state.items.map(x => x.id)).forEach(id => set[id] = true);
      state.items.forEach(x => { if (ids === 'all' || set[x.id]) x.read = true; });
      paintBadge(); paintList();
    } catch (e) {}
  }
  function markAll() { if (state.unread > 0) markIds('all'); }
  function openItem(x) {
    if (!x.read) { x.read = true; state.unread = Math.max(0, state.unread - 1); paintBadge(); paintList(); markIds([x.id]); }
    if (x.url) { setOpen(false); location.href = x.url; }
  }

  /* ---------- الفتح والقفل ---------- */
  function setOpen(o) {
    state.open = o;
    panel.hidden = !o; scrim.hidden = !o;
    bell.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o && !state.loaded) paintList();
    if (o) refresh();
  }
  bell.onclick = e => { e.stopPropagation(); setOpen(!state.open); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.open) setOpen(false); });

  /* ---------- التركيب داخل الـ nav الحالي ---------- */
  function mount() {
    const side = document.querySelector('.nav-side.ns-r');
    if (!side) return false;
    if (!bell.isConnected) side.prepend(bell);
    if (!panel.isConnected) { document.body.appendChild(panel); document.body.appendChild(scrim); }
    return true;
  }
  function syncVisibility() {
    const logged = !!auth();
    bell.hidden = !logged;
    if (!logged) setOpen(false);
    if (logged && !state.loaded) refresh();
  }
  function boot() {
    if (!mount()) { setTimeout(boot, 250); return; }
    syncVisibility();
    setInterval(() => { if (auth() && !document.hidden) refresh(); }, 3 * 60 * 1000);
    window.addEventListener('storage', syncVisibility);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  else setTimeout(boot, 0);
})();
