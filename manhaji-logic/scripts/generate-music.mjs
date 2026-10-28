// Generates the music bed procedurally: a mature lo-fi / chill-hop groove
// (Rhodes-style keys, warm sub bass, swung drums, muted guitar, vinyl air).
// No bells, no bright sine arps — those read as "kids' music".
//   node scripts/generate-music.mjs   → public/music/groove.wav
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const SR = 44100;
const TAU = Math.PI * 2;

let seed = 2024;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// one-pole low/high pass
const onePole = () => {
  let y = 0;
  return (x, fc) => {
    const a = 1 - Math.exp((-TAU * fc) / SR);
    y += a * (x - y);
    return y;
  };
};

const BPM = 94;
const BEAT = 60 / BPM;
const BAR = 4 * BEAT;
const BARS = 30;
const N = Math.round(BARS * BAR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const add = (buf, i, v) => {
  if (i >= 0 && i < N) buf[i] += v;
};

// Dm9 – Bbmaj9 – Gm9 – A7sus4→A7 (keys voiced without roots; bass plays the roots)
const PROG = [
  {keys: [53, 57, 60, 64], root: 38},
  {keys: [50, 53, 57, 60], root: 34},
  {keys: [53, 58, 62, 65], root: 31},
  {keys: [55, 57, 62, 64], root: 33, late: [55, 57, 61, 64]},
];

// swing: every off-beat 16th is pushed late
const SW = 0.58;
const sixteenth = (beatPos) => {
  const b = Math.floor(beatPos);
  const f = beatPos - b;
  const q = Math.round(f * 4);
  const swung = q % 2 === 1 ? (q - 1) / 4 + (0.5 * SW) / 2 + 0.25 * (SW - 0.5) : q / 4;
  return b + swung;
};
const tAt = (bar, beatPos) => bar * BAR + sixteenth(beatPos) * BEAT;

// ── Rhodes-ish electric piano (2-op FM + tine + tremolo) ──
const rhodes = (t0, m, dur, vel) => {
  const f = midi(m);
  const n = Math.round((dur + 1.2) * SR);
  const s0 = Math.round(t0 * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const rel = t > dur ? Math.exp(-(t - dur) * 6) : 1;
    const env = Math.exp(-t * 1.6) * rel * Math.min(1, t / 0.004);
    const idx = 1.4 * Math.exp(-t * 5) + 0.25;
    const mod = Math.sin(TAU * f * t) * idx;
    const body = Math.sin(TAU * f * t + mod);
    const tine = Math.sin(TAU * f * 7.02 * t) * Math.exp(-t * 28) * 0.18;
    const trem = 1 + 0.12 * Math.sin(TAU * 4.6 * (t0 + t));
    const v = (body + tine) * env * vel * 0.15 * trem;
    const pan = 0.15 * Math.sin(TAU * 4.6 * (t0 + t) + 1.3);
    add(L, s0 + i, v * (1 - pan));
    add(R, s0 + i, v * (1 + pan));
  }
};

// ── warm sub bass (sine + soft 2nd harmonic, tanh) ──
const bass = (t0, m, dur, vel) => {
  const f = midi(m);
  const n = Math.round((dur + 0.08) * SR);
  const s0 = Math.round(t0 * SR);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (TAU * f) / SR;
    const env = Math.min(1, t / 0.01) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.08) : 1) * (0.75 + 0.25 * Math.exp(-t * 6));
    const v = Math.tanh((Math.sin(ph) + 0.25 * Math.sin(2 * ph)) * 1.6) * env * vel * 0.13;
    add(L, s0 + i, v);
    add(R, s0 + i, v);
  }
};

// ── drums ──
const kick = (t0, vel) => {
  const s0 = Math.round(t0 * SR);
  let ph = 0;
  for (let i = 0; i < 0.45 * SR; i++) {
    const t = i / SR;
    ph += (TAU * (46 + 110 * Math.exp(-t * 32))) / SR;
    const v = Math.tanh(Math.sin(ph) * 2.2) * Math.exp(-t * 7.5) * vel * 0.3 + noise() * Math.exp(-t * 300) * 0.05 * vel;
    add(L, s0 + i, v);
    add(R, s0 + i, v);
  }
};
const snare = (t0, vel) => {
  const s0 = Math.round(t0 * SR);
  const hp = onePole();
  const lp = onePole();
  for (let i = 0; i < 0.35 * SR; i++) {
    const t = i / SR;
    const nz = noise();
    const bright = lp(nz - hp(nz, 1400), 7000);
    const v = (bright * Math.exp(-t * 18) * 0.32 + Math.sin(TAU * 185 * t) * Math.exp(-t * 30) * 0.18) * vel;
    add(L, s0 + i, v * 0.95);
    add(R, s0 + i, v * 1.05);
  }
};
const hat = (t0, vel, open = false) => {
  const s0 = Math.round(t0 * SR);
  const hp = onePole();
  const d = open ? 9 : 55;
  for (let i = 0; i < (open ? 0.3 : 0.08) * SR; i++) {
    const t = i / SR;
    const nz = noise();
    const v = (nz - hp(nz, 6500)) * Math.exp(-t * d) * vel * 0.09;
    add(L, s0 + i, v * 0.8);
    add(R, s0 + i, v * 1.2);
  }
};
const shaker = (t0, vel) => {
  const s0 = Math.round(t0 * SR);
  const hp = onePole();
  for (let i = 0; i < 0.09 * SR; i++) {
    const t = i / SR;
    const nz = noise();
    const v = (nz - hp(nz, 4500)) * Math.sin(Math.PI * Math.min(1, t / 0.09)) * vel * 0.035;
    add(L, s0 + i, v * 1.25);
    add(R, s0 + i, v * 0.75);
  }
};

// ── muted guitar pluck (Karplus–Strong, darkened) ──
const pluck = (t0, m, vel) => {
  const f = midi(m);
  const p = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(p);
  for (let k = 0; k < p; k++) buf[k] = noise();
  const s0 = Math.round(t0 * SR);
  let idx = 0;
  let prev = 0;
  const lp = onePole();
  for (let i = 0; i < 0.6 * SR; i++) {
    const cur = buf[idx];
    const nxt = 0.5 * (cur + buf[(idx + 1) % p]) * 0.985;
    buf[idx] = nxt;
    idx = (idx + 1) % p;
    const v = lp(cur, 2200) * Math.exp(-(i / SR) * 7) * vel * 0.2;
    prev = v;
    add(L, s0 + i, v * 1.3);
    add(R, s0 + i, v * 0.7);
  }
  return prev;
};

// ── arrangement ──
for (let bar = 0; bar < BARS; bar++) {
  const ch = PROG[bar % 4];
  const intro = bar < 2;
  const outro = bar >= BARS - 2;
  const full = !intro && !outro;
  const vel = (lo, hi) => lo + (hi - lo) * rand();

  // keys: long chord on 1, a swung re-hit on the "a" of 2, small push into the next bar
  const k1 = ch.keys;
  k1.forEach((m, j) => rhodes(tAt(bar, 0) + j * 0.012, m, BEAT * 2.4, vel(0.85, 1)));
  const k2 = ch.late ?? ch.keys;
  if (!intro) k2.forEach((m, j) => rhodes(tAt(bar, 2.75) + j * 0.01, m, BEAT * 1.1, vel(0.55, 0.7)));

  // bass
  if (!intro) {
    bass(tAt(bar, 0), ch.root, BEAT * 1.6, 1);
    bass(tAt(bar, 2.5), ch.root, BEAT * 0.6, 0.8);
    bass(tAt(bar, 3.25), ch.root + (bar % 2 ? 7 : 12), BEAT * 0.6, 0.7);
  }

  // drums
  if (full) {
    kick(tAt(bar, 0), 1);
    kick(tAt(bar, 1.75), 0.7);
    kick(tAt(bar, 2.5), 0.9);
    snare(tAt(bar, 1), vel(0.9, 1));
    snare(tAt(bar, 3), vel(0.9, 1));
    if (bar % 4 === 3) snare(tAt(bar, 3.75), 0.35);
  }
  for (let s = 0; s < 8; s++) {
    const pos = s / 2;
    if (intro && s % 2 === 0) continue;
    hat(tAt(bar, pos), s % 2 ? vel(0.5, 0.65) : vel(0.8, 0.95), full && s === 7 && bar % 2 === 1);
  }
  if (full) for (let s = 0; s < 16; s++) shaker(tAt(bar, s / 4), s % 4 === 2 ? 1 : 0.55);

  // muted guitar: syncopated chord tones one octave up, sparse
  if (full && bar >= 4) {
    const pat = [0.5, 1.25, 2, 3.5];
    pat.forEach((p, j) => pluck(tAt(bar, p), ch.keys[(j + bar) % ch.keys.length] + 12, vel(0.6, 0.85)));
  }
}

// ── master: vinyl air, gentle sidechain from the kick grid, warmth, simple room ──
const lpL = onePole(), lpR = onePole();
let crackle = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const inBeat = t % BEAT;
  const pump = 1 - 0.22 * Math.exp(-inBeat * 9);
  crackle = rand() < 0.0006 ? noise() * 0.12 : crackle * 0.6;
  const hiss = noise() * 0.004 + crackle * 0.25;
  L[i] = lpL(Math.tanh(L[i] * pump * 1.4) / 1.4, 9500) + hiss;
  R[i] = lpR(Math.tanh(R[i] * pump * 1.4) / 1.4, 9500) + hiss;
}
// short stereo room (two feedback delays, darkened)
const room = (buf, d1, d2) => {
  const a = Math.round(d1 * SR), b = Math.round(d2 * SR);
  const out = Float32Array.from(buf);
  const lp = onePole();
  for (let i = 0; i < N; i++) {
    const fb = (i >= a ? out[i - a] : 0) * 0.32 + (i >= b ? out[i - b] : 0) * 0.22;
    out[i] = buf[i] + lp(fb, 3500);
  }
  return out;
};
const outL = room(L, 0.031, 0.047);
const outR = room(R, 0.037, 0.053);
// fade the last bar so the loop point is clean
const fadeN = Math.round(BAR * SR);
for (let i = 0; i < fadeN; i++) {
  const g = 1 - i / fadeN;
  outL[N - fadeN + i] *= g;
  outR[N - fadeN + i] *= g;
}

// write 16-bit stereo WAV, peak-normalised to -1 dBFS
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
const g = 0.89 / peak;
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
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outL[i] * g)) * 32767), 44 + i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outR[i] * g)) * 32767), 46 + i * 4);
}
const p = join(ROOT, 'music', 'groove.wav');
mkdirSync(dirname(p), {recursive: true});
writeFileSync(p, data);
console.log('✓ music/groove.wav', (N / SR).toFixed(1) + 's');
