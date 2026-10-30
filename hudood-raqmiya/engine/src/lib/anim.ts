import {Easing, interpolate, spring} from 'remotion';
import {VIDEO} from '../theme';

export const sec = (s: number) => Math.round(s * VIDEO.fps);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** smooth cinematic curves (no cartoon bounce) */
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  soft: Easing.bezier(0.33, 0, 0.2, 1),
};

/** 0→1 between two times (seconds, relative to the frame given) */
export const ramp = (frame: number, a: number, b: number, ease = EASE.out) => interpolate(frame / VIDEO.fps, [a, b], [0, 1], {...clamp, easing: ease});

/** in at `a`, out at `b` (seconds), with fade lengths */
export const life = (frame: number, a: number, b: number, fin = 0.45, fout = 0.35) =>
  ramp(frame, a, a + fin) * (1 - ramp(frame, b - fout, b, EASE.in));

export const sp = (frame: number, at: number, cfg: {damping?: number; stiffness?: number; mass?: number} = {}) =>
  spring({frame: frame - sec(at), fps: VIDEO.fps, config: {damping: cfg.damping ?? 22, stiffness: cfg.stiffness ?? 140, mass: cfg.mass ?? 0.9}});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
