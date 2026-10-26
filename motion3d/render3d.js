// Render scene.html frame by frame with headless Chromium.
// usage: node render3d.js <outdir> [fps] [--only t1,t2,...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const root = path.resolve(__dirname, '..');
const out = path.resolve(process.argv[2] || 'frames');
const fps = Number(process.argv[3] || 30);
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1].split(',').map(Number) : null;
fs.mkdirSync(out, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/motion3d/scene.html`);
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  const end = await page.evaluate(() => window.END);
  const times = only || Array.from({ length: Math.round(end * fps) }, (_, i) => i / fps);
  const meta = [];
  const t0 = Date.now();
  for (let i = 0; i < times.length; i++) {
    const r = await page.evaluate(t => {
      const m = window.renderAt(t);
      return { m, img: document.querySelector('canvas').toDataURL('image/jpeg', 0.95) };
    }, times[i]);
    fs.writeFileSync(path.join(out, only ? `t_${times[i]}.jpg` : `f_${String(i).padStart(5, '0')}.jpg`), Buffer.from(r.img.split(',')[1], 'base64'));
    meta.push({ t: times[i], ...r.m });
    if (i % 30 === 0) console.log(`frame ${i}/${times.length} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta));
  await browser.close(); server.close();
})();
