import React from 'react';
import {P, F} from '../theme';

export type Screen =
  | {kind: 'off'}
  | {kind: 'notify'; from: string; text: string; time: string}
  | {kind: 'chat'; from: string; avatar?: string; msgs: {text: string; at: number}[]; now: number; focus?: string; focusK?: number}
  | {kind: 'call'; name: string; status: string};

/**
 * Close-up: Nawaf's hand holding his phone. The screen is real text (Arabic shaped by the browser),
 * never painted pixels. The screen is the main light source of the shot.
 */
export const PhoneShot: React.FC<{screen: Screen; glow?: number; jitter?: [number, number]; tilt?: number}> = ({screen, glow = 1, jitter = [0, 0], tilt = -4}) => {
  const W = 560;
  const H = 1140;
  return (
    <div style={{position: 'absolute', left: 540 - W / 2 + jitter[0], top: 380 + jitter[1], width: W, height: H, transform: `rotate(${tilt}deg)`}}>
      {/* light spilling from the screen */}
      <div style={{position: 'absolute', left: -380, top: -300, width: W + 760, height: H + 600, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(170,200,255,${0.35 * glow}), transparent)`, mixBlendMode: 'screen'}} />
      {/* fingers behind */}
      <svg viewBox="0 0 560 1140" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d="M -40 760 C -90 780, -96 860, -40 880 L 30 880 L 30 760 Z" fill={P.skinShade} />
        <path d="M 520 520 C 600 520, 610 600, 540 616 Z" fill={P.skinShade} />
        <path d="M 520 640 C 610 640, 620 724, 540 740 Z" fill={P.skinShade} />
      </svg>
      <div style={{position: 'absolute', inset: 0, borderRadius: 64, background: '#07080b', boxShadow: `0 0 0 3px #1c2028, 0 30px 80px rgba(0,0,0,0.7), 0 0 ${80 * glow}px rgba(150,190,255,${0.35 * glow})`}} />
      <div style={{position: 'absolute', left: 18, top: 18, right: 18, bottom: 18, borderRadius: 50, overflow: 'hidden', background: screen.kind === 'off' ? '#030407' : '#0d1118', direction: 'rtl', fontFamily: F.body}}>
        <ScreenView screen={screen} />
        {/* glass reflection */}
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(130deg, rgba(255,255,255,0.08), transparent 40%)'}} />
      </div>
      {/* thumb over the bottom edge */}
      <svg viewBox="0 0 560 1140" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <path d="M 420 1180 C 470 1080, 560 1020, 600 1060 C 640 1110, 560 1220, 520 1260 Z" fill={P.skin} />
        <path d="M 420 1180 C 470 1080, 560 1020, 600 1060 C 640 1110, 560 1220, 520 1260 Z" fill="#bcd4ff" opacity={0.18 * glow} />
      </svg>
    </div>
  );
};

const ScreenView: React.FC<{screen: Screen}> = ({screen}) => {
  if (screen.kind === 'off') return null;
  if (screen.kind === 'notify')
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #121a28, #0a0d14)'}}>
        <div style={{textAlign: 'center', marginTop: 120, color: '#dfe6f2', fontFamily: F.head, fontWeight: 300, fontSize: 120, letterSpacing: 2, direction: 'ltr'}}>{screen.time}</div>
        <div style={{margin: '80px 26px 0', padding: '22px 24px', borderRadius: 26, background: 'rgba(40,48,62,0.85)', color: '#eef2f8'}}>
          <div style={{fontWeight: 700, fontSize: 28, opacity: 0.8}}>{screen.from}</div>
          <div style={{fontSize: 30, marginTop: 8, lineHeight: 1.5}}>{screen.text}</div>
        </div>
      </div>
    );
  if (screen.kind === 'call')
    return (
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #16202f, #0a0d14)', color: '#eef2f8', textAlign: 'center'}}>
        <div style={{width: 170, height: 170, borderRadius: 85, background: '#2a3446', margin: '200px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 70, fontWeight: 700}}>أ</div>
        <div style={{fontSize: 56, fontWeight: 700, marginTop: 40}}>{screen.name}</div>
        <div style={{fontSize: 30, opacity: 0.7, marginTop: 14}}>{screen.status}</div>
        <div style={{position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{width: 120, height: 120, borderRadius: 60, background: '#c0392b'}} />
        </div>
      </div>
    );
  return (
    <div style={{position: 'absolute', inset: 0, background: '#0d1118'}}>
      <div style={{height: 150, background: '#151b26', display: 'flex', alignItems: 'flex-end', padding: '0 30px 22px', gap: 18, color: '#eef2f8'}}>
        <div style={{width: 64, height: 64, borderRadius: 32, background: '#2a3446', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 30}}>{screen.avatar ?? '؟'}</div>
        <div style={{fontWeight: 700, fontSize: 34}}>{screen.from}</div>
      </div>
      <div style={{padding: '30px 26px', display: 'flex', flexDirection: 'column', gap: 22}}>
        {screen.msgs.map((m, i) => {
          const k = Math.max(0, Math.min(1, (screen.now - m.at) / 0.35));
          if (k <= 0) return null;
          const hasFocus = screen.focus && m.text.includes(screen.focus);
          const parts = hasFocus ? m.text.split(screen.focus!) : [m.text];
          return (
            <div key={i} style={{alignSelf: 'flex-start', maxWidth: '86%', background: '#222a38', color: '#eef2f8', padding: '22px 26px', borderRadius: '26px 26px 26px 8px', fontSize: 40, lineHeight: 1.6, opacity: k, transform: `translateY(${(1 - k) * 18}px)`}}>
              {hasFocus ? (
                <>
                  {parts[0]}
                  <span style={{color: P.pale, textShadow: `0 0 ${18 * (screen.focusK ?? 0)}px ${P.pale}`, fontWeight: 700}}>{screen.focus}</span>
                  {parts[1]}
                </>
              ) : (
                m.text
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
