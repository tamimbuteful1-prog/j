import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {resolveTimeline, estimateLineSec} from '../../engine/src/timeline/resolve.ts';

const fx = (f: string) => JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'smoke', f), 'utf8'));
const settings = {fps: 30, wordsPerSec: 2.3, lineGapSec: 0.18, sceneLeadSec: 0.25, sceneOverlapSec: 0.3, hookExitSec: 0.9};

test('preview: beats follow estimated line durations, scenes are contiguous', () => {
  const tl = resolveTimeline({episodeId: 'X', mode: 'preview', script: fx('script.json'), storyboard: fx('storyboard.json'), hook: {clipSec: null, holdFrames: 0, keyWordSec: null}, settings});
  assert.equal(tl.warnings.length, 0, tl.warnings.join());
  assert.equal(tl.scenes.length, 3);
  for (let i = 1; i < tl.scenes.length; i++) assert.ok(tl.scenes[i].start < tl.scenes[i - 1].end, 'scenes overlap for transitions');
  const l3 = tl.lines.find((l) => l.id === 'L03')!;
  assert.ok(tl.beats.trueHit > l3.start && tl.beats.trueHit < l3.end, 'word beat inside its line');
  assert.equal(tl.totalSec, tl.scenes[2].end, 'no black tail');
});

test('final: real durations re-sync every beat (the whole point)', () => {
  const base = {episodeId: 'X', script: fx('script.json'), storyboard: fx('storyboard.json'), settings};
  const a = resolveTimeline({...base, mode: 'preview', hook: {clipSec: 4, holdFrames: 0, keyWordSec: null}});
  const b = resolveTimeline({...base, mode: 'final', durations: {L02: 5, L03: 6, L04: 2, L05: 2}, hook: {clipSec: 4, holdFrames: 12, keyWordSec: 2}});
  const L03a = a.lines.find((l) => l.id === 'L03')!;
  const L03b = b.lines.find((l) => l.id === 'L03')!;
  assert.ok(L03b.end - L03b.start === 6);
  // the beat keeps the same relative position inside the line
  const ra = (a.beats.trueHit - L03a.start) / (L03a.end - L03a.start);
  const rb = (b.beats.trueHit - L03b.start) / (L03b.end - L03b.start);
  assert.ok(Math.abs(ra - rb) < 1e-3);
  assert.ok(b.hook.end > 4 + 12 / 30 - 1e-6, 'hook includes the hold frames');
});

test('errors are loud: unknown line / duplicate beat / hook line in a scene', () => {
  const script = fx('script.json');
  const sb = fx('storyboard.json');
  const run = (storyboard: unknown) => resolveTimeline({episodeId: 'X', mode: 'preview', script, storyboard: storyboard as never, hook: {clipSec: null, holdFrames: 0, keyWordSec: null}, settings});
  assert.throws(() => run({scenes: [{...sb.scenes[0], lines: ['L99']}]}), /unknown line/);
  assert.throws(() => run({scenes: [{...sb.scenes[0], lines: ['L01']}]}), /hook line/);
  assert.throws(() => run({scenes: [sb.scenes[0], {...sb.scenes[1], beats: [{name: 'title', anchor: {line: 'L03'}}]}]}), /duplicate beat/);
});

test('duration estimate is sane for Arabic speech', () => {
  const s = estimateLineSec('وعبارة الوصل تكون صحيحة فقط إذا كانت كلا العبارتين صحيحتين', 2.3);
  assert.ok(s > 3 && s < 5, String(s));
});
