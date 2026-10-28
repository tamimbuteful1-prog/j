import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {ep, P} from './paths.ts';
import {loadConfig} from './config.ts';
import {readContract, writeJson, validate} from './contracts.ts';
import {estimateLineSec, type ScriptLine} from '../../engine/src/timeline/resolve.ts';

const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const FFPROBE = process.env.FFPROBE ?? 'ffprobe';

export type Probe = {width: number; height: number; durationSec: number; hasAudio: boolean; hasVideo: boolean};

export const probe = (file: string): Probe => {
  const out = execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', file]).toString();
  const j = JSON.parse(out) as {streams: {codec_type: string; width?: number; height?: number}[]; format: {duration?: string}};
  const v = j.streams.find((s) => s.codec_type === 'video');
  return {
    width: v?.width ?? 0,
    height: v?.height ?? 0,
    durationSec: Number(j.format.duration ?? 0),
    hasAudio: j.streams.some((s) => s.codec_type === 'audio'),
    hasVideo: !!v,
  };
};

/** Speech windows from ffmpeg silencedetect → [[start,end],…] in seconds. */
export const speechWindows = (file: string, noiseDb = -32, minSilence = 0.12): [number, number][] => {
  const dur = probe(file).durationSec;
  const log = execFileSync('sh', ['-c', `"${FFMPEG}" -hide_banner -nostats -i "${file}" -af silencedetect=noise=${noiseDb}dB:d=${minSilence} -f null - 2>&1 || true`]).toString();
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  const silences: [number, number][] = starts.map((s, i) => [s, ends[i] ?? dur]);
  const speech: [number, number][] = [];
  let cur = 0;
  for (const [s, e] of silences) {
    if (s - cur > 0.05) speech.push([cur, s]);
    cur = e;
  }
  if (dur - cur > 0.05) speech.push([cur, dur]);
  return speech.map(([a, b]) => [Math.round(a * 1000) / 1000, Math.round(b * 1000) / 1000]);
};

const AUDIO_EXT = ['.wav', '.m4a', '.mp3', '.aac', '.flac'];
const VIDEO_EXT = ['.mp4', '.mov', '.m4v'];

export const findHook = (id: string) => {
  const d = ep(id).hook;
  if (!fs.existsSync(d)) return null;
  const f = fs.readdirSync(d).find((x) => VIDEO_EXT.includes(path.extname(x).toLowerCase()));
  return f ? path.join(d, f) : null;
};

export const findVoice = (id: string, lineIds: string[]) => {
  const d = ep(id).voice;
  const files = fs.existsSync(d) ? fs.readdirSync(d).filter((x) => AUDIO_EXT.includes(path.extname(x).toLowerCase())) : [];
  const perLine: Record<string, string> = {};
  for (const lid of lineIds) {
    const f = files.find((x) => path.parse(x).name.toUpperCase() === lid.toUpperCase());
    if (f) perLine[lid] = path.join(d, f);
  }
  const single = files.find((x) => /^(full|voiceover|vo)$/i.test(path.parse(x).name));
  return {perLine, single: single ? path.join(d, single) : null, missing: lineIds.filter((l) => !perLine[l])};
};

type Script = {lines: ScriptLine[]; hook: {text: string; key_word: string}; approval: {status: string}};

export const loadScript = (id: string) => readContract<Script>('script', path.join(ep(id).script, 'script.json'));

/** What the presenter still has to upload. */
export const mediaStatus = (id: string) => {
  const s = loadScript(id);
  const voiceLines = s.lines.filter((l) => !l.hook).map((l) => l.id);
  const hook = findHook(id);
  const v = findVoice(id, voiceLines);
  const voiceReady = v.missing.length === 0 || !!v.single;
  return {hook, voiceReady, missing: v.single ? [] : v.missing, single: v.single, ready: !!hook && voiceReady};
};

/** Link shared engine assets into the episode's render public dir. */
export const preparePublicDir = (id: string) => {
  const pub = ep(id).publicDir;
  fs.mkdirSync(path.join(pub, 'vo'), {recursive: true});
  for (const d of ['fonts', 'sfx', 'music']) {
    const link = path.join(pub, d);
    if (!fs.existsSync(link)) fs.symlinkSync(path.join(P.engine, 'public', d), link, 'dir');
  }
  return pub;
};

const run = (args: string[]) => execFileSync(FFMPEG, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', ...args], {stdio: ['ignore', 'pipe', 'pipe'], timeout: 10 * 60 * 1000});

/**
 * Every spoken piece (hook audio and each voice line) is levelled to this one loudness.
 * It sits 2 dB under the platform target so the true-peak cap never binds and every line
 * lands at exactly the same level; the static mastering gain then lifts the whole mix.
 */
const VOICE_LUFS = -16;

/** Integrated loudness and true peak of a file (ffmpeg loudnorm analysis pass). */
const measureLoudness = (file: string) => {
  const log = execFileSync('sh', ['-c', `"${FFMPEG}" -nostdin -hide_banner -i "${file}" -af loudnorm=print_format=json -f null - 2>&1 || true`]).toString();
  const j = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1)) as {input_i: string; input_tp: string};
  return {i: Number(j.input_i), tp: Number(j.input_tp)};
};

/**
 * Trim leading/trailing silence (keep 60 ms air — the timeline adds the line gap) and level one spoken line.
 * Edges come from a lenient silencedetect (-50 dB) so soft onsets and word tails survive,
 * with short fades so no cut clicks. Levelling is one static gain (never dynamic
 * loudnorm, which pumps on short clips), capped so the true peak stays ≤ -1.5 dBTP.
 */
const conformLine = (src: string, dst: string, lufs: number, fromSec?: number, toSec?: number) => {
  let a = fromSec ?? 0;
  let b = toSec ?? probe(src).durationSec;
  const sp = speechWindows(src, -50, 0.12).filter(([x, y]) => y > a && x < b);
  if (sp.length) {
    a = Math.max(a, sp[0][0]);
    b = Math.min(b, sp[sp.length - 1][1]);
  }
  const start = Math.max(0, a - 0.06);
  const dur = b - a + 0.12;
  const tmp = `${dst}.cut.wav`;
  run(['-ss', String(start), '-t', String(dur), '-i', src, '-af', `highpass=f=70,afade=t=in:d=0.012,afade=t=out:st=${Math.max(0, dur - 0.03).toFixed(3)}:d=0.03`, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_f32le', tmp]);
  const m = measureLoudness(tmp);
  const gain = Number.isFinite(m.i) ? Math.min(lufs - m.i, -1.5 - m.tp) : 0;
  run(['-i', tmp, '-af', `volume=${gain.toFixed(2)}dB`, '-ar', '48000', '-ac', '1', dst]);
  fs.rmSync(tmp, {force: true});
  return probe(dst).durationSec;
};

/**
 * Deterministic part of the Assembly stage. Produces final/assembly_plan.json and the
 * conformed media in production/public. The Assembly Agent reviews it and edits only the
 * judgement fields (hook trim, key-word time) — re-running keeps those edits.
 */
export const prepareMedia = (id: string) => {
  const cfg = loadConfig();
  const e = ep(id);
  const s = loadScript(id);
  const pub = preparePublicDir(id);
  const planFile = path.join(e.final, 'assembly_plan.json');
  const prev = fs.existsSync(planFile) ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : null;
  const issues: {severity: 'blocker' | 'warning'; message: string; line?: string}[] = [];

  // ── hook
  const hookSrc = findHook(id);
  if (!hookSrc) issues.push({severity: 'blocker', message: 'no hook video in 01_hook/'});
  let hook = {file: '', width: 0, height: 0, duration_sec: 0, framing: 'fit' as 'fit' | 'fill', speech: [] as [number, number][], trim_start_sec: 0, trim_end_sec: null as number | null, key_word_sec: null as number | null, hold_frames: 12};
  if (hookSrc) {
    const pr = probe(hookSrc);
    const conformed = path.join(pub, 'hook.mp4');
    const srcStat = fs.statSync(hookSrc).mtimeMs;
    if (!fs.existsSync(conformed) || fs.statSync(conformed).mtimeMs < srcStat) {
      // static gain to the shared voice level, so the hook and the voice-over sound like one take
      const m = measureLoudness(hookSrc);
      const gain = Number.isFinite(m.i) ? Math.min(VOICE_LUFS - m.i, -1.5 - m.tp) : 0;
      run(['-i', hookSrc, '-vf', `scale='min(1920,iw)':-2:flags=lanczos,fps=${cfg.episode.fps},format=yuv420p`, '-af', `highpass=f=70,volume=${gain.toFixed(2)}dB`, '-ar', '48000', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', conformed]);
    }
    const sameFile = prev?.hook?.file === path.relative(e.dir, hookSrc) && prev?.hook?.duration_sec === Math.round(pr.durationSec * 1000) / 1000;
    hook = {
      file: path.relative(e.dir, hookSrc),
      width: pr.width,
      height: pr.height,
      duration_sec: Math.round(pr.durationSec * 1000) / 1000,
      framing: pr.width > pr.height ? 'fit' : 'fill',
      speech: pr.hasAudio ? speechWindows(conformed) : [],
      trim_start_sec: sameFile ? prev.hook.trim_start_sec : 0,
      trim_end_sec: sameFile ? prev.hook.trim_end_sec : null,
      key_word_sec: sameFile ? prev.hook.key_word_sec : null,
      hold_frames: sameFile ? prev.hook.hold_frames ?? 12 : 12,
    };
    if (!pr.hasAudio) issues.push({severity: 'blocker', message: 'hook video has no audio track'});
    if (pr.durationSec > 15) issues.push({severity: 'warning', message: `hook is ${pr.durationSec.toFixed(1)}s — the script hook should be ≤ 8s; set trim_start_sec / trim_end_sec`});
  }

  // ── voice-over
  const voiceLines = s.lines.filter((l) => !l.hook);
  const v = findVoice(id, voiceLines.map((l) => l.id));
  const lines: {id: string; file: string; duration_sec: number; expected_sec: number; ratio: number}[] = [];
  let mode: 'per_line' | 'single_file' = 'per_line';
  if (v.missing.length === 0) {
    for (const l of voiceLines) {
      const dst = path.join(pub, 'vo', `${l.id}.wav`);
      const d = conformLine(v.perLine[l.id], dst, VOICE_LUFS);
      const exp = estimateLineSec(l.text, cfg.episode.speech_rate_words_per_sec);
      lines.push({id: l.id, file: `vo/${l.id}.wav`, duration_sec: Math.round(d * 1000) / 1000, expected_sec: exp, ratio: Math.round((d / exp) * 100) / 100});
    }
  } else if (v.single) {
    mode = 'single_file';
    let segs: [number, number][] = [];
    for (const d of [0.6, 0.8, 0.5, 1.0, 0.4]) {
      segs = speechWindows(v.single, -35, d);
      if (segs.length === voiceLines.length) break;
    }
    if (segs.length !== voiceLines.length) {
      issues.push({severity: 'blocker', message: `full voice-over has ${segs.length} spoken segments but the script has ${voiceLines.length} lines — record one file per line (L03.wav…) or leave a full one-second pause between lines`});
    } else {
      voiceLines.forEach((l, i) => {
        const dst = path.join(pub, 'vo', `${l.id}.wav`);
        const d = conformLine(v.single!, dst, VOICE_LUFS, segs[i][0], segs[i][1]);
        const exp = estimateLineSec(l.text, cfg.episode.speech_rate_words_per_sec);
        lines.push({id: l.id, file: `vo/${l.id}.wav`, duration_sec: Math.round(d * 1000) / 1000, expected_sec: exp, ratio: Math.round((d / exp) * 100) / 100});
      });
    }
  } else {
    issues.push({severity: 'blocker', message: `missing voice-over lines: ${v.missing.join(', ')}`});
  }
  for (const l of lines) {
    if (l.ratio < 0.4 || l.ratio > 2.6) issues.push({severity: 'blocker', line: l.id, message: `${l.id} lasts ${l.duration_sec}s but its text suggests ~${l.expected_sec}s — wrong take or wrong file?`});
    else if (l.ratio < 0.6 || l.ratio > 1.8) issues.push({severity: 'warning', line: l.id, message: `${l.id} duration is unusual (${l.duration_sec}s vs ~${l.expected_sec}s)`});
  }

  const plan = validate('assembly_plan', {episode_id: id, hook, voiceover: {mode, lines}, issues, agent_notes: prev?.agent_notes ?? ''}, planFile);
  writeJson(planFile, plan);
  return plan as {hook: typeof hook; voiceover: {mode: typeof mode; lines: typeof lines}; issues: typeof issues};
};
