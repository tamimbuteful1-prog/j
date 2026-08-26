/* ==========================================================================
   app.js — التحكم: الدخول، العرض، إضافة/تعديل المهام، السحب والإفلات
   ========================================================================== */
(function (global) {
  "use strict";

  var C = global.Core, S = global.Schedule, Store = global.Store, UI = global.UI;

  var view = { mode: "day", date: C.todayYmd() };
  var els = {};
  var dragging = false;
  var tickTimer = null;

  /* ====================== المظهر ====================== */

  function applyTheme() {
    var t = (Store.state.settings && Store.state.settings.theme) || "auto";
    var dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    applyTheme(); if (Store.ready) render();
  });

  /* ====================== الإقلاع ====================== */

  function boot() {
    els.auth = document.getElementById("authScreen");
    els.app = document.getElementById("app");
    els.daystrip = document.getElementById("daystrip");
    els.dayhead = document.getElementById("dayhead");
    els.nowbar = document.getElementById("nowbar");
    els.board = document.getElementById("board");
    els.scroller = document.getElementById("scroller");
    els.userLabel = document.getElementById("userLabel");

    Store.onError = function (m) { UI.toast(m); };
    applyTheme();
    wireChrome();

    var saved = Store.savedMode();
    if (Store.cloudAvailable()) {
      Store.restoreSession().then(function (user) {
        if (user) { Store.mode = "cloud"; startApp(); }
        else showAuth();
      });
    } else if (saved === "local") {
      Store.mode = "local"; startApp();
    } else {
      showAuth();
    }
  }

  function startApp() {
    Store.load().then(function () {
      applyTheme();
      els.auth.hidden = true;
      els.app.hidden = false;
      els.userLabel.innerHTML = Store.mode === "cloud" && Store.user
        ? '<b>' + C.escapeHtml(Store.user.email || "") + '</b>'
        : '<b>وضع محلي</b> · هذا الجهاز فقط';
      render();
      scrollToRelevant();
      clearInterval(tickTimer);
      tickTimer = setInterval(tick, 20000);
    });
  }

  function tick() {
    if (dragging || UI.modalOpen) return;
    render();
  }

  /* ====================== شاشة الدخول ====================== */

  function showAuth() {
    els.app.hidden = true;
    els.auth.hidden = false;
    renderAuth("signin");
  }

  function renderAuth(tab, message, ok) {
    var configured = !!Store.getCloudConfig();
    var libReady = !!(global.supabase && global.supabase.createClient);

    els.auth.innerHTML =
      '<div class="auth__card">' +
        '<div class="auth__brand"><div class="auth__logo">ي</div><div class="auth__title">يومي</div></div>' +
        '<p class="auth__sub">جدولك الزمني المرئي — ابدأ يومك وأنت ترى ساعاته كاملة أمامك.</p>' +
        (configured && libReady ? authCloudForm(tab) : authSetupForm(libReady)) +
        (message ? '<div class="auth__msg' + (ok ? " auth__msg--ok" : "") + '" style="margin-top:14px">' + C.escapeHtml(message) + '</div>' : "") +
        '<div class="auth__sep">أو</div>' +
        '<button class="btn btn--ghost btn--block" data-a="local">المتابعة بدون حساب (حفظ على هذا الجهاز)</button>' +
        (configured ? '<button class="btn btn--block" style="margin-top:8px;background:transparent;color:var(--text-3);font-size:12.5px;height:30px" data-a="reconfig">تغيير إعدادات قاعدة البيانات</button>' : "") +
      '</div>';

    els.auth.querySelectorAll(".auth__tab").forEach(function (b) {
      b.addEventListener("click", function () { renderAuth(b.dataset.tab); });
    });

    els.auth.addEventListener("click", onAuthClick);
    var form = els.auth.querySelector("form");
    if (form) form.addEventListener("submit", onAuthSubmit);
  }

  function authCloudForm(tab) {
    var isUp = tab === "signup";
    return '' +
      '<div class="auth__tabs" role="tablist">' +
        '<button class="auth__tab" data-tab="signin" aria-selected="' + (!isUp) + '">تسجيل الدخول</button>' +
        '<button class="auth__tab" data-tab="signup" aria-selected="' + isUp + '">حساب جديد</button>' +
      '</div>' +
      '<form class="auth__form" data-tab="' + tab + '">' +
        '<div class="field"><label>البريد الإلكتروني</label>' +
          '<input class="control" type="email" name="email" autocomplete="email" required placeholder="name@example.com"></div>' +
        '<div class="field"><label>كلمة المرور</label>' +
          '<input class="control" type="password" name="password" autocomplete="' + (isUp ? "new-password" : "current-password") + '" required minlength="6" placeholder="٦ أحرف على الأقل"></div>' +
        '<button class="btn btn--primary btn--block" type="submit">' + (isUp ? "إنشاء الحساب" : "دخول") + '</button>' +
        '<button class="btn btn--ghost btn--block" type="button" data-a="magic">إرسال رابط دخول إلى البريد</button>' +
      '</form>';
  }

  function authSetupForm(libReady) {
    return '' +
      '<div class="cloudbox">' +
        '<div class="cloudbox__row"><span class="badge badge--warn">غير مربوط</span></div>' +
        '<p class="hint">لتفعيل الحسابات والحفظ السحابي، أدخل بيانات مشروع Supabase الخاص بك. ' +
        (libReady ? "" : "تعذّر تحميل مكتبة Supabase — تحقّق من الاتصال بالإنترنت. ") +
        'الخطوات كاملة موجودة في ملف <b>README</b> مع ملف SQL جاهز لإنشاء الجداول.</p>' +
        '<div class="field"><label>Project URL</label><input class="control" id="cfgUrl" placeholder="https://xxxx.supabase.co"></div>' +
        '<div class="field"><label>Anon public key</label><input class="control" id="cfgKey" placeholder="eyJhbGciOi..."></div>' +
        '<button class="btn btn--primary btn--block" data-a="savecfg">حفظ وربط</button>' +
      '</div>';
  }

  function onAuthClick(e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var a = b.dataset.a;

    if (a === "local") {
      Store.useLocal().then(startApp);
      return;
    }
    if (a === "reconfig") { Store.clearCloudConfig(); renderAuth("signin"); return; }
    if (a === "savecfg") {
      var url = (document.getElementById("cfgUrl").value || "").trim().replace(/\/+$/, "");
      var key = (document.getElementById("cfgKey").value || "").trim();
      if (!/^https?:\/\/.+/.test(url) || key.length < 20) { renderAuth("signin", "تأكّد من صحة الرابط والمفتاح."); return; }
      Store.setCloudConfig(url, key);
      renderAuth("signin", "تم الربط. يمكنك الآن إنشاء حساب أو تسجيل الدخول.", true);
      return;
    }
    if (a === "magic") {
      var form = els.auth.querySelector("form");
      var email = (form.email.value || "").trim();
      if (!email) { renderAuth(form.dataset.tab, "أدخل بريدك الإلكتروني أولًا."); return; }
      b.disabled = true;
      Store.sendMagicLink(email).then(function () {
        renderAuth(form.dataset.tab, "أُرسل رابط الدخول إلى " + email, true);
      }).catch(function (err) { renderAuth(form.dataset.tab, err.message || "تعذّر الإرسال."); });
    }
  }

  function onAuthSubmit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var tab = form.dataset.tab;
    var email = (form.email.value || "").trim();
    var pass = form.password.value || "";
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = "جارٍ...";

    var p = tab === "signup" ? Store.signUp(email, pass) : Store.signIn(email, pass);
    p.then(function (r) {
      if (r && r.needsConfirm) {
        renderAuth("signin", "تم إنشاء الحساب. افتح بريدك لتأكيد الحساب ثم سجّل الدخول.", true);
        return;
      }
      Store.mode = "cloud";
      localStorage.setItem("yawmi.mode.v1", "cloud");
      startApp();
    }).catch(function (err) {
      renderAuth(tab, translateAuthError(err));
    });
  }

  function translateAuthError(err) {
    var m = (err && err.message) || "حدث خطأ.";
    if (/Invalid login credentials/i.test(m)) return "البريد أو كلمة المرور غير صحيحة.";
    if (/User already registered/i.test(m)) return "هذا البريد مسجّل مسبقًا، سجّل الدخول بدلًا من ذلك.";
    if (/Email not confirmed/i.test(m)) return "لم يتم تأكيد البريد بعد، افتح رسالة التأكيد.";
    if (/Password should be/i.test(m)) return "كلمة المرور قصيرة جدًا (٦ أحرف على الأقل).";
    return m;
  }

  /* ====================== العرض ====================== */

  function visibleDates() {
    return view.mode === "week" ? C.weekDates(view.date) : [view.date];
  }

  function aggregate() {
    var today = C.todayYmd(), nowMin = C.nowMinutes();
    var dates = visibleDates();
    var all = [], agg = { count: 0, done: 0, planned: 0, leftInDay: 0, free: 0, remainingPlanned: 0 };
    dates.forEach(function (d) {
      var occs = S.occurrencesFor(d, { today: today, nowMin: nowMin });
      var sum = S.summary(d, occs, { today: today, nowMin: nowMin });
      all = all.concat(occs);
      agg.count += sum.count; agg.done += sum.done; agg.planned += sum.planned;
      agg.leftInDay += sum.leftInDay; agg.free += sum.free; agg.remainingPlanned += sum.remainingPlanned;
    });
    agg.percent = agg.count ? Math.round(agg.done / agg.count * 100) : 0;
    return { occs: all, sum: agg };
  }

  function render() {
    var today = C.todayYmd(), nowMin = C.nowMinutes();
    var a = aggregate();

    UI.renderDayStrip(els.daystrip, view, function (d) { view.date = d; render(); });
    UI.renderDayHead(els.dayhead, view, a.occs, a.sum);
    els.dayhead.querySelectorAll("[data-act]").forEach(function (b) {
      b.addEventListener("click", function () { headAction(b.dataset.act); });
    });

    var inRange = visibleDates().indexOf(today) !== -1;
    UI.renderNowBar(els.nowbar, { date: inRange ? today : "" },
      inRange ? S.occurrencesFor(today, { today: today, nowMin: nowMin }) : [], nowMin);

    UI.renderBoard(els.board, view, {
      onColumnPick: function (d) { view.date = d; if (view.mode === "day") render(); else render(); }
    });

    document.querySelectorAll(".topbar__seg button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === view.mode));
    });
  }

  function headAction(a) {
    var step = view.mode === "week" ? 7 : 1;
    if (a === "today") { view.date = C.todayYmd(); render(); scrollToRelevant(); }
    else if (a === "prev") { view.date = C.addDays(view.date, -step); render(); }
    else if (a === "next") { view.date = C.addDays(view.date, step); render(); }
    else if (a === "add") { openEditor({ mode: "create", date: view.date }); }
  }

  /** تمرير الجدول إلى الوقت الحالي (أو بداية أول مهمة) */
  function scrollToRelevant() {
    var s = Store.state.settings;
    var target = C.nowMinutes();
    if (view.date !== C.todayYmd()) {
      var occs = S.occurrencesFor(view.date);
      target = occs.length ? occs[0].start : s.dayStart + 120;
    }
    var y = (C.clamp(target, s.dayStart, s.dayEnd) - s.dayStart) * UI.pxPerMinute();
    var boardTop = els.board.offsetTop;
    els.scroller.scrollTo({ top: Math.max(0, boardTop + y - els.scroller.clientHeight * 0.35), behavior: "smooth" });
  }

  /* ====================== شريط الأدوات ====================== */

  function wireChrome() {
    document.querySelectorAll(".topbar__seg button").forEach(function (b) {
      b.addEventListener("click", function () { view.mode = b.dataset.mode; render(); scrollToRelevant(); });
    });
    document.getElementById("btnSettings").addEventListener("click", openSettings);
    document.getElementById("btnAdd").addEventListener("click", function () {
      openEditor({ mode: "create", date: view.date });
    });
    document.getElementById("fab").addEventListener("click", function () {
      openEditor({ mode: "create", date: view.date });
    });

    document.addEventListener("keydown", function (e) {
      if (UI.modalOpen || els.app.hidden) return;
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "n" || e.key === "ن") { e.preventDefault(); openEditor({ mode: "create", date: view.date }); }
      else if (e.key === "t" || e.key === "ه") { headAction("today"); }
      else if (e.key === "d" || e.key === "ي") { view.mode = "day"; render(); }
      else if (e.key === "w" || e.key === "ص") { view.mode = "week"; render(); }
      else if (e.key === "ArrowRight") { headAction("prev"); }
      else if (e.key === "ArrowLeft") { headAction("next"); }
    });

    els.board.addEventListener("pointerdown", onBoardPointerDown);
    els.board.addEventListener("click", onBoardClick);
    els.board.addEventListener("contextmenu", function (e) {
      var block = e.target.closest(".block");
      if (!block) return;
      e.preventDefault();
      openMenu(e.clientX, e.clientY, block.__occ);
    });
  }

  /* ====================== النقر داخل الجدول ====================== */

  var suppressClick = false;

  function onBoardClick(e) {
    if (suppressClick) { suppressClick = false; return; }
    var block = e.target.closest(".block");
    if (block) {
      if (e.target.closest(".block__grip") || e.target.closest("[data-rs]")) return;
      openEditor({ mode: "edit", occ: block.__occ });
      return;
    }
    var cell = e.target.closest(".cell");
    if (cell) {
      var s = Store.state.settings;
      var start = +cell.dataset.min;
      openEditor({
        mode: "create",
        date: cell.dataset.date,
        start: start,
        end: Math.min(s.dayEnd, start + s.defaultDuration)
      });
    }
  }

  /* ====================== السحب والإفلات ====================== */

  var drag = null;

  function onBoardPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    var block = e.target.closest(".block");
    if (block) return startBlockDrag(e, block);
    var cell = e.target.closest(".cell");
    if (cell && e.pointerType === "mouse") return startCreateDrag(e, cell);
  }

  function colsEl() { return els.board.querySelector(".cols"); }

  function minutesAt(clientY) {
    var rect = colsEl().getBoundingClientRect();
    return Store.state.settings.dayStart + (clientY - rect.top) / UI.pxPerMinute();
  }

  function dateAt(clientX) {
    var cols = Array.prototype.slice.call(els.board.querySelectorAll(".col"));
    for (var i = 0; i < cols.length; i++) {
      var r = cols[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) return cols[i].dataset.date;
    }
    return null;
  }

  function startBlockDrag(e, block) {
    var occ = block.__occ;
    if (!occ) return;
    var rs = e.target.closest("[data-rs]");
    var grip = e.target.closest(".block__grip");
    var mode = rs ? (rs.dataset.rs === "t" ? "top" : "bottom") : "move";

    // على اللمس: السحب من المقبض أو من حافتَي التحجيم فقط، حتى يبقى التمرير ممكنًا
    if (e.pointerType !== "mouse" && !rs && !grip) { startLongPress(e, block); return; }

    drag = {
      kind: "task", mode: mode, block: block, occ: occ,
      startY: e.clientY, startX: e.clientX,
      origStart: occ.start, origEnd: occ.end, origDate: occ.date,
      grabOffset: minutesAt(e.clientY) - occ.start,
      newStart: occ.start, newEnd: occ.end, newDate: occ.date,
      active: rs || grip ? true : false,
      moved: false
    };
    if (drag.active) block.classList.add("block--dragging");
    bindDragEvents();
  }

  function startLongPress(e, block) {
    var x = e.clientX, y = e.clientY;
    var t = setTimeout(function () {
      suppressClick = true;
      openMenu(x, y, block.__occ);
      cleanup();
    }, 480);
    function move(ev) { if (Math.abs(ev.clientY - y) > 8 || Math.abs(ev.clientX - x) > 8) cleanup(); }
    function cleanup() {
      clearTimeout(t);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", cleanup);
      document.removeEventListener("pointercancel", cleanup);
    }
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", cleanup);
    document.addEventListener("pointercancel", cleanup);
  }

  function startCreateDrag(e, cell) {
    drag = {
      kind: "create", date: cell.dataset.date,
      anchor: +cell.dataset.min, startY: e.clientY,
      newStart: +cell.dataset.min,
      newEnd: +cell.dataset.min + Store.state.settings.slot,
      active: false, ghost: null
    };
    bindDragEvents();
  }

  function bindDragEvents() {
    document.addEventListener("pointermove", onDragMove);
    document.addEventListener("pointerup", onDragEnd);
    document.addEventListener("pointercancel", onDragEnd);
  }
  function unbindDragEvents() {
    document.removeEventListener("pointermove", onDragMove);
    document.removeEventListener("pointerup", onDragEnd);
    document.removeEventListener("pointercancel", onDragEnd);
  }

  function onDragMove(e) {
    if (!drag) return;
    if (!drag.active) {
      if (Math.abs(e.clientY - drag.startY) < 5 && Math.abs(e.clientX - (drag.startX || e.clientX)) < 5) return;
      drag.active = true;
      dragging = true;
      if (drag.block) drag.block.classList.add("block--dragging");
    }
    dragging = true;
    drag.moved = true;
    e.preventDefault();
    autoScroll(e.clientY);

    var s = Store.state.settings, snap = s.snap || 15;
    var abs = minutesAt(e.clientY);

    if (drag.kind === "create") {
      var m = C.clamp(C.snapTo(abs, snap), s.dayStart, s.dayEnd);
      drag.newStart = Math.min(drag.anchor, m);
      drag.newEnd = Math.max(drag.anchor + s.slot, m);
      drawCreateGhost();
      return;
    }

    if (drag.mode === "move") {
      var dur = drag.origEnd - drag.origStart;
      var ns = C.snapTo(abs - drag.grabOffset, snap);
      ns = C.clamp(ns, s.dayStart, s.dayEnd - dur);
      drag.newStart = ns; drag.newEnd = ns + dur;
      var d = dateAt(e.clientX);
      if (d) drag.newDate = d;
    } else if (drag.mode === "top") {
      drag.newStart = C.clamp(C.snapTo(abs, snap), s.dayStart, drag.newEnd - snap);
    } else {
      drag.newEnd = C.clamp(C.snapTo(abs, snap), drag.newStart + snap, s.dayEnd);
    }
    paintDrag();
  }

  function paintDrag() {
    var s = Store.state.settings, pxm = UI.pxPerMinute(), b = drag.block;
    b.style.top = ((drag.newStart - s.dayStart) * pxm + 1.5) + "px";
    b.style.height = Math.max(20, (drag.newEnd - drag.newStart) * pxm - 3) + "px";
    var meta = b.querySelector(".block__m");
    if (meta) meta.textContent = C.formatTime(drag.newStart) + " – " + C.formatTime(drag.newEnd) +
      " · " + C.formatDuration(drag.newEnd - drag.newStart);
    if (drag.newDate !== drag.currentDate) {
      var col = els.board.querySelector('.col[data-date="' + drag.newDate + '"] .blocks');
      if (col && b.parentNode !== col) {
        col.appendChild(b);
        b.style.insetInlineStart = "3px";
        b.style.width = "calc(100% - 6px)";
      }
      drag.currentDate = drag.newDate;
    }
  }

  function drawCreateGhost() {
    var s = Store.state.settings, pxm = UI.pxPerMinute();
    var host = els.board.querySelector('.col[data-date="' + drag.date + '"] .blocks');
    if (!host) return;
    if (!drag.ghost) {
      drag.ghost = document.createElement("div");
      drag.ghost.className = "ghost-create";
      drag.ghost.style.insetInlineStart = "3px";
      drag.ghost.style.width = "calc(100% - 6px)";
      host.appendChild(drag.ghost);
    }
    drag.ghost.style.top = ((drag.newStart - s.dayStart) * pxm + 1.5) + "px";
    drag.ghost.style.height = ((drag.newEnd - drag.newStart) * pxm - 3) + "px";
    drag.ghost.textContent = C.formatTime(drag.newStart) + " – " + C.formatTime(drag.newEnd);
  }

  var scrollRaf = null;
  function autoScroll(clientY) {
    var r = els.scroller.getBoundingClientRect();
    var speed = 0;
    if (clientY < r.top + 70) speed = -Math.min(18, (r.top + 70 - clientY) / 3);
    else if (clientY > r.bottom - 70) speed = Math.min(18, (clientY - (r.bottom - 70)) / 3);
    cancelAnimationFrame(scrollRaf);
    if (!speed) return;
    (function step() {
      els.scroller.scrollTop += speed;
      scrollRaf = requestAnimationFrame(step);
    })();
    setTimeout(function () { cancelAnimationFrame(scrollRaf); }, 120);
  }

  function onDragEnd() {
    cancelAnimationFrame(scrollRaf);
    unbindDragEvents();
    if (!drag) { dragging = false; return; }
    var d = drag; drag = null; dragging = false;

    if (d.kind === "create") {
      if (d.ghost) d.ghost.remove();
      if (!d.active) return; // نقرة عادية → يتكفّل بها onBoardClick
      suppressClick = true;
      openEditor({ mode: "create", date: d.date, start: d.newStart, end: d.newEnd });
      return;
    }

    d.block.classList.remove("block--dragging");
    if (!d.active || !d.moved) { render(); return; }
    suppressClick = true;

    if (d.newStart === d.origStart && d.newEnd === d.origEnd && d.newDate === d.origDate) { render(); return; }
    commitMove(d.occ, d.newStart, d.newEnd, d.newDate).then(render);
  }

  /* ====================== تطبيق التغييرات ====================== */

  function commitMove(occ, newStart, newEnd, newDate) {
    var task = occ.task;
    if (!occ.isRecurring) {
      task.start = newStart; task.end = newEnd; task.date = newDate;
      return Store.upsertTask(task).then(function () {
        UI.toast("تم نقل «" + occ.title + "» إلى " + C.formatTime(newStart));
      });
    }
    return UI.askScope(newDate !== occ.date ? "النقل" : "تغيير الوقت").then(function (scope) {
      if (!scope) return;
      if (scope === "one") {
        if (newDate === occ.date) return Store.setOverride(task.id, occ.date, { start: newStart, end: newEnd });
        return detachOccurrence(occ, { date: newDate, start: newStart, end: newEnd });
      }
      var delta = C.diffDays(occ.date, newDate);
      task.start = newStart; task.end = newEnd;
      if (delta) {
        task.date = C.addDays(task.date, delta);
        if (task.recurType === "weekly" && task.recurDays && task.recurDays.length) {
          task.recurDays = task.recurDays.map(function (x) { return ((x + delta) % 7 + 7) % 7; }).sort();
        }
      }
      return Store.upsertTask(task);
    });
  }

  /** فصل موعد واحد من مهمة متكررة إلى مهمة مستقلة */
  function detachOccurrence(occ, patch) {
    var t = occ.task;
    var copy = {
      id: C.uid("t"),
      title: patch.title != null ? patch.title : occ.title,
      notes: patch.notes != null ? patch.notes : t.notes,
      categoryId: patch.categoryId != null ? patch.categoryId : occ.categoryId,
      date: patch.date || occ.date,
      start: patch.start != null ? patch.start : occ.start,
      end: patch.end != null ? patch.end : occ.end,
      recurType: "none", recurDays: [], recurUntil: null,
      status: patch.status || occ.status || "todo"
    };
    return Store.setOverride(t.id, occ.date, { deleted: true })
      .then(function () { return Store.upsertTask(copy); })
      .then(function () { UI.toast("تم فصل هذا الموعد كمهمة مستقلة."); });
  }

  function setStatus(occ, status) {
    var p = occ.isRecurring
      ? Store.setOverride(occ.taskId, occ.date, { status: status })
      : (function () { occ.task.status = status; return Store.upsertTask(occ.task); })();
    return p.then(function () {
      render();
      UI.toast(status === "done" ? "تم إنجاز «" + occ.title + "» 🎉"
        : status === "postponed" ? "تم تأجيل «" + occ.title + "»"
        : "أُعيدت «" + occ.title + "» إلى «لم تبدأ»");
    });
  }

  function deleteOccurrence(occ) {
    if (!occ.isRecurring) {
      return UI.confirm("حذف المهمة", "سيتم حذف «" + occ.title + "» نهائيًا.", "حذف").then(function (yes) {
        if (!yes) return;
        var backup = Object.assign({}, occ.task);
        return Store.removeTask(occ.taskId).then(function () {
          render();
          UI.toast("تم حذف المهمة", "تراجع", function () {
            Store.upsertTask(backup).then(render);
          });
        });
      });
    }
    return UI.askScope("الحذف").then(function (scope) {
      if (!scope) return;
      if (scope === "one") {
        return Store.setOverride(occ.taskId, occ.date, { deleted: true }).then(function () {
          render();
          UI.toast("تم حذف هذا الموعد فقط", "تراجع", function () {
            Store.clearOverride(occ.taskId, occ.date).then(render);
          });
        });
      }
      return Store.removeTask(occ.taskId).then(function () { render(); UI.toast("تم حذف المهمة المتكررة بالكامل"); });
    });
  }

  /* ====================== قائمة السياق ====================== */

  var menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  document.addEventListener("pointerdown", function (e) {
    if (menuEl && !e.target.closest(".menu")) closeMenu();
  }, true);
  document.addEventListener("scroll", closeMenu, true);

  function openMenu(x, y, occ) {
    closeMenu();
    if (!occ) return;
    menuEl = document.createElement("div");
    menuEl.className = "menu";
    var isDone = occ.state === "done";
    menuEl.innerHTML =
      '<div class="menu__h">' + C.escapeHtml(occ.title) + ' · ' + C.formatTime(occ.start) + '</div>' +
      item("done", isDone ? "إلغاء الإنجاز" : "تحديد كمكتملة", UI.ICON.check) +
      item("postpone", occ.state === "postponed" ? "إلغاء التأجيل" : "تأجيل", UI.ICON.repeat) +
      '<div class="menu__sep"></div>' +
      item("edit", "تعديل المهمة", UI.ICON.cog) +
      item("copy", "نسخ إلى يوم آخر", UI.ICON.copy) +
      item("shift", "تأخير ٣٠ دقيقة", UI.ICON.next) +
      '<div class="menu__sep"></div>' +
      item("delete", "حذف", UI.ICON.trash, true);

    function item(a, label, icon, danger) {
      return '<button class="menu__i' + (danger ? " menu__i--danger" : "") + '" data-a="' + a + '">' +
        icon + '<span>' + label + '</span></button>';
    }

    document.body.appendChild(menuEl);
    var w = menuEl.offsetWidth, h = menuEl.offsetHeight;
    menuEl.style.left = Math.max(8, Math.min(x - w / 2, innerWidth - w - 8)) + "px";
    menuEl.style.top = (y + h + 12 > innerHeight ? Math.max(8, y - h - 8) : y + 8) + "px";

    menuEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var a = b.dataset.a; closeMenu();
      if (a === "done") setStatus(occ, isDone ? "todo" : "done");
      else if (a === "postpone") setStatus(occ, occ.state === "postponed" ? "todo" : "postponed");
      else if (a === "edit") openEditor({ mode: "edit", occ: occ });
      else if (a === "copy") openCopyDialog(occ);
      else if (a === "shift") {
        var s = Store.state.settings;
        var dur = occ.end - occ.start;
        var ns = C.clamp(occ.start + 30, s.dayStart, s.dayEnd - dur);
        commitMove(occ, ns, ns + dur, occ.date).then(render);
      }
      else if (a === "delete") deleteOccurrence(occ);
    });
  }

  /* ====================== نسخ إلى يوم آخر ====================== */

  function openCopyDialog(occ) {
    var m = UI.openModal({
      title: "نسخ إلى يوم آخر",
      body:
        '<div class="field"><label>اليوم المستهدف</label>' +
          '<input class="control" type="date" id="cpDate" value="' + C.addDays(occ.date, 1) + '"></div>' +
        '<p class="hint">ستُنشأ نسخة مستقلة من «' + C.escapeHtml(occ.title) + '» بنفس الوقت والتصنيف.</p>',
      footer: '<button class="btn btn--ghost grow" data-a="cancel">إلغاء</button>' +
              '<button class="btn btn--primary grow" data-a="ok">نسخ</button>'
    });
    m.foot.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "cancel") return m.close();
      var d = document.getElementById("cpDate").value;
      if (!d) return;
      Store.upsertTask({
        id: C.uid("t"), title: occ.title, notes: occ.notes, categoryId: occ.categoryId,
        date: d, start: occ.start, end: occ.end,
        recurType: "none", recurDays: [], recurUntil: null, status: "todo"
      }).then(function () {
        m.close(); render();
        UI.toast("تم النسخ إلى " + C.dayName(d) + " " + C.formatDate(d));
      });
    });
  }

  /* ====================== محرّر المهمة ====================== */

  function openEditor(opts) {
    var isEdit = opts.mode === "edit";
    var occ = opts.occ;
    var s = Store.state.settings;
    var cats = Store.state.categories;

    var val = isEdit ? {
      title: occ.title, notes: occ.notes, categoryId: occ.categoryId,
      date: occ.date, start: occ.start, end: occ.end,
      recurType: occ.task.recurType || "none",
      recurDays: (occ.task.recurDays || []).slice(),
      recurUntil: occ.task.recurUntil || "",
      status: occ.status || "todo"
    } : {
      title: "", notes: "", categoryId: (cats[0] || {}).id,
      date: opts.date || view.date,
      start: opts.start != null ? opts.start : defaultStart(),
      end: opts.end != null ? opts.end : defaultStart() + s.defaultDuration,
      recurType: "none", recurDays: [], recurUntil: "", status: "todo"
    };

    var body = document.createElement("div");
    body.style.display = "flex"; body.style.flexDirection = "column"; body.style.gap = "14px";
    body.innerHTML =
      '<div class="field"><label>اسم المهمة</label>' +
        '<input class="control" id="fTitle" placeholder="مثال: مذاكرة الرياضيات" value="' + C.escapeHtml(val.title) + '" maxlength="120"></div>' +

      '<div class="field"><label>التصنيف</label><div class="catpick" id="fCats"></div></div>' +

      '<div class="field"><label>اليوم</label><input class="control" type="date" id="fDate" value="' + val.date + '"></div>' +

      '<div class="row">' +
        '<div class="field"><label>وقت البداية</label><input class="control" type="time" step="900" id="fStart" value="' + C.toHHMM(val.start) + '"></div>' +
        '<div class="field"><label>وقت النهاية</label><input class="control" type="time" step="900" id="fEnd" value="' + C.toHHMM(val.end === 1440 ? 1439 : val.end) + '"></div>' +
      '</div>' +
      '<div class="field"><label>المدة</label><div class="durchips" id="fDur">' +
        [15, 30, 45, 60, 90, 120, 180, 240].map(function (n) {
          return '<button type="button" data-d="' + n + '">' + C.formatDuration(n) + '</button>';
        }).join("") +
        '<span class="hint" id="fDurNow" style="align-self:center;margin-inline-start:4px"></span>' +
      '</div></div>' +

      '<div class="field"><label>التكرار</label>' +
        '<div class="seglist" id="fRecur">' +
          '<button type="button" data-r="none">لا يتكرر</button>' +
          '<button type="button" data-r="daily">يوميًا</button>' +
          '<button type="button" data-r="weekly">أسبوعيًا</button>' +
        '</div></div>' +
      '<div class="field" id="fWeekWrap" hidden><label>أيام التكرار</label><div class="wdays" id="fWeek"></div></div>' +
      '<div class="field" id="fUntilWrap" hidden><label>يتكرر حتى تاريخ (اختياري)</label>' +
        '<input class="control" type="date" id="fUntil" value="' + (val.recurUntil || "") + '"></div>' +

      (isEdit ? '<div class="field"><label>الحالة</label><div class="statuspick" id="fStatus">' +
        C.MANUAL_STATUSES.map(function (k) {
          return '<button type="button" data-s="' + k + '">' + C.STATUS[k].icon + " " + C.STATUS[k].label + '</button>';
        }).join("") + '</div></div>' : "") +

      '<div class="field"><label>ملاحظات</label>' +
        '<textarea class="control" id="fNotes" placeholder="اختياري" maxlength="800">' + C.escapeHtml(val.notes) + '</textarea></div>';

    var footer =
      (isEdit ? '<button class="btn btn--danger" data-a="delete">' + UI.ICON.trash + '</button>' +
                '<button class="btn btn--ghost" data-a="copy">' + UI.ICON.copy + '</button>' : "") +
      '<button class="btn btn--ghost grow" data-a="cancel">إلغاء</button>' +
      '<button class="btn btn--primary grow" data-a="save">' + (isEdit ? "حفظ التعديل" : "إضافة المهمة") + '</button>';

    var m = UI.openModal({
      title: isEdit ? "تعديل المهمة" : "مهمة جديدة",
      body: body, footer: footer,
      onReady: function () { setTimeout(function () { document.getElementById("fTitle").focus(); }, 30); }
    });

    /* --- التصنيفات --- */
    var catBox = body.querySelector("#fCats");
    cats.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "catpick__b"; b.dataset.id = c.id; b.textContent = c.name;
      UI.applyColorVars(b, c.color);
      b.setAttribute("aria-pressed", String(c.id === val.categoryId));
      b.addEventListener("click", function () {
        val.categoryId = c.id;
        catBox.querySelectorAll(".catpick__b").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x.dataset.id === c.id));
        });
      });
      catBox.appendChild(b);
    });

    /* --- أيام الأسبوع --- */
    var weekBox = body.querySelector("#fWeek");
    C.WEEK_ORDER.forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "wday"; b.dataset.d = d; b.textContent = C.DAY_SHORT[d];
      b.setAttribute("aria-pressed", String(val.recurDays.indexOf(d) !== -1));
      b.addEventListener("click", function () {
        var i = val.recurDays.indexOf(d);
        if (i === -1) val.recurDays.push(d); else val.recurDays.splice(i, 1);
        b.setAttribute("aria-pressed", String(val.recurDays.indexOf(d) !== -1));
      });
      weekBox.appendChild(b);
    });

    /* --- التكرار --- */
    function syncRecur() {
      body.querySelectorAll("#fRecur button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.r === val.recurType));
      });
      body.querySelector("#fWeekWrap").hidden = val.recurType !== "weekly";
      body.querySelector("#fUntilWrap").hidden = val.recurType === "none";
    }
    body.querySelector("#fRecur").addEventListener("click", function (e) {
      var b = e.target.closest("[data-r]"); if (!b) return;
      val.recurType = b.dataset.r;
      if (val.recurType === "weekly" && !val.recurDays.length) {
        val.recurDays = [C.dayOfWeek(body.querySelector("#fDate").value || val.date)];
        weekBox.querySelectorAll(".wday").forEach(function (x) {
          x.setAttribute("aria-pressed", String(val.recurDays.indexOf(+x.dataset.d) !== -1));
        });
      }
      syncRecur();
    });
    syncRecur();

    /* --- الحالة --- */
    if (isEdit) {
      var stBox = body.querySelector("#fStatus");
      function syncStatus() {
        stBox.querySelectorAll("[data-s]").forEach(function (b) {
          b.setAttribute("aria-pressed", String(b.dataset.s === val.status));
        });
      }
      stBox.addEventListener("click", function (e) {
        var b = e.target.closest("[data-s]"); if (!b) return;
        val.status = b.dataset.s; syncStatus();
      });
      syncStatus();
    }

    /* --- المدة --- */
    var fStart = body.querySelector("#fStart"), fEnd = body.querySelector("#fEnd");
    function durNow() {
      var a = C.toMinutes(fStart.value), b = C.toMinutes(fEnd.value);
      if (a == null || b == null) return 0;
      if (b <= a) b += 0;
      return b - a;
    }
    function syncDur() {
      var d = durNow();
      body.querySelector("#fDurNow").textContent = d > 0 ? "المدة الحالية: " + C.formatDuration(d) : "وقت النهاية يجب أن يكون بعد البداية";
    }
    body.querySelector("#fDur").addEventListener("click", function (e) {
      var b = e.target.closest("[data-d]"); if (!b) return;
      var a = C.toMinutes(fStart.value) || 0;
      fEnd.value = C.toHHMM(Math.min(1439, a + (+b.dataset.d)));
      syncDur();
    });
    fStart.addEventListener("change", function () {
      var d = durNow();
      if (d <= 0) { fEnd.value = C.toHHMM(Math.min(1439, (C.toMinutes(fStart.value) || 0) + s.defaultDuration)); }
      syncDur();
    });
    fEnd.addEventListener("change", syncDur);
    syncDur();

    /* --- الأزرار --- */
    m.foot.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var a = b.dataset.a;
      if (a === "cancel") return m.close();
      if (a === "delete") { m.close(); return deleteOccurrence(occ); }
      if (a === "copy") { m.close(); return openCopyDialog(occ); }
      if (a === "save") return save();
    });

    body.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.id === "fTitle") { e.preventDefault(); save(); }
    });

    function save() {
      var title = (body.querySelector("#fTitle").value || "").trim();
      if (!title) { body.querySelector("#fTitle").focus(); UI.toast("اكتب اسم المهمة أولًا."); return; }
      var start = C.toMinutes(fStart.value);
      var end = C.toMinutes(fEnd.value);
      if (start == null || end == null) { UI.toast("حدّد وقت البداية والنهاية."); return; }
      if (end <= start) { UI.toast("وقت النهاية يجب أن يكون بعد البداية."); return; }
      if (val.recurType === "weekly" && !val.recurDays.length) { UI.toast("اختر يومًا واحدًا على الأقل للتكرار."); return; }

      var data = {
        title: title,
        notes: (body.querySelector("#fNotes").value || "").trim(),
        categoryId: val.categoryId,
        date: body.querySelector("#fDate").value || val.date,
        start: start, end: end,
        recurType: val.recurType,
        recurDays: val.recurType === "weekly" ? val.recurDays.slice().sort() : [],
        recurUntil: val.recurType !== "none" ? (body.querySelector("#fUntil").value || null) : null,
        status: isEdit ? val.status : "todo"
      };

      // اليوم الذي اختاره المستخدم في النموذج (قبل ضبط بداية التكرار)
      var chosenDate = data.date;

      // التكرار الأسبوعي يبدأ من أول يوم مُختار داخل نفس الأسبوع،
      // حتى تظهر المهمة في كل أيام الأسبوع الحالي لا من اليوم فقط.
      if (data.recurType === "weekly" && data.recurDays.length) {
        var ws = C.weekStart(data.date);
        for (var wi = 0; wi < 7; wi++) {
          var cand = C.addDays(ws, wi);
          if (data.recurDays.indexOf(C.dayOfWeek(cand)) !== -1) { data.date = cand; break; }
        }
      }

      if (!isEdit) {
        data.id = C.uid("t");
        Store.upsertTask(data).then(function () {
          m.close();
          if (chosenDate !== view.date && view.mode === "day") view.date = chosenDate;
          render();
          UI.toast("تمت إضافة «" + title + "»");
        });
        return;
      }

      if (!occ.isRecurring) {
        var t = Object.assign({}, occ.task, data);
        Store.upsertTask(t).then(function () { m.close(); render(); UI.toast("تم حفظ التعديل"); });
        return;
      }

      UI.askScope("التعديل").then(function (scope) {
        if (!scope) return;
        if (scope === "one") {
          m.close();
          return detachOccurrence(occ, data).then(render);
        }
        var t2 = Object.assign({}, occ.task, data);
        // الحالة اليدوية للمهام المتكررة تُحفظ لكل موعد على حدة
        t2.status = "todo";
        Store.upsertTask(t2)
          .then(function () { return Store.setOverride(occ.taskId, occ.date, { status: data.status }); })
          .then(function () { m.close(); render(); UI.toast("تم حفظ التعديل على كل المواعيد"); });
      });
    }
  }

  function defaultStart() {
    var s = Store.state.settings;
    var base = view.date === C.todayYmd() ? C.nowMinutes() : s.dayStart + 180;
    return C.clamp(C.snapTo(base, s.slot), s.dayStart, s.dayEnd - s.defaultDuration);
  }

  /* ====================== الإعدادات ====================== */

  function openSettings() {
    var s = Store.state.settings;
    var body = document.createElement("div");
    body.style.display = "flex"; body.style.flexDirection = "column"; body.style.gap = "16px";

    body.innerHTML =
      '<div class="field"><label>المظهر</label><div class="seglist" id="sTheme">' +
        '<button type="button" data-t="auto">تلقائي</button>' +
        '<button type="button" data-t="light">فاتح</button>' +
        '<button type="button" data-t="dark">داكن</button>' +
      '</div></div>' +

      '<div class="row">' +
        '<div class="field"><label>بداية الجدول</label><select class="control" id="sStart"></select></div>' +
        '<div class="field"><label>نهاية الجدول</label><select class="control" id="sEnd"></select></div>' +
      '</div>' +
      '<div class="row">' +
        '<div class="field"><label>حجم الخانة</label><select class="control" id="sSlot">' +
          '<option value="15">١٥ دقيقة</option><option value="30">٣٠ دقيقة</option><option value="60">ساعة</option>' +
        '</select></div>' +
        '<div class="field"><label>دقة السحب</label><select class="control" id="sSnap">' +
          '<option value="5">٥ دقائق</option><option value="10">١٠ دقائق</option>' +
          '<option value="15">١٥ دقيقة</option><option value="30">٣٠ دقيقة</option>' +
        '</select></div>' +
      '</div>' +

      '<div class="field"><label>التصنيفات والألوان</label><div id="sCats" style="display:flex;flex-direction:column;gap:8px"></div>' +
        '<button class="btn btn--ghost btn--sm" id="sAddCat" style="align-self:flex-start;margin-top:8px">' + UI.ICON.plus + ' تصنيف جديد</button>' +
      '</div>' +

      '<div class="field"><label>البيانات والحساب</label><div class="cloudbox" id="sCloud"></div></div>';

    var m = UI.openModal({ title: "الإعدادات", body: body, wide: true, footer: '<button class="btn btn--primary btn--block" data-a="close">تم</button>' });
    m.foot.addEventListener("click", function () { m.close(); });

    /* المظهر */
    function syncTheme() {
      body.querySelectorAll("#sTheme button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.t === Store.state.settings.theme));
      });
    }
    body.querySelector("#sTheme").addEventListener("click", function (e) {
      var b = e.target.closest("[data-t]"); if (!b) return;
      Store.saveSettings({ theme: b.dataset.t });
      applyTheme(); syncTheme(); render();
    });
    syncTheme();

    /* نطاق اليوم */
    var sStart = body.querySelector("#sStart"), sEnd = body.querySelector("#sEnd");
    for (var h = 0; h <= 12; h++) sStart.add(new Option(C.formatTime(h * 60), String(h * 60)));
    for (var h2 = 13; h2 <= 24; h2++) sEnd.add(new Option(h2 === 24 ? "منتصف الليل" : C.formatTime(h2 * 60), String(h2 * 60)));
    sStart.value = String(s.dayStart); sEnd.value = String(s.dayEnd);
    body.querySelector("#sSlot").value = String(s.slot);
    body.querySelector("#sSnap").value = String(s.snap);

    ["sStart", "sEnd", "sSlot", "sSnap"].forEach(function (id) {
      body.querySelector("#" + id).addEventListener("change", function () {
        var patch = {};
        var v = +body.querySelector("#" + id).value;
        if (id === "sStart") patch.dayStart = v;
        if (id === "sEnd") patch.dayEnd = v;
        if (id === "sSlot") patch.slot = v;
        if (id === "sSnap") patch.snap = v;
        if (patch.dayStart != null && patch.dayStart >= Store.state.settings.dayEnd) { UI.toast("بداية الجدول يجب أن تسبق نهايته."); return; }
        if (patch.dayEnd != null && patch.dayEnd <= Store.state.settings.dayStart) { UI.toast("نهاية الجدول يجب أن تلي بدايته."); return; }
        Store.saveSettings(patch); render();
      });
    });

    /* التصنيفات */
    var catWrap = body.querySelector("#sCats");
    function renderCats() {
      catWrap.innerHTML = "";
      Store.state.categories.forEach(function (c) {
        var row = document.createElement("div");
        row.className = "catrow";
        row.innerHTML =
          '<input type="color" value="' + c.color + '" class="catrow__dot" style="padding:0;border:0;background:none" aria-label="لون التصنيف">' +
          '<input class="control" value="' + C.escapeHtml(c.name) + '" maxlength="40" aria-label="اسم التصنيف">' +
          '<button class="catrow__del" title="حذف التصنيف" aria-label="حذف التصنيف">' + UI.ICON.trash + '</button>';
        var color = row.querySelector('input[type="color"]');
        var name = row.querySelector(".control");
        color.addEventListener("change", function () {
          c.color = color.value; Store.upsertCategory(c); render();
        });
        name.addEventListener("change", function () {
          c.name = (name.value || "").trim() || c.name; Store.upsertCategory(c); render();
        });
        row.querySelector(".catrow__del").addEventListener("click", function () {
          if (Store.state.categories.length <= 1) { UI.toast("يجب أن يبقى تصنيف واحد على الأقل."); return; }
          UI.confirm("حذف تصنيف", "المهام المرتبطة بـ«" + c.name + "» ستنتقل إلى التصنيف الأول.", "حذف")
            .then(function (yes) { if (yes) Store.removeCategory(c.id).then(function () { renderCats(); render(); }); });
        });
        catWrap.appendChild(row);
      });
    }
    renderCats();
    body.querySelector("#sAddCat").addEventListener("click", function () {
      var used = Store.state.categories.length;
      Store.upsertCategory({
        id: C.uid("cat"), name: "تصنيف " + (used + 1),
        color: C.PALETTE[used % C.PALETTE.length], sort: used
      }).then(function () { renderCats(); render(); });
    });

    /* البيانات */
    var cloud = body.querySelector("#sCloud");
    function renderCloud() {
      var isCloud = Store.mode === "cloud" && Store.user;
      cloud.innerHTML =
        '<div class="cloudbox__row">' +
          (isCloud
            ? '<span class="badge">محفوظ في السحابة</span><b>' + C.escapeHtml(Store.user.email || "") + '</b>'
            : '<span class="badge badge--warn">محلي على هذا الجهاز</span>') +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn btn--sm btn--ghost" data-a="export">تصدير نسخة احتياطية</button>' +
          '<button class="btn btn--sm btn--ghost" data-a="import">استيراد نسخة</button>' +
          (isCloud
            ? '<button class="btn btn--sm btn--danger" data-a="signout">' + UI.ICON.logout + ' خروج</button>'
            : '<button class="btn btn--sm btn--primary" data-a="login">إنشاء حساب / ربط سحابي</button>') +
        '</div>' +
        '<p class="hint">' + (isCloud
          ? 'كل المهام والتصنيفات والإعدادات تُحفظ في حسابك وتظهر على أي جهاز تسجّل الدخول منه.'
          : 'البيانات محفوظة في متصفح هذا الجهاز فقط. اربط حسابًا سحابيًا لمزامنتها بين أجهزتك.') + '</p>' +
        '<input type="file" accept="application/json,.json" id="impFile" hidden>';

      cloud.querySelector("#impFile").addEventListener("change", function (e) {
        var f = e.target.files[0]; if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          try { Store.importJson(r.result); m.close(); applyTheme(); render(); UI.toast("تم استيراد النسخة بنجاح."); }
          catch (err) { UI.toast("ملف غير صالح: " + err.message); }
        };
        r.readAsText(f);
      });
    }
    renderCloud();

    cloud.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      var a = b.dataset.a;
      if (a === "export") {
        var blob = new Blob([Store.exportJson()], { type: "application/json" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url; link.download = "yawmi-backup-" + C.todayYmd() + ".json";
        document.body.appendChild(link); link.click(); link.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      } else if (a === "import") {
        cloud.querySelector("#impFile").click();
      } else if (a === "signout") {
        Store.signOut().then(function () { m.close(); clearInterval(tickTimer); showAuth(); });
      } else if (a === "login") {
        m.close(); clearInterval(tickTimer);
        localStorage.removeItem("yawmi.mode.v1");
        showAuth();
      }
    });
  }

  /* ====================== بدء ====================== */

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.App = { render: render, view: view, openEditor: openEditor };
})(window);
