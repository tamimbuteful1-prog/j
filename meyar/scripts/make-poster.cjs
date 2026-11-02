// Exports the fallback/poster image from the real 3D model.
// Run after a build:  npm run build && node scripts/make-poster.cjs && npm run build
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 4181;

(async () => {
  const server = spawn(path.join(ROOT, 'node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2000));
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    await page.goto(`http://localhost:${PORT}/`);
    await page.waitForFunction(() => typeof window.__meyarSnapshot === 'function', null, { timeout: 60000 });
    for (const [size, name] of [[1200, 'gauge-poster.webp']]) {
      const url = await page.evaluate((n) => window.__meyarSnapshot(n), size);
      const buf = Buffer.from(url.split(',')[1], 'base64');
      fs.writeFileSync(path.join(ROOT, 'public/media', name), buf);
      console.log('wrote', name, buf.length, 'bytes');
    }
  } finally {
    await browser.close();
    server.kill();
  }
})();
