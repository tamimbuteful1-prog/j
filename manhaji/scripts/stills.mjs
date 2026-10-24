// Render preview stills: node scripts/stills.mjs 1.0 4.5 12 ...  (seconds)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const browserExecutable = process.env.REMOTION_BROWSER || undefined;
const outDir = process.env.STILLS_DIR || path.resolve('out/stills');
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Manhaji', browserExecutable});
for (const s of process.argv.slice(2)) {
  const frame = Math.round(parseFloat(s) * composition.fps);
  const output = path.join(outDir, `t${String(s).padStart(5, '0')}.jpg`);
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 80, browserExecutable, chromiumOptions: {gl: process.env.GL || 'swangle'}});
  console.log('wrote', output);
}
