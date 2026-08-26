/* ==========================================================================
   ui.js — بناء الواجهة: شريط الأيام، رأس اليوم، شريط "الآن"، والجدول الزمني
   ========================================================================== */
(function (global) {
  "use strict";

  var C = global.Core, S = global.Schedule, Store = global.Store;
  var UI = {};

  /* ---------------------- أيقونات ---------------------- */
  var ICON = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
    cog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>'
  };
  UI.ICON = ICON;

  /* ---------------------- أدوات مساعدة ---------------------- */

  function isDark() { return document.documentElement.getAttribute("data-theme") === "dark"; }

  function categoryOf(id) {
    var list = Store.state.categories;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0] || { id: null, name: "بدون تصنيف", color: "#64748b" };
  }
  UI.categoryOf = categoryOf;

  function applyColorVars(el, hex) {
    var v = C.colorVars(hex, isDark());
    el.style.setProperty("--c-bg", v.bg);
    el.style.setProperty("--c-bd", v.bd);
    el.style.setProperty("--c-fg", v.fg);
    el.style.setProperty("--c-solid", v.solid);
  }
  UI.applyColorVars = applyColorVars;

  UI.slotHeight = function () {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--slot-h");
    var n = parseFloat(v);
    return isNaN(n) ? 56 : n;
  };

  UI.pxPerMinute = function () { return UI.slotHeight() / Store.state.settings.slot; };

  /* ---------------------- شريط الأيام ---------------------- */

  UI.renderDayStrip = function (root, view, onPick) {
    var dates = C.weekDates(view.date);
    var today = C.todayYmd();
    var busy = S.busyDays(dates);

    root.innerHTML =
      '<button class="daystrip__nav" data-nav="-1" title="الأسبوع السابق" aria-label="الأسبوع السابق">' + ICON.next + '</button>' +
      '<div class="daystrip__days"></div>' +
      '<button class="daystrip__nav" data-nav="1" title="الأسبوع التالي" aria-label="الأسبوع التالي">' + ICON.prev + '</button>';

    var wrap = root.querySelector(".daystrip__days");
    dates.forEach(function (d) {
      var b = document.createElement("button");
      b.className = "daybtn" + (d === today ? " daybtn--today" : "");
      b.setAttribute("aria-pressed", String(d === view.date));
      b.dataset.date = d;
      b.innerHTML =
        '<span class="daybtn__n">' + C.DAY_SHORT[C.dayOfWeek(d)] + '</span>' +
        '<span class="daybtn__d">' + C.parseYmd(d).getDate() + '</span>' +
        (busy[d] ? '<i class="daybtn__dot"></i>' : "");
      b.addEventListener("click", function () { onPick(d); });
      wrap.appendChild(b);
    });

    root.querySelectorAll("[data-nav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        onPick(C.addDays(view.date, 7 * (+btn.dataset.nav)));
      });
    });
  };

  /* ---------------------- رأس اليوم ---------------------- */

  UI.renderDayHead = function (root, view, occs, sum) {
    var isWeek = view.mode === "week";
    var title, sub;
    if (isWeek) {
      var wd = C.weekDates(view.date);
      title = "أسبوع " + C.formatDate(wd[0]);
      sub = C.formatDate(wd[0]) + " — " + C.formatDate(wd[6]);
    } else {
      title = C.dayName(view.date) + (C.relativeDay(view.date) !== C.dayName(view.date) ? " · " + C.relativeDay(view.date) : "");
      sub = C.formatDate(view.date);
    }

    root.innerHTML =
      '<div class="dayhead__top">' +
        '<div>' +
          '<div class="dayhead__title">' + C.escapeHtml(title) + '</div>' +
          '<div class="dayhead__date">' + C.escapeHtml(sub) + '</div>' +
        '</div>' +
        '<div class="dayhead__actions">' +
          '<button class="btn btn--ghost" data-act="today">اليوم</button>' +
          '<button class="btn btn--ghost btn--icon" data-act="prev" title="السابق" aria-label="السابق">' + ICON.next + '</button>' +
          '<button class="btn btn--ghost btn--icon" data-act="next" title="التالي" aria-label="التالي">' + ICON.prev + '</button>' +
          '<button class="btn btn--primary btn--add" data-act="add">' + ICON.plus + ' مهمة جديدة</button>' +
        '</div>' +
      '</div>' +
      '<div class="stats">' +
        stat("عدد المهام", sum.count) +
        stat("المكتملة", sum.done + ' <small>من ' + sum.count + '</small>') +
        stat("إجمالي الوقت المخطط", C.formatDuration(sum.planned)) +
        stat(isWeek ? "المتبقي من الأسبوع" : "المتبقي في اليوم", C.formatDuration(sum.leftInDay)) +
        stat("وقت متاح غير مخطط", C.formatDuration(sum.free)) +
      '</div>' +
      '<div class="progress"><i style="width:' + sum.percent + '%"></i></div>';

    function stat(k, v) {
      return '<div class="stat"><div class="stat__k">' + k + '</div><div class="stat__v">' + v + '</div></div>';
    }
  };

  /* ---------------------- شريط المهمة الحالية ---------------------- */

  UI.renderNowBar = function (root, view, occs, nowMin) {
    if (view.date !== C.todayYmd()) { root.hidden = true; return; }
    root.hidden = false;

    var cn = S.currentAndNext(occs, nowMin);
    var cur = cn.current, nxt = cn.next;

    root.classList.toggle("nowbar--idle", !cur);

    var left;
    if (cur) {
      var cat = categoryOf(cur.categoryId);
      left =
        '<div>' +
          '<div class="nowbar__k"><i></i> المهمة الحالية</div>' +
          '<div class="nowbar__t">' + C.escapeHtml(cur.title) + '</div>' +
          '<div class="nowbar__s">تنتهي الساعة ' + C.formatTime(cur.end) +
            ' · باقٍ ' + C.formatDuration(cur.end - nowMin) +
            ' · ' + C.escapeHtml(cat.name) + '</div>' +
        '</div>';
    } else {
      left =
        '<div>' +
          '<div class="nowbar__k">الآن</div>' +
          '<div class="nowbar__t">لا توجد مهمة جارية</div>' +
          '<div class="nowbar__s">الوقت ' + C.formatTime(nowMin) + ' — وقت حر</div>' +
        '</div>';
    }

    var right;
    if (nxt) {
      right =
        '<div>' +
          '<div class="nowbar__k">المهمة التالية</div>' +
          '<div class="nowbar__t">' + C.escapeHtml(nxt.title) + ' — ' + C.formatTime(nxt.start) + '</div>' +
          '<div class="nowbar__s">تبدأ بعد ' + C.formatDuration(nxt.start - nowMin) + '</div>' +
        '</div>';
    } else {
      right =
        '<div>' +
          '<div class="nowbar__k">المهمة التالية</div>' +
          '<div class="nowbar__t">لا شيء بعد ذلك</div>' +
          '<div class="nowbar__s">بقية اليوم فارغة</div>' +
        '</div>';
    }

    root.innerHTML = left + '<div class="nowbar__div"></div>' + right;
  };

  /* ---------------------- الجدول ---------------------- */

  /**
   * @param {HTMLElement} root  عنصر .board
   * @param {object} view       {mode, date}
   * @param {object} handlers   {onCellClick, onBlockOpen, onBlockMenu, onDragStart}
   */
  UI.renderBoard = function (root, view, handlers) {
    var st = Store.state, s = st.settings;
    var dates = view.mode === "week" ? C.weekDates(view.date) : [view.date];
    var today = C.todayYmd();
    var nowMin = C.nowMinutes();
    var slots = Math.max(1, Math.round((s.dayEnd - s.dayStart) / s.slot));
    var pxm = UI.pxPerMinute();

    root.classList.toggle("board--week", view.mode === "week");

    /* --- الرأس --- */
    var head = document.createElement("div");
    head.className = "board__head";
    head.innerHTML = '<div class="board__head-gutter"></div><div class="board__head-cols"></div>';
    var headCols = head.querySelector(".board__head-cols");
    headCols.style.gridTemplateColumns = "repeat(" + dates.length + ", minmax(0,1fr))";
    dates.forEach(function (d) {
      var el = document.createElement("button");
      el.className = "colhead" + (d === today ? " colhead--today" : "");
      if (view.mode === "week" && d === view.date) el.dataset.sel = "1";
      el.innerHTML =
        '<div class="colhead__n">' + C.DAY_NAMES[C.dayOfWeek(d)] + '</div>' +
        '<div class="colhead__d">' + C.parseYmd(d).getDate() +
          '<span class="colhead__mo"> ' + C.MONTHS[C.parseYmd(d).getMonth()] + '</span></div>';
      el.addEventListener("click", function () { handlers.onColumnPick && handlers.onColumnPick(d); });
      headCols.appendChild(el);
    });

    /* --- الجسم --- */
    var body = document.createElement("div");
    body.className = "board__body";

    var gutter = document.createElement("div");
    gutter.className = "gutter";
    for (var i = 0; i < slots; i++) {
      var min = s.dayStart + i * s.slot;
      var g = document.createElement("div");
      g.className = "gutter__slot" + (min % 60 === 0 ? " gutter__slot--hour" : "");
      g.innerHTML = '<b style="' + (i === 0 ? "top:2px" : "") + '">' + C.formatTimeShort(min) + '</b>';
      gutter.appendChild(g);
    }

    var cols = document.createElement("div");
    cols.className = "cols";
    cols.style.gridTemplateColumns = "repeat(" + dates.length + ", minmax(0,1fr))";

    dates.forEach(function (d) {
      var col = document.createElement("div");
      col.className = "col" + (d < today ? " col--past" : "") + (view.mode === "week" && d === view.date ? " col--sel" : "");
      col.dataset.date = d;

      for (var k = 0; k < slots; k++) {
        var m = s.dayStart + k * s.slot;
        var cell = document.createElement("div");
        cell.className = "cell" + (m % 60 === 0 ? " cell--hour" : "");
        cell.dataset.min = m;
        cell.dataset.date = d;
        col.appendChild(cell);
      }

      var blocks = document.createElement("div");
      blocks.className = "blocks";
      col.appendChild(blocks);

      /* المهام */
      var occs = S.layout(S.occurrencesFor(d, { today: today, nowMin: nowMin }));
      occs.forEach(function (o) { blocks.appendChild(buildBlock(o, s, pxm, dates.length > 1)); });

      /* خط الوقت الحالي */
      if (d === today && nowMin >= s.dayStart && nowMin <= s.dayEnd) {
        var line = document.createElement("div");
        line.className = "nowline";
        line.style.top = ((nowMin - s.dayStart) * pxm) + "px";
        col.appendChild(line);
      }

      cols.appendChild(col);
    });

    /* شارة الوقت الحالي داخل عمود الساعات حتى لا تغطّي أي مهمة */
    if (dates.indexOf(today) !== -1 && nowMin >= s.dayStart && nowMin <= s.dayEnd) {
      var lbl = document.createElement("div");
      lbl.className = "nowlabel";
      lbl.style.top = ((nowMin - s.dayStart) * pxm - 9) + "px";
      lbl.textContent = C.formatTimeShort(nowMin);
      gutter.appendChild(lbl);
    }

    body.appendChild(gutter);
    body.appendChild(cols);

    root.innerHTML = "";
    root.appendChild(head);
    root.appendChild(body);
  };

  function buildBlock(o, s, pxm, compact) {
    var el = document.createElement("div");
    var cat = categoryOf(o.categoryId);

    var vStart = C.clamp(o.start, s.dayStart, s.dayEnd);
    var vEnd = C.clamp(o.end, s.dayStart, s.dayEnd);
    var h = Math.max(20, (vEnd - vStart) * pxm - 3);
    var short = h < 42;

    el.className = "block block--" + o.state + (short ? " block--short" : "") + (o.state === "now" ? " block--live" : "");
    el.dataset.key = o.key;
    el.dataset.taskId = o.taskId;
    el.dataset.date = o.date;
    el.style.top = ((vStart - s.dayStart) * pxm + 1.5) + "px";
    el.style.height = h + "px";
    el.style.insetInlineStart = "calc(" + (o.col / o.cols * 100) + "% + 3px)";
    el.style.width = "calc(" + (100 / o.cols) + "% - 6px)";
    el.style.zIndex = String(2 + o.col);
    applyColorVars(el, cat.color);

    var badges = "";
    if (o.isRecurring) badges += "<span title=\"مهمة متكررة\">⟳</span>";
    if (o.state === "done") badges += "<span>✓</span>";
    if (o.state === "postponed") badges += "<span>↷</span>";
    if (o.start < s.dayStart) badges += "<span title=\"تبدأ قبل بداية الجدول\">▲</span>";
    if (o.end > s.dayEnd) badges += "<span title=\"تمتد بعد نهاية الجدول\">▼</span>";

    var timeText = C.formatTime(o.start) + " – " + C.formatTime(o.end);
    el.innerHTML =
      '<div class="block__rs block__rs--t" data-rs="t"></div>' +
      '<div class="block__t">' + C.escapeHtml(o.title) +
        (badges ? '<span class="block__badges">' + badges + '</span>' : "") + '</div>' +
      '<div class="block__m">' + (compact ? C.formatTimeShort(o.start) + " – " + C.formatTimeShort(o.end) : timeText + (short ? "" : " · " + C.formatDuration(o.duration) + " · " + C.escapeHtml(cat.name))) + '</div>' +
      '<button class="block__grip" title="اسحب لتغيير الوقت" aria-label="اسحب لتغيير الوقت">' + ICON.grip + '</button>' +
      '<div class="block__rs block__rs--b" data-rs="b"></div>';

    el.__occ = o;
    return el;
  }
  UI.buildBlock = buildBlock;

  /* ---------------------- التنبيهات ---------------------- */

  var toastTimer = null;
  UI.toast = function (text, actionLabel, onAction) {
    var root = document.getElementById("toastRoot");
    root.innerHTML = "";
    var el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span>' + C.escapeHtml(text) + '</span>';
    if (actionLabel) {
      var b = document.createElement("button");
      b.textContent = actionLabel;
      b.addEventListener("click", function () { root.innerHTML = ""; onAction && onAction(); });
      el.appendChild(b);
    }
    root.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { root.innerHTML = ""; }, actionLabel ? 7000 : 3200);
  };

  /* ---------------------- النوافذ المنبثقة ---------------------- */

  UI.openModal = function (opts) {
    var root = document.getElementById("modalRoot");
    var overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML =
      '<div class="modal' + (opts.wide ? " modal--wide" : "") + '" role="dialog" aria-modal="true">' +
        '<div class="modal__head">' +
          '<div class="modal__title">' + C.escapeHtml(opts.title) + '</div>' +
          '<button class="modal__x" aria-label="إغلاق">' + ICON.x + '</button>' +
        '</div>' +
        '<div class="modal__body"></div>' +
        '<div class="modal__foot"></div>' +
      '</div>';

    var body = overlay.querySelector(".modal__body");
    var foot = overlay.querySelector(".modal__foot");
    if (typeof opts.body === "string") body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    if (!opts.footer) foot.remove();
    else if (typeof opts.footer === "string") foot.innerHTML = opts.footer; else foot.appendChild(opts.footer);

    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      UI.modalOpen = root.children.length > 0;
      opts.onClose && opts.onClose();
    }
    function onKey(e) { if (e.key === "Escape") close(); }

    overlay.querySelector(".modal__x").addEventListener("click", close);
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);

    root.appendChild(overlay);
    UI.modalOpen = true;

    var api = { el: overlay, body: body, foot: foot, close: close };
    opts.onReady && opts.onReady(api);
    return api;
  };

  UI.confirm = function (title, message, confirmLabel) {
    return new Promise(function (resolve) {
      var done = false;
      var m = UI.openModal({
        title: title,
        body: '<p class="hint" style="font-size:14px;color:var(--text-2)">' + C.escapeHtml(message) + '</p>',
        footer: '<button class="btn btn--ghost grow" data-a="no">إلغاء</button>' +
                '<button class="btn btn--danger grow" data-a="yes">' + C.escapeHtml(confirmLabel || "تأكيد") + '</button>',
        onClose: function () { if (!done) resolve(false); }
      });
      m.foot.addEventListener("click", function (e) {
        var b = e.target.closest("[data-a]"); if (!b) return;
        done = true; m.close(); resolve(b.dataset.a === "yes");
      });
    });
  };

  /** اختيار نطاق التعديل لمهمة متكررة: هذا الموعد فقط أم كل المواعيد */
  UI.askScope = function (verb) {
    return new Promise(function (resolve) {
      var done = false;
      var m = UI.openModal({
        title: "مهمة متكررة",
        body: '<p class="hint" style="font-size:14px;color:var(--text-2)">هذه المهمة تتكرر في أكثر من يوم. أين تريد تطبيق ' +
              C.escapeHtml(verb || "التغيير") + '؟</p>',
        footer: '<button class="btn btn--ghost grow" data-a="one">هذا الموعد فقط</button>' +
                '<button class="btn btn--primary grow" data-a="all">كل المواعيد</button>',
        onClose: function () { if (!done) resolve(null); }
      });
      m.foot.addEventListener("click", function (e) {
        var b = e.target.closest("[data-a]"); if (!b) return;
        done = true; m.close(); resolve(b.dataset.a);
      });
    });
  };

  global.UI = UI;
})(window);
