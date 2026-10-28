import React from 'react';
import {Audio, Sequence, interpolate, staticFile} from 'remotion';
import {HOOK, MUSIC, SFX_ENABLED, SFX_MASTER, VOICE_ENABLED} from '../config/media';
import {SfxName, Timeline, sec} from '../config/timeline';
import {AbsCaption} from '../components/Captions';

const Sfx: React.FC<{name: SfxName; at: number; volume?: number}> = ({name, at, volume = 1}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={90} layout="none" name={`sfx:${name}`}>
    <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume * SFX_MASTER} />
  </Sequence>
);

/**
 * All audio lives here:
 *  • voice-over slots per scene (enable in timeline.ts once recorded)
 *  • scene SFX cues (keyed to the same beats as the visuals)
 *  • music bed auto-ducked under every spoken caption window
 */
export const SoundDesign: React.FC<{tl: Timeline; speech: AbsCaption[]}> = ({tl, speech}) => {
  const musicFrom = MUSIC.startAfterHook ? tl.hookFrames - sec(0.9) : 0;
  const orF = sec(HOOK.orWordSec);

  // duck envelope: 1 = full music, 0 = ducked
  const duck = (absFrame: number) => {
    let d = 1;
    for (const c of speech) {
      const v = interpolate(absFrame, [c.start - 6, c.start, c.end, c.end + 10], [1, 0, 0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      d = Math.min(d, v);
    }
    return d;
  };

  return (
    <>
      {/* hook — the «أو» stop */}
      {SFX_ENABLED && HOOK.freezeFrames > 0 && (
        <>
          <Sfx name="tape_stop" at={orF - 2} volume={0.45} />
          <Sfx name="glitch" at={orF} volume={0.3} />
          <Sfx name="tick" at={orF + HOOK.freezeFrames} volume={0.4} />
        </>
      )}
      {SFX_ENABLED && <Sfx name="riser" at={tl.hookFrames - sec(1.6)} volume={0.3} />}

      {tl.scenes.map(({def, from}) => (
        <React.Fragment key={def.id}>
          {VOICE_ENABLED && def.voice?.enabled && (
            <Sequence from={from + sec(def.voice.offsetSec)} layout="none" name={`voice:${def.id}`}>
              <Audio src={staticFile(def.voice.src)} volume={def.voice.volume ?? 1} />
            </Sequence>
          )}
          {SFX_ENABLED && def.sfx.map((c, i) => <Sfx key={i} name={c.name} at={from + sec(c.at)} volume={c.volume} />)}
        </React.Fragment>
      ))}

      {MUSIC.enabled && (
        <Sequence from={musicFrom} layout="none" name="music">
          <Audio
            src={staticFile(MUSIC.src)}
            loop
            volume={(fr) => {
              const abs = fr + musicFrom;
              const fadeIn = interpolate(fr, [0, 45], [0, 1], {extrapolateRight: 'clamp'});
              const fadeOut = interpolate(abs, [tl.total - 60, tl.total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              const d = duck(abs);
              return (MUSIC.duckedVolume + (MUSIC.volume - MUSIC.duckedVolume) * d) * fadeIn * fadeOut;
            }}
          />
        </Sequence>
      )}
    </>
  );
};
