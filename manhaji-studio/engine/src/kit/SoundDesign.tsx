import React from 'react';
import {Audio, Sequence, interpolate, staticFile} from 'remotion';
import {useTimeline} from '../timeline/context';

/**
 * All episode audio:
 *  • voice-over per line (final mode) — exactly at the resolved line start
 *  • SFX cues resolved from storyboard beats
 *  • music bed, auto-ducked under every spoken line, faded in after the hook
 */
export const SoundDesign: React.FC<{voice?: Record<string, string>; music?: {src: string; volume: number; ducked: number} | null}> = ({voice, music}) => {
  const tl = useTimeline();
  const f = (s: number) => Math.round(s * tl.fps);
  const totalF = f(tl.totalSec);
  const musicFrom = Math.max(0, f(tl.hook.end - tl.hook.exitSec));
  const duck = (abs: number) => {
    let d = 1;
    for (const l of tl.lines) {
      const v = interpolate(abs, [f(l.start) - 6, f(l.start), f(l.end), f(l.end) + 10], [1, 0, 0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      d = Math.min(d, v);
    }
    return d;
  };
  return (
    <>
      {voice &&
        tl.lines.map((l) =>
          voice[l.id] ? (
            <Sequence key={l.id} from={f(l.start)} layout="none" name={`vo:${l.id}`}>
              <Audio src={staticFile(voice[l.id])} />
            </Sequence>
          ) : null,
        )}
      {tl.sfx.map((c, i) => (
        <Sequence key={i} from={f(c.at)} durationInFrames={90} layout="none" name={`sfx:${c.name}`}>
          <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.volume} />
        </Sequence>
      ))}
      {music && (
        <Sequence from={musicFrom} layout="none" name="music">
          <Audio
            src={staticFile(music.src)}
            loop
            volume={(fr) => {
              const abs = fr + musicFrom;
              const fade = interpolate(fr, [0, 45], [0, 1], {extrapolateRight: 'clamp'}) * interpolate(abs, [totalF - 60, totalF], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return (music.ducked + (music.volume - music.ducked) * duck(abs)) * fade;
            }}
          />
        </Sequence>
      )}
    </>
  );
};
