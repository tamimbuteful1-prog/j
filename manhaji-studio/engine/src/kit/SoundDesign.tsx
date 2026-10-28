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
  // Music stays at one steady "under voice" level for the whole narration. It only lifts
  // (slowly, and by at most `GAP_LIFT`) in real pauses longer than LONG_GAP seconds, and
  // returns to full only before the first line and after the last — never a quick swell
  // between sentences.
  const LONG_GAP = 1.6;
  const GAP_LIFT = 0.45;
  const spans = tl.lines.map((l) => [l.start, l.end] as const).sort((a, b) => a[0] - b[0]);
  const duck = (abs: number) => {
    if (!spans.length) return 1;
    const t = abs / tl.fps;
    const first = spans[0][0];
    const last = spans[spans.length - 1][1];
    if (t < first) return interpolate(t, [first - 0.8, first - 0.1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    if (t > last) return interpolate(t, [last + 0.4, last + 1.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    for (let i = 0; i < spans.length - 1; i++) {
      const a = spans[i][1];
      const b = spans[i + 1][0];
      if (t > a && t < b && b - a > LONG_GAP) {
        const up = interpolate(t, [a + 0.3, a + 0.9], [0, GAP_LIFT], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        const down = interpolate(t, [b - 0.7, b - 0.15], [GAP_LIFT, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return Math.min(up, down);
      }
    }
    return 0;
  };
  // sound effects that land on a spoken word are kept under the voice
  const underVoice = (sec: number) => spans.some(([a, b]) => sec >= a - 0.05 && sec <= b + 0.05);

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
          <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={underVoice(c.at) ? Math.min(c.volume, 0.35) : c.volume} />
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
