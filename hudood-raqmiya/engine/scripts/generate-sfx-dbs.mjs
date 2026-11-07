// Sound kit for «جندي على الحدود الرقمية» (procedural placeholders; swap 1:1 for licensed library sounds of the same name)
// library sound of the same name dropped into public/sfx or public/music.
//   node scripts/generate-sfx.mjs
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SR = 48000;
const TAU = Math.PI * 2;
let seed = 99;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = () => rand() * 2 - 1;

const write = (rel, L, R = L) => {
  const n = L.length;
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.89 / peak : 1;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), {recursive: true});
  writeFileSync(p, b);
  console.log('✓', rel, (n / SR).toFixed(2) + 's');
};

// resonant state-variable filter
const svf = () => {
  let lo = 0, bp = 0;
  return (x, fc, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 3)) / SR);
    lo += f * bp;
    const hi = x - lo - q * bp;
    bp += f * hi;
    return {lo, bp, hi};
  };
};
// small room / plate for realism
const verb = (x, mix = 0.25, size = 1) => {
  const ds = [0.0297, 0.0371, 0.0411, 0.0437].map((d) => Math.round(d * size * SR));
  const bufs = ds.map((d) => new Float32Array(d));
  const idx = ds.map(() => 0);
  const out = new Float32Array(x.length + Math.round(0.6 * SR * size));
  for (let i = 0; i < out.length; i++) {
    const s = i < x.length ? x[i] : 0;
    let w = 0;
    for (let k = 0; k < 4; k++) {
      const y = bufs[k][idx[k]];
      bufs[k][idx[k]] = s + y * 0.72;
      idx[k] = (idx[k] + 1) % ds[k];
      w += y;
    }
    out[i] = s * (1 - mix) + (w / 4) * mix;
  }
  return out;
};
const mk = (sec, fn) => {
  const n = Math.round(sec * SR);
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = fn(i / SR, i);
  return a;
};
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const stereo = (m, w = 0.15) => {
  const L = new Float32Array(m.length), R = new Float32Array(m.length);
  let d1 = 0;
  for (let i = 0; i < m.length; i++) {
    const del = i > 240 ? m[i - 240] : 0;
    L[i] = m[i] + del * w;
    R[i] = m[i] - del * w;
    d1 = del;
  }
  return [L, R];
};

import {copyFileSync} from 'node:fs';
for (const n of ['whoosh_air', 'whoosh_fast', 'sub_hit', 'boom_soft', 'lock_on', 'stamp', 'card_slide', 'unlock', 'riser', 'glitch', 'warm_swell', 'end_hit', 'tick']) {
  mkdirSync(join(ROOT, 'sfx/dbs'), {recursive: true});
  copyFileSync(join(ROOT, `sfx/${n}.wav`), join(ROOT, `sfx/dbs/${n}.wav`));
}
const W = (n, ...a) => write(`sfx/dbs/${n}.wav`, ...a);
const click = (t, a = 0, d = 0.004, g = 1) => (t > a ? noise() * env(t - a, 0.0003, d) * g : 0);

// room tone: air, far AC, the hum of a server rack in the next room — 46 s
{
  const a = svf(), b = svf();
  const m = mk(46, (t) => a(noise(), 240, 0.5).lo * 0.7 + b(noise(), 1100, 0.9).bp * 0.05 + Math.sin(TAU * 50 * t) * 0.03 + Math.sin(TAU * 100 * t) * 0.02);
  W('room_tone', ...stereo(m, 0.35));
}
// investigation drone: low, unresolved, no melody — 46 s
{
  const n = Math.round(46 * SR), L = new Float32Array(n), R = new Float32Array(n);
  const f1 = svf(), f2 = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR, sw = 0.5 + 0.5 * Math.sin(t * 0.11);
    const v = Math.sin(TAU * 36.7 * t) * 0.5 + Math.sin(TAU * 55 * t + 1) * 0.25 * sw + (Math.sin(TAU * 220 * t) + Math.sin(TAU * 233.1 * t)) * 0.025 + f1(noise(), 420 + 300 * sw, 0.3).bp * 0.08;
    const o = f2(v, 1800, 0.7).lo, w = Math.sin(t * 0.23) * 0.3;
    L[i] = o * (1 + w); R[i] = o * (1 - w);
  }
  W('drone', verb(L, 0.35, 1.8).subarray(0, n), verb(R, 0.35, 1.9).subarray(0, n));
}
W('torch_click', ...stereo(verb(mk(0.4, (t) => click(t, 0, 0.003, 1) + click(t, 0.03, 0.005, 0.7) + Math.sin(TAU * 3200 * t) * env(t, 0.0005, 0.01) * 0.3), 0.2)));
{
  const f = svf();
  W('buzz', ...stereo(mk(0.55, (t) => f(Math.sign(Math.sin(TAU * 170 * t)) * 0.5 + noise() * 0.25, 1000, 0.6).lo * ((t % 0.27) < 0.2 ? 1 : 0) * Math.min(1, (0.55 - t) * 20)), 0.05));
}
{
  const f = svf();
  W('pop', ...stereo(verb(mk(0.25, (t) => Math.sin(TAU * (900 - 2400 * t) * t) * env(t, 0.001, 0.03) * 0.8 + f(noise(), 2500, 0.8).bp * env(t, 0.0005, 0.01)), 0.15), 0.2));
}
// rubber stretch / pressure building — 4.4 s
{
  const f = svf();
  W('stretch', ...stereo(verb(mk(4.4, (t) => { const k = t / 4.4; return f(noise() + Math.sin(TAU * (60 + 140 * k * k) * t) * 0.6, 200 + 900 * k, 1.5).bp * k * k * (0.8 + 0.2 * Math.sin(t * 31)); }), 0.2), 0.2));
}
W('heartbeat', ...stereo(mk(1.6, (t) => [0, 0.28, 0.8, 1.08].reduce((s, a, i) => s + (t > a ? Math.sin(TAU * 48 * (t - a)) * env(t - a, 0.006, 0.07) * (i % 2 ? 0.6 : 1) : 0), 0)), 0.05));
W('pin', ...stereo(verb(mk(0.3, (t) => click(t, 0, 0.004, 0.8) + Math.sin(TAU * 1800 * t) * env(t, 0.0005, 0.02) * 0.25 + Math.sin(TAU * 160 * t) * env(t, 0.001, 0.03) * 0.5), 0.15)));
{
  const f = svf();
  W('marker', ...stereo(mk(1.1, (t) => f(noise(), 3800, 1.2).bp * Math.sin(Math.PI * Math.min(1, t / 1.0)) ** 0.5 * (0.6 + 0.4 * Math.sin(t * 40)) * 0.9), 0.2));
}
// the puppet-hand shadow: dark reverse swell + low growl
{
  const f = svf();
  W('shadow_swell', ...stereo(verb(mk(3.2, (t) => { const k = Math.min(1, t / 1.4); const d = Math.exp(-Math.max(0, t - 1.4) * 1.5); return (f(noise(), 120 + 300 * k, 0.6).lo * 1.6 + Math.sin(TAU * 41 * t) * 0.4) * k * k * d; }), 0.45, 1.8), 0.3));
}
W('creak', ...stereo(verb(mk(1.2, (t) => { const fr = 180 + 60 * Math.sin(t * 5); return Math.sign(Math.sin(TAU * fr * t)) * 0.2 * (Math.floor(t * fr) % 3 === 0 ? 1 : 0.3) * Math.sin(Math.PI * t / 1.2); }), 0.35)));
W('crack', ...stereo(verb(mk(0.6, (t) => click(t, 0, 0.01, 1) + click(t, 0.04, 0.008, 0.6) + click(t, 0.09, 0.006, 0.4)), 0.25)));
{
  const f = svf(), g = svf();
  W('flame', ...stereo(verb(mk(2.2, (t) => (f(noise(), 600, 0.5).lo * 1.4 + (rand() > 0.997 ? noise() * 2 : 0) + g(noise(), 3000, 1).bp * 0.15) * Math.min(1, t * 6) * Math.exp(-Math.max(0, t - 1.4) * 4)), 0.2), 0.3));
}
{
  const f = svf();
  W('door', ...stereo(verb(mk(2.0, (t) => f(noise(), 300, 0.4).lo * Math.sin(Math.PI * Math.min(1, t / 1.6)) * 0.9 + (t > 1.55 ? Math.sin(TAU * 70 * t) * env(t - 1.55, 0.003, 0.15) : 0)), 0.4, 1.5), 0.25));
}
{
  const f = svf();
  W('footstep', ...stereo(verb(mk(0.5, (t) => Math.sin(TAU * (90 + 50 * Math.exp(-t * 40)) * t) * env(t, 0.003, 0.05) + f(noise(), 900, 0.6).bp * env(t, 0.002, 0.04) * 0.8), 0.3)));
}
// shield wall powering up: rising electric hum
W('shield_up', ...stereo(verb(mk(1.8, (t) => { const k = Math.min(1, t / 0.9); return (Math.sin(TAU * (80 + 160 * k) * t) * 0.5 + Math.sin(TAU * (160 + 320 * k) * t) * 0.25 + noise() * 0.05) * k * Math.exp(-Math.max(0, t - 0.9) * 2); }), 0.3), 0.3));
{
  const f = svf();
  W('incoming', ...stereo(mk(0.8, (t) => f(noise(), 800 + 3000 * (t / 0.8), 1.2).bp * (t / 0.8) ** 2 * 0.8), 0.4));
}
// deflect: energy impact + shimmer
W('deflect', ...stereo(verb(mk(1.2, (t) => Math.sin(TAU * (55 + 90 * Math.exp(-t * 20)) * t) * env(t, 0.002, 0.18) + noise() * env(t, 0.0005, 0.02) * 0.6 + (Math.sin(TAU * 1240 * t) + Math.sin(TAU * 1873 * t)) * env(t, 0.003, 0.25) * 0.12), 0.35, 1.4), 0.3));
{
  const f = svf();
  W('scanner', ...stereo(verb(mk(1.8, (t) => (Math.sin(TAU * 440 * t) * 0.15 + f(noise(), 2000 + 1500 * Math.sin(Math.PI * t / 1.8), 2).bp * 0.5) * Math.sin(Math.PI * t / 1.8)), 0.25), 0.3));
}
W('beep', ...stereo(verb(mk(0.3, (t) => Math.sin(TAU * 1568 * t) * env(t, 0.003, 0.06) * 0.6), 0.2)));
{
  const f = svf();
  W('page_turn', ...stereo(verb(mk(0.6, (t) => f(noise(), 2500, 0.7).bp * Math.sin(Math.PI * t / 0.6) ** 2 * (0.5 + 0.5 * Math.sin(t * 70)) * 1.2), 0.15), 0.25));
}
{
  const f = svf();
  W('printer', ...stereo(verb(mk(1.1, (t) => (f(noise(), 1500, 0.8).bp * 0.6 + Math.sin(TAU * 120 * t) * 0.2) * ((t * 18) % 1 < 0.6 ? 1 : 0.4) * Math.sin(Math.PI * t / 1.1)), 0.2)));
}
// map drawing: soft electric line tracing
W('map_draw', ...stereo(verb(mk(1.6, (t) => (Math.sin(TAU * (300 + 400 * t) * t) * 0.15 + noise() * 0.08) * Math.sin(Math.PI * t / 1.6)), 0.4, 1.5), 0.3));
{
  const f = svf();
  W('folder', ...stereo(verb(mk(1.0, (t) => f(noise(), 1400, 0.6).bp * Math.sin(Math.PI * Math.min(1, t / 0.6)) * 0.6 + (t > 0.6 ? Math.sin(TAU * (80 + 40 * Math.exp(-(t - 0.6) * 30)) * t) * env(t - 0.6, 0.002, 0.08) + noise() * env(t - 0.6, 0.001, 0.02) * 0.5 : 0)), 0.3)));
}
W('lamp_click', ...stereo(verb(mk(0.5, (t) => click(t, 0, 0.004, 1) + Math.sin(TAU * 2400 * t) * env(t, 0.0005, 0.015) * 0.4 + click(t, 0.012, 0.003, 0.5)), 0.3)));
// metal ID tag + ball chain landing on wood
W('tag', ...stereo(verb(mk(1.4, (t) => {
  const hit = (a, g) => (t > a ? (Math.sin(TAU * 2830 * (t - a)) * 0.5 + Math.sin(TAU * 4170 * (t - a)) * 0.35 + Math.sin(TAU * 6020 * (t - a)) * 0.2) * env(t - a, 0.0005, 0.12) * g + noise() * env(t - a, 0.0003, 0.004) * g : 0);
  let chain = 0;
  for (let i = 0; i < 14; i++) chain += t > 0.06 + i * 0.018 ? noise() * env(t - 0.06 - i * 0.018, 0.0002, 0.003) * 0.35 : 0;
  return hit(0, 1) + hit(0.11, 0.45) + hit(0.19, 0.2) + chain + (t > 0 ? Math.sin(TAU * 140 * t) * env(t, 0.001, 0.03) * 0.5 : 0);
}), 0.25), 0.15));
console.log('done');
