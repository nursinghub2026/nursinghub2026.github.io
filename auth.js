/* ===================== auth.js — حسابات الطلبة والمزامنة =====================
   تسجيل دخول/حساب جديد + مزامنة التقدّم مع قاعدة البيانات.
   يعتمد على API (nav.js) وNPH (progress.js). بيانات الجلسة في localStorage
   باسم NPH_AUTH_V1: {token, username, name}. لو الجلسة اتلغت من الأدمن،
   المزامنة الجاية هترجّع للشاشة اللي قبلها برسالة واضحة.
*/
(function () {
  const KEY = "NPH_AUTH_V1";
  let A = null;
  try { const r = localStorage.getItem(KEY); if (r) A = JSON.parse(r); } catch (e) {}

  function saveA() {
    try { if (A) localStorage.setItem(KEY, JSON.stringify(A)); else localStorage.removeItem(KEY); } catch (e) {}
  }
  function isLoggedIn() { return !!(A && A.token); }
  function user() { return A ? { username: A.username, name: A.name } : null; }

  async function call(action, p) {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ action: action }, p || {}))
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error || "حصل خطأ");
    return d;
  }

  /* ---------- مزامنة التقدّم ---------- */
  let syncT = null, syncing = false, pending = false;

  function scheduleSync() {
    if (!isLoggedIn()) return;
    clearTimeout(syncT);
    syncT = setTimeout(pushSync, 2000);
  }

  function sessionDead(msg) {
    return /سجل دخولك|خلصت|اتقفل|متوقف|مش موجود/.test(msg || "");
  }

  async function pushSync() {
    if (!isLoggedIn()) return;
    if (syncing) { pending = true; return; }
    syncing = true;
    try {
      let blob = {};
      try { blob = JSON.parse(localStorage.getItem("NPH_PROGRESS_V1") || "{}"); } catch (e) {}
      await call("stuSync", { token: A.token, progress: blob });
      A.lastSync = Date.now(); saveA(); paintAuthBtn();
    } catch (e) {
      if (sessionDead(e.message)) { localLogout(e.message); }
    }
    syncing = false;
    if (pending) { pending = false; pushSync(); }
  }

  function mergeProgress(local, remote) {
    local = local || {}; remote = remote || {};
    const out = Object.assign({}, remote);
    ["done", "fav"].forEach(function (k) {
      const m = Object.assign({}, remote[k] || {});
      Object.keys(local[k] || {}).forEach(function (key) {
        if (!m[key] || (local[k][key] || 0) > (m[key] || 0)) m[key] = local[k][key];
      });
      out[k] = m;
    });
    const n = Object.assign({}, remote.notes || {});
    Object.keys(local.notes || {}).forEach(function (key) {
      const l = local.notes[key];
      if (!n[key] || (l && l.ts || 0) > (n[key] && n[key].ts || 0)) n[key] = l;
    });
    out.notes = n;
    const d = Object.assign({}, remote.days || {});
    Object.keys(local.days || {}).forEach(function (key) {
      d[key] = Math.max(d[key] || 0, local.days[key] || 0);
    });
    out.days = d;
    const b = Object.assign({}, remote.badges || {});
    Object.keys(local.badges || {}).forEach(function (key) {
      if (!b[key]) b[key] = local.badges[key];
    });
    out.badges = b;
    if (local.last && (!remote.last || (local.last.ts || 0) > (remote.last.ts || 0))) out.last = local.last;
    out.v = 1;
    return out;
  }

  async function pullAndMerge() {
    const d = await call("stuGet", { token: A.token });
    let local = null;
    try { local = JSON.parse(localStorage.getItem("NPH_PROGRESS_V1") || "null"); } catch (e) {}
    const merged = mergeProgress(local, d.progress);
    localStorage.setItem("NPH_PROGRESS_V1", JSON.stringify(merged));
    if (window.NPH && NPH.reload) NPH.reload();
    pushSync();
  }

  function localLogout(msg) {
    A = null; saveA(); paintAuthBtn();
    if (msg && window.toast) toast(msg, "warn");
    setTimeout(function () { location.reload(); }, 900);
  }

  async function logout() {
    if (!isLoggedIn()) return;
    if (!confirm("تسجيل الخروج؟ تقدّمك محفوظ على السيرفر وهيرجع لما تسجل دخولك تاني.")) return;
    const t = A.token;
    A = null; saveA();
    try { await call("stuLogout", { token: t }); } catch (e) {}
    location.reload();
  }

  /* ---------- زر الهيدر ---------- */
  function paintAuthBtn() {
    const b = document.getElementById("abtn");
    if (!b) return;
    if (isLoggedIn()) {
      b.innerHTML = '<i class="fas fa-user-graduate"></i>';
      b.classList.add("on");
    } else {
      b.innerHTML = '<i class="fas fa-user"></i>';
      b.classList.remove("on");
    }
  }

  /* ---------- نافذة تسجيل الدخول / الحساب ---------- */
  let el = null, mode = "login";

  function css() {
    if (document.getElementById("authcss")) return;
    const s = document.createElement("style");
    s.id = "authcss";
    s.textContent = [
      ".aov{position:fixed;inset:0;background:rgba(5,10,22,.78);backdrop-filter:blur(5px);z-index:2500;display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s;--card:#0e2240;--bg:#0a1a2e;--border:rgba(212,175,90,.28);--txt:#eef4fa;--txt2:#a9bccd;--txt3:#7f93a8}",
      ".aov.show{opacity:1}",
      ".acard{width:min(380px,94vw);background:linear-gradient(165deg,#122c46,#0b1e33);border:1px solid var(--border);border-radius:22px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.55);color:var(--txt)}",
      ".atitle{font-weight:900;font-size:19px;text-align:center;margin-bottom:4px}",
      ".asub{color:var(--txt2);font-size:12.5px;text-align:center;margin-bottom:16px}",
      ".atabs{display:flex;gap:8px;margin-bottom:16px}",
      ".atab{flex:1;padding:9px;border-radius:12px;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--txt2);font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer}",
      ".atab.on{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1205;border-color:transparent}",
      ".afield{margin-bottom:12px}",
      ".afield label{display:block;font-size:12.5px;font-weight:800;color:var(--txt2);margin-bottom:5px}",
      ".ainput{width:100%;padding:11px 13px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--txt);font-family:inherit;font-size:14px;outline:none;box-sizing:border-box;transition:border-color .15s}",
      ".ainput:focus{border-color:var(--gold)}",
      ".aerr{display:none;background:rgba(226,75,74,.12);border:1px solid rgba(226,75,74,.35);color:#ff9d9c;border-radius:10px;padding:9px 11px;font-size:12.5px;font-weight:700;margin-bottom:12px}",
      ".aerr.show{display:block}",
      ".asub2{width:100%;padding:13px;border:none;border-radius:14px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1205;font-family:inherit;font-size:14.5px;font-weight:900;cursor:pointer;transition:transform .15s}",
      ".asub2:active{transform:scale(.97)}",
      ".asub2:disabled{opacity:.5;cursor:default}",
      ".anote{margin-top:12px;color:var(--txt3);font-size:11.5px;text-align:center;line-height:1.7}",
      ".alink{display:block;margin:11px auto 0;background:none;border:none;color:var(--txt2);font-family:inherit;font-size:12.5px;font-weight:800;cursor:pointer;text-decoration:underline;text-underline-offset:3px}",
      ".ax{position:absolute;top:14px;left:14px;width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:rgba(255,255,255,.05);color:var(--txt2);font-size:14px;cursor:pointer}",
      ".abtn{width:38px;height:38px;border-radius:50%;border:1.5px solid var(--gold);background:rgba(212,175,55,.1);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:15px;cursor:pointer;flex-shrink:0}",
      ".abtn.on{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1205;font-weight:900;font-size:15px;border-color:transparent}",
      ".aacc{text-align:center;padding:8px 0}",
      ".aacc-name{font-weight:900;font-size:20px}",
      ".aacc-user{color:var(--txt2);font-size:13px;margin:2px 0 14px}",
      ".aacc-row{display:flex;justify-content:space-between;align-items:center;background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:11px 13px;margin-bottom:9px;font-size:13px}",
      ".aacc-row b{color:var(--gold)}",
      ".aout{width:100%;padding:11px;border-radius:12px;border:1px solid rgba(226,75,74,.4);background:rgba(226,75,74,.08);color:#ff9d9c;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer;margin-top:6px}"
    ].join("");
    document.head.appendChild(s);
  }

  function close() {
    if (!el) return;
    el.classList.remove("show");
    setTimeout(function () { if (el) { el.remove(); el = null; } }, 200);
  }

  function openModal(m) {
    mode = m || "login";
    css();
    close();
    el = document.createElement("div");
    el.className = "aov";
    el.innerHTML =
      '<div class="acard" style="position:relative">' +
      '<button class="ax" id="ax"><i class="fas fa-times"></i></button>' +
      '<div class="atitle" id="atitle"></div>' +
      '<div class="asub" id="asub"></div>' +
      '<div class="atabs">' +
      '<button class="atab" id="tab-login">تسجيل الدخول</button>' +
      '<button class="atab" id="tab-reg">حساب جديد</button>' +
      "</div>" +
      '<div class="aerr" id="aerr"></div>' +
      '<div class="afield" id="f-name" style="display:none"><label>اسمك (اختياري — بيظهر للأدمن)</label><input class="ainput" id="a-name" maxlength="60" placeholder="مثال: بودا"></div>' +
      '<div class="afield"><label>اسم المستخدم</label><input class="ainput" id="a-user" maxlength="30" placeholder="حروف وأرقام إنجليزي" autocomplete="username" dir="ltr" style="text-align:left"></div>' +
      '<div class="afield"><label>كلمة السر</label><input class="ainput" id="a-pass" type="password" maxlength="60" placeholder="٤ حروف على الأقل" autocomplete="current-password" dir="ltr" style="text-align:left"></div>' +
      '<button class="asub2" id="a-go"></button>' +
      '<button class="alink" id="a-forgot" type="button">نسيت كلمة السر؟</button>' +
      "</div>";
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });

    function paint() {
      el.querySelector("#tab-login").classList.toggle("on", mode === "login");
      el.querySelector("#tab-reg").classList.toggle("on", mode === "register");
      el.querySelector("#f-name").style.display = mode === "register" ? "" : "none";
      el.querySelector("#atitle").textContent = mode === "register" ? "حساب جديد" : "تسجيل الدخول";
      el.querySelector("#asub").textContent = mode === "register"
        ? "اعمل حسابك لمتابعة تقدّمك من أي جهاز"
        : "سجّل دخولك لمتابعة تقدّمك";
      el.querySelector("#a-forgot").style.display = mode === "login" ? "" : "none";
      el.querySelector("#a-go").textContent = mode === "register" ? "إنشاء الحساب" : "دخول";
      el.querySelector("#aerr").classList.remove("show");
    }
    paint();

    el.querySelector("#tab-login").onclick = function () { mode = "login"; paint(); };
    el.querySelector("#tab-reg").onclick = function () { mode = "register"; paint(); };
    el.querySelector("#ax").onclick = close;
    el.querySelector("#a-forgot").onclick = function () {
      const u = el.querySelector("#a-user").value.trim();
      location.href = "chat.html" + (u ? "?u=" + encodeURIComponent(u) : "");
    };
    el.addEventListener("click", function (e) { if (e.target === el) close(); });

    const go = el.querySelector("#a-go");
    async function submit() {
      const u = el.querySelector("#a-user").value.trim();
      const p = el.querySelector("#a-pass").value;
      const nm = el.querySelector("#a-name").value.trim();
      const err = el.querySelector("#aerr");
      function fail(m) { err.textContent = m; err.classList.add("show"); }
      if (!u) return fail("اكتب اسم المستخدم");
      if (u.length > 30) return fail("اسم المستخدم طويل أوي (٣٠ حرف كحد أقصى)");
      if (!/^[A-Za-z0-9_.\-]+$/.test(u)) return fail("اسم المستخدم حروف وأرقام إنجليزي بس (ممكن . أو _ أو -)");
      if (p.length < 4) return fail("كلمة السر لازم تكون ٤ حروف على الأقل");
      go.disabled = true;
      go.textContent = "لحظة...";
      try {
        const d = mode === "register"
          ? await call("stuRegister", { username: u, password: p, name: nm })
          : await call("stuLogin", { username: u, password: p });
        A = { token: d.token, username: d.username, name: d.name };
        saveA(); paintAuthBtn(); close();
        toast(mode === "register" ? "اتسجلت! أهلاً بيك يا " + (d.name || d.username) : "أهلاً بيك يا " + (d.name || d.username), "ok");
        pullAndMerge().then(function () { setTimeout(function () { location.reload(); }, 700); })
          .catch(function () { setTimeout(function () { location.reload(); }, 700); });
      } catch (e) {
        fail(e.message);
        go.disabled = false; paint();
      }
    }
    go.onclick = submit;
    el.querySelector("#a-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    el.querySelector("#a-user").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
  }

  function openAccount() {
    if (!isLoggedIn()) return openModal("login");
    css(); close();
    const done = (window.NPH && NPH.get() && NPH.get().done) || {};
    const nd = Object.keys(done).length;
    el = document.createElement("div");
    el.className = "aov";
    el.innerHTML =
      '<div class="acard" style="position:relative">' +
      '<button class="ax" id="ax"><i class="fas fa-times"></i></button>' +
      '<div class="aacc">' +
      '<div class="aacc-name">' + (A.name || A.username) + "</div>" +
      '<div class="aacc-user">@' + A.username + "</div>" +
      '<div class="aacc-row"><span>عناصر مخلّصها</span><b>' + nd + "</b></div>" +
      '<div class="aacc-row"><span>آخر مزامنة</span><b>' + (A.lastSync ? agoTxt(A.lastSync) : "لسه") + "</b></div>" +
      "</div>" +
      '<button class="aout" id="a-logout"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>' +
      "</div>";
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("show"); });
    el.querySelector("#ax").onclick = close;
    el.addEventListener("click", function (e) { if (e.target === el) close(); });
    el.querySelector("#a-logout").onclick = function () { close(); setTimeout(logout, 150); };
  }

  function agoTxt(t) {
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return "دلوقتي";
    if (m < 60) return "من " + m + " دقيقة";
    const h2 = Math.floor(m / 60);
    if (h2 < 24) return "من " + h2 + " ساعة";
    return "من " + Math.floor(h2 / 24) + " يوم";
  }

  /* زر شريط التنقل: nav.js بيستدعي دالة دي؛ هنا بنظبطها لو auth.js متحمّل */
  function openAuth() { if (isLoggedIn()) openAccount(); else openModal("login"); }

  window.NPHAuth = {
    isLoggedIn: isLoggedIn,
    user: user,
    openModal: openModal,
    openAccount: openAccount,
    openAuth: openAuth,
    logout: logout,
    paintAuthBtn: paintAuthBtn,
    scheduleSync: scheduleSync,
    needLogin: function () {
      openModal("login");
      return false;
    }
  };
  window.NPH_SYNC_HOOK = scheduleSync;

  document.addEventListener("DOMContentLoaded", paintAuthBtn);
  paintAuthBtn();
  if (isLoggedIn()) setTimeout(pullAndMerge, 1200);
})();
