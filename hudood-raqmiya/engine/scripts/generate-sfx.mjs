// TEMPORARY sound kit for «الحدود الرقمية» (procedural). Every file is replaced by a real
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

// ── whoosh: moving air (filtered noise with a doppler-like sweep)
{
  for (const [name, len, f0, f1] of [['whoosh_air', 0.9, 300, 3200], ['whoosh_fast', 0.45, 600, 6000]]) {
    const f = svf();
    const L = new Float32Array(Math.round(len * SR)), R = new Float32Array(L.length);
    for (let i = 0; i < L.length; i++) {
      const t = i / SR, k = t / len;
      const shape = Math.sin(Math.PI * Math.pow(k, 0.8)) ** 2;
      const fc = f0 + (f1 - f0) * Math.sin(Math.PI * k);
      const s = f(noise(), fc, 0.35).bp * shape * 1.4;
      const pan = k * 2 - 1;
      L[i] = s * (1 - pan * 0.6);
      R[i] = s * (1 + pan * 0.6);
    }
    write(`sfx/${name}.wav`, verb(L, 0.2), verb(R, 0.2));
  }
}
// ── sub hit / boom
{
  const hit = mk(1.6, (t) => Math.sin(TAU * (38 + 70 * Math.exp(-t * 18)) * t) * env(t, 0.004, 0.45) * 0.9 + noise() * env(t, 0.001, 0.02) * 0.35);
  write('sfx/sub_hit.wav', ...stereo(verb(hit, 0.15)));
  const f = svf();
  const boom = mk(2.4, (t) => Math.sin(TAU * (32 + 40 * Math.exp(-t * 8)) * t) * env(t, 0.01, 0.8) * 0.8 + f(noise(), 180, 0.6).lo * env(t, 0.002, 0.35) * 1.2);
  write('sfx/boom_soft.wav', ...stereo(verb(boom, 0.35, 1.6), 0.3));
}
// ── metallic lock-on (reticle)
{
  const m = mk(0.7, (t) => {
    const c1 = noise() * env(t, 0.0003, 0.004) * 0.8;
    const c2 = t > 0.055 ? noise() * env(t - 0.055, 0.0003, 0.005) * 0.9 : 0;
    const ring = (Math.sin(TAU * 2410 * t) * 0.5 + Math.sin(TAU * 3710 * t) * 0.35 + Math.sin(TAU * 5230 * t) * 0.2) * env(Math.max(0, t - 0.055), 0.001, 0.09) * (t > 0.055 ? 0.5 : 0);
    const beep = t > 0.12 && t < 0.32 ? Math.sin(TAU * 1760 * t) * 0.18 * (Math.floor(t * 40) % 2) : 0;
    return c1 + c2 + ring + beep;
  });
  write('sfx/lock_on.wav', ...stereo(verb(m, 0.18)));
}
// ── paper stamp
{
  const f = svf();
  const m = mk(0.9, (t) => Math.sin(TAU * (110 + 60 * Math.exp(-t * 40)) * t) * env(t, 0.002, 0.07) * 0.9 + f(noise(), 2200, 0.8).bp * env(t, 0.001, 0.05) * 0.8 + (t > 0.02 ? f(noise(), 5000, 1).hi * env(t - 0.02, 0.01, 0.12) * 0.15 : 0));
  write('sfx/stamp.wav', ...stereo(verb(m, 0.22)));
}
// ── paper / card slide
{
  const f = svf();
  const m = mk(0.5, (t) => {
    const k = t / 0.5;
    return f(noise(), 1200 + 3000 * k, 0.5).bp * Math.sin(Math.PI * k) ** 1.5 * (0.6 + 0.4 * Math.sin(t * 90 + rand())) * 1.1;
  });
  write('sfx/card_slide.wav', ...stereo(m, 0.3));
}
// ── key click / tick
{
  const f = svf();
  const m = mk(0.12, (t) => f(noise(), 3500, 1).bp * env(t, 0.0005, 0.006) * 1.2 + Math.sin(TAU * 1800 * t) * env(t, 0.0005, 0.01) * 0.2);
  write('sfx/tick.wav', ...stereo(m));
}
// ── padlock unlock (shackle release + latch)
{
  const m = mk(0.9, (t) => {
    const click = noise() * env(t, 0.0003, 0.006) * 0.9;
    const slide = t > 0.05 && t < 0.22 ? noise() * 0.15 * Math.sin(((t - 0.05) / 0.17) * Math.PI) : 0;
    const latch = t > 0.22 ? (noise() * env(t - 0.22, 0.0003, 0.008) + Math.sin(TAU * 2900 * t) * env(t - 0.22, 0.001, 0.12) * 0.4) : 0;
    return click + slide + latch;
  });
  write('sfx/unlock.wav', ...stereo(verb(m, 0.2)));
}
// ── riser (air + tone)
{
  const f = svf();
  const len = 1.8;
  const m = mk(len, (t) => {
    const k = t / len;
    return f(noise(), 400 + 7000 * k * k, 0.4).bp * k * k * 0.9 + Math.sin(TAU * (180 + 520 * k * k) * t) * k * k * 0.25;
  });
  write('sfx/riser.wav', ...stereo(verb(m, 0.3), 0.25));
}
// ── notification pop (soft, two tones)
{
  const m = mk(0.6, (t) => Math.sin(TAU * 988 * t) * env(t, 0.003, 0.08) * 0.5 + (t > 0.07 ? Math.sin(TAU * 1480 * t) * env(t - 0.07, 0.003, 0.12) * 0.45 : 0));
  write('sfx/notif.wav', ...stereo(verb(m, 0.25)));
}
// ── tape stop
{
  let ph = 0;
  const m = mk(0.7, (t) => {
    const k = t / 0.7;
    ph += (TAU * 220 * (1 - k) ** 2) / SR;
    return (Math.sin(ph) * 0.6 + noise() * 0.08 * (1 - k)) * (1 - k);
  });
  write('sfx/tape_stop.wav', ...stereo(m));
}
// ── glitch
{
  const m = mk(0.45, (t) => {
    const seg = Math.floor(t * 40);
    const on = (seg * 7919) % 3 !== 0 ? 1 : 0;
    const crush = Math.round(Math.sin(TAU * (300 + (seg % 5) * 220) * t) * 4) / 4;
    return (crush * 0.4 + noise() * 0.2) * on * (1 - t / 0.45);
  });
  write('sfx/glitch.wav', ...stereo(m, 0.4));
}
// ── flip (toggle)
{
  const m = mk(0.2, (t) => noise() * env(t, 0.0004, 0.004) * 0.9 + (t > 0.03 ? Math.sin(TAU * 1300 * t) * env(t - 0.03, 0.001, 0.03) * 0.35 : 0));
  write('sfx/flip.wav', ...stereo(m));
}
// ── warm swell (green moments) / dark drone (red moments)
{
  const notes = [146.8, 220, 293.7, 369.9];
  const m = mk(2.6, (t) => notes.reduce((a, f, i) => a + Math.sin(TAU * f * t + i) * (0.5 + 0.5 * Math.sin(TAU * 0.5 * t)), 0) * 0.12 * Math.sin(Math.PI * Math.min(1, t / 2.6)));
  write('sfx/warm_swell.wav', ...stereo(verb(m, 0.4, 1.5), 0.3));
  const f = svf();
  const d = mk(2.4, (t) => (Math.sin(TAU * 55 * t) * 0.5 + Math.sin(TAU * 58.3 * t) * 0.4 + f(noise(), 300, 0.4).lo * 0.6) * Math.sin(Math.PI * Math.min(1, t / 2.4)) * 0.6);
  write('sfx/dark_drone.wav', ...stereo(verb(d, 0.3, 1.4), 0.3));
}
// ── end hit
{
  const f = svf();
  const m = mk(3.2, (t) => Math.sin(TAU * (36 + 60 * Math.exp(-t * 10)) * t) * env(t, 0.004, 0.9) * 0.8 + f(noise(), 900, 0.5).bp * env(t, 0.001, 0.25) * 0.7 + Math.sin(TAU * 293.7 * t) * env(t, 0.01, 1.4) * 0.12);
  write('sfx/end_hit.wav', ...stereo(verb(m, 0.4, 1.8), 0.3));
}

// ── MUSIC: tense documentary pulse, D minor, 100 BPM, 100 s
{
  const BPM = 100, BEAT = 60 / BPM, LEN = 100;
  const n = Math.round(LEN * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const prog = [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]]; // Dm Bb C A
  const bassN = [38, 34, 36, 33];
  const lp = svf(), hp = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bar = Math.floor(t / (4 * BEAT)), ch = prog[bar % 4];
    const inBeat = t % BEAT, eighth = t % (BEAT / 2);
    const intro = t < 4 * BEAT * 2;
    // low piano ostinato on eighths
    const step = Math.floor(t / (BEAT / 2)) % 4;
    const pf = midi(ch[[0, 1, 2, 1][step]] + 12);
    const piano = (Math.sin(TAU * pf * t) + 0.3 * Math.sin(TAU * pf * 2 * t)) * Math.exp(-eighth * 6) * 0.16;
    // strings pad
    let pad = 0;
    for (const m of ch) pad += Math.sin(TAU * midi(m) * t + Math.sin(t * 5) * 0.3) + 0.5 * Math.sin(TAU * midi(m) * 1.005 * t);
    pad = lp(pad * 0.05, 1200, 0.8).lo * (0.7 + 0.3 * Math.sin(TAU * t / (8 * BEAT)));
    // pulsing bass
    const bass = intro ? 0 : Math.tanh(Math.sin(TAU * midi(bassN[bar % 4]) * t) * 1.5) * (0.5 + 0.5 * Math.exp(-inBeat * 7)) * 0.2;
    // soft kick + ticking hat
    const kick = intro ? 0 : Math.sin(TAU * (48 + 80 * Math.exp(-inBeat * 30)) * inBeat) * Math.exp(-inBeat * 8) * 0.3;
    const hat = hp(noise(), 8000, 0.5).hi * Math.exp(-eighth * 70) * (intro ? 0.03 : 0.06);
    const v = piano + pad + bass + kick + hat;
    const w = Math.sin(t * 0.7) * 0.15;
    L[i] = v * (1 + w);
    R[i] = v * (1 - w);
  }
  const fade = Math.round(3 * SR);
  for (let i = 0; i < fade; i++) { L[n - fade + i] *= 1 - i / fade; R[n - fade + i] *= 1 - i / fade; }
  write('music/pulse.wav', verb(L, 0.25, 1.3).subarray(0, n), verb(R, 0.25, 1.3).subarray(0, n));
}
console.log('done — TEMPORARY kit; replace with real library sounds of the same names.');
