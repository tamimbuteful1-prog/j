/* ==========================================================================
   schedule.js — توليد مواعيد المهام (بما فيها المتكررة)، حساب الحالة، وتوزيع
   الكتل المتداخلة على أعمدة داخل اليوم.
   ========================================================================== */
(function (global) {
  "use strict";

  var C = global.Core;
  var Schedule = {};

  /** هل تظهر هذه المهمة في هذا التاريخ؟ */
  function occursOn(task, date) {
    if (!task.date) return false;
    var type = task.recurType || "none";
    if (type === "none") return task.date === date;
    if (date < task.date) return false;
    if (task.recurUntil && date > task.recurUntil) return false;
    if (type === "daily") return true;
    if (type === "weekly") {
      var days = task.recurDays && task.recurDays.length ? task.recurDays : [C.dayOfWeek(task.date)];
      return days.indexOf(C.dayOfWeek(date)) !== -1;
    }
    return false;
  }
  Schedule.occursOn = occursOn;

  /** الحالة المحسوبة: لم تبدأ / الآن / مكتملة / تم تجاوزها / مؤجلة */
  function computeState(occ, today, nowMin) {
    if (occ.status === "done") return "done";
    if (occ.status === "postponed") return "postponed";
    if (occ.date < today) return "missed";
    if (occ.date > today) return "todo";
    if (nowMin >= occ.end) return "missed";
    if (nowMin >= occ.start) return "now";
    return "todo";
  }
  Schedule.computeState = computeState;

  /**
   * كل مواعيد يوم واحد، مرتّبة حسب وقت البداية.
   * @param {string} date  YYYY-MM-DD
   */
  Schedule.occurrencesFor = function (date, opts) {
    opts = opts || {};
    var st = global.Store.state;
    var today = opts.today || C.todayYmd();
    var nowMin = opts.nowMin != null ? opts.nowMin : C.nowMinutes();
    var out = [];

    st.tasks.forEach(function (task) {
      if (!occursOn(task, date)) return;
      var ov = (st.overrides[task.id] || {})[date] || null;
      if (ov && ov.deleted) return;

      var isRecurring = (task.recurType || "none") !== "none";
      var occ = {
        key: task.id + "@" + date,
        taskId: task.id,
        task: task,
        date: date,
        title: (ov && ov.title) || task.title,
        notes: task.notes || "",
        categoryId: task.categoryId,
        start: ov && ov.start != null ? ov.start : task.start,
        end: ov && ov.end != null ? ov.end : task.end,
        status: ov && ov.status ? ov.status : (isRecurring ? "todo" : (task.status || "todo")),
        isRecurring: isRecurring,
        hasOverride: !!ov
      };
      if (occ.end <= occ.start) occ.end = occ.start + 15;
      occ.duration = occ.end - occ.start;
      occ.state = computeState(occ, today, nowMin);
      out.push(occ);
    });

    out.sort(function (a, b) { return a.start - b.start || a.end - b.end || a.title.localeCompare(b.title, "ar"); });
    return out;
  };

  /**
   * توزيع المواعيد المتداخلة على أعمدة داخل نفس اليوم.
   * يضيف لكل موعد: col (رقم العمود) و cols (عدد الأعمدة في مجموعته).
   */
  Schedule.layout = function (occs) {
    var i = 0;
    while (i < occs.length) {
      // تحديد مجموعة متداخلة
      var group = [occs[i]];
      var groupEnd = occs[i].end;
      var j = i + 1;
      while (j < occs.length && occs[j].start < groupEnd) {
        group.push(occs[j]);
        if (occs[j].end > groupEnd) groupEnd = occs[j].end;
        j++;
      }
      // توزيع أعمدة جشِع
      var colEnds = [];
      group.forEach(function (o) {
        var placed = false;
        for (var k = 0; k < colEnds.length; k++) {
          if (colEnds[k] <= o.start) { o.col = k; colEnds[k] = o.end; placed = true; break; }
        }
        if (!placed) { o.col = colEnds.length; colEnds.push(o.end); }
      });
      var total = colEnds.length;
      group.forEach(function (o) { o.cols = total; });
      i = j;
    }
    return occs;
  };

  /** ملخّص اليوم: عدد المهام، المكتملة، الوقت المخطط، الوقت المتبقي */
  Schedule.summary = function (date, occs, opts) {
    opts = opts || {};
    var st = global.Store.state;
    var today = opts.today || C.todayYmd();
    var nowMin = opts.nowMin != null ? opts.nowMin : C.nowMinutes();
    var planned = 0, done = 0, doneMinutes = 0, remainingPlanned = 0;

    occs.forEach(function (o) {
      planned += o.duration;
      if (o.state === "done") { done++; doneMinutes += o.duration; }
      else if (o.state !== "missed") remainingPlanned += Math.max(0, o.end - Math.max(o.start, date === today ? nowMin : o.start));
    });

    var dayEnd = st.settings.dayEnd;
    var leftInDay;
    if (date > today) leftInDay = dayEnd - st.settings.dayStart;
    else if (date < today) leftInDay = 0;
    else leftInDay = Math.max(0, dayEnd - nowMin);

    return {
      count: occs.length,
      done: done,
      planned: planned,
      doneMinutes: doneMinutes,
      remainingPlanned: Math.round(remainingPlanned),
      leftInDay: Math.round(leftInDay),
      free: Math.max(0, Math.round(leftInDay - remainingPlanned)),
      percent: occs.length ? Math.round((done / occs.length) * 100) : 0
    };
  };

  /** المهمة الجارية الآن والمهمة التالية داخل اليوم */
  Schedule.currentAndNext = function (occs, nowMin) {
    var current = null, next = null;
    for (var i = 0; i < occs.length; i++) {
      var o = occs[i];
      if (o.state === "done" || o.state === "postponed") continue;
      if (nowMin >= o.start && nowMin < o.end) { if (!current) current = o; }
    }
    for (var k = 0; k < occs.length; k++) {
      var t = occs[k];
      if (t.start > nowMin && t.state !== "done" && t.state !== "postponed") {
        if (!next || t.start < next.start) next = t;
      }
    }
    return { current: current, next: next };
  };

  /** الأيام التي تحتوي على مهام ضمن قائمة تواريخ (لنقاط شريط الأيام) */
  Schedule.busyDays = function (dates) {
    var map = {};
    dates.forEach(function (d) {
      var st = global.Store.state, found = false;
      for (var i = 0; i < st.tasks.length; i++) {
        if (occursOn(st.tasks[i], d)) {
          var ov = (st.overrides[st.tasks[i].id] || {})[d];
          if (!(ov && ov.deleted)) { found = true; break; }
        }
      }
      map[d] = found;
    });
    return map;
  };

  global.Schedule = Schedule;
})(window);
