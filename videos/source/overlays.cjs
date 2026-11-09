// Renders Arabic caption overlays + title/end cards with Meyar's fonts and colours.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const P = process.argv[2];
const OUT = path.join(__dirname, 'out', P);
const FONTS = fs.readFileSync(path.join(__dirname, 'fonts.css'), 'utf8');
const board = JSON.parse(fs.readFileSync(path.join(OUT, 'board.json'), 'utf8'));
const TOTAL = 10;
const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const NAME = P === 'openai' ? 'OpenAI' : 'Claude';
const CSS = `${FONTS}
*{box-sizing:border-box;margin:0} html,body{background:transparent}
body{font-family:"IBM Plex Sans Arabic",Inter,sans-serif;color:#1c1a17;direction:rtl}
.d{font-family:"Alexandria Variable","IBM Plex Sans Arabic",sans-serif}
.en{direction:ltr;unicode-bidi:isolate;font-family:Inter,sans-serif}`;
const MODES = {
  real: ['#2c8a57', '#e3f1e8', 'لقطة حقيقية من الجوال'],
  doc: ['#2c5f8a', '#e3ecf5', 'وثائق رسمية · لقطة حقيقية'],
  sim: ['#b8461b', '#fbe6dc', 'محاكاة توضيحية'],
};
function capHTML(c, mode) {
  const [fg, bg, label] = MODES[mode];
  const sub = (c.sub || '').replace(/([A-Za-z][A-Za-z0-9.\-/ ]*[A-Za-z0-9$])/g, '<span class="en">$1</span>');
  const title = c.title.replace(/([A-Za-z][A-Za-z0-9.\-/ ]*[A-Za-z0-9])/g, '<span class="en">$1</span>');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
  .w{width:1080px;height:372px;padding:44px 64px 0;position:relative}
  .top{display:flex;justify-content:space-between;align-items:center}
  .brand{font:700 44px "Alexandria Variable";letter-spacing:-1px}.brand i{color:#e45c28;font-style:normal}
  .mode{direction:rtl;color:${fg};background:${bg};border-radius:999px;padding:9px 22px;font-weight:600;font-size:27px;display:flex;gap:10px;align-items:center}
  .mode b{width:13px;height:13px;border-radius:50%;background:${fg};display:inline-block;${mode === 'sim' ? 'background:transparent;border:3px dashed ' + fg + ';width:16px;height:16px' : ''}}
  .step{margin-top:30px;display:inline-block;background:#e45c28;color:#fff;border-radius:12px;padding:4px 18px;font-weight:600;font-size:28px}
  h1{font:700 60px/1.25 "Alexandria Variable","IBM Plex Sans Arabic";margin-top:16px;letter-spacing:-.5px}
  p{font-size:33px;color:#48433c;margin-top:10px;line-height:1.35}
  </style></head><body><div class="w"><div class="top"><div class="brand d">معيار<i>.</i></div><div class="mode"><b></b>${label}</div></div>
  <div class="step">الخطوة ${ar(c.step)} من ${ar(TOTAL)}</div><h1>${title}</h1><p>${sub}</p></div></body></html>`;
}
const card = (body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}
 body{width:1080px;height:1920px;background:radial-gradient(120% 70% at 80% 0%,#faf7f1 0,#f3eee5 55%,#e9e0cf 100%);padding:150px 90px;position:relative}
 .brand{font:700 120px "Alexandria Variable";letter-spacing:-3px}.brand i{color:#e45c28;font-style:normal}
 .x{font:600 46px Inter;color:#776f65;margin-top:10px;direction:ltr;text-align:right}
 h1{font:700 86px/1.25 "Alexandria Variable";margin-top:120px;letter-spacing:-1px}
 h1 em{color:#e45c28;font-style:normal}
 p.lead{font-size:44px;color:#48433c;margin-top:40px;line-height:1.5}
 ul{list-style:none;padding:0;margin-top:90px} li{font-size:38px;line-height:1.5;margin:26px 0;padding-right:58px;position:relative;color:#1c1a17}
 li:before{content:"";position:absolute;right:0;top:20px;width:24px;height:24px;border-radius:50%;background:#e45c28}
 .foot{position:absolute;bottom:120px;right:90px;left:90px;font-size:32px;color:#776f65;line-height:1.5;border-top:2px solid rgba(28,26,23,.15);padding-top:34px}
 .chip{display:inline-block;border-radius:999px;padding:6px 22px;font-size:30px;font-weight:600;margin-left:12px}
</style></head><body>${body}</body></html>`;
const key = P === 'openai' ? 'OpenAI' : 'Anthropic (Claude)';
const TITLE = card(`<div class="brand d">معيار<i>.</i></div><div class="x">× ${key}</div>
 <h1>اربط معيار بمفتاح <em class="en">${NAME}</em> API من جوالك</h1>
 <p class="lead">إنشاء المفتاح، شحن رصيد API، ثم الرجوع إلى معيار وتشغيل الفحص.</p>
 <ul><li>صُوّر كل شيء بواجهة الجوال (390×844).</li><li>رصيد API منفصل عن اشتراك ${P === 'openai' ? 'ChatGPT' : 'Claude'}، والاشتراك وحده لا يكفي.</li><li>لا تظهر مفاتيح أو بيانات دفع حقيقية.</li></ul>
 <div class="foot"><span class="chip" style="background:#e3f1e8;color:#2c8a57">لقطة حقيقية</span><span class="chip" style="background:#e3ecf5;color:#2c5f8a">وثائق رسمية</span><span class="chip" style="background:#fbe6dc;color:#b8461b">محاكاة توضيحية</span><br>الشارة أعلى كل لقطة توضح نوعها. الصفحات التي تتطلب تسجيل الدخول أو الدفع معروضة كمحاكاة.</div>`);
const END = card(`<div class="brand d">معيار<i>.</i></div>
 <h1>تذكّر</h1>
 <ul><li>يظهر المفتاح كاملًا مرة واحدة فقط؛ انسخه فورًا ولا تشاركه.</li><li>معيار لا يحفظ المفتاح، ويُمسح عند إعادة تحميل الصفحة.</li><li>كل فحص يُحتسب على رصيدك لدى ${P === 'openai' ? 'OpenAI' : 'Anthropic'}.</li><li>النتيجة تقييم مساعد وفق المراجع المعروضة، وليست حكمًا قانونيًا نهائيًا.</li></ul>
 <div class="foot">tamimimpact.com<br>نتيجة الفحص في هذا الفيديو ناتجة عن ردّ مزود محاكى، لأن المفتاح المستخدم وهمي.</div>`);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 372 } });
  fs.mkdirSync(path.join(OUT, 'cap'), { recursive: true });
  const seen = new Map();
  for (const f of board) {
    const k = crypto.createHash('md5').update(JSON.stringify([f.caption, f.mode])).digest('hex').slice(0, 10);
    f.cap = `cap/${k}.png`;
    if (seen.has(k)) continue;
    seen.set(k, 1);
    await p.setContent(capHTML(f.caption, f.mode), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, f.cap), omitBackground: true });
  }
  await p.setViewportSize({ width: 1080, height: 1920 });
  for (const [n, h] of [['title', TITLE], ['end', END]]) {
    await p.setContent(h, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, `${n}.png`) });
  }
  fs.writeFileSync(path.join(OUT, 'board.json'), JSON.stringify(board, null, 1));
  console.log('captions', seen.size);
  await b.close();
})();
