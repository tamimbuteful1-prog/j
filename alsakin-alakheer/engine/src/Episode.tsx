import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import './lib/fonts';
import {F, P, VIDEO} from './theme';
import {EASE, ramp, sec} from './lib/anim';
import {Finish} from './fx';
import {Captions} from './Captions';
import {Sound} from './Sound';
import {BLACK_AT, SCENES, TITLE_AT, TOTAL} from './timeline';
import {S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13} from './scenes/Scenes';

const C = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13] as React.FC<{start: number; end: number}>[];

/** the title after the cut to black */
const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const a = ramp(frame, TITLE_AT, TITLE_AT + 1.2, EASE.soft);
  const b = ramp(frame, TITLE_AT + 1.1, TITLE_AT + 2.1, EASE.soft);
  const out = 1 - ramp(frame, TOTAL - 0.6, TOTAL, EASE.in);
  return (
    <AbsoluteFill style={{background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', direction: 'rtl', opacity: out}}>
      <div style={{fontFamily: F.head, fontWeight: 900, fontSize: 132, color: P.text, opacity: a, letterSpacing: -1, transform: `scale(${1.04 - 0.04 * a})`, textShadow: '0 0 40px rgba(179,38,30,0.35)'}}>الساكن الأخير</div>
      <div style={{width: 260 * b, height: 3, background: P.redHi, margin: '34px 0 28px', boxShadow: `0 0 18px ${P.red}`}} />
      <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 44, color: '#b9b4ab', opacity: b}}>الحلقة الأولى — لا ترد</div>
    </AbsoluteFill>
  );
};

export const E01: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SCENES.map((s, i) => {
        const Comp = C[i];
        const from = sec(s.start);
        const dur = Math.max(1, sec(s.id === 13 ? BLACK_AT : s.end) - from);
        return (
          <Sequence key={s.id} from={from} durationInFrames={dur}>
            <AbsoluteFill style={{transform: `translateY(${-0}px)`}}>
              {/* scenes read the absolute clock */}
              <AbsFrame offset={from}>
                <Comp start={s.start} end={s.id === 13 ? BLACK_AT : s.end} />
              </AbsFrame>
            </AbsoluteFill>
          </Sequence>
        );
      })}
      {t < BLACK_AT && <Captions />}
      {t < BLACK_AT && <Finish flicker={1} />}
      {t >= BLACK_AT && <AbsoluteFill style={{background: '#000'}} />}
      {t >= TITLE_AT && <Title />}
      <Sound />
    </AbsoluteFill>
  );
};

/** lets scene code use absolute seconds (useCurrentFrame inside a Sequence is relative) */
import {Freeze} from 'remotion';
const AbsFrame: React.FC<{offset: number; children: React.ReactNode}> = ({offset, children}) => {
  const f = useCurrentFrame();
  return <Freeze frame={f + offset}>{children}</Freeze>;
};
