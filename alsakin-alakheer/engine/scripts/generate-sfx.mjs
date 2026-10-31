// Sound kit for «الساكن الأخير» E01 — generated, to be swapped 1:1 for licensed library sounds of the same name.
//   node scripts/generate-sfx.mjs
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SR = 48000, TAU = Math.PI * 2;
let seed = 31;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const write = (rel, L, R = L, peakTo = 0.89) => {
  const n = L.length;
  let pk = 0;
  for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  const g = pk > 0 ? peakTo / pk : 1;
  const b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32);
  b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
    b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
  }
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), {recursive: true});
  writeFileSync(p, b);
  console.log('✓', rel, (n / SR).toFixed(2) + 's');
};
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
const room = (x, mix = 0.3, size = 1, fb = 0.75) => {
  const ds = [0.0297, 0.0371, 0.0411, 0.0437, 0.053].map((d) => Math.round(d * size * SR));
  const bufs = ds.map((d) => new Float32Array(d)), idx = ds.map(() => 0);
  const out = new Float32Array(x.length + Math.round(0.9 * SR * size));
  const lp = svf();
  for (let i = 0; i < out.length; i++) {
    const s = i < x.length ? x[i] : 0;
    let w = 0;
    for (let k = 0; k < ds.length; k++) {
      const y = bufs[k][idx[k]];
      bufs[k][idx[k]] = s + y * fb;
      idx[k] = (idx[k] + 1) % ds[k];
      w += y;
    }
    out[i] = s * (1 - mix) + lp(w / ds.length, 3500).lo * mix;
  }
  return out;
};
const mk = (sec, fn) => { const n = Math.round(sec * SR), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = fn(i / SR, i); return a; };
const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));
const st = (m, w = 0.12) => { const L = new Float32Array(m.length), R = new Float32Array(m.length); for (let i = 0; i < m.length; i++) { const d = i > 300 ? m[i - 300] : 0; L[i] = m[i] + d * w; R[i] = m[i] - d * w; } return [L, R]; };

// ── room tone (soft air + far traffic), 30 s loop
{
  const a = svf(), b = svf();
  const m = mk(30, (t) => a(noise(), 260, 0.5).lo * 0.6 + b(noise(), 900, 0.8).bp * 0.08 * (0.6 + 0.4 * Math.sin(t * 0.13)));
  write('sfx/room_tone.wav', ...st(m, 0.3), 0.35);
}
// ── distant electrical hum (60 Hz mains + harmonics), 30 s loop
{
  const m = mk(30, (t) => (Math.sin(TAU * 60 * t) * 0.5 + Math.sin(TAU * 120 * t) * 0.35 + Math.sin(TAU * 180 * t) * 0.12) * (0.85 + 0.15 * Math.sin(t * 0.7)));
  write('sfx/hum.wav', ...st(m, 0.05), 0.3);
}
// ── three heavy wooden knocks are placed one by one: single knock
{
  const f = svf(), g = svf();
  const m = mk(1.4, (t) => {
    const body = Math.sin(TAU * (92 + 40 * Math.exp(-t * 30)) * t) * env(t, 0.002, 0.09) * 0.9;
    const panel = f(noise(), 420, 0.25).bp * env(t, 0.001, 0.05) * 1.6;
    const click = g(noise(), 2600, 0.6).bp * env(t, 0.0005, 0.008) * 0.6;
    return body + panel + click;
  });
  write('sfx/knock.wav', ...st(room(m, 0.32, 1.2), 0.1));
}
// ── phone vibration on wood (buzz pulses with rattle)
{
  const f = svf();
  const m = mk(1.3, (t) => {
    const on = (t % 0.62) < 0.42 ? 1 : 0;
    const buzz = Math.sign(Math.sin(TAU * 165 * t)) * 0.4 + Math.sin(TAU * 330 * t) * 0.2;
    return f(buzz + noise() * 0.2, 900, 0.6).lo * on * 0.8;
  });
  write('sfx/vibrate.wav', ...st(m, 0.05));
}
// ── call connect + hang up (phone UI tones)
{
  write('sfx/call_connect.wav', ...st(mk(0.6, (t) => Math.sin(TAU * 880 * t) * env(t, 0.005, 0.12) * 0.5 + (t > 0.14 ? Math.sin(TAU * 1320 * t) * env(t - 0.14, 0.005, 0.14) * 0.4 : 0))));
  write('sfx/hang_up.wav', ...st(mk(0.7, (t) => (Math.sin(TAU * 620 * t) + Math.sin(TAU * 480 * t)) * 0.3 * env(t, 0.004, 0.18) + (t > 0.25 ? (Math.sin(TAU * 620 * t) + Math.sin(TAU * 480 * t)) * 0.25 * env(t - 0.25, 0.004, 0.16) : 0))));
}
// ── low cinematic rumble
{
  const f = svf();
  const m = mk(5, (t) => (f(noise(), 70, 0.4).lo * 2.4 + Math.sin(TAU * 34 * t) * 0.4) * Math.sin(Math.PI * Math.min(1, t / 5)) ** 0.7);
  write('sfx/rumble.wav', ...st(m, 0.2));
}
// ── suspense riser (air + rising detuned tones)
{
  const f = svf();
  const len = 4.5;
  const m = mk(len, (t) => {
    const k = t / len;
    return f(noise(), 300 + 5000 * k * k, 0.35).bp * k * k * 0.7 + (Math.sin(TAU * (110 + 330 * k * k) * t) + Math.sin(TAU * (111.5 + 334 * k * k) * t)) * k * k * 0.15;
  });
  write('sfx/riser.wav', ...st(room(m, 0.3, 1.4), 0.25));
}
// ── human breathing (close, nervous) and the breath behind his head (very close, slow)
{
  const breath = (len, rate, close) => {
    const f = svf(), g = svf();
    return mk(len, (t) => {
      const ph = (t * rate) % 1;
      const inhale = ph < 0.42 ? Math.sin((ph / 0.42) * Math.PI) : 0;
      const exhale = ph >= 0.5 && ph < 0.95 ? Math.sin(((ph - 0.5) / 0.45) * Math.PI) : 0;
      return f(noise(), close ? 900 : 1400, 0.5).bp * inhale * 0.7 + g(noise(), close ? 600 : 1000, 0.6).bp * exhale * 0.9;
    });
  };
  write('sfx/breath_nervous.wav', ...st(room(breath(6, 0.75, false), 0.15)));
  const b = breath(4.5, 0.36, true);
  write('sfx/breath_behind.wav', b, b.map((x, i) => (i > 200 ? b[i - 200] : 0) * 0.7));
}
// ── the end: low hit for the title
{
  const f = svf();
  const m = mk(4, (t) => Math.sin(TAU * (30 + 50 * Math.exp(-t * 6)) * t) * env(t, 0.005, 1.2) * 0.9 + f(noise(), 160, 0.5).lo * env(t, 0.002, 0.5) * 1.4);
  write('sfx/title_hit.wav', ...st(room(m, 0.4, 2), 0.3));
}
// ── MUSIC: low ambient horror drone (no melody), 100 s
{
  const n = Math.round(100 * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const f1 = svf(), f2 = svf(), f3 = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const sw = 0.5 + 0.5 * Math.sin(t * 0.08);
    const base = Math.sin(TAU * 41.2 * t) * 0.5 + Math.sin(TAU * 41.8 * t + 1) * 0.4 + Math.sin(TAU * 61.7 * t) * 0.2 * sw;
    const cluster = (Math.sin(TAU * 293.7 * t) + Math.sin(TAU * 311.1 * t) * 0.8 + Math.sin(TAU * 349.2 * t) * 0.5) * 0.05 * (0.4 + 0.6 * Math.sin(t * 0.05 + 2) ** 2);
    const air = f1(noise(), 500 + 400 * sw, 0.3).bp * 0.12;
    const low = f2(noise(), 90, 0.5).lo * 0.6;
    const v = f3(base * 0.6 + cluster + air + low, 2400, 0.7).lo;
    const w = Math.sin(t * 0.21) * 0.25;
    L[i] = v * (1 + w);
    R[i] = v * (1 - w);
  }
  write('music/drone.wav', room(L, 0.35, 1.8).subarray(0, n), room(R, 0.35, 1.9).subarray(0, n), 0.8);
}
console.log('done');
