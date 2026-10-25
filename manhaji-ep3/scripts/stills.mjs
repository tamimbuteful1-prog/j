// Render review stills: node scripts/stills.mjs <Landscape|Vertical> <outDir> <sec> [sec...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';

const [comp, outDir, ...secs] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const puppeteerInstance = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id: comp, puppeteerInstance});
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(parseFloat(s) * composition.fps));
  await renderStill({composition, serveUrl, output: path.join(outDir, `${comp}_${s}.png`), frame, puppeteerInstance, scale: 0.5});
  console.log('ok', s);
}
await puppeteerInstance.close({silent: true});
