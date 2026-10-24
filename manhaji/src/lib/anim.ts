import {Easing, random} from 'remotion';

export type EaseFn = (x: number) => number;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const E = {
  linear: (x: number) => x,
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  soft: Easing.bezier(0.37, 0, 0.63, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  expoIn: Easing.bezier(0.7, 0, 0.84, 0),
  expo: Easing.bezier(0.19, 1, 0.22, 1),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
};

/** 0..1 progress of a move that starts at t0 and lasts dur seconds. */
export const p = (t: number, t0: number, dur: number, ease: EaseFn = E.out) =>
  ease(clamp((t - t0) / Math.max(dur, 1e-4)));

/** fade-in at t0, fade-out ending at t1 */
export const win = (t: number, t0: number, t1: number, fin = 0.3, fout = 0.3) =>
  Math.min(p(t, t0, fin, E.soft), 1 - p(t, t1 - fout, fout, E.soft));

/** Piecewise keyframes: [[time, value, easeIntoThisKey?], ...] */
export const keys = (t: number, ks: [number, number, EaseFn?][]) => {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, e] = ks[i];
    const [t0, v0] = ks[i - 1];
    if (t <= t1) return lerp(v0, v1, (e ?? E.inOut)(clamp((t - t0) / Math.max(t1 - t0, 1e-4))));
  }
  return ks[ks.length - 1][1];
};

/** springy pop 0 -> 1 with a little overshoot */
export const pop = (t: number, t0: number, dur = 0.45) => p(t, t0, dur, E.back);

/** smooth deterministic noise in [-1, 1] */
export const noise1 = (t: number, seed: number) => {
  const a = random(`a${seed}`) * 6.28;
  const b = random(`b${seed}`) * 6.28;
  return (Math.sin(t * 1.7 + a) * 0.6 + Math.sin(t * 2.9 + b) * 0.3 + Math.sin(t * 5.3 + a * b) * 0.1);
};

/** decaying camera shake offset */
export const shake = (t: number, t0: number, dur: number, amp: number, seed = 1) => {
  if (t < t0 || t > t0 + dur) return {x: 0, y: 0, r: 0};
  const k = 1 - (t - t0) / dur;
  const s = k * k * amp;
  return {
    x: Math.sin((t - t0) * 61 + seed) * s,
    y: Math.cos((t - t0) * 53 + seed * 2) * s,
    r: Math.sin((t - t0) * 47 + seed * 3) * s * 0.04,
  };
};
