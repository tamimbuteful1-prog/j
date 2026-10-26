import {Easing, interpolate, spring} from 'remotion';
import {VIDEO} from '../config/theme';

export const fps = VIDEO.fps;
export const f = (s: number) => Math.round(s * fps);

const clampOpts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Signature easings — one motion language for the whole film. */
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-out: confident arrivals
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // camera moves
  in: Easing.bezier(0.7, 0, 0.84, 0), // exits
  soft: Easing.bezier(0.33, 1, 0.68, 1),
  anticipate: Easing.bezier(0.68, -0.35, 0.32, 1.35),
};

/** 0→1 between two times (seconds) with an easing. */
export const ramp = (frame: number, fromSec: number, toSec: number, ease: (t: number) => number = EASE.out) =>
  interpolate(frame, [fromSec * fps, toSec * fps], [0, 1], {...clampOpts, easing: ease});

/** Map a 0..1 progress to a range. */
export const mix = (p: number, a: number, b: number) => a + (b - a) * p;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Physically based pop-in starting at `atSec`. */
export const pop = (frame: number, atSec: number, config: {damping?: number; stiffness?: number; mass?: number} = {}) =>
  spring({frame: frame - atSec * fps, fps, config: {damping: 14, stiffness: 170, mass: 0.9, ...config}});

/** Gentle settle — for heavy objects (products landing). */
export const settle = (frame: number, atSec: number) =>
  spring({frame: frame - atSec * fps, fps, config: {damping: 11, stiffness: 120, mass: 1.1}});

/** Decaying shake (FALSE reactions). Returns px offset. */
export const shake = (frame: number, atSec: number, amp = 18, durSec = 0.45) => {
  const t = (frame - atSec * fps) / fps;
  if (t < 0 || t > durSec) return 0;
  const decay = 1 - t / durSec;
  return Math.sin(t * 70) * amp * decay * decay;
};

/** Deterministic noise for organic idle motion (no Math.random in renders). */
export const wobble = (frame: number, seed: number, speed = 0.04, amp = 1) =>
  (Math.sin(frame * speed + seed * 12.9898) * 0.6 + Math.sin(frame * speed * 0.53 + seed * 78.233) * 0.4) * amp;

/** Velocity-driven motion blur amount (px) for a 1-D motion curve. */
export const velocityBlur = (valueAt: (fr: number) => number, frame: number, scale = 0.08, max = 14) =>
  Math.min(max, Math.abs(valueAt(frame) - valueAt(frame - 1)) * scale);

/** Multi-keyframe tween (times in seconds). Easing is applied per segment. */
export const kf = (frame: number, times: number[], values: number[], ease: (t: number) => number = EASE.inOut) =>
  interpolate(
    frame,
    times.map((t) => t * fps),
    values,
    {...clampOpts, easing: ease},
  );

/** Ballistic drop: 0→1 over `dur` with gravity feel, then a small bounce. */
export const drop = (frame: number, atSec: number, dur = 0.32) => {
  const t = (frame - atSec * fps) / (dur * fps);
  if (t <= 0) return 0;
  if (t < 1) return t * t;
  const b = (t - 1) * dur * fps; // frames after impact
  return 1 - Math.abs(Math.sin(b / 3)) * Math.exp(-b / 4) * 0.06;
};
