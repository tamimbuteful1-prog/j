/* ==========================================================================
   store.js — طبقة البيانات: التخزين المحلي + قاعدة البيانات السحابية (Supabase)
   --------------------------------------------------------------------------
   الحالة في الذاكرة:
     categories: [{id, name, color, sort}]
     tasks:      [{id, title, notes, categoryId, date, start, end,
                   recurType:'none'|'daily'|'weekly', recurDays:[0..6],
                   recurUntil:null|'YYYY-MM-DD', status, createdAt, updatedAt}]
     overrides:  { taskId: { 'YYYY-MM-DD': {status, start, end, title, deleted} } }
     settings:   {...}
   ========================================================================== */
(function (global) {
  "use strict";

  var C = global.Core;
  var LS_DATA = "yawmi.data.v1";
  var LS_MODE = "yawmi.mode.v1";
  var LS_CLOUD = "yawmi.cloud.v1";

  var Store = {
    mode: "local",          // local | cloud
    user: null,
    client: null,
    ready: false,
    onError: function () {},
    state: emptyState()
  };

  function emptyState() {
    return {
      categories: C.DEFAULT_CATEGORIES.map(function (c) { return Object.assign({}, c); }),
      tasks: [],
      overrides: {},
      settings: Object.assign({}, C.DEFAULT_SETTINGS)
    };
  }

  /* ---------------------- إعدادات السحابة ---------------------- */

  Store.getCloudConfig = function () {
    try {
      var raw = localStorage.getItem(LS_CLOUD);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    if (global.SUPABASE_CONFIG && global.SUPABASE_CONFIG.url && global.SUPABASE_CONFIG.anonKey) {
      return { url: global.SUPABASE_CONFIG.url, key: global.SUPABASE_CONFIG.anonKey };
    }
    return null;
  };

  Store.setCloudConfig = function (url, key) {
    localStorage.setItem(LS_CLOUD, JSON.stringify({ url: url, key: key }));
    Store.client = null;
  };

  Store.clearCloudConfig = function () { localStorage.removeItem(LS_CLOUD); Store.client = null; };

  Store.cloudAvailable = function () {
    return !!(global.supabase && global.supabase.createClient && Store.getCloudConfig());
  };

  function client() {
    if (Store.client) return Store.client;
    var cfg = Store.getCloudConfig();
    if (!cfg || !global.supabase) return null;
    Store.client = global.supabase.createClient(cfg.url, cfg.key, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "yawmi.auth" }
    });
    return Store.client;
  }
  Store.client_ = client;

  /* ---------------------- الدخول ---------------------- */

  Store.restoreSession = function () {
    var c = client();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (r) {
      var s = r && r.data && r.data.session;
      if (s && s.user) { Store.user = { id: s.user.id, email: s.user.email }; return Store.user; }
      return null;
    }).catch(function () { return null; });
  };

  Store.signUp = function (email, password) {
    var c = client();
    if (!c) return Promise.reject(new Error("لم يتم إعداد الاتصال بقاعدة البيانات."));
    return c.auth.signUp({ email: email, password: password }).then(function (r) {
      if (r.error) throw r.error;
      if (r.data.session && r.data.user) {
        Store.user = { id: r.data.user.id, email: r.data.user.email };
        return { needsConfirm: false };
      }
      return { needsConfirm: true };
    });
  };

  Store.signIn = function (email, password) {
    var c = client();
    if (!c) return Promise.reject(new Error("لم يتم إعداد الاتصال بقاعدة البيانات."));
    return c.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
      if (r.error) throw r.error;
      Store.user = { id: r.data.user.id, email: r.data.user.email };
      return Store.user;
    });
  };

  Store.sendMagicLink = function (email) {
    var c = client();
    if (!c) return Promise.reject(new Error("لم يتم إعداد الاتصال بقاعدة البيانات."));
    return c.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: location.href.split("#")[0] }
    }).then(function (r) { if (r.error) throw r.error; return true; });
  };

  Store.signOut = function () {
    var c = client();
    var p = c ? c.auth.signOut().catch(function () {}) : Promise.resolve();
    return p.then(function () {
      Store.user = null;
      Store.mode = "local";
      localStorage.removeItem(LS_MODE);
    });
  };

  /* ---------------------- التحميل ---------------------- */

  Store.useLocal = function () {
    Store.mode = "local";
    localStorage.setItem(LS_MODE, "local");
    return Store.load();
  };

  Store.useCloud = function () {
    Store.mode = "cloud";
    localStorage.setItem(LS_MODE, "cloud");
    return Store.load();
  };

  Store.savedMode = function () { return localStorage.getItem(LS_MODE); };

  Store.load = function () {
    if (Store.mode === "cloud" && Store.user) return loadCloud();
    loadLocal();
    Store.ready = true;
    return Promise.resolve(Store.state);
  };

  function cacheKey() {
    return LS_DATA + (Store.mode === "cloud" && Store.user ? ":" + Store.user.id : "");
  }

  function loadLocal() {
    var raw = null;
    try { raw = localStorage.getItem(cacheKey()); } catch (e) {}
    if (!raw) { Store.state = emptyState(); return; }
    try {
      var d = JSON.parse(raw);
      Store.state = {
        categories: Array.isArray(d.categories) && d.categories.length ? d.categories : emptyState().categories,
        tasks: Array.isArray(d.tasks) ? d.tasks : [],
        overrides: d.overrides && typeof d.overrides === "object" ? d.overrides : {},
        settings: Object.assign({}, C.DEFAULT_SETTINGS, d.settings || {})
      };
    } catch (e) {
      Store.state = emptyState();
    }
  }

  function persistLocal() {
    try { localStorage.setItem(cacheKey(), JSON.stringify(Store.state)); }
    catch (e) { Store.onError("تعذّر الحفظ محليًا (المساحة ممتلئة)."); }
  }
  Store.persistLocal = persistLocal;

  function loadCloud() {
    var c = client();
    if (!c) { loadLocal(); Store.ready = true; return Promise.resolve(Store.state); }
    var uid = Store.user.id;
    loadLocal(); // نعرض النسخة المخزّنة فورًا ثم نحدّثها من السحابة
    return Promise.all([
      c.from("categories").select("*").eq("user_id", uid).order("sort", { ascending: true }),
      c.from("tasks").select("*").eq("user_id", uid),
      c.from("task_overrides").select("*").eq("user_id", uid),
      c.from("user_settings").select("*").eq("user_id", uid).maybeSingle()
    ]).then(function (res) {
      var err = res.find(function (r) { return r.error; });
      if (err) throw err.error;

      var cats = (res[0].data || []).map(rowToCategory);
      if (!cats.length) {
        cats = emptyState().categories;
        // أول دخول: نزرع التصنيفات الافتراضية في الحساب
        c.from("categories").insert(cats.map(function (x) { return categoryToRow(x, uid); }))
          .then(function () {}, function () {});
      }
      var overrides = {};
      (res[2].data || []).forEach(function (r) {
        (overrides[r.task_id] || (overrides[r.task_id] = {}))[r.date] = rowToOverride(r);
      });

      Store.state = {
        categories: cats,
        tasks: (res[1].data || []).map(rowToTask),
        overrides: overrides,
        settings: Object.assign({}, C.DEFAULT_SETTINGS, (res[3].data && res[3].data.data) || {})
      };
      persistLocal();
      Store.ready = true;
      return Store.state;
    }).catch(function (e) {
      Store.ready = true;
      Store.onError("تعذّر تحميل البيانات من السحابة، يتم العرض من النسخة المحفوظة. " + msg(e));
      return Store.state;
    });
  }

  function msg(e) { return (e && (e.message || e.error_description)) || ""; }

  /* ---------------------- التحويل بين الصفوف والكائنات ---------------------- */

  function rowToCategory(r) { return { id: r.id, name: r.name, color: r.color, sort: r.sort || 0 }; }
  function categoryToRow(c, uid) { return { id: c.id, user_id: uid, name: c.name, color: c.color, sort: c.sort || 0 }; }

  function rowToTask(r) {
    return {
      id: r.id, title: r.title, notes: r.notes || "",
      categoryId: r.category_id, date: r.date,
      start: r.start_min, end: r.end_min,
      recurType: r.recur_type || "none",
      recurDays: r.recur_days || [],
      recurUntil: r.recur_until || null,
      status: r.status || "todo",
      createdAt: r.created_at, updatedAt: r.updated_at
    };
  }
  function taskToRow(t, uid) {
    return {
      id: t.id, user_id: uid, title: t.title, notes: t.notes || "",
      category_id: t.categoryId, date: t.date,
      start_min: Math.round(t.start), end_min: Math.round(t.end),
      recur_type: t.recurType || "none",
      recur_days: t.recurDays || [],
      recur_until: t.recurUntil || null,
      status: t.status || "todo",
      updated_at: new Date().toISOString()
    };
  }

  function rowToOverride(r) {
    var o = {};
    if (r.status) o.status = r.status;
    if (r.start_min != null) o.start = r.start_min;
    if (r.end_min != null) o.end = r.end_min;
    if (r.title) o.title = r.title;
    if (r.deleted) o.deleted = true;
    return o;
  }
  function overrideToRow(taskId, date, o, uid) {
    return {
      id: taskId + "|" + date, user_id: uid, task_id: taskId, date: date,
      status: o.status || null,
      start_min: o.start != null ? Math.round(o.start) : null,
      end_min: o.end != null ? Math.round(o.end) : null,
      title: o.title || null,
      deleted: !!o.deleted
    };
  }

  /* ---------------------- عمليات الكتابة ---------------------- */

  function cloudWrite(fn) {
    if (Store.mode !== "cloud" || !Store.user) return Promise.resolve();
    var c = client();
    if (!c) return Promise.resolve();
    return fn(c, Store.user.id).then(function (r) {
      if (r && r.error) throw r.error;
    }).catch(function (e) {
      Store.onError("تعذّر الحفظ في السحابة: " + msg(e));
    });
  }

  Store.upsertTask = function (task) {
    var i = Store.state.tasks.findIndex(function (t) { return t.id === task.id; });
    task.updatedAt = new Date().toISOString();
    if (i >= 0) Store.state.tasks[i] = task;
    else { task.createdAt = task.createdAt || task.updatedAt; Store.state.tasks.push(task); }
    persistLocal();
    return cloudWrite(function (c, uid) { return c.from("tasks").upsert(taskToRow(task, uid)); });
  };

  Store.removeTask = function (id) {
    Store.state.tasks = Store.state.tasks.filter(function (t) { return t.id !== id; });
    delete Store.state.overrides[id];
    persistLocal();
    return cloudWrite(function (c, uid) {
      return c.from("task_overrides").delete().eq("task_id", id).eq("user_id", uid)
        .then(function () { return c.from("tasks").delete().eq("id", id).eq("user_id", uid); });
    });
  };

  Store.getOverride = function (taskId, date) {
    var m = Store.state.overrides[taskId];
    return (m && m[date]) || null;
  };

  Store.setOverride = function (taskId, date, patch) {
    var m = Store.state.overrides[taskId] || (Store.state.overrides[taskId] = {});
    m[date] = Object.assign({}, m[date] || {}, patch);
    var o = m[date];
    persistLocal();
    return cloudWrite(function (c, uid) {
      return c.from("task_overrides").upsert(overrideToRow(taskId, date, o, uid), { onConflict: "id" });
    });
  };

  Store.clearOverride = function (taskId, date) {
    var m = Store.state.overrides[taskId];
    if (m) { delete m[date]; if (!Object.keys(m).length) delete Store.state.overrides[taskId]; }
    persistLocal();
    return cloudWrite(function (c, uid) {
      return c.from("task_overrides").delete().eq("id", taskId + "|" + date).eq("user_id", uid);
    });
  };

  Store.upsertCategory = function (cat) {
    var i = Store.state.categories.findIndex(function (c) { return c.id === cat.id; });
    if (i >= 0) Store.state.categories[i] = cat; else Store.state.categories.push(cat);
    persistLocal();
    return cloudWrite(function (c, uid) { return c.from("categories").upsert(categoryToRow(cat, uid)); });
  };

  Store.removeCategory = function (id) {
    Store.state.categories = Store.state.categories.filter(function (c) { return c.id !== id; });
    var fallback = Store.state.categories[0];
    Store.state.tasks.forEach(function (t) {
      if (t.categoryId === id) { t.categoryId = fallback ? fallback.id : null; Store.upsertTask(t); }
    });
    persistLocal();
    return cloudWrite(function (c, uid) { return c.from("categories").delete().eq("id", id).eq("user_id", uid); });
  };

  Store.saveSettings = function (patch) {
    Store.state.settings = Object.assign({}, Store.state.settings, patch);
    var s = Store.state.settings;
    persistLocal();
    return cloudWrite(function (c, uid) {
      return c.from("user_settings").upsert({ user_id: uid, data: s, updated_at: new Date().toISOString() });
    });
  };

  /** تصدير/استيراد نسخة احتياطية */
  Store.exportJson = function () {
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: Store.state }, null, 2);
  };

  Store.importJson = function (text) {
    var parsed = JSON.parse(text);
    var d = parsed.data || parsed;
    if (!d || !Array.isArray(d.tasks)) throw new Error("ملف غير صالح.");
    Store.state = {
      categories: Array.isArray(d.categories) && d.categories.length ? d.categories : emptyState().categories,
      tasks: d.tasks,
      overrides: d.overrides || {},
      settings: Object.assign({}, C.DEFAULT_SETTINGS, d.settings || {})
    };
    persistLocal();
    if (Store.mode === "cloud" && Store.user) {
      var uid = Store.user.id, c = client();
      if (c) {
        var overrideRows = [];
        Object.keys(Store.state.overrides).forEach(function (tid) {
          Object.keys(Store.state.overrides[tid]).forEach(function (dt) {
            overrideRows.push(overrideToRow(tid, dt, Store.state.overrides[tid][dt], uid));
          });
        });
        Promise.all([
          c.from("categories").upsert(Store.state.categories.map(function (x) { return categoryToRow(x, uid); })),
          c.from("tasks").upsert(Store.state.tasks.map(function (x) { return taskToRow(x, uid); })),
          overrideRows.length ? c.from("task_overrides").upsert(overrideRows, { onConflict: "id" }) : Promise.resolve(),
          c.from("user_settings").upsert({ user_id: uid, data: Store.state.settings })
        ]).catch(function (e) { Store.onError("تعذّر رفع النسخة إلى السحابة: " + msg(e)); });
      }
    }
    return Store.state;
  };

  global.Store = Store;
})(window);
