// Render episode-01.html frame by frame and mux with the synthesized audio.
// Usage: node render.js <audio.wav> <out.mp4>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const [audio, out, html = 'episode-01.html', fpsArg = '24'] = process.argv.slice(2);
const FPS = +fpsArg;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.resolve(__dirname, html) + '?render');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const dur = await page.evaluate(() => window.DURATION);

  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', audio,
    '-vf', 'scale=1080:1920:flags=lanczos', '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-tune', 'grain', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });

  const frames = Math.round(dur * FPS);
  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 240 === 0) console.log(`frame ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();
