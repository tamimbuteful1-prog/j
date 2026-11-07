import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {sec} from '../../lib/anim';
import {VIDEO} from '../../theme';
import {Finish, Tear} from './look';
import {S1Scene, S2Balloon, S3Wall} from './scenes1';
import {S4Reactions, S5Border, S6Miyar, S7Map, S8Close} from './scenes2';

/** «جندي على الحدود الرقمية» — 45 s, vertical, no text: picture, camera and sound only. VO is Tamim's. */
export const SCENES = [
  {id: 'S1', from: 0.0, to: 5.2, C: S1Scene},
  {id: 'S2', from: 5.2, to: 10.4, C: S2Balloon},
  {id: 'S3', from: 10.4, to: 17.0, C: S3Wall},
  {id: 'S4', from: 17.0, to: 23.2, C: S4Reactions},
  {id: 'S5', from: 23.2, to: 29.6, C: S5Border},
  {id: 'S6', from: 29.6, to: 36.2, C: S6Miyar},
  {id: 'S7', from: 36.2, to: 41.2, C: S7Map},
  {id: 'S8', from: 41.2, to: 45.0, C: S8Close},
] as const;
export const DBS_TOTAL = 45;
const X = 0.35; // cross-dissolve overlap

const Cut: React.FC = () => {
  const t = useCurrentFrame() / VIDEO.fps;
  let k = 0;
  for (const s of SCENES.slice(1)) k = Math.max(k, interpolate(Math.abs(t - s.from), [0, 0.22], [1, 0], {extrapolateRight: 'clamp'}));
  return <Tear k={k} />;
};

type Cue = [number, string, number];
/** sound design (no music): every cue is tied to an on-screen event */
export const CUES: Cue[] = [
  [0.0, 'room_tone', 0.5], [0.0, 'drone', 0.38],
  [0.35, 'torch_click', 0.6], [0.8, 'buzz', 0.55], [2.0, 'buzz', 0.55], [1.9, 'whoosh_air', 0.25],
  [4.3, 'riser', 0.45], [5.05, 'glitch', 0.45], [5.2, 'sub_hit', 0.6],
  ...Array.from({length: 22}).map((_, i): Cue => [5.2 + 0.5 + 3.9 * Math.pow(i / 22, 0.75), 'pop', 0.22 + 0.012 * i]),
  [5.6, 'stretch', 0.45], [9.4, 'heartbeat', 0.55],
  [10.15, 'glitch', 0.5], [10.4, 'boom_soft', 0.5],
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): Cue => [10.4 + 0.4 + i * 0.18, 'pin', 0.35]),
  [12.0, 'marker', 0.5], [12.6, 'shadow_swell', 0.6], [12.7, 'creak', 0.35], [15.8, 'sub_hit', 0.35],
  [16.75, 'glitch', 0.4], [17.0, 'whoosh_fast', 0.35],
  ...[0.3, 1.4, 2.5, 3.6].map((a): Cue => [17.0 + a - 0.35, 'card_slide', 0.6]),
  [17.0 + 1.4 + 0.25, 'crack', 0.45], [17.0 + 2.5 + 0.3, 'flame', 0.5], [17.0 + 3.6 + 0.3, 'lock_on', 0.35],
  [17.0 + 4.6, 'stamp', 0.55], [17.0 + 4.75, 'stamp', 0.4],
  [22.95, 'whoosh_air', 0.4], [23.2, 'door', 0.55], [23.4, 'footstep', 0.5], [24.0, 'footstep', 0.45],
  [25.2, 'riser', 0.35], [25.4, 'shield_up', 0.6],
  ...Array.from({length: 14}).map((_, i): Cue => [23.2 + 2.4 + i * 0.28, 'incoming', 0.18]),
  [23.2 + 3.25, 'deflect', 0.7], [23.2 + 3.95, 'deflect', 0.7], [23.2 + 4.65, 'deflect', 0.7],
  [23.2 + 5.0, 'warm_swell', 0.45],
  [29.35, 'whoosh_fast', 0.35], [29.7, 'card_slide', 0.5], [30.5, 'scanner', 0.55], [31.2, 'beep', 0.4], [31.6, 'beep', 0.4],
  [31.3, 'page_turn', 0.45], [32.1, 'lock_on', 0.35], [32.6, 'printer', 0.5], [33.6, 'stamp', 0.35],
  [33.7, 'whoosh_air', 0.4], [34.2, 'unlock', 0.55], [34.4, 'warm_swell', 0.4], [34.6, 'beep', 0.3], [34.75, 'beep', 0.3],
  [36.0, 'whoosh_air', 0.4], [36.3, 'map_draw', 0.45], [37.0, 'warm_swell', 0.5], [38.2, 'sub_hit', 0.3],
  [41.0, 'whoosh_air', 0.35], [41.6, 'folder', 0.6], [42.75, 'lamp_click', 0.7], [42.9, 'end_hit', 0.75],
];

export const DBS: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    {SCENES.map(({id, from, to, C}, i) => {
      const dur = to - from + (i < SCENES.length - 1 ? X : 0);
      return (
        <Sequence key={id} from={sec(from)} durationInFrames={sec(dur)} layout="none">
          <Fade inAt={i ? X : 0}>
            <C />
          </Fade>
        </Sequence>
      );
    })}
    <Cut />
    <Finish />
    {CUES.map(([at, name, vol], i) => (
      <Sequence key={i} from={sec(at)} layout="none">
        <Audio src={staticFile(`sfx/dbs/${name}.wav`)} volume={(fr) => vol * (name === 'room_tone' || name === 'drone' ? interpolate(fr, [0, 20, sec(DBS_TOTAL) - 40, sec(DBS_TOTAL)], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const Fade: React.FC<{inAt: number; children: React.ReactNode}> = ({inAt, children}) => {
  const f = useCurrentFrame();
  const o = Math.min(interpolate(f, [0, sec(inAt) || 1], [inAt ? 0 : 1, 1], {extrapolateRight: 'clamp'}), 1);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
