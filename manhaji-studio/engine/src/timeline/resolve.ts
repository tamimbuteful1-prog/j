/**
 * TIMELINE RESOLVER — the heart of automatic sync.
 *
 * Scenes never contain seconds. Every important moment is a `beat` anchored to a
 * narration line (L05, word «أو», …). This pure function turns
 *   script.json + storyboard.json + line durations
 * into absolute seconds. Preview uses estimated durations; after the presenter
 * records, the same function runs with the real durations and the whole film re-syncs.
 *
 * Self-contained on purpose: imported by the engine (React) AND the orchestrator (node).
 */

export type Section = 'hook' | 'context' | 'bridge' | 'explanation' | 'demonstration' | 'conclusion';

export type ScriptLine = {
  id: string;
  section: Section;
  text: string;
  hook: boolean;
  emphasis?: string[];
};

export type Anchor = {
  line?: string;
  scene?: string;
  at?: 'start' | 'end' | number;
  word?: string;
  occurrence?: number;
};

export type StoryboardScene = {
  id: string;
  section: Section;
  lines: string[];
  silent_duration_sec?: number;
  silent_tail_sec?: number;
  beats: {name: string; anchor: Anchor; offset?: number}[];
  sfx?: {beat: string; name: string; offset?: number; volume?: number}[];
};

export type ResolveInput = {
  episodeId: string;
  mode: 'preview' | 'final';
  script: {lines: ScriptLine[]; hook?: {key_word?: string}};
  storyboard: {scenes: StoryboardScene[]};
  /** measured seconds per line id (final). Missing ids fall back to the estimate. */
  durations?: Record<string, number>;
  /** optional word timings per line (from ASR when available): [{word,start,end}] relative to the line */
  words?: Record<string, {word: string; start: number; end: number}[]>;
  hook: {
    /** seconds of the (trimmed) hook clip, or null in preview → estimated from the hook lines */
    clipSec: number | null;
    holdFrames: number;
    keyWordSec: number | null;
    /** speech windows inside the trimmed clip, for hook captions */
    speech?: [number, number][];
    tailHoldSec?: number;
  };
  settings: {
    fps: number;
    wordsPerSec: number;
    lineGapSec: number;
    sceneLeadSec: number;
    sceneOverlapSec: number;
    hookExitSec: number;
  };
};

export type ResolvedLine = ScriptLine & {start: number; end: number; estimated: boolean};
export type Caption = {start: number; end: number; text: string; highlight: string[]};

export type Timeline = {
  episodeId: string;
  mode: 'preview' | 'final';
  fps: number;
  hook: {start: 0; end: number; clipSec: number; holdFrames: number; keyWordSec: number | null; tailHoldSec: number; exitSec: number};
  lines: ResolvedLine[];
  scenes: {id: string; start: number; end: number}[];
  /** absolute seconds; key = beat name (unique per episode) */
  beats: Record<string, number>;
  sfx: {name: string; at: number; volume: number}[];
  captions: Caption[];
  totalSec: number;
  warnings: string[];
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Arabic-aware word count for duration estimates (diacritics/punctuation ignored). */
export const countWords = (text: string) =>
  text
    .replace(/[«»"'…،؛,.!?؟:()\-—]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

export const estimateLineSec = (text: string, wordsPerSec: number) => r3(Math.max(0.9, countWords(text) / wordsPerSec + 0.25));

/** Time of the n-th occurrence of `word` inside a line, proportional to character position. */
const wordFraction = (text: string, word: string, occurrence = 1) => {
  let idx = -1;
  let from = 0;
  for (let i = 0; i < occurrence; i++) {
    idx = text.indexOf(word, from);
    if (idx < 0) return null;
    from = idx + word.length;
  }
  return text.length ? idx / text.length : 0;
};

export const resolveTimeline = (inp: ResolveInput): Timeline => {
  const {settings: S} = inp;
  const warnings: string[] = [];
  const byId = new Map(inp.script.lines.map((l) => [l.id, l]));
  const dur = (id: string) => {
    const l = byId.get(id);
    if (!l) throw new Error(`storyboard references unknown line ${id}`);
    const measured = inp.durations?.[id];
    if (inp.mode === 'final' && measured === undefined && !l.hook) warnings.push(`no recording for ${id}; using estimate`);
    return {sec: measured ?? estimateLineSec(l.text, S.wordsPerSec), estimated: measured === undefined};
  };

  // ── hook
  const hookLines = inp.script.lines.filter((l) => l.hook);
  const tailHoldSec = inp.hook.tailHoldSec ?? 0;
  const clipSec = inp.hook.clipSec ?? r3(hookLines.reduce((a, l) => a + estimateLineSec(l.text, S.wordsPerSec), 0) + 0.6);
  const hookEnd = r3(clipSec + inp.hook.holdFrames / S.fps + tailHoldSec);

  // ── lines & scenes
  const lines: ResolvedLine[] = [];
  const scenes: Timeline['scenes'] = [];
  let prevSceneEnd = hookEnd;
  let lastLineEnd = hookEnd;
  inp.storyboard.scenes.forEach((sc, i) => {
    const start = i === 0 ? r3(hookEnd - S.hookExitSec) : r3(prevSceneEnd - S.sceneOverlapSec);
    let cursor = Math.max(start + S.sceneLeadSec, lastLineEnd + S.lineGapSec);
    if (i === 0) cursor = Math.max(cursor, hookEnd + S.sceneLeadSec * 0.4);
    for (const id of sc.lines) {
      const l = byId.get(id)!;
      if (!l) throw new Error(`scene ${sc.id} references unknown line ${id}`);
      if (l.hook) throw new Error(`scene ${sc.id} references hook line ${id} (hook lines live in the Higgsfield video)`);
      const d = dur(id);
      lines.push({...l, start: r3(cursor), end: r3(cursor + d.sec), estimated: d.estimated});
      cursor += d.sec + S.lineGapSec;
      lastLineEnd = cursor - S.lineGapSec;
    }
    const contentEnd = sc.lines.length ? lastLineEnd : start + S.sceneLeadSec + (sc.silent_duration_sec ?? 2.5);
    const end = r3(contentEnd + (sc.silent_tail_sec ?? 0.25));
    scenes.push({id: sc.id, start, end});
    prevSceneEnd = end;
    if (!sc.lines.length) lastLineEnd = Math.max(lastLineEnd, end - S.sceneOverlapSec);
  });

  // every non-hook line must be placed exactly once
  const placed = new Set(lines.map((l) => l.id));
  for (const l of inp.script.lines) if (!l.hook && !placed.has(l.id)) warnings.push(`line ${l.id} is not used by any scene`);
  if (placed.size !== lines.length) warnings.push('a line is used by more than one scene');

  const lineById = new Map(lines.map((l) => [l.id, l]));
  const sceneById = new Map(scenes.map((s) => [s.id, s]));

  // ── beats
  const beats: Record<string, number> = {};
  const anchorTime = (a: Anchor, sceneId: string): number => {
    if (a.scene || !a.line) {
      const s = sceneById.get(a.scene ?? sceneId);
      if (!s) throw new Error(`unknown scene anchor ${a.scene}`);
      const at = a.at ?? 'start';
      return at === 'start' ? s.start : at === 'end' ? s.end : s.start + (s.end - s.start) * at;
    }
    const l = lineById.get(a.line);
    if (!l) throw new Error(`beat anchored to unknown/unplaced line ${a.line}`);
    if (a.word) {
      const w = inp.words?.[a.line]?.filter((x) => x.word.includes(a.word!))[(a.occurrence ?? 1) - 1];
      if (w) return l.start + w.start;
      const fr = wordFraction(l.text, a.word, a.occurrence ?? 1);
      if (fr === null) {
        warnings.push(`word «${a.word}» not found in ${a.line}; using line start`);
        return l.start;
      }
      return l.start + (l.end - l.start) * fr;
    }
    const at = a.at ?? 'start';
    return at === 'start' ? l.start : at === 'end' ? l.end : l.start + (l.end - l.start) * at;
  };
  for (const sc of inp.storyboard.scenes) {
    for (const b of sc.beats) {
      if (beats[b.name] !== undefined) throw new Error(`duplicate beat name ${b.name}`);
      beats[b.name] = r3(anchorTime(b.anchor, sc.id) + (b.offset ?? 0));
    }
  }

  // ── sfx
  const sfx: Timeline['sfx'] = [];
  for (const sc of inp.storyboard.scenes)
    for (const c of sc.sfx ?? []) {
      if (beats[c.beat] === undefined) {
        warnings.push(`sfx ${c.name} references unknown beat ${c.beat}`);
        continue;
      }
      sfx.push({name: c.name, at: r3(Math.max(0, beats[c.beat] + (c.offset ?? 0))), volume: c.volume ?? 0.6});
    }

  // ── captions: short chunks, proportional to characters inside each line
  const captions: Caption[] = [];
  const chunk = (text: string, start: number, end: number, emphasis: string[]) => {
    const words = text.split(/\s+/).filter(Boolean);
    const groups: string[][] = [];
    for (let i = 0; i < words.length; i += 6) groups.push(words.slice(i, i + 6));
    // avoid a dangling 1–2 word tail
    if (groups.length > 1 && groups[groups.length - 1].length <= 2) groups[groups.length - 2].push(...groups.pop()!);
    const total = text.length || 1;
    let cur = start;
    for (const g of groups) {
      const t = g.join(' ');
      const d = (end - start) * ((t.length + 1) / (total + 1));
      captions.push({start: r3(cur), end: r3(cur + d), text: t, highlight: emphasis.filter((e) => t.includes(e))});
      cur += d;
    }
  };
  // hook captions spread over the speech windows (or the whole clip)
  const hookText = hookLines.map((l) => l.text).join(' ');
  if (hookText) {
    const holdSec = inp.hook.holdFrames / S.fps;
    const kw = inp.hook.keyWordSec;
    const map = (t: number) => (kw !== null && t >= kw ? t + holdSec : t);
    const sp = inp.hook.speech?.length ? inp.hook.speech : [[0.1, clipSec - 0.1] as [number, number]];
    const spanStart = sp[0][0];
    const spanEnd = sp[sp.length - 1][1];
    hookLines.forEach((l, i) => {
      const a = spanStart + ((spanEnd - spanStart) * i) / hookLines.length;
      const b = spanStart + ((spanEnd - spanStart) * (i + 1)) / hookLines.length;
      chunk(l.text, map(a), Math.min(map(b), hookEnd - 0.4), inp.script.hook?.key_word ? [inp.script.hook.key_word, ...(l.emphasis ?? [])] : l.emphasis ?? []);
    });
  }
  for (const l of lines) chunk(l.text, l.start, l.end + Math.min(0.25, S.lineGapSec), l.emphasis ?? []);

  // the last scene owns the final frames (no black tail)
  const totalSec = scenes.length ? scenes[scenes.length - 1].end : hookEnd;
  return {
    episodeId: inp.episodeId,
    mode: inp.mode,
    fps: S.fps,
    hook: {start: 0, end: hookEnd, clipSec, holdFrames: inp.hook.holdFrames, keyWordSec: inp.hook.keyWordSec, tailHoldSec, exitSec: S.hookExitSec},
    lines,
    scenes,
    beats,
    sfx,
    captions,
    totalSec,
    warnings,
  };
};
