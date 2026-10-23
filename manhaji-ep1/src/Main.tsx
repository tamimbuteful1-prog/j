import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {C, useLayout} from './theme';
import {clamp, cue, easeInOutCubic, easeInOutQuint, FPS, INTRO, prog} from './time';
import {Intro} from './scenes/Intro';
import {avatarScreen, MAP_A_END, MAP_B_START, MapScene} from './scenes/MapScene';
import {Days} from './scenes/Days';
import {Counter} from './scenes/Counter';
import {Concept} from './scenes/Concept';
import {Outro} from './scenes/Outro';
import {BrandBug} from './components/Kit';

const between = (t: number, a: number, b: number) => t >= a && t < b;

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const {W, H, isV} = useLayout();

  const introEnd = INTRO.transition + 0.72;
  const mapAEnd = MAP_A_END();
  const s3 = cue('s3_start');
  const mapB = MAP_B_START();
  const s5 = cue('s5_start');
  const s6 = cue('s6_start');
  const s8 = cue('s8_start');

  // map A leaves while the camera rises; map B drops back in
  const mapAOut = prog(t, s3 + 0.1, 0.6, easeInOutCubic);
  const mapBIn = prog(t, mapB - 0.2, 0.5, easeInOutQuint);

  // bar wipe 5 -> 6 (moves right -> left, the reading direction)
  const wipeK = prog(t, s6 - 0.3, 0.55, easeInOutCubic);
  const wpos = W + 400 - (W + 800) * wipeK;
  const skew = H * 0.25;
  const clip6 = wipeK < 1 ? `polygon(${wpos + skew}px 0, ${W + skew + 10}px 0, ${W + 10}px ${H}px, ${wpos - skew}px ${H}px)` : undefined;

  const bug = clamp((t - (INTRO.transition + 0.9)) / 0.4) * (1 - clamp((t - (s8 - 0.4)) / 0.3));

  return (
    <AbsoluteFill style={{background: C.bg0}}>
      {between(t, INTRO.transition, mapAEnd) && (
        <AbsoluteFill style={{opacity: 1 - mapAOut}}>
          <MapScene t={t} />
        </AbsoluteFill>
      )}
      {between(t, s3, mapB + 0.35) && <Days t={t} />}
      {between(t, mapB - 0.2, s5 + 0.5) && (
        <AbsoluteFill style={{opacity: mapBIn, transform: `scale(${1.25 - 0.25 * mapBIn})`, filter: mapBIn < 1 ? `blur(${(1 - mapBIn) * 16}px)` : undefined}}>
          <MapScene t={t} />
        </AbsoluteFill>
      )}
      {between(t, s5 - 0.05, s6 + 0.3) && <Counter t={t} />}
      {between(t, s6 - 0.3, s8 + 0.2) && (
        <AbsoluteFill style={{clipPath: clip6}}>
          <Concept t={t} />
        </AbsoluteFill>
      )}
      {wipeK > 0 && wipeK < 1 && (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <polygon points={`${wpos + skew - 70},0 ${wpos + skew + 10},0 ${wpos - skew + 10},${H} ${wpos - skew - 70},${H}`} fill={C.orange} />
          <polygon points={`${wpos + skew + 10},0 ${wpos + skew + 46},0 ${wpos - skew + 46},${H} ${wpos - skew + 10},${H}`} fill={C.yellow} />
        </svg>
      )}
      {t >= s8 - 0.35 && <Outro t={t} />}
      {t < introEnd && <Intro t={t} irisTo={avatarScreen(Math.min(t, introEnd), W, H, isV)} />}

      {bug > 0 && (
        <div style={{position: 'absolute', top: isV ? 70 : 48, right: isV ? 56 : 60, opacity: bug * 0.95}}>
          <BrandBug a={1} scale={isV ? 1.1 : 1} />
        </div>
      )}
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};
