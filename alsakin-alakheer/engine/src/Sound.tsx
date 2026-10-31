import React from 'react';
import {Audio, Sequence, interpolate, staticFile} from 'remotion';
import {sec} from './lib/anim';
import {BLACK_AT, TITLE_AT, TOTAL, line, word, scene} from './timeline';

type Cue = {at: number; name: string; vol: number; loop?: boolean; dur?: number};

const cues = (): Cue[] => {
  const k = line('L07').words.map((w) => w[0]);
  return [
    ...k.map((at) => ({at: at - 0.02, name: 'knock', vol: 0.95})),
    {at: line('L01').start + 0.15, name: 'knock', vol: 0.25},
    {at: word('L11', 3) - 0.1, name: 'vibrate', vol: 0.7},
    {at: line('L14').end + 0.25, name: 'knock', vol: 0.3},
    {at: line('L18').start - 0.25, name: 'call_connect', vol: 0.45},
    {at: line('L28').start + 0.4, name: 'hang_up', vol: 0.4},
    {at: line('L28').end + 0.1, name: 'breath_nervous', vol: 0.55},
    {at: scene(9).start + 0.25, name: 'vibrate', vol: 0.65},
    {at: line('L33').start - 0.4, name: 'vibrate', vol: 0.6},
    {at: line('L37').start, name: 'riser', vol: 0.5},
    {at: line('L39').start, name: 'rumble', vol: 0.6},
    {at: line('L41').start - 0.3, name: 'breath_behind', vol: 0.75},
    {at: TITLE_AT, name: 'title_hit', vol: 0.8},
  ];
};

/** music bed with deliberate silences (the score drops out at the turning points) */
const musicVol = (t: number) => {
  const c = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
  const fadeIn = interpolate(t, [0, 2], [0.4, 1], c);
  const cut = (a: number, b: number, fade = 0.15) => 1 - interpolate(t, [a, a + fade], [0, 1], c) * interpolate(t, [b, b + 0.8], [1, 0], c);
  const swell = 1 + 0.6 * interpolate(t, [line('L37').start, line('L39').end], [0, 1], c);
  return 0.3 * fadeIn * swell * cut(line('L14').start, line('L15').start) * cut(line('L33').end, line('L36').start) * cut(line('L40').end, TOTAL + 10, 0.05) * cut(line('L28').end, scene(9).start - 0.2);
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile('vo/E01.wav')} />
    {cues().map((c, i) => (
      <Sequence key={i} from={Math.max(0, sec(c.at))} durationInFrames={sec(6)} layout="none">
        <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.vol} />
      </Sequence>
    ))}
    {/* room tone + far hum, everywhere until the black */}
    <Sequence from={0} durationInFrames={sec(BLACK_AT)} layout="none">
      <Audio src={staticFile('sfx/room_tone.wav')} loop volume={0.55} />
      <Audio src={staticFile('sfx/hum.wav')} loop volume={0.12} />
    </Sequence>
    <Sequence from={0} durationInFrames={sec(BLACK_AT)} layout="none">
      <Audio src={staticFile('music/drone.wav')} volume={(f) => musicVol(f / 30)} />
    </Sequence>
  </>
);
