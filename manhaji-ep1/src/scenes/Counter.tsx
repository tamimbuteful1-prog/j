import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, useLayout} from '../theme';
import {clamp, cue, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutExpo, prog, spr} from '../time';
import {Clock, Draw, Pill} from '../components/Kit';
import {Stage} from '../components/Background';

const Panel: React.FC<{label: string; accent: string; children: React.ReactNode; w: number; h: number; dim?: number}> = ({label, accent, children, w, h, dim = 0}) => (
  <div
    style={{
      width: w,
      height: h,
      borderRadius: 40,
      background: 'linear-gradient(165deg, #232B36 0%, #151A21 100%)',
      border: `3px solid ${accent}`,
      boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 60px ${accent}22`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      direction: 'rtl',
      filter: dim ? `grayscale(${dim * 0.9}) brightness(${1 - dim * 0.35})` : undefined,
      position: 'relative',
    }}
  >
    <div style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 54, color: accent}}>{label}</div>
    {children}
  </div>
);

export const Counter: React.FC<{t: number}> = ({t}) => {
  const {W, H, isV, p} = useLayout();
  const k = {
    start: cue('s5_start'),
    tabaan: cue('s5_tabaan'),
    late: cue('s5_late'),
    x: cue('s5_x'),
    mithal: cue('s5_mithal'),
    mudad: cue('s5_mudad'),
    mine: cue('s5_takhmini'),
  };
  // yellow iris opening from the question mark
  const iris = prog(t, k.start - 0.02, 0.42, easeInOutQuint);
  const irisR = iris * Math.hypot(W, H) * 0.6;

  const pe = spr(t, k.start + 0.02, 1.4); // expectation panel
  const pr = spr(t, k.tabaan + 0.05, 1.4); // reality panel
  const roll = prog(t, k.tabaan + 0.15, 1.6, easeInOutCubic);
  const stamp = spr(t, k.late, 1.8);
  const xk = prog(t, k.x, 0.32, easeOutExpo);
  const xk2 = prog(t, k.x + 0.1, 0.32, easeOutExpo);
  const shake = t > k.x ? Math.exp(-(t - k.x) * 10) * Math.sin((t - k.x) * 80) * 14 : 0;
  const move = prog(t, k.mithal - 0.1, 0.5, easeInOutQuint);
  const m1 = spr(t, k.mithal, 1.5);
  const m2 = spr(t, k.mudad - 0.12, 1.7);
  const hit = t > k.mudad ? Math.exp(-(t - k.mudad) * 6) : 0;
  const hitShake = t > k.mudad ? Math.exp(-(t - k.mudad) * 12) * Math.sin((t - k.mudad) * 70) * 10 : 0;
  const under = prog(t, k.mudad + 0.1, 0.4, easeOutExpo);
  const sub = prog(t, k.mudad + 0.45, 0.4, easeOutExpo);
  const mine = spr(t, k.mine, 1.5);

  const pw = p(640, 860);
  const ph = p(440, 420);
  // panels: side by side (landscape) / stacked (vertical); then shrink below the term
  const panelScale = 1 - move * p(0.42, 0.38);
  const exp0 = p({x: W / 2 + 40, y: H / 2 - ph / 2 + 30}, {x: (W - pw) / 2, y: 330});
  const rea0 = p({x: W / 2 - 40 - pw, y: H / 2 - ph / 2 + 30}, {x: (W - pw) / 2, y: 330 + ph + 60});
  const dy = move * p(250, 380);

  return (
    <AbsoluteFill>
      <Stage t={t} accent={C.orange} />
      <AbsoluteFill style={{transform: `translate(${shake + hitShake}px, ${hitShake * 0.4}px)`}}>
        {/* expectation */}
        <div
          style={{
            position: 'absolute',
            left: exp0.x,
            top: exp0.y + dy,
            transformOrigin: p('0% 50%', '50% 50%'),
            transform: `translateX(${(1 - Math.min(1, pe)) * p(500, 0)}px) translateY(${(1 - Math.min(1, pe)) * p(0, -300)}px) scale(${panelScale * (0.7 + 0.3 * Math.min(1.05, pe))})`,
            opacity: clamp(pe * 3),
          }}
        >
          <Panel label="التوقع" accent={C.teal} w={pw} h={ph} dim={xk}>
            <Clock minutes={410} size={140} />
            <div style={{fontFamily: F.kufi, fontWeight: 700, fontSize: 36, color: C.muted}}>الوصول</div>
          </Panel>
          {/* X */}
          <svg width={pw} height={ph} viewBox={`0 0 ${pw} ${ph}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <Draw d={`M ${pw * 0.18} ${ph * 0.12} L ${pw * 0.82} ${ph * 0.88}`} k={xk} color={C.red} w={34} len={100} />
            <Draw d={`M ${pw * 0.82} ${ph * 0.12} L ${pw * 0.18} ${ph * 0.88}`} k={xk2} color={C.red} w={34} len={100} />
          </svg>
          {mine > 0.001 && (
            <div style={{position: 'absolute', top: -120, left: 0, right: 0, display: 'flex', justifyContent: 'center', transform: `scale(${1.6 * Math.min(1.1, mine)})`}}>
              <Pill size={38} bg={C.teal}>تخميني</Pill>
            </div>
          )}
        </div>
        {/* reality */}
        <div
          style={{
            position: 'absolute',
            left: rea0.x,
            top: rea0.y + dy,
            transformOrigin: p('100% 50%', '50% 50%'),
            transform: `translateX(${(1 - Math.min(1, pr)) * p(-500, 0)}px) translateY(${(1 - Math.min(1, pr)) * p(0, 300)}px) scale(${panelScale * (0.7 + 0.3 * Math.min(1.05, pr))})`,
            opacity: clamp(pr * 3),
          }}
        >
          <Panel label="الواقع المحتمل" accent={C.orange} w={pw} h={ph}>
            <Clock minutes={410 + 25 * roll} size={140} color={roll > 0.05 ? C.red : C.text} />
            <div style={{height: 60}} />
          </Panel>
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              transform: `scale(${stamp > 0 ? 2.2 - 1.2 * Math.min(1.05, stamp) : 0}) rotate(-6deg)`,
              opacity: clamp(stamp * 4),
            }}
          >
            <Pill size={44} bg={C.red} color={C.text}>
              الوصول متأخرًا
            </Pill>
          </div>
        </div>

        {/* «مثال مضاد» */}
        {m1 > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: p(150, 380),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{display: 'flex', direction: 'rtl', gap: 40, alignItems: 'center', position: 'relative'}}>
              <div
                style={{
                  fontFamily: F.kufi,
                  fontWeight: 900,
                  fontSize: p(170, 150),
                  color: C.ink,
                  lineHeight: 1.3,
                  transform: `translateX(${(1 - Math.min(1, m1)) * 700}px) skewX(${(1 - clamp(m1)) * -14}deg)`,
                  opacity: clamp(m1 * 3),
                  filter: `blur(${(1 - clamp(m1 * 1.3)) * 14}px)`,
                }}
              >
                مثال
              </div>
              <div
                style={{
                  fontFamily: F.kufi,
                  fontWeight: 900,
                  fontSize: p(170, 150),
                  color: C.orange,
                  lineHeight: 1.3,
                  transform: `translateX(${(1 - Math.min(1, m2)) * -800}px) skewX(${(1 - clamp(m2)) * 14}deg) scale(${1 + 0.12 * hit})`,
                  opacity: clamp(m2 * 3),
                  filter: `blur(${(1 - clamp(m2 * 1.3)) * 14}px)`,
                }}
              >
                مضاد
              </div>
              {/* impact flash between the words */}
              <svg width={400} height={400} viewBox="-200 -200 400 400" style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', overflow: 'visible', pointerEvents: 'none'}}>
                <circle r={60 + (1 - hit) * 260} fill="none" stroke={C.yellow} strokeWidth={10 * hit} opacity={hit} />
                {Array.from({length: 10}).map((_, i) => {
                  const a = (i / 10) * Math.PI * 2;
                  const r0 = 90 + (1 - hit) * 170;
                  return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * (r0 + 60 * hit)} y2={Math.sin(a) * (r0 + 60 * hit)} stroke={C.orange} strokeWidth={8} strokeLinecap="round" opacity={hit} />;
                })}
              </svg>
            </div>
            <svg width={p(760, 680)} height={30} viewBox="0 0 760 30" style={{marginTop: -10}}>
              <Draw d="M 740 15 Q 380 0 20 15" k={under} color={C.orange} w={12} len={100} />
            </svg>
            <div
              style={{
                fontFamily: F.kufi,
                fontWeight: 700,
                fontSize: p(42, 44),
                color: C.inkMuted,
                direction: 'rtl',
                marginTop: 14,
                opacity: sub,
                transform: `translateY(${(1 - sub) * 20}px)`,
              }}
            >
              حالة واحدة <span style={{color: C.ink}}>تنقض</span> التخمين
            </div>
          </div>
        )}
      </AbsoluteFill>
      {/* yellow carry-over from the question mark, opening as an iris */}
      {iris < 1 && (
        <AbsoluteFill
          style={{
            background: C.yellow,
            WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${irisR}px, #000 ${irisR + 1}px)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};

void easeOutBack;
