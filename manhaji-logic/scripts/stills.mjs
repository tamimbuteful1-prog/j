// Quick QA: render a contact sheet of stills.  node scripts/stills.mjs <compId> <frame,frame,...> [outPrefix]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';

const [comp, frames, prefix = comp] = process.argv.slice(2);
const exe = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browser = await openBrowser('chrome', {browserExecutable: exe});
const composition = await selectComposition({serveUrl, id: comp, puppeteerInstance: browser});
for (const fr of frames.split(',').map(Number)) {
  const output = path.resolve(`out/${prefix}_${fr}.jpg`);
  await renderStill({composition, serveUrl, frame: fr, output, imageFormat: 'jpeg', jpegQuality: 70, scale: 0.5, puppeteerInstance: browser});
  console.log(output);
}
await browser.close({silent: true});
