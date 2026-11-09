// Drives a mobile-emulated Chromium (390x844 CSS px, DPR 3, touch, iPhone UA) through
// the real sites and records a storyboard of screenshots + taps + captions.
// Usage: node capture.cjs openai|anthropic
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const M = require('./mock.cjs');

const PROVIDER = process.argv[2];
const OUT = path.join(__dirname, 'out', PROVIDER);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'img'), { recursive: true });

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const VIEW = { width: 390, height: 844 };
const FONTS = fs.readFileSync(path.join(__dirname, 'fonts.css'), 'utf8');
const DEMO_KEY = PROVIDER === 'openai' ? 'sk-proj-DEMO-0000-not-a-real-key' : 'sk-ant-api03-DEMO-0000-not-a-real-key';
const NAME = PROVIDER === 'openai' ? 'OpenAI' : 'Claude';

const board = [];
let n = 0;
let caption = null; // {step, title, sub}
let mode = 'real';   // 'real' | 'sim' | 'doc'
const cap = (step, title, sub = '', m) => { caption = { step, title, sub }; if (m) mode = m; };

async function snap(page, dur, extra = {}) {
  const file = `img/${String(n++).padStart(4, '0')}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 90 });
  const u = new URL(page.url());
  const url = extra.url || (u.protocol === 'about:' ? '' : u.host + (u.pathname === '/' ? '' : u.pathname));
  board.push({ img: file, dur, caption: { ...caption }, mode: extra.mode || mode, url, tap: extra.tap || null, zoom: extra.zoom || null, kind: extra.kind || 'still' });
}

async function box(page, target) {
  const loc = typeof target === 'string' ? page.locator(target).first() : target;
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  const b = await loc.boundingBox();
  return { loc, b, cx: b.x + b.width / 2, cy: b.y + b.height / 2 };
}

// Show the finger on the element (captured frame), then really tap it.
async function tap(page, target, { hold = 0.9, after = 800, zoom = null } = {}) {
  const { loc, cx, cy } = await box(page, target);
  await snap(page, hold, { tap: [cx, cy], zoom });
  await loc.tap();
  await page.waitForTimeout(after);
  return [cx, cy];
}

async function scrollEl(page) {
  return page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    return window.scrollY;
  });
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
async function animateScroll(page, y0, y1, frames = 16) {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  for (let i = 1; i <= frames; i++) {
    const y = Math.round(y0 + (y1 - y0) * ease(i / frames));
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await page.waitForTimeout(30);
    await snap(page, 1 / 15, { kind: 'scroll' });
  }
  await page.waitForTimeout(400);
}
// Tap something that scrolls the page natively, then replay that scroll frame by frame.
async function tapThatScrolls(page, target, extraOffset = 0) {
  const y0 = await scrollEl(page);
  await tap(page, target, { after: 1800 });
  const y1 = (await page.evaluate(() => window.scrollY)) + extraOffset;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y0);
  await page.waitForTimeout(150);
  await animateScroll(page, y0, y1, 20);
}
async function scrollTo(page, y1, frames = 16) {
  const y0 = await scrollEl(page);
  await animateScroll(page, y0, y1, frames);
}
async function scrollToEl(page, sel, offset = 120, frames = 16) {
  const y = await page.evaluate(([s, o]) => { const e = document.querySelector(s); return e.getBoundingClientRect().top + window.scrollY - o; }, [sel, offset]);
  await scrollTo(page, Math.max(0, y), frames);
}
async function typeInto(page, sel, text, step = 3) {
  for (let k = step; k < text.length + step; k += step) {
    await page.fill(sel, text.slice(0, Math.min(k, text.length)));
    await snap(page, 1 / 15, { kind: 'type' });
  }
}

// ---------- Simulated (clearly labelled) screens ----------
function simHTML({ url, title, lead, target, targetNote, bullets, keyBox, toast, docFoot }) {
  const skel = (w) => `<div class="sk" style="width:${w}%"></div>`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${FONTS}
  *{box-sizing:border-box} body{margin:0;background:#f4f2ee;font-family:"IBM Plex Sans Arabic",sans-serif;color:#1c1a17;width:390px;height:844px;overflow:hidden}
  .badge{margin:14px 14px 0;padding:9px 12px;border:1.5px dashed #e45c28;border-radius:12px;background:#fff6f1;color:#b8461b;font-weight:600;font-size:13.5px;display:flex;gap:8px;align-items:center}
  .badge b{background:#e45c28;color:#fff;border-radius:6px;padding:1px 7px;font-size:12px}
  .wire{margin:14px;background:#fff;border-radius:18px;padding:16px;border:1px solid #e5e1da}
  .host{direction:ltr;font:600 13px Inter,sans-serif;color:#776f65;margin-bottom:12px}
  .sk{height:10px;border-radius:6px;background:#ece8e1;margin:8px 0}
  h1{font:600 22px "IBM Plex Sans Arabic",Inter,sans-serif;margin:6px 0 6px} .lead{color:#48433c;font-size:15px;line-height:1.7;margin:0}
  .target{direction:ltr;margin:16px 0 4px;border:2.5px solid #e45c28;border-radius:12px;padding:13px 14px;text-align:center;font:600 17px Inter,sans-serif;background:#fff;box-shadow:0 0 0 6px rgba(228,92,40,.14)}
  .tnote{font-size:12.5px;color:#776f65;text-align:center;margin:6px 0 0}
  ol{margin:6px 14px 0;padding:0 22px 0 0;font-size:15.5px;line-height:1.75;color:#1c1a17} li{margin:7px 0}
  code,.en{direction:ltr;unicode-bidi:isolate;font:600 14px Inter,sans-serif;background:#efe9df;border-radius:6px;padding:1px 6px}
  .key{direction:ltr;margin:14px 0 0;display:flex;gap:8px;align-items:center}
  .key div{flex:1;font:600 13.5px ui-monospace,monospace;background:#f6f3ee;border:1px solid #e5e1da;border-radius:10px;padding:12px 10px;white-space:nowrap;overflow:hidden}
  .key button{font:600 14px Inter;border:2.5px solid #e45c28;background:#fff;border-radius:10px;padding:10px 12px}
  .toast{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);background:#1c1a17;color:#fff;border-radius:999px;padding:10px 18px;font-size:14px;white-space:nowrap}
  .foot{position:absolute;bottom:14px;left:14px;right:14px;font-size:12px;color:#776f65;text-align:center;line-height:1.5}
  </style></head><body>
  <div class="badge"><b>محاكاة</b> شاشة توضيحية — ليست لقطة من الموقع (تتطلب تسجيل الدخول)</div>
  <div class="wire">
    <div class="host">${url}</div>
    ${skel(38)}${skel(70)}
    <h1>${title}</h1><p class="lead">${lead}</p>
    ${target ? `<div class="target" id="target">${target}</div>${targetNote ? `<p class="tnote">${targetNote}</p>` : ''}` : ''}
    ${keyBox ? `<div class="key"><div>${keyBox}</div><button id="copy">Copy</button></div>` : ''}
    ${skel(85)}${skel(55)}
  </div>
  <ol>${bullets.map((b) => `<li>${b}</li>`).join('')}</ol>
  ${toast ? `<div class="toast">${toast}</div>` : ''}
  <div class="foot">${docFoot || 'التسميات من وثائق المزود الرسمية، وقد يختلف شكل الصفحة الفعلي.'}</div>
  </body></html>`;
}
async function simScreen(sim, spec, url, dur, tapSel) {
  await sim.setContent(simHTML(spec), { waitUntil: 'networkidle' });
  await sim.evaluate(() => document.fonts.ready);
  if (tapSel) {
    const { cx, cy } = await box(sim, tapSel);
    await snap(sim, dur, { url, mode: 'sim' });
    await snap(sim, 1.0, { url, mode: 'sim', tap: [cx, cy] });
  } else await snap(sim, dur, { url, mode: 'sim' });
}

// ---------- Real docs page: scroll to a phrase ----------
async function docScene(ctx, url, phrase, dur, zoomFrac) {
  const d = await ctx.newPage();
  await d.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await d.waitForTimeout(1500);
  mode = 'doc';
  await snap(d, 1.4);
  // find scroll container + target offset
  const info = await d.evaluate((ph) => {
    const el = [...document.querySelectorAll('p,li,td,th,h2,h3')].find((e) => e.textContent.includes(ph));
    if (!el) return null;
    let c = el.parentElement;
    while (c) { const s = getComputedStyle(c); if (/(auto|scroll)/.test(s.overflowY) && c.scrollHeight > c.clientHeight + 5 && c.clientHeight > 400) break; c = c.parentElement; }
    const isWin = !c;
    window.__sc = isWin ? document.scrollingElement : c;
    const top = el.getBoundingClientRect().top - (isWin ? 0 : c.getBoundingClientRect().top) + window.__sc.scrollTop;
    return { y0: window.__sc.scrollTop, y1: Math.max(0, top - 300) };
  }, phrase);
  if (info) {
    for (let i = 1; i <= 22; i++) {
      const y = Math.round(info.y0 + (info.y1 - info.y0) * ease(i / 22));
      await d.evaluate((y) => { window.__sc.scrollTop = y; }, y);
      await d.waitForTimeout(35);
      await snap(d, 1 / 15, { kind: 'scroll' });
    }
    await d.waitForTimeout(500);
    const r = await d.evaluate((ph) => { const el = [...document.querySelectorAll('p,li,td,th,h2,h3')].find((e) => e.textContent.includes(ph)); const b = el.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, phrase);
    await snap(d, dur, { zoom: { x: r[0], y: r[1], s: zoomFrac || 1.45 } });
  }
  await d.close();
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEW, screen: VIEW, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: UA, locale: 'ar-SA' });
  const page = await ctx.newPage();
  await M.install(page, (s) => console.log(s));
  const sim = await ctx.newPage();
  await page.bringToFront();

  // 1. Meyar on mobile
  cap(1, 'افتح معيار من متصفح الجوال', 'tamimimpact.com', 'real');
  await page.goto('https://tamimimpact.com/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snap(page, 1.8);
  cap(1, 'اضغط زر «معيار»', 'ستنتقل إلى صفحة أداة الفحص');
  await tapThatScrolls(page, '#enter-miyaar');
  await snap(page, 0.8);
  cap(2, 'افتح «فحص نص باستخدام API»', 'المسار الأول في معيار');
  await tapThatScrolls(page, page.getByText('فحص نص باستخدام API').first());
  await snap(page, 0.6);
  await scrollToEl(page, '#task-group', 330, 14);
  await snap(page, 0.8);

  // 2. choose provider + key link
  cap(2, `اختر ${NAME}`, PROVIDER === 'openai' ? 'من أزرار المزود: OpenAI أو Claude' : 'Claude هو المزود المختار افتراضيًا');
  await tap(page, `[data-provider=${PROVIDER}]`, { after: 700 });
  await snap(page, 0.8);
  const link = await box(page, '#key-link');
  cap(3, 'اضغط رابط إنشاء المفتاح', PROVIDER === 'openai' ? '«أنشئ مفتاحًا لدى OpenAI» تحت خانة المفتاح' : '«أنشئ مفتاحًا لدى Anthropic» تحت خانة المفتاح');
  await snap(page, 2.0, { zoom: { x: link.cx - 60, y: link.cy, s: 2.2 } });
  const popupP = ctx.waitForEvent('page');
  await tap(page, '#key-link', { after: 200, zoom: { x: link.cx - 60, y: link.cy, s: 2.2 } });
  const popup = await popupP;

  if (PROVIDER === 'openai') {
    await popup.close();
    cap(3, 'تُفتح منصة OpenAI للمطورين', 'platform.openai.com/api-keys — تطلب تسجيل الدخول أولًا', 'sim');
    await simScreen(sim, {
      url: 'platform.openai.com/api-keys', title: 'سجّل الدخول أو أنشئ حسابًا', lead: 'صفحة المفاتيح لا تُعرض قبل تسجيل الدخول إلى منصة OpenAI للمطورين.',
      target: 'Log in · Sign up', targetNote: 'تسجيل الدخول أو إنشاء حساب جديد',
      bullets: ['لديك حساب؟ سجّل الدخول به.', 'جديد؟ أنشئ حسابًا وأكّد بريدك الإلكتروني.', 'أكمل خطوات التحقق التي تطلبها المنصة.'],
    }, 'platform.openai.com/api-keys', 2.6, '#target');

    cap(4, 'افتح Billing لشحن الرصيد', 'Settings ثم Billing — أو افتح الرابط مباشرة', 'sim');
    await simScreen(sim, {
      url: 'platform.openai.com/settings/organization/billing', title: 'Billing: وسيلة الدفع والرصيد', lead: 'على الجوال قد تكون القائمة مطوية خلف أيقونة القائمة أعلى الصفحة؛ افتحها ثم <span class="en">Settings</span> ← <span class="en">Billing</span>.',
      target: 'Add credits', targetNote: 'إضافة رصيد API مدفوع مسبقًا',
      bullets: ['أضف بطاقة الدفع في قسم وسائل الدفع.', 'اختر مبلغ الشحن، ثم أكّد الشراء.', '<span class="en">Auto Recharge</span> اختياري؛ يمكنك تركه مغلقًا للتحكم بالصرف.'],
      docFoot: 'لا تظهر بيانات بطاقة حقيقية، ولم يُنفَّذ أي شراء.',
    }, 'platform.openai.com/settings/organization/billing', 3.0, '#target');
    cap(4, 'كم أشحن؟', 'من وثائق OpenAI الرسمية: أول 5$ تنقلك إلى مستوى Build', 'doc');
    await docScene(ctx, 'https://developers.openai.com/api/docs/guides/rate-limits', 'in total credit purchases', 3.2, 1.5);

    cap(5, 'أنشئ مفتاح API جديدًا', 'صفحة API keys', 'sim');
    await simScreen(sim, {
      url: 'platform.openai.com/api-keys', title: 'API keys', lead: 'اضغط زر إنشاء مفتاح سري جديد، وسمِّه باسم يذكّرك باستخدامه، مثل <span class="en">Meyar</span>.',
      target: '+ Create new secret key', targetNote: 'قد تختلف التسمية قليلًا في واجهتك',
      bullets: ['اكتب اسمًا للمفتاح.', 'اختر المشروع إن طُلب منك.', 'اضغط زر الإنشاء.'],
    }, 'platform.openai.com/api-keys', 2.6, '#target');
    cap(6, 'انسخ المفتاح فورًا', 'يظهر كاملًا مرة واحدة فقط — احفظه في مكان آمن', 'sim');
    const simKey = { url: 'platform.openai.com/api-keys', title: 'احفظ مفتاحك', lead: 'لن تتمكن من رؤية المفتاح كاملًا مرة أخرى. إن فقدته، أنشئ مفتاحًا جديدًا.', keyBox: 'sk-proj-••••••••••••••••DEMO', bullets: ['اضغط <span class="en">Copy</span>.', 'لا تشارك المفتاح مع أحد ولا تنشره.'], docFoot: 'المفتاح المعروض وهمي للشرح فقط.' };
    await simScreen(sim, simKey, 'platform.openai.com/api-keys', 2.2, '#copy');
    await simScreen(sim, { ...simKey, toast: 'تم النسخ ✓' }, 'platform.openai.com/api-keys', 1.2);
  } else {
    // Real Claude Console on mobile
    await popup.waitForLoadState('networkidle').catch(() => {});
    await popup.waitForTimeout(1500);
    cap(3, 'تُفتح منصة Claude للمطورين', 'platform.claude.com — تطلب تسجيل الدخول أولًا', 'real');
    await snap(popup, 2.4);
    cap(3, 'قائمة الجوال ☰', 'قبل الدخول تعرض روابط الوثائق فقط');
    await tap(popup, 'button[aria-label="Toggle menu"]', { after: 900 });
    await snap(popup, 2.0);
    cap(3, 'أغلق القائمة وسجّل الدخول', 'أو أنشئ حسابًا جديدًا بالطريقة نفسها');
    await tap(popup, 'button[aria-label="Close menu"]', { after: 700 });
    const email = popup.locator('input[type=email], input[placeholder*="email" i]').first();
    await tap(popup, email, { after: 500 });
    await typeInto(popup, 'input[type=email], input[placeholder*="email" i]', 'name@example.com', 2);
    const cont = await box(popup, popup.getByText('Continue with email').first());
    cap(4, 'اضغط Continue with email', 'ثم أكمل التحقق المرسل إلى بريدك (أو استخدم Google)');
    await snap(popup, 2.4, { tap: [cont.cx, cont.cy], zoom: { x: cont.cx, y: cont.cy - 80, s: 1.5 } });
    await popup.close();

    cap(5, 'افتح Billing لشراء الرصيد', 'بعد الدخول: من الإعدادات ← Billing', 'sim');
    await simScreen(sim, {
      url: 'platform.claude.com/settings/billing', title: 'Billing: الدفع وشراء الرصيد', lead: 'إن كانت القائمة مطوية على الجوال فافتح أيقونة القائمة ثم <span class="en">Settings</span> ← <span class="en">Billing</span>، أو افتح الرابط مباشرة.',
      target: 'Buy credits', targetNote: 'شراء رصيد API مدفوع مسبقًا',
      bullets: ['أضف بطاقة ائتمانية كوسيلة دفع.', 'اختر مبلغ الرصيد وأكّد الشراء.', '<span class="en">Auto-reload</span> اختياري، ويمكن ضبط حد إنفاق شهري.'],
      docFoot: 'لا تظهر بيانات بطاقة حقيقية، ولم يُنفَّذ أي شراء.',
    }, 'platform.claude.com/settings/billing', 3.0, '#target');
    cap(5, 'من وثائق Anthropic الرسمية', 'البطاقات الائتمانية مقبولة، والشراء من صفحة Billing', 'doc');
    await docScene(ctx, 'https://platform.claude.com/docs/en/about-claude/pricing', 'Major credit cards are accepted', 3.4, 1.5);

    cap(6, 'أنشئ مفتاح API جديدًا', 'صفحة API keys', 'sim');
    await simScreen(sim, {
      url: 'platform.claude.com/settings/keys', title: 'API keys', lead: 'اضغط <span class="en">Create key</span>، ثم سمِّ المفتاح، مثل <span class="en">Meyar</span>.',
      target: 'Create key', targetNote: 'زر إنشاء المفتاح',
      bullets: ['اكتب اسم المفتاح.', 'اختر مدة الصلاحية <span class="en">expiration</span>.', 'اجعل <span class="en">Linked account</span> حسابك أنت.'],
    }, 'platform.claude.com/settings/keys', 2.6, '#target');
    cap(6, 'انسخ المفتاح فورًا', 'يبدأ بـ sk-ant- ويظهر كاملًا مرة واحدة فقط', 'sim');
    const simKey = { url: 'platform.claude.com/settings/keys', title: 'احفظ مفتاحك', lead: 'يعرض الموقع المفتاح كاملًا مرة واحدة عند إنشائه فقط. إن فقدته، أنشئ مفتاحًا جديدًا.', keyBox: 'sk-ant-api03-••••••••••••DEMO', bullets: ['اضغط <span class="en">Copy</span>.', 'لا تشارك المفتاح مع أحد ولا تنشره.'], docFoot: 'المفتاح المعروض وهمي للشرح فقط.' };
    await simScreen(sim, simKey, 'platform.claude.com/settings/keys', 2.2, '#copy');
    await simScreen(sim, { ...simKey, toast: 'تم النسخ ✓' }, 'platform.claude.com/settings/keys', 1.2);
  }

  // Back to Meyar (same tab, no reload — the key is wiped on reload)
  await page.bringToFront();
  const S = PROVIDER === 'openai' ? 7 : 7;
  cap(S, 'ارجع إلى تبويب معيار', 'دون إعادة تحميل الصفحة', 'real');
  await snap(page, 1.4);
  cap(S, 'الصق المفتاح في خانة API Key', 'المفتاح هنا وهمي للشرح، ويظهر مخفيًا بالنقاط');
  const kb = await box(page, '#api-key');
  await tap(page, '#api-key', { after: 300, zoom: { x: kb.cx, y: kb.cy, s: 1.8 } });
  await page.fill('#api-key', DEMO_KEY);
  await page.locator('#api-key').blur();
  await snap(page, 2.0, { zoom: { x: kb.cx, y: kb.cy, s: 1.8 } });

  cap(S + 1, 'الصق النص الذي تريد فحصه', 'مثال: نص إعلان قبل نشره');
  await scrollToEl(page, '#input-label', 140, 14);
  await tap(page, '#user-text', { after: 300 });
  await typeInto(page, '#user-text', M.SAMPLE, 4);
  await page.locator('#user-text').blur();
  await page.waitForTimeout(500);
  await snap(page, 1.2);

  cap(S + 1, 'وافق على إرسال البيانات', 'يُرسل النص والمراجع المختارة فقط إلى المزود');
  await scrollToEl(page, '#consent-box', 420, 12);
  const eb = await box(page, '#estimate');
  if (PROVIDER === 'anthropic') {
    cap(S + 1, 'تقدير التكلفة بالريال', 'يظهر قبل الإرسال، ويُحتسب على حسابك لدى المزود');
    await snap(page, 2.4, { zoom: { x: eb.cx, y: eb.cy, s: 1.7 } });
    cap(S + 1, 'وافق على إرسال البيانات', 'يُرسل النص والمراجع المختارة فقط إلى المزود');
  }
  const cb = await box(page, '#consent-box');
  await tap(page, '#consent', { after: 500, zoom: { x: cb.cx, y: cb.cy, s: 1.6 } });
  await snap(page, 1.2, { zoom: { x: cb.cx, y: cb.cy, s: 1.6 } });

  cap(S + 2, 'اضغط «افحص النص»', 'ردّ المزود في هذا العرض محاكى، لأن المفتاح وهمي');
  await tap(page, '#run', { after: 400 });
  // loading frames
  for (let i = 0; i < 6; i++) { await snap(page, 0.25); await page.waitForTimeout(150); }
  const confirmBtn = page.getByText('تابع الإرسال');
  if (await confirmBtn.count()) {
    await page.waitForTimeout(400);
    cap(S + 2, 'أكّد الإرسال', 'اختار معيار النموذج تلقائيًا من النماذج المتاحة لحسابك');
    const c = await box(page, confirmBtn.first());
    await snap(page, 2.4, { zoom: { x: c.cx, y: c.cy - 90, s: 1.35 } });
    await tap(page, confirmBtn.first(), { after: 300 });
    for (let i = 0; i < 6; i++) { await snap(page, 0.25); await page.waitForTimeout(150); }
  }
  await page.waitForSelector('#output .result, #output h3, #output section', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);

  cap(S + 3, 'النتيجة: توجد مؤشرات تعارض', 'التصنيف والخلاصة في أعلى التقرير');
  await scrollToEl(page, '#output', 90, 18);
  await snap(page, 3.0);
  cap(S + 3, 'الملاحظة والمادة النظامية', 'العبارة محل الملاحظة، والاقتباس الأصلي من المرجع');
  const y0 = await page.evaluate(() => window.scrollY);
  await scrollTo(page, y0 + 520, 18);
  await snap(page, 3.4);
  cap(S + 3, 'صياغة بديلة مقترحة', 'والقرار لك: معيار تقييم مساعد، وليس حكمًا قانونيًا');
  await scrollTo(page, y0 + 1000, 18);
  await snap(page, 3.4);

  fs.writeFileSync(path.join(OUT, 'board.json'), JSON.stringify(board, null, 1));
  console.log('frames', board.length, 'seconds', board.reduce((a, b) => a + b.dur, 0).toFixed(1));
  await browser.close();
})();
