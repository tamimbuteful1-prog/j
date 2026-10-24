import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {FPS} from '../theme';
import {CUES as Q, HOOK, OUTRO, VOICE_START} from '../timeline';

type Sfx = [time: number, file: string, volume: number];

// Every effect sits on a word, a visual event, or a camera move.
// Effects that land while the narrator is speaking stay low so no word is ever masked.
export const SFX: Sfx[] = [
  // hook
  [HOOK.lightsOut - 0.03, 'power_down', 0.5],
  [7.95, 'riser', 0.32],
  [8.42, 'whoosh_long', 0.6],
  [8.8, 'impact_soft', 0.55],
  [8.84, 'shimmer', 0.3],
  // scene 1
  [Q.wCut + 0.02, 'zap', 0.3],
  [Q.wCut + 0.05, 'power_down', 0.42],
  [Q.wExceptOne, 'hum_on', 0.3],
  [Q.wExceptOne + 0.05, 'ding', 0.22],
  [Q.wElec1 - 0.05, 'click', 0.22],
  [Q.wOr1 - 0.05, 'pop_high', 0.32],
  [Q.wBatt1 - 0.05, 'click_low', 0.25],
  [17.42, 'whoosh', 0.45],
  // scene 2
  [Q.wWhatDiff, 'pop', 0.2],
  [Q.wAnd2, 'pop_high', 0.32],
  [Q.wAnd2 + 0.35, 'pop', 0.25],
  [22.92, 'whoosh_long', 0.42],
  // scene 3
  [Q.wMantiq - 0.08, 'impact', 0.42],
  [Q.wJumla - 0.2, 'whoosh_short', 0.22],
  [Q.wJudge + 0.45, 'hum_on', 0.18],
  [Q.wTrueFalse, 'click', 0.25],
  [Q.wTrueFalse + 0.35, 'click_low', 0.25],
  [Q.wIbara + 0.15, 'stamp', 0.42],
  [30.92, 'whoosh', 0.42],
  // scene 4
  [33.67, 'pop_high', 0.25],
  [35.25, 'error', 0.22],
  [36.1, 'whoosh_short', 0.3],
  [36.98, 'stamp', 0.42],
  [38.05, 'pop_high', 0.25],
  [40.34, 'ding_low', 0.3],
  [41.25, 'whoosh_short', 0.3],
  [42.03, 'stamp', 0.42],
  [42.62, 'whoosh_long', 0.42],
  // scene 5
  [Q.wP3, 'pop', 0.2],
  [Q.wOr3, 'pop_high', 0.3],
  [Q.wQ3, 'pop', 0.2],
  [46.35, 'hum_on', 0.3],
  [46.4, 'ding', 0.25],
  [Q.wFasl + 0.6, 'stamp', 0.4],
  [Q.wAnd4 - 0.05, 'pop_high', 0.3],
  [Q.wAnd4 + 0.05, 'whoosh_short', 0.22],
  [Q.wAnd4 + 1.25, 'zap', 0.38],
  [Q.wKhata, 'impact', 0.5],
  [Q.wKhata + 0.02, 'sub_drop', 0.45],
  [Q.wWasl + 0.83, 'stamp', 0.4],
  [Q.wWaw + 0.3, 'shimmer', 0.3],
  [58.15, 'whoosh', 0.45],
  // scene 6
  [59.2, 'draw', 0.3],
  [59.8, 'draw', 0.3],
  [61.2, 'pop', 0.18],
  [62.9, 'whoosh_short', 0.32],
  [63.25, 'ding', 0.32],
  [63.75, 'pop_high', 0.3],
  [64.75, 'ding_low', 0.32],
  [65.25, 'error', 0.25],
  // outro
  [OUTRO.pullBack, 'whoosh_long', 0.5],
  [Q.wLesson, 'click', 0.2],
  [Q.wSubject, 'click', 0.2],
  [Q.wGrade, 'click', 0.2],
  [OUTRO.logo, 'impact_soft', 0.45],
  [OUTRO.logo + 0.05, 'shimmer', 0.35],
];

export const SoundTrack: React.FC = () => (
  <>
    {/* original studio sound of the hook */}
    <Audio src={staticFile('hook_audio.wav')} volume={1} />
    {/* edited narration — always on top */}
    <Sequence from={Math.round(VOICE_START * FPS)} layout="none">
      <Audio src={staticFile('voice.wav')} volume={1} />
    </Sequence>
    {/* original score (pre-ducked under every spoken word) */}
    <Audio src={staticFile('music.wav')} volume={0.9} />
    {SFX.map(([time, file, vol], i) => (
      <Sequence key={i} from={Math.max(0, Math.round(time * FPS))} durationInFrames={FPS * 4} layout="none">
        <Audio src={staticFile(`sfx/${file}.wav`)} volume={vol} />
      </Sequence>
    ))}
  </>
);
