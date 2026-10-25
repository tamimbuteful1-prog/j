import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import './fonts';
import {clamp, cue, FPS, HOOK} from './time';
import {card, Hook} from './scenes/Hook';
import {BellScene} from './scenes/BellScene';
import {LogicScene} from './scenes/LogicScene';
import {Summary} from './scenes/Summary';
import {P, World} from './components/Props';
import {LogoMark} from './components/Kit';
import {F} from './theme';
import {Captions} from './components/Captions';

export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cd = card(t);
  const say = cue('say');
  const summary = cue('summary');
  const backSide = cd.active && !cd.front;
  const bellOn = t >= HOOK.transition + 0.1 && t < say + 0.15;

  const bug = 0; // brand appears in the title and the sign-off instead

  return (
    <AbsoluteFill style={{background: P.paper}}>
      {/* paper world behind the flipping card */}
      {cd.active && t < HOOK.transition + 1.0 && <World t={t} />}
      {bellOn && (
        <AbsoluteFill
          style={
            backSide && cd.s < 0.999
              ? {
                  transform: `perspective(2200px) scale(${cd.s}) rotateZ(${cd.tilt}deg) rotateY(${cd.angle - 180}deg)`,
                  borderRadius: cd.radius,
                  overflow: 'hidden',
                  boxShadow: `0 40px 90px rgba(40,30,10,0.35), 0 0 0 ${cd.border}px #FFFFFF`,
                }
              : !cd.front
                ? undefined
                : {opacity: 0}
          }
        >
          <BellScene t={t} />
        </AbsoluteFill>
      )}
      {t >= say - 0.4 && t < summary + 0.6 && <LogicScene t={t} />}
      {t >= summary - 0.2 && <Summary t={t} />}
      {cd.front && t < HOOK.transition + 0.8 && <Hook t={t} />}

      {bug > 0 && (
        <div style={{position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: bug * 0.85}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl', background: 'rgba(255,255,255,0.75)', borderRadius: 999, padding: '6px 22px 6px 10px'}}>
            <LogoMark size={44} />
            <span style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 30, color: P.ink}}>منهجي</span>
          </div>
        </div>
      )}
      {t > HOOK.transition + 0.8 && <Captions t={t} />}
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};
