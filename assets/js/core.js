/* ==========================================================================
   core.js — الثوابت وأدوات الوقت والتاريخ
   ========================================================================== */
(function (global) {
  "use strict";

  /* --- أسماء الأيام (مرتبة حسب Date.getDay: 0 = الأحد) --- */
  var DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  var DAY_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
  var MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  /* الأسبوع يبدأ من السبت: السبت، الأحد، ... الجمعة */
  var WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

  var STATUS = {
    todo:      { key: "todo",      label: "لم تبدأ",     icon: "○" },
    now:       { key: "now",       label: "الآن",        icon: "◉" },
    done:      { key: "done",      label: "مكتملة",      icon: "✓" },
    missed:    { key: "missed",    label: "تم تجاوزها",  icon: "⤫" },
    postponed: { key: "postponed", label: "مؤجلة",       icon: "↷" }
  };

  /* الحالات التي يمكن للمستخدم اختيارها يدويًا (البقية تُحسب من الوقت) */
  var MANUAL_STATUSES = ["todo", "done", "postponed"];

  var PALETTE = [
    "#4f46e5", "#0ea5e9", "#06b6d4", "#10b981", "#84cc16",
    "#eab308", "#f59e0b", "#f97316", "#ef4444", "#ec4899",
    "#a855f7", "#8b5cf6", "#64748b", "#0f766e", "#b45309", "#be123c"
  ];

  var DEFAULT_CATEGORIES = [
    { id: "cat_study",   name: "دراسة",      color: "#4f46e5", sort: 0 },
    { id: "cat_work",    name: "عمل",        color: "#0ea5e9", sort: 1 },
    { id: "cat_project", name: "مشروع",      color: "#a855f7", sort: 2 },
    { id: "cat_sport",   name: "رياضة",      color: "#10b981", sort: 3 },
    { id: "cat_meeting", name: "اجتماع",     color: "#f59e0b", sort: 4 },
    { id: "cat_rest",    name: "راحة",       color: "#64748b", sort: 5 },
    { id: "cat_personal",name: "وقت شخصي",   color: "#ec4899", sort: 6 }
  ];

  var DEFAULT_SETTINGS = {
    dayStart: 6 * 60,   // بداية الجدول بالدقائق
    dayEnd: 24 * 60,    // نهاية الجدول
    slot: 30,           // مدة الخانة الواحدة بالدقائق
    snap: 15,           // دقة السحب والتحجيم
    theme: "auto",      // auto | light | dark
    defaultDuration: 60
  };

  /* ---------------------- التاريخ ---------------------- */

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  /** تحويل كائن تاريخ إلى نص YYYY-MM-DD بالتوقيت المحلي */
  function ymd(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  /** تحويل YYYY-MM-DD إلى كائن تاريخ محلي (منتصف الليل) */
  function parseYmd(s) {
    var p = String(s).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2], 0, 0, 0, 0);
  }

  function addDays(s, n) {
    var d = parseYmd(s);
    d.setDate(d.getDate() + n);
    return ymd(d);
  }

  function todayYmd() { return ymd(new Date()); }

  function dayOfWeek(s) { return parseYmd(s).getDay(); }

  /** أول يوم في الأسبوع (السبت) بالنسبة لتاريخ معيّن */
  function weekStart(s) {
    var d = parseYmd(s);
    var back = (d.getDay() + 1) % 7; // السبت = 6 → 0
    d.setDate(d.getDate() - back);
    return ymd(d);
  }

  function weekDates(s) {
    var start = weekStart(s), out = [];
    for (var i = 0; i < 7; i++) out.push(addDays(start, i));
    return out;
  }

  function diffDays(a, b) {
    return Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
  }

  function formatDate(s) {
    var d = parseYmd(s);
    return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
  }

  function dayName(s) { return DAY_NAMES[parseYmd(s).getDay()]; }

  /** وصف نسبي: اليوم / أمس / غدًا / اسم اليوم */
  function relativeDay(s) {
    var n = diffDays(todayYmd(), s);
    if (n === 0) return "اليوم";
    if (n === 1) return "غدًا";
    if (n === -1) return "أمس";
    if (n === 2) return "بعد غد";
    if (n === -2) return "أول أمس";
    return dayName(s);
  }

  /* ---------------------- الوقت ---------------------- */

  /** "07:30" → 450 */
  function toMinutes(hhmm) {
    if (hhmm == null || hhmm === "") return null;
    var p = String(hhmm).split(":");
    return (+p[0]) * 60 + (+p[1] || 0);
  }

  /** 450 → "07:30" (لحقول input type=time) */
  function toHHMM(min) {
    min = ((Math.round(min) % 1440) + 1440) % 1440;
    return pad(Math.floor(min / 60)) + ":" + pad(min % 60);
  }

  /** 450 → "7:30 ص" */
  function formatTime(min) {
    var m = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60), mm = m % 60;
    var suffix = h < 12 ? "ص" : "م";
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ":" + pad(mm) + " " + suffix;
  }

  /** 450 → "7:30" بدون لاحقة (للاستخدام داخل الخانات الضيّقة) */
  function formatTimeShort(min) {
    var m = ((Math.round(min) % 1440) + 1440) % 1440;
    var h = Math.floor(m / 60) % 12; if (h === 0) h = 12;
    return h + ":" + pad(m % 60);
  }

  /** 90 → "ساعة ونصف" بشكل مختصر: "1 س 30 د" */
  function formatDuration(min) {
    min = Math.max(0, Math.round(min));
    var h = Math.floor(min / 60), m = min % 60;
    if (h && m) return h + " س " + m + " د";
    if (h) return h + " س";
    return m + " د";
  }

  function nowMinutes(d) {
    d = d || new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  function snapTo(v, step) { return Math.round(v / step) * step; }

  /* ---------------------- متفرقات ---------------------- */

  function uid(prefix) {
    var rnd = (global.crypto && global.crypto.randomUUID)
      ? global.crypto.randomUUID()
      : (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
    return prefix ? prefix + "_" + rnd : rnd;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /** ألوان مشتقة من لون التصنيف تناسب الوضع الفاتح والداكن */
  function colorVars(hex, dark) {
    var c = hexToRgb(hex) || { r: 79, g: 70, b: 229 };
    if (dark) {
      return {
        bg: "rgba(" + c.r + "," + c.g + "," + c.b + ",.22)",
        bd: "rgba(" + c.r + "," + c.g + "," + c.b + ",.45)",
        fg: mixWithWhite(c, .72),
        solid: hex
      };
    }
    return {
      bg: "rgba(" + c.r + "," + c.g + "," + c.b + ",.13)",
      bd: "rgba(" + c.r + "," + c.g + "," + c.b + ",.32)",
      fg: darken(c, .55),
      solid: hex
    };
  }

  function hexToRgb(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || "").trim());
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
  }

  function darken(c, amount) {
    return "rgb(" + Math.round(c.r * amount) + "," + Math.round(c.g * amount) + "," + Math.round(c.b * amount) + ")";
  }

  function mixWithWhite(c, t) {
    return "rgb(" + Math.round(c.r + (255 - c.r) * t) + "," +
                    Math.round(c.g + (255 - c.g) * t) + "," +
                    Math.round(c.b + (255 - c.b) * t) + ")";
  }

  global.Core = {
    DAY_NAMES: DAY_NAMES, DAY_SHORT: DAY_SHORT, MONTHS: MONTHS, WEEK_ORDER: WEEK_ORDER,
    STATUS: STATUS, MANUAL_STATUSES: MANUAL_STATUSES, PALETTE: PALETTE,
    DEFAULT_CATEGORIES: DEFAULT_CATEGORIES, DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    pad: pad, ymd: ymd, parseYmd: parseYmd, addDays: addDays, todayYmd: todayYmd,
    dayOfWeek: dayOfWeek, weekStart: weekStart, weekDates: weekDates, diffDays: diffDays,
    formatDate: formatDate, dayName: dayName, relativeDay: relativeDay,
    toMinutes: toMinutes, toHHMM: toHHMM, formatTime: formatTime, formatTimeShort: formatTimeShort,
    formatDuration: formatDuration, nowMinutes: nowMinutes,
    clamp: clamp, snapTo: snapTo, uid: uid, escapeHtml: escapeHtml, colorVars: colorVars
  };
})(window);
