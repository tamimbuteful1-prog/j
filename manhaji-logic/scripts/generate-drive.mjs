// Generates an energetic pop-funk bed (≈122 BPM): punchy drums with a real backbeat,
// a driving synth bass, off-beat chord stabs, a muted-guitar 16th groove and section
// lifts. Upbeat but not techno (no four-on-the-floor) and not childish (no bells/arps).
//   node scripts/generate-drive.mjs   → public/music/drive.wav (≈ −14 LUFS)
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SR = 44100;
const TAU = Math.PI * 2;

let seed = 7;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const onePole = () => {
  let y = 0;
  return (x, fc) => {
    y += (1 - Math.exp((-TAU * fc) / SR)) * (x - y);
    return y;
  };
};
// resonant state-variable low-pass
const svf = () => {
  let low = 0, band = 0;
  return (x, fc, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 3)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return low;
  };
};

const BPM = 122;
const BEAT = 60 / BPM;
const BAR = 4 * BEAT;
const BARS = 56;
const N = Math.round(BARS * BAR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const add = (i, l, r = l) => {
  if (i >= 0 && i < N) {
    L[i] += l;
    R[i] += r;
  }
};
const at = (bar, beat) => Math.round((bar * BAR + beat * BEAT) * SR);

// Am – F – C – G  (vi–IV–I–V in C): bright, forward-moving
const PROG = [
  {root: 45, chord: [57, 60, 64, 69]},
  {root: 41, chord: [57, 60, 65, 69]},
  {root: 48, chord: [55, 60, 64, 67]},
  {root: 43, chord: [55, 59, 62, 67]},
];

// ── drums ──
const kick = (i0, v) => {
  let ph = 0;
  for (let i = 0; i < 0.32 * SR; i++) {
    const t = i / SR;
    ph += (TAU * (52 + 130 * Math.exp(-t * 40))) / SR;
    const s = Math.tanh(Math.sin(ph) * 2.5) * Math.exp(-t * 9) * 0.55 * v + noise() * Math.exp(-t * 400) * 0.08 * v;
    add(i0 + i, s);
  }
};
const snare = (i0, v) => {
  const hp = onePole();
  for (let i = 0; i < 0.25 * SR; i++) {
    const t = i / SR;
    const nz = noise();
    const s = ((nz - hp(nz, 1800)) * Math.exp(-t * 20) * 0.34 + Math.sin(TAU * 200 * t) * Math.exp(-t * 35) * 0.2) * v;
    add(i0 + i, s * 0.95, s * 1.05);
  }
};
const clap = (i0, v) => {
  const hp = onePole();
  for (let i = 0; i < 0.2 * SR; i++) {
    const t = i / SR;
    const burst = t < 0.03 ? (Math.floor(t / 0.009) % 2 ? 0.4 : 1) : 1;
    const nz = noise();
    const s = (nz - hp(nz, 1200)) * Math.exp(-t * 22) * burst * 0.22 * v;
    add(i0 + i, s * 1.1, s * 0.9);
  }
};
const hat = (i0, v, open = false) => {
  const hp = onePole();
  const d = open ? 12 : 70;
  for (let i = 0; i < (open ? 0.22 : 0.06) * SR; i++) {
    const t = i / SR;
    const nz = noise();
    const s = (nz - hp(nz, 8000)) * Math.exp(-t * d) * 0.13 * v;
    add(i0 + i, s * 0.8, s * 1.2);
  }
};

// ── synth bass: two detuned saws through an enveloped resonant low-pass ──
const bass = (i0, m, dur, v) => {
  const f = midi(m);
  const lp = svf();
  for (let i = 0; i < (dur + 0.03) * SR; i++) {
    const t = i / SR;
    const saw = ((t * f) % 1) * 2 - 1 + (((t * f * 1.006) % 1) * 2 - 1);
    const env = Math.min(1, t / 0.004) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.03) : 1);
    const cut = 220 + 1400 * Math.exp(-t * 18);
    const s = Math.tanh(lp(saw * 0.5, cut, 0.5) * 2.2) * env * 0.2 * v + Math.sin(TAU * f * t) * env * 0.12 * v;
    add(i0 + i, s);
  }
};

// ── chord stab: detuned square/saw, fast filter pluck ──
const stab = (i0, notes, v, len = 0.16) => {
  const lp = svf();
  for (let i = 0; i < (len + 0.12) * SR; i++) {
    const t = i / SR;
    let x = 0;
    for (const m of notes) {
      const f = midi(m);
      x += ((t * f) % 1) * 2 - 1;
      x += (((t * f * 1.008) % 1) < 0.5 ? 1 : -1) * 0.6;
    }
    const env = Math.min(1, t / 0.003) * (t < len ? Math.exp(-t * 4) : Math.exp(-len * 4) * Math.exp(-(t - len) * 30));
    const s = lp(x * 0.05, 900 + 3200 * Math.exp(-t * 22), 0.6) * env * v;
    add(i0 + i, s * 0.85, s * 1.15);
  }
};

// ── muted guitar (Karplus–Strong) ──
const pluck = (i0, m, v) => {
  const p = Math.max(2, Math.round(SR / midi(m)));
  const buf = new Float32Array(p);
  for (let k = 0; k < p; k++) buf[k] = noise();
  const lp = onePole();
  let idx = 0;
  for (let i = 0; i < 0.18 * SR; i++) {
    const cur = buf[idx];
    buf[idx] = 0.5 * (cur + buf[(idx + 1) % p]) * 0.97;
    idx = (idx + 1) % p;
    const s = lp(cur, 3200) * Math.exp(-(i / SR) * 22) * 0.16 * v;
    add(i0 + i, s * 1.25, s * 0.75);
  }
};

// ── riser into each section ──
const riser = (i0, len) => {
  const hp = onePole();
  for (let i = 0; i < len * SR; i++) {
    const t = i / SR;
    const k = t / len;
    const nz = noise();
    const s = (nz - hp(nz, 800 + 6000 * k)) * k * k * 0.08;
    add(i0 + i, s, s);
  }
};

// ── arrangement: 2-bar intro, then 8-bar sections; every 4th section is a lighter break ──
for (let bar = 0; bar < BARS; bar++) {
  const ch = PROG[bar % 4];
  const intro = bar < 2;
  const sec = Math.floor((bar - 2) / 8);
  const brk = !intro && sec % 4 === 3 && (bar - 2) % 8 < 4;
  const outro = bar >= BARS - 1;
  const v = (a, b) => a + (b - a) * rand();

  // drums
  if (!intro && !outro && !brk) {
    [0, 1.5, 2, 2.75].forEach((b, j) => kick(at(bar, b), j === 0 || j === 2 ? 1 : 0.75));
    snare(at(bar, 1), v(0.9, 1));
    snare(at(bar, 3), v(0.9, 1));
    clap(at(bar, 1), 0.8);
    clap(at(bar, 3), 0.8);
    if (bar % 8 === 7) [3.25, 3.5, 3.75].forEach((b) => snare(at(bar, b), 0.55));
  }
  if (!outro) {
    for (let s = 0; s < 16; s++) {
      if (intro && s % 2) continue;
      hat(at(bar, s / 4), s % 4 === 2 ? 1 : s % 2 ? 0.45 : 0.7, !intro && s === 14);
    }
  }
  if (brk) kick(at(bar, 0), 0.8);

  // bass: driving 8ths with octave jumps
  if (!intro && !outro) {
    const pat = [0, 0, 12, 0, 0, 12, 0, 7];
    pat.forEach((o, k) => bass(at(bar, k / 2), ch.root + o, BEAT * 0.42, k % 2 ? 0.8 : 1));
  }

  // stabs on the off-beats (the "and"s)
  [0.5, 1.5, 2.5, 3.5].forEach((b, k) => stab(at(bar, b), ch.chord, brk ? 0.6 : k === 3 ? 0.8 : 1));
  if (!intro && !brk) stab(at(bar, 3.75), ch.chord, 0.6, 0.08);

  // muted guitar 16ths on full sections
  if (!intro && !brk && !outro && bar >= 6) {
    for (let s = 0; s < 16; s++) if (s % 4 !== 0) pluck(at(bar, s / 4), ch.chord[(s * 3) % ch.chord.length] + 12, s % 2 ? 0.55 : 0.85);
  }

  // risers into each new section
  if (!intro && (bar - 2) % 8 === 7) riser(at(bar, 2), BEAT * 2);
}
riser(at(1, 0), BAR);

// ── master: light glue, side-chain feel on the kick grid, stereo room ──
const lpL = onePole(), lpR = onePole();
for (let i = 0; i < N; i++) {
  const t = (i / SR) % BEAT;
  const pump = 1 - 0.18 * Math.exp(-t * 12);
  L[i] = lpL(Math.tanh(L[i] * pump * 1.3) / 1.3, 14000);
  R[i] = lpR(Math.tanh(R[i] * pump * 1.3) / 1.3, 14000);
}
const room = (buf, d1, d2) => {
  const a = Math.round(d1 * SR), b = Math.round(d2 * SR);
  const out = Float32Array.from(buf);
  const lp = onePole();
  for (let i = 0; i < N; i++) out[i] = buf[i] + lp((i >= a ? out[i - a] : 0) * 0.22 + (i >= b ? out[i - b] : 0) * 0.15, 4000);
  return out;
};
const oL = room(L, 0.029, 0.043);
const oR = room(R, 0.034, 0.049);
const fadeN = Math.round(BAR * SR);
for (let i = 0; i < fadeN; i++) {
  oL[N - fadeN + i] *= 1 - i / fadeN;
  oR[N - fadeN + i] *= 1 - i / fadeN;
}

// rough loudness normalisation to ≈ −14 LUFS (RMS-based), peak-limited at −1 dBFS
let ss = 0;
for (let i = 0; i < N; i++) ss += oL[i] * oL[i] + oR[i] * oR[i];
const rms = Math.sqrt(ss / (2 * N));
let g = Math.pow(10, -16.5 / 20) / rms;
for (let i = 0; i < N; i++) {
  oL[i] = Math.tanh(oL[i] * g * 1.1) / 1.1;
  oR[i] = Math.tanh(oR[i] * g * 1.1) / 1.1;
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(oL[i]), Math.abs(oR[i]));
const pg = peak > 0.89 ? 0.89 / peak : 1;

const data = Buffer.alloc(44 + N * 4);
data.write('RIFF', 0);
data.writeUInt32LE(36 + N * 4, 4);
data.write('WAVE', 8);
data.write('fmt ', 12);
data.writeUInt32LE(16, 16);
data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22);
data.writeUInt32LE(SR, 24);
data.writeUInt32LE(SR * 4, 28);
data.writeUInt16LE(4, 32);
data.writeUInt16LE(16, 34);
data.write('data', 36);
data.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, oL[i] * pg)) * 32767), 44 + i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, oR[i] * pg)) * 32767), 46 + i * 4);
}
const out = join(ROOT, 'music', 'drive.wav');
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, data);
console.log('✓ music/drive.wav', (N / SR).toFixed(1) + 's');
