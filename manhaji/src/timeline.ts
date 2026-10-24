import {CUES, SEGMENTS, VOICE_START} from './timeline.generated';

export {CUES, SEGMENTS, VOICE_START};

export type SegId = (typeof SEGMENTS)[number]['id'];
export const seg = (id: SegId) => SEGMENTS.find((s) => s.id === id)!;

// --- the real hook (seconds on the final timeline)
export const HOOK = {
  end: 8.709, // last frame of the filmed hook
  lightsOut: 95 / 24, // exact frame the studio lights die (3.958s)
  diveStart: 8.05, // student's finger reaches his temple → camera pushes into the idea
  flash: 8.78,
  worldIn: 8.62,
};

// --- the motion-graphics world: one circuit board, six modules
export const POS = {
  s1: [0, 0],
  s2: [1600, 0],
  s3: [1600, 2400],
  s4: [0, 2400],
  s5: [0, 4800],
  s6: [1600, 4800],
} as const;
export type SceneKey = keyof typeof POS;

export const OUTRO = {
  pullBack: CUES.wDetails - 0.15,
  logo: CUES.wSalam - 0.05,
};
