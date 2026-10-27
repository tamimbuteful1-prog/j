// Generates the TEMPORARY sound kit (SFX + music bed) procedurally.
// Every file can be replaced by a licensed library sound with the same name.
//   node scripts/generate-sfx.mjs
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'public');
const SR = 44100;
const TAU = Math.PI * 2;

let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const writeWav = (rel, ch /* Float32Array[] */) => {
  const n = ch[0].length;
  const nc = ch.length;
  const buf = Buffer.alloc(44 + n * nc * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * nc * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(nc, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * nc * 2, 28);
  buf.writeUInt16LE(nc * 2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * nc * 2, 40);
  let peak = 0;
  for (const c of ch) for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(c[i]));
  const g = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < nc; c++) buf.writeInt16LE(Math.round(clamp(ch[c][i] * g, -1, 1) * 32767), 44 + (i * nc + c) * 2);
  const p = join(ROOT, rel);
  mkdirSync(dirname(p), {recursive: true});
  writeFileSync(p, buf);
  console.log('✓', rel, (n / SR).toFixed(2) + 's');
};

const make = (sec, fn) => {
  const n = Math.round(sec * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  fn(L, R, n);
  return [L, R];
};

// state-variable band-pass, resonant — the core of the whooshes
const svf = () => {
  let low = 0, band = 0;
  return (x, cutoff, q) => {
    const f = 2 * Math.sin((Math.PI * clamp(cutoff, 20, SR / 3)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return {low, band, high};
  };
};

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

const whoosh = (sec, f0, f1, peakAt) =>
  make(sec, (L, R, n) => {
    const fl = svf(), fr = svf();
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const shape = t < peakAt ? Math.pow(t / peakAt, 2.2) : Math.pow(1 - (t - peakAt) / (1 - peakAt), 1.6);
      const cut = f0 + (f1 - f0) * Math.sin((Math.PI / 2) * Math.min(1, t / peakAt)) - (t > peakAt ? (f1 - f0) * 0.5 * (t - peakAt) : 0);
      const pan = Math.sin(t * Math.PI - Math.PI / 2) * 0.6;
      const a = fl(noise(), cut, 0.6).band;
      const b = fr(noise(), cut * 1.05, 0.6).band;
      L[i] = a * shape * 0.9 * (1 - pan * 0.5);
      R[i] = b * shape * 0.9 * (1 + pan * 0.5);
    }
  });

const tone = (sec, fn) =>
  make(sec, (L, R, n) => {
    for (let i = 0; i < n; i++) {
      const v = fn(i / SR, i);
      L[i] = v;
      R[i] = v;
    }
  });

// ── SFX ──────────────────────────────────────────────────────
writeWav('sfx/whoosh_long.wav', whoosh(1.3, 180, 2600, 0.55));
writeWav('sfx/whoosh_short.wav', whoosh(0.5, 300, 3200, 0.45));
writeWav('sfx/swish.wav', whoosh(0.32, 900, 5200, 0.35));

writeWav('sfx/riser.wav', make(1.8, (L, R, n) => {
  const f = svf();
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const fr = 160 + 900 * t * t;
    ph += (TAU * fr) / SR;
    const nz = f(noise(), 400 + 6000 * t * t, 0.7).band;
    const v = (Math.sin(ph) * 0.25 + Math.sin(ph * 1.5) * 0.12 + nz * 0.5) * Math.pow(t, 2) * (t > 0.96 ? (1 - t) / 0.04 : 1);
    L[i] = v;
    R[i] = v * 0.95;
  }
}));

writeWav('sfx/pop.wav', tone(0.18, (t) => {
  const f = 980 * Math.exp(-t * 18) + 260;
  return Math.sin(TAU * f * t) * env(t, 0.003, 0.045) * 0.8;
}));

writeWav('sfx/drop.wav', tone(0.5, (t) => {
  const body = Math.sin(TAU * (60 + 120 * Math.exp(-t * 30)) * t) * env(t, 0.002, 0.12);
  const rustle = noise() * env(t, 0.001, 0.025) * 0.5 + noise() * env(t, 0.03, 0.06) * 0.12;
  return body * 0.9 + rustle;
}));

writeWav('sfx/true_chime.wav', tone(1.3, (t) => {
  const bell = (f, d) => (t < d ? 0 : (Math.sin(TAU * f * (t - d)) + 0.35 * Math.sin(TAU * f * 2.01 * (t - d))) * env(t - d, 0.004, 0.32));
  return (bell(1046.5, 0) * 0.42 + bell(1318.5, 0.075) * 0.38 + bell(1568, 0.15) * 0.32) * 0.75;
}));

writeWav('sfx/false_hit.wav', tone(0.7, (t) => {
  const f = 98 * (1 - t * 0.25);
  const sq = Math.tanh(Math.sin(TAU * f * t) * 3) * 0.45 + Math.tanh(Math.sin(TAU * f * 1.06 * t) * 3) * 0.35;
  const thump = Math.sin(TAU * (50 + 80 * Math.exp(-t * 25)) * t) * env(t, 0.002, 0.1);
  return (sq * env(t, 0.004, 0.16) + thump * 0.8) * 0.7;
}));

writeWav('sfx/tick.wav', tone(0.08, (t) => (Math.sin(TAU * 2400 * t) * 0.5 + noise() * 0.2) * env(t, 0.0005, 0.012)));

writeWav('sfx/tape_stop.wav', make(0.7, (L, R, n) => {
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    ph += (TAU * (420 * Math.pow(1 - t, 2) + 30)) / SR;
    const v = (Math.sin(ph) + 0.4 * Math.sin(ph * 2)) * (1 - t) * 0.5;
    L[i] = v;
    R[i] = v;
  }
}));

writeWav('sfx/impact.wav', tone(1.6, (t) => {
  const sub = Math.sin(TAU * (42 + 70 * Math.exp(-t * 12)) * t) * env(t, 0.002, 0.45);
  const crack = noise() * env(t, 0.0005, 0.02) * 0.6;
  return sub + crack;
}));

writeWav('sfx/lock.wav', tone(0.3, (t) => {
  const c1 = (noise() * 0.7 + Math.sin(TAU * 3200 * t) * 0.3) * env(t, 0.0005, 0.008);
  const c2 = t > 0.06 ? (noise() * 0.6 + Math.sin(TAU * 1800 * t) * 0.4) * env(t - 0.06, 0.0005, 0.015) : 0;
  const body = Math.sin(TAU * 140 * t) * env(t, 0.002, 0.06) * 0.5;
  return c1 + c2 + body;
}));

writeWav('sfx/shimmer.wav', make(2.4, (L, R, n) => {
  const freqs = [1568, 2093, 2349, 2637, 3136];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let l = 0, r = 0;
    freqs.forEach((f, k) => {
      const d = k * 0.06;
      if (t < d) return;
      const e = env(t - d, 0.02, 0.7) * (0.6 + 0.4 * Math.sin(TAU * (5 + k) * t));
      const v = Math.sin(TAU * f * t) * e * 0.16;
      l += k % 2 ? v * 0.6 : v;
      r += k % 2 ? v : v * 0.6;
    });
    L[i] = l;
    R[i] = r;
  }
}));

writeWav('sfx/glitch.wav', make(0.35, (L, R, n) => {
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const gate = Math.floor(t * 60) % 2 === 0 ? 1 : 0.15;
    const v = (Math.sin(TAU * 620 * t) * 0.3 + noise() * 0.25) * gate * env(t, 0.002, 0.12);
    L[i] = v;
    R[i] = -v;
  }
}));

// ── FOLEY / UI (realistic object sounds) ─────────────────────────
// thermal printer: stepper-motor chatter + paper feed + final cut
const printer = (sec) =>
  make(sec + 0.35, (L, R, n) => {
    const bp = svf(), bp2 = svf();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let v = 0;
      if (t < sec) {
        const step = (t * 42) % 1; // 42 steps/s
        const click = Math.exp(-step * 30);
        const motor = Math.sin(TAU * 480 * t) * 0.08 + Math.sin(TAU * 960 * t) * 0.04;
        const feed = bp(noise(), 3200, 0.9).band * 0.25;
        const env = Math.min(1, t / 0.04) * Math.min(1, (sec - t) / 0.05);
        v = (bp2(noise(), 1800, 0.5).band * click * 0.9 + motor + feed) * env;
      } else {
        const c = t - sec - 0.08; // cutter "tchk"
        if (c > 0) v = (noise() * 0.8 + Math.sin(TAU * 900 * c) * 0.3) * Math.exp(-c * 60);
      }
      L[i] = v;
      R[i] = v * 0.92;
    }
  });
writeWav('sfx/printer.wav', printer(1.6));
writeWav('sfx/printer_short.wav', printer(1.1));

// POS rejection: two descending square beeps
writeWav('sfx/reject.wav', tone(0.55, (t) => {
  const beep = (t0, f) => (t >= t0 && t < t0 + 0.16 ? Math.tanh(Math.sin(TAU * f * (t - t0)) * 4) * 0.35 * Math.min(1, (t0 + 0.16 - t) / 0.02) : 0);
  return beep(0, 740) + beep(0.21, 520);
}));

// cash register "ka-ching": drawer thunk + bright bell
writeWav('sfx/kaching.wav', tone(1.3, (t) => {
  const thunk = Math.sin(TAU * (90 + 60 * Math.exp(-t * 40)) * t) * Math.exp(-t * 25) * 0.6 + noise() * Math.exp(-t * 90) * 0.3;
  const b = (f, d) => (t < d ? 0 : Math.sin(TAU * f * (t - d)) * Math.exp(-(t - d) * 4.5));
  const bell = (b(2093, 0.08) * 0.35 + b(2637, 0.08) * 0.25 + b(3136, 0.11) * 0.2 + b(4186, 0.11) * 0.1);
  return thunk + bell;
}));

// rubber stamp: whoosh-in + heavy slap
writeWav('sfx/stamp.wav', make(0.7, (L, R, n) => {
  const f = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const pre = t < 0.12 ? f(noise(), 600 + 4000 * (t / 0.12), 0.7).band * (t / 0.12) * 0.4 : 0;
    const h = t - 0.12;
    const slap = h > 0 ? (noise() * 0.9 * Math.exp(-h * 70) + Math.sin(TAU * (70 + 90 * Math.exp(-h * 30)) * h) * Math.exp(-h * 14) * 0.9) : 0;
    L[i] = pre + slap;
    R[i] = pre * 0.8 + slap;
  }
}));

// "nope": soft low double buzz for ✕ marks
writeWav('sfx/nope.wav', tone(0.45, (t) => {
  const z = (t0) => (t >= t0 && t < t0 + 0.12 ? Math.tanh(Math.sin(TAU * 160 * (t - t0)) * 3) * 0.3 * Math.sin(Math.PI * (t - t0) / 0.12) : 0);
  return z(0) + z(0.16);
}));

// success: soft rising two-note chime for ✓ marks
writeWav('sfx/yes.wav', tone(0.6, (t) => {
  const n1 = Math.sin(TAU * 880 * t) * Math.exp(-t * 9) * (t < 0.3 ? 1 : 0);
  const n2 = t > 0.09 ? Math.sin(TAU * 1318.5 * (t - 0.09)) * Math.exp(-(t - 0.09) * 7) : 0;
  return (n1 * 0.35 + n2 * 0.35);
}));

// wooden board hung on the wall: knock + small creak
writeWav('sfx/board.wav', make(0.9, (L, R, n) => {
  const bp = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const knock = Math.sin(TAU * (180 + 40 * Math.exp(-t * 20)) * t) * Math.exp(-t * 18) * 0.6 + bp(noise(), 900, 0.4).band * Math.exp(-t * 30) * 0.5;
    const c = t - 0.18;
    const creak = c > 0 && c < 0.5 ? Math.sin(TAU * (300 + 80 * Math.sin(TAU * 6 * c)) * c) * Math.sin(Math.PI * c / 0.5) * 0.12 * (0.5 + 0.5 * Math.sin(TAU * 37 * c)) : 0;
    L[i] = knock + creak;
    R[i] = knock * 0.9 + creak;
  }
}));

// paper slide (coupon) and paper drop (slot fill)
writeWav('sfx/paper_slide.wav', make(0.5, (L, R, n) => {
  const f = svf();
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const v = f(noise(), 2500 + 2500 * t, 0.3).band * Math.sin(Math.PI * t) * 0.6;
    L[i] = v;
    R[i] = v;
  }
}));
writeWav('sfx/paper_drop.wav', tone(0.35, (t) => {
  return noise() * Math.exp(-t * 35) * 0.35 + Math.sin(TAU * (140 + 120 * Math.exp(-t * 40)) * t) * Math.exp(-t * 22) * 0.55;
}));

// snap: negation tab clicks onto the block
writeWav('sfx/snap.wav', tone(0.2, (t) => (noise() * 0.6 + Math.sin(TAU * 2600 * t) * 0.4) * Math.exp(-t * 80) + Math.sin(TAU * 420 * t) * Math.exp(-t * 30) * 0.3));

// ── MUSIC BED (temp) — energetic edu-pop, 122 BPM, sidechained, 16 bars loop ──
// Four-on-the-floor kick, claps on 2 & 4, 16th hats, pumping chords, plucky arp,
// driving bass and a riser/impact every 8 bars. Replace with a licensed track of the same name.
{
  const bpm = 122;
  const beat = 60 / bpm;
  const bars = 16;
  const secs = bars * 4 * beat;
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const prog = [
    [57, 60, 64, 67], // Am7
    [53, 57, 60, 64], // Fmaj7
    [48, 52, 55, 59], // Cmaj7
    [55, 59, 62, 66], // G(add#11) — bright lift
  ];
  const bassRoot = [33, 29, 36, 31];
  const arpPattern = [0, 2, 1, 3, 2, 1, 3, 2];
  const music = make(secs, (L, R, n) => {
    const lpPad = svf(), lpBass = svf(), hpHat = svf(), bpClap = svf(), lpLead = svf(), riserF = svf();
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const barF = t / (4 * beat);
      const bar = Math.floor(barF);
      const chord = prog[bar % 4];
      const inBeat = t % beat;
      const beatIdx = Math.floor((t % (4 * beat)) / beat);
      const s16 = beat / 4;
      const step16 = Math.floor(t / s16);
      const in16 = t % s16;
      // sidechain envelope (duck after each kick)
      const duck = 0.35 + 0.65 * Math.min(1, Math.pow(inBeat / (beat * 0.55), 1.6));

      // kick — punchy with click
      const kf = 45 + 110 * Math.exp(-inBeat * 38);
      const kick = Math.sin(TAU * kf * inBeat) * Math.exp(-inBeat * 7.5) * 0.85 + noise() * Math.exp(-inBeat * 400) * 0.25;
      // clap on 2 & 4
      const clapT = beatIdx % 2 === 1 ? inBeat : 9;
      const clap = clapT < 0.25 ? bpClap(noise(), 1500, 0.8).band * (Math.exp(-clapT * 22) + 0.5 * Math.exp(-Math.max(0, clapT - 0.012) * 30)) * 0.55 : 0;
      // hats — 16ths, accented off-beats, open hat on the "and"
      const accent = step16 % 4 === 2 ? 1 : step16 % 2 ? 0.55 : 0.35;
      const hatDecay = step16 % 4 === 2 ? 18 : 70;
      const hat = hpHat(noise(), 9000, 0.4).high * Math.exp(-in16 * hatDecay) * 0.16 * accent;
      // pumping pad: detuned saws, filter opens across the 8-bar phrase
      const phrase = (barF % 8) / 8;
      let pad = 0;
      for (const m of chord) {
        const f = midi(m + 12);
        pad += ((t * f) % 1) * 2 - 1 + ((t * f * 1.006) % 1) * 2 - 1;
      }
      const padF = lpPad(pad * 0.045, 1200 + 2600 * phrase, 0.7).low * duck;
      // pluck arp — 16ths
      const note = chord[arpPattern[step16 % 8] % chord.length] + 24;
      const pluckEnv = Math.exp(-in16 * 16);
      const pf = midi(note);
      const pluck = lpLead(((t * pf) % 1) * 2 - 1 + Math.sin(TAU * pf * t), 2500 + 3000 * pluckEnv, 0.5).low * pluckEnv * 0.13;
      // bass — 8ths with octave jumps, sidechained
      const s8 = beat / 2;
      const step8 = Math.floor(t / s8);
      const bm = bassRoot[bar % 4] + (step8 % 4 === 3 ? 12 : 0);
      const bf = midi(bm);
      const bassRaw = ((t * bf) % 1) * 2 - 1;
      const bass = lpBass(bassRaw, 380, 0.9).low * 0.42 * duck * (0.6 + 0.4 * Math.exp(-(t % s8) * 6));
      // riser in the last bar of every 8, impact on the downbeat
      const pos8 = barF % 8;
      const riser = pos8 > 7 ? riserF(noise(), 500 + 7000 * (pos8 - 7), 0.6).band * (pos8 - 7) * 0.35 : 0;
      const impact = pos8 < 0.5 && bar > 0 ? Math.sin(TAU * 40 * t) * Math.exp(-(t % (8 * 4 * beat)) * 3) * 0.3 : 0;

      const v = kick + clap + hat + padF + pluck + bass + riser + impact;
      const wide = Math.sin(TAU * 0.25 * t) * 0.3;
      L[i] = Math.tanh((v + pluck * wide + hat * 0.3) * 1.1);
      R[i] = Math.tanh((v - pluck * wide - hat * 0.3) * 1.1);
    }
  });
  writeWav('music/bed.wav', music);
}
// ── MUSIC (temp) — "upbeat-fun": happy ukulele pop, 112 BPM, I–V–vi–IV ──
// Karplus–Strong strummed ukulele, round bass, kick/clap/shaker, glockenspiel hook.
// Bright and familiar, not electronic. Replace with a licensed track of the same name.
{
  const bpm = 112;
  const beat = 60 / bpm;
  const bars = 16;
  const secs = bars * 4 * beat;
  const n = Math.round(secs * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const add = (buf, start, data, gain) => {
    for (let i = 0; i < data.length; i++) {
      const j = (start + i) % n; // wrap → seamless loop
      buf[j] += data[i] * gain;
    }
  };
  // Karplus–Strong plucked string
  const pluck = (f, dur, bright = 0.5) => {
    const len = Math.max(2, Math.round(SR / f));
    const line = new Float32Array(len);
    for (let i = 0; i < len; i++) line[i] = noise() * (0.6 + 0.4 * bright);
    const out = new Float32Array(Math.round(dur * SR));
    let idx = 0;
    const decay = 0.996;
    for (let i = 0; i < out.length; i++) {
      const a = line[idx];
      const b = line[(idx + 1) % len];
      const v = decay * (a * (0.5 + 0.1 * bright) + b * (0.5 - 0.1 * bright));
      line[idx] = v;
      out[i] = a;
      idx = (idx + 1) % len;
    }
    return out;
  };
  const prog = [
    [67, 60, 64, 72], // C  (uke 0003)
    [67, 62, 67, 71], // G  (0232)
    [69, 60, 64, 69], // Am (2000)
    [69, 60, 65, 69], // F  (2010)
  ];
  const roots = [36, 43, 45, 41];
  // strum pattern on 8ths: D _ D U _ U D U
  const pattern = [[0, 'D', 1], [2, 'D', 0.8], [3, 'U', 0.55], [5, 'U', 0.6], [6, 'D', 0.85], [7, 'U', 0.5]];
  for (let bar = 0; bar < bars; bar++) {
    const chord = prog[bar % 4];
    const t0 = bar * 4 * beat;
    for (const [e8, dir, vel] of pattern) {
      const order = dir === 'D' ? chord : [...chord].reverse();
      order.forEach((m, k) => {
        const st = Math.round((t0 + e8 * (beat / 2) + k * 0.012) * SR);
        const d = pluck(midi(m), 0.9, dir === 'D' ? 0.7 : 0.45);
        add(L, st, d, 0.16 * vel * (k % 2 ? 0.9 : 1.05));
        add(R, st, d, 0.16 * vel * (k % 2 ? 1.05 : 0.9));
      });
    }
    // bass: root on 1, fifth on 3, passing note on the "and of 4"
    const bassNotes = [[0, roots[bar % 4]], [2, roots[bar % 4] + 7], [3.5, roots[bar % 4] + 12]];
    for (const [b4, m] of bassNotes) {
      const st = Math.round((t0 + b4 * beat) * SR);
      const len = Math.round(beat * 0.95 * SR);
      const f = midi(m);
      const d = new Float32Array(len);
      for (let i = 0; i < len; i++) {
        const tt = i / SR;
        d[i] = (Math.sin(TAU * f * tt) + 0.25 * Math.sin(TAU * 2 * f * tt)) * Math.min(1, tt / 0.01) * Math.exp(-tt * 2.2);
      }
      add(L, st, d, 0.32);
      add(R, st, d, 0.32);
    }
  }
  // drums
  const kickD = new Float32Array(Math.round(0.35 * SR));
  for (let i = 0; i < kickD.length; i++) { const tt = i / SR; kickD[i] = Math.sin(TAU * (50 + 80 * Math.exp(-tt * 30)) * tt) * Math.exp(-tt * 9); }
  const clapD = new Float32Array(Math.round(0.25 * SR));
  { const f = svf(); for (let i = 0; i < clapD.length; i++) { const tt = i / SR; clapD[i] = f(noise(), 1400, 0.9).band * (Math.exp(-tt * 25) + 0.6 * Math.exp(-Math.max(0, tt - 0.01) * 35) + 0.4 * Math.exp(-Math.max(0, tt - 0.022) * 40)); } }
  const shakerD = new Float32Array(Math.round(0.07 * SR));
  { const f = svf(); for (let i = 0; i < shakerD.length; i++) { const tt = i / SR; shakerD[i] = f(noise(), 7500, 0.6).band * Math.sin(Math.PI * tt / 0.07); } }
  const totalBeats = bars * 4;
  for (let b = 0; b < totalBeats; b++) {
    const st = Math.round(b * beat * SR);
    if (b % 4 === 0 || b % 4 === 2) { add(L, st, kickD, 0.5); add(R, st, kickD, 0.5); }
    if (b % 4 === 1 || b % 4 === 3) { add(L, st, clapD, 0.42); add(R, st, clapD, 0.36); }
    if (b % 8 === 7) { const s2 = Math.round((b + 0.5) * beat * SR); add(L, s2, kickD, 0.35); add(R, s2, kickD, 0.35); }
    for (let k = 0; k < 4; k++) {
      const s16 = Math.round((b * beat + k * beat / 4) * SR);
      const g = k % 2 ? 0.07 : 0.11;
      add(L, s16, shakerD, g * 0.7);
      add(R, s16, shakerD, g);
    }
  }
  // glockenspiel hook in bars 4–7 and 12–15 (call & response)
  const bell = (f, dur) => {
    const d = new Float32Array(Math.round(dur * SR));
    for (let i = 0; i < d.length; i++) { const tt = i / SR; d[i] = (Math.sin(TAU * f * tt) + 0.35 * Math.sin(TAU * f * 2.76 * tt) * Math.exp(-tt * 6) + 0.15 * Math.sin(TAU * f * 5.4 * tt) * Math.exp(-tt * 12)) * Math.exp(-tt * 3.2); }
    return d;
  };
  const hook = [[0, 76], [1, 79], [1.5, 81], [2, 79], [3, 76], [4, 74], [5, 72], [5.5, 74], [6, 76]];
  for (const startBar of [4, 12]) {
    for (const rep of [0, 2]) {
      for (const [b4, m] of hook) {
        const st = Math.round(((startBar + rep) * 4 + b4) * beat * SR);
        const d = bell(midi(m + 12), 1.2);
        add(L, st, d, 0.07);
        add(R, st, d, 0.09);
      }
    }
  }
  // gentle glue
  for (let i = 0; i < n; i++) { L[i] = Math.tanh(L[i] * 1.2) * 0.9; R[i] = Math.tanh(R[i] * 1.2) * 0.9; }
  writeWav('music/upbeat.wav', [L, R]);
}

console.log('done — temporary sound kit generated.');
