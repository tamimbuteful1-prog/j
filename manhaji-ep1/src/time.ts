import TL from './timeline.json';

export const FPS = TL.fps;
export const INTRO = TL.intro;

/** original-voice seconds -> output seconds (follows the silence-cut edit) */
export const out = (t: number): number => {
  let pos = TL.voiceStart;
  for (const [a, b] of TL.segments) {
    if (t <= b) return pos + Math.max(0, t - a);
    pos += b - a;
  }
  return pos;
};

type CueName = keyof typeof TL.cues;
/** output time of a named cue */
export const cue = (name: CueName): number => out(TL.cues[name]);

export const TOTAL =
  TL.voiceStart + TL.segments.reduce((s, [a, b]) => s + (b - a), 0) + TL.tail;
export const TOTAL_FRAMES = Math.ceil(TOTAL * FPS);

// ---------------------------------------------------------------- easing
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const easeInExpo = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInCubic = (x: number) => x * x * x;
export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
export const easeInOutQuint = (x: number) =>
  x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2;
export const easeOutBack = (x: number, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);

/** 0..1 progress of t through [start, start+dur], eased */
export const prog = (t: number, start: number, dur: number, ease: (x: number) => number = easeInOutCubic) =>
  ease(clamp((t - start) / dur));

/** snappy damped spring (0 -> 1 with ~13% overshoot, settles in ~0.6s at speed 1) */
export const spr = (t: number, start: number, speed = 1, bounce = 1) => {
  const x = Math.max(0, t - start) * speed;
  if (x <= 0) return 0;
  return 1 - Math.exp(-7 * x) * Math.cos(11 * bounce * x);
};

/** fade-in / fade-out window helper */
export const win = (t: number, a: number, b: number, fin = 0.2, fout = 0.2) =>
  clamp((t - a) / fin) * clamp((b - t) / fout);

export type Key = [number, number, ((x: number) => number)?];
/** keyframed number: keys sorted by time; ease belongs to the segment arriving at that key */
export const kf = (t: number, keys: Key[]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) return lerp(v0, v1, (e ?? easeInOutCubic)((t - t0) / (t1 - t0 || 1)));
  }
  return keys[keys.length - 1][1];
};

/** deterministic pseudo random */
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** smooth low-frequency noise for handheld drift */
export const drift = (t: number, seed: number) =>
  Math.sin(t * 1.3 + seed) * 0.6 + Math.sin(t * 2.7 + seed * 2.1) * 0.3 + Math.sin(t * 0.7 + seed * 3.3) * 0.5;
