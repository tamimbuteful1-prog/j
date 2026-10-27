// Stills for agents to LOOK at while building scenes (before a preview video exists).
//   npm run stills -- <EPISODE_ID> <sec> [sec…] [--final]
// Uses episodes/<ID>/production/props.<mode>.json (written by `studio resolve/render`).
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const args = process.argv.slice(2);
const final = args.includes('--final');
const [id, ...secs] = args.filter((x) => x !== '--final');
if (!id || !secs.length) {
  console.error('usage: npm run stills -- <EPISODE_ID> <sec> [sec…] [--final]');
  process.exit(1);
}
const mode = final ? 'final' : 'preview';
const epDir = path.join(root, 'episodes', id);
let props;
const propsFile = path.join(epDir, 'production', `props.${mode}.json`);
if (fs.existsSync(propsFile)) props = JSON.parse(fs.readFileSync(propsFile, 'utf8'));
else {
  const tl = JSON.parse(fs.readFileSync(path.join(here, 'src', 'episodes', id, 'timeline.preview.json'), 'utf8'));
  const script = JSON.parse(fs.readFileSync(path.join(epDir, 'script', 'script.json'), 'utf8'));
  props = {timeline: tl, hookText: script.hook.text, keyWord: script.hook.key_word, media: {framing: 'fit', trimStartSec: 0, music: null}};
}
let publicDir = path.join(epDir, 'production', 'public');
if (!fs.existsSync(path.join(publicDir, 'fonts'))) publicDir = path.join(here, 'public'); // not prepared yet → shared assets
const outDir = path.join(epDir, 'quality', 'stills', `${mode}-agent`);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'src', 'index.ts'), publicDir});
const browser = await openBrowser('chrome', process.env.REMOTION_BROWSER ? {browserExecutable: process.env.REMOTION_BROWSER} : {});
const composition = await selectComposition({serveUrl, id, inputProps: props, puppeteerInstance: browser});
for (const s of secs.map(Number)) {
  const frame = Math.min(composition.durationInFrames - 1, Math.max(0, Math.round(s * composition.fps)));
  const output = path.join(outDir, `t${s.toFixed(2).replace('.', '_')}.jpg`);
  await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 75, scale: 0.5, inputProps: props, puppeteerInstance: browser});
  console.log(path.relative(root, output));
}
await browser.close({silent: true});
