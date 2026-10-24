import {CUES as Q, HOOK, OUTRO, POS} from '../timeline';
import {E, EaseFn, clamp, lerp, noise1, shake} from '../lib/anim';

export type Cam = {x: number; y: number; z: number; r: number; tilt: number};
type K = {t: number; x: number; y: number; z: number; r?: number; tilt?: number; e?: EaseFn};

const at = (s: keyof typeof POS, dx = 0, dy = 0) => ({x: POS[s][0] + dx, y: POS[s][1] + dy});

/** travel between two modules: dips out, tilts the board in 3D, then lands */
const travel = (t0: number, t1: number, from: keyof typeof POS, to: keyof typeof POS, landDy = 0): K[] => {
  const a = at(from);
  const b = at(to, 0, landDy);
  const mid = (t0 + t1) / 2;
  return [
    {t: mid, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: 0.72, tilt: 16, r: b.x > a.x ? -2 : b.x < a.x ? 2 : 0, e: E.in},
    {t: t1, ...b, z: 1, tilt: 0, r: 0, e: E.out},
  ];
};

// Camera script: every move is motivated by a word or an idea in the narration.
const KEYS: K[] = [
  // arrival from the student's head into the board
  {t: HOOK.worldIn, ...at('s1', 0, -140), z: 3.4, r: -9},
  {t: 9.5, ...at('s1', 0, -40), z: 1.0, r: 0, e: E.expo},
  {t: Q.wCut - 0.05, ...at('s1', 0, -60), z: 1.05, e: E.soft},
  // blackout: fast push-in
  {t: Q.wCut + 0.25, ...at('s1', 0, -150), z: 1.22, e: E.out},
  {t: Q.wExceptOne - 0.15, ...at('s1', 0, -150), z: 1.2, e: E.soft},
  // "except one" — push to the surviving lamp
  {t: Q.wExceptOne + 0.45, ...at('s1', 100, -230), z: 1.38, e: E.out},
  {t: Q.wRuns + 0.2, ...at('s1', 90, -220), z: 1.34, e: E.soft},
  // reveal both sources feeding it
  {t: Q.wElec1 - 0.1, ...at('s1', 0, 0), z: 1.0, e: E.inOut},
  {t: 17.45, ...at('s1', 0, 10), z: 1.03, e: E.soft},
  ...travel(17.45, 18.25, 's1', 's2'),
  {t: Q.wAnd2 - 0.1, ...at('s2', 0, 0), z: 1.04, e: E.soft},
  {t: Q.wAnd2 + 0.35, ...at('s2', 0, 230), z: 1.16, e: E.out},
  {t: 22.95, ...at('s2', 0, 230), z: 1.18, e: E.soft},
  ...travel(22.95, 24.0, 's2', 's3'),
  {t: Q.wMantiq + 0.25, ...at('s3', 0, -200), z: 1.1, e: E.out},
  {t: Q.wJumla, ...at('s3', 0, 60), z: 1.0, e: E.inOut},
  {t: Q.wIbara - 0.1, ...at('s3', 0, 80), z: 1.02, e: E.soft},
  {t: Q.wIbara + 0.35, ...at('s3', 0, 260), z: 1.14, e: E.out},
  {t: 30.95, ...at('s3', 0, 260), z: 1.15, e: E.soft},
  ...travel(30.95, 31.75, 's3', 's4'),
  {t: 36.5, ...at('s4', 0, 40), z: 1.02, e: E.soft},
  {t: 37.15, ...at('s4', -170, 280), z: 1.12, e: E.out},
  {t: 37.9, ...at('s4', 0, 40), z: 1.0, e: E.inOut},
  {t: 41.6, ...at('s4', 0, 40), z: 1.02, e: E.soft},
  {t: 42.2, ...at('s4', 170, 280), z: 1.12, e: E.out},
  {t: 42.65, ...at('s4', 120, 220), z: 1.08, e: E.soft},
  ...travel(42.65, 43.55, 's4', 's5'),
  {t: Q.wFasl + 0.2, ...at('s5', 0, 30), z: 1.04, e: E.soft},
  {t: Q.wAnd4 - 0.2, ...at('s5', 0, 0), z: 1.0, e: E.inOut},
  // "my statement is FALSE" — punch-in on the verdict
  {t: Q.wKhata - 0.1, ...at('s5', 0, 40), z: 1.03, e: E.soft},
  {t: Q.wKhata + 0.12, ...at('s5', 0, 330), z: 1.32, e: E.expo},
  {t: 55.0, ...at('s5', 0, 330), z: 1.36, e: E.soft},
  {t: 55.6, ...at('s5', 0, 60), z: 1.02, e: E.inOut},
  // "because of the letter و" — dive onto the connector
  {t: Q.wWaw + 0.2, ...at('s5', 0, 0), z: 1.04, e: E.soft},
  {t: Q.wWaw + 1.0, ...at('s5', 0, -640), z: 1.75, e: E.inOut},
  {t: 58.2, ...at('s5', 0, -640), z: 1.8, e: E.soft},
  ...travel(58.2, 59.1, 's5', 's6'),
  {t: 62.9, ...at('s6', 0, 0), z: 1.03, e: E.soft},
  {t: 63.6, ...at('s6', 0, -380), z: 1.1, e: E.inOut},
  {t: 64.4, ...at('s6', 0, -380), z: 1.12, e: E.soft},
  {t: 65.0, ...at('s6', 0, 400), z: 1.1, e: E.inOut},
  {t: OUTRO.pullBack, ...at('s6', 0, 400), z: 1.12, e: E.soft},
  // pull back: the whole lesson as one circuit
  {t: OUTRO.pullBack + 1.6, x: 800, y: 2400, z: 0.262, r: -2, e: E.inOut},
  {t: OUTRO.logo, x: 800, y: 2400, z: 0.29, r: 0, e: E.soft},
  {t: OUTRO.logo + 1.4, x: 800, y: 2400, z: 0.2, r: 3, e: E.inOut},
];

const prop = (t: number, f: (k: K) => number, def: number): number => {
  const ks = KEYS;
  const val = (k: K) => {
    const v = f(k);
    return Number.isFinite(v) ? v : def;
  };
  if (t <= ks[0].t) return val(ks[0]);
  for (let i = 1; i < ks.length; i++) {
    if (t <= ks[i].t) {
      const k0 = ks[i - 1];
      const k1 = ks[i];
      const e = k1.e ?? E.inOut;
      const q = e(clamp((t - k0.t) / Math.max(k1.t - k0.t, 1e-4)));
      return lerp(val(k0), val(k1), q);
    }
  }
  return val(ks[ks.length - 1]);
};

export const cameraAt = (t: number): Cam => {
  const zLog = prop(t, (k) => Math.log(k.z), 0); // zoom interpolated in log space = constant perceived speed
  const s = shake(t, Q.wCut + 0.02, 0.5, 14, 3);
  const s2 = shake(t, Q.wKhata + 0.02, 0.35, 10, 7);
  // gentle hand-held drift so the world never feels frozen
  const drift = (n: number) => noise1(t * 0.35, n);
  return {
    x: prop(t, (k) => k.x, 0) + s.x + s2.x + drift(1) * 6,
    y: prop(t, (k) => k.y, 0) + s.y + s2.y + drift(2) * 6,
    z: Math.exp(zLog),
    r: prop(t, (k) => k.r ?? NaN, 0) + s.r + s2.r + drift(3) * 0.25,
    tilt: prop(t, (k) => k.tilt ?? NaN, 0),
  };
};
