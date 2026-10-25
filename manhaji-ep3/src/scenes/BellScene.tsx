import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../theme';
import {clamp, cue, easeInOutCubic, easeInOutQuint, kf, prog, spr} from '../time';
import {Bell, Button, P, Waves, World, shake} from '../components/Props';
import {LogoMark} from '../components/Kit';

const BELL = {x: 540, y: 600, size: 580};
const BTN = {x: 540, y: 1240, size: 250};

export const Chip: React.FC<{k: number; children: React.ReactNode; color?: string; bg?: string; size?: number; style?: React.CSSProperties}> = ({k, children, color = P.ink, bg = '#FFFFFF', size = 46, style}) =>
  k > 0.001 ? (
    <div
      style={{
        fontFamily: F.kufi,
        fontWeight: 800,
        fontSize: size,
        color,
        background: bg,
        padding: `${size * 0.1}px ${size * 0.6}px ${size * 0.24}px`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
        direction: 'rtl',
        boxShadow: '0 18px 40px rgba(60,45,20,0.18)',
        transform: `scale(${Math.min(1.08, k)})`,
        opacity: clamp(k * 3),
        ...style,
      }}
    >
      {children}
    </div>
  ) : null;

/** wifi arcs = «ذكي» */
export const Smart: React.FC<{size: number; k: number; color?: string}> = ({size, k, color = P.teal}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 100 80" style={{overflow: 'visible'}}>
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${50 - 14 - i * 14} ${58 - 10 - i * 12} Q 50 ${30 - i * 20} ${50 + 14 + i * 14} ${58 - 10 - i * 12}`} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" opacity={clamp((k - i * 0.2) * 3)} />
    ))}
    <circle cx={50} cy={62} r={8} fill={color} opacity={clamp(k * 3)} />
  </svg>
);

export const BellScene: React.FC<{t: number}> = ({t}) => {
  const k = {because: cue('because'), smart: cue('smart'), auto: cue('auto'), time: cue('time'), ring: cue('ring'), say: cue('say')};

  const cs = kf(t, [
    [3.4, 1.25],
    [k.smart - 0.1, 1.02, easeInOutCubic],
    [k.time - 0.2, 1.05],
    [k.time + 0.25, 1.7, easeInOutQuint],
    [k.ring - 0.05, 1.75],
    [k.ring + 0.4, 1.0, easeInOutQuint],
    [k.say + 0.4, 1.02],
  ]);
  const cy = kf(t, [
    [3.4, 640],
    [k.smart - 0.1, 960, easeInOutCubic],
    [k.time - 0.2, 940],
    [k.time + 0.25, 860, easeInOutQuint],
    [k.ring - 0.05, 860],
    [k.ring + 0.4, 960, easeInOutQuint],
  ]);
  const sh = shake(t, k.ring, 7);
  const ring = clamp((t - k.ring) / 0.05) * (1 - clamp((t - (k.ring + 1.1)) / 0.4));
  const led = Math.max(ring, clamp((t - k.smart) / 0.4) * 0.6);
  const sec = Math.floor(clamp((t - (k.ring - 3)) / 3) * 3);
  const screen = (
    <div style={{fontFamily: F.mono, fontWeight: 800, fontSize: 40, color: t >= k.ring ? P.yellow : '#7CF4E8', letterSpacing: 1}}>
      {t >= k.ring ? '07:00:00' : `06:59:5${7 + sec}`}
    </div>
  );
  const out = prog(t, k.say - 0.1, 0.5, easeInOutQuint);

  return (
    <AbsoluteFill>
      <World t={t} cam={{x: 0, y: cy * cs - 960, s: cs}} />
      <AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 - out * 0.3}) translateY(${-out * 240}px)`, filter: out > 0 ? `blur(${out * 10}px)` : undefined}}>
        <div style={{position: 'absolute', inset: 0, transform: `translate(${540 - 540 * cs + sh}px, ${960 - cy * cs}px) scale(${cs})`, transformOrigin: '0 0'}}>
          <div style={{position: 'absolute', left: BELL.x - BELL.size / 2, top: BELL.y - BELL.size * 0.575}}>
            <div style={{position: 'absolute', left: BELL.size / 2, top: BELL.size * 0.3}}>
              <Waves t={t} k={ring} r0={220} />
            </div>
            <Bell size={BELL.size} ring={ring} t={t} led={led} screen={screen} />
          </div>
          {/* «ذكي»: wifi + chip */}
          <div style={{position: 'absolute', left: 760, top: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
            <Smart size={110} k={prog(t, k.smart - 0.1, 0.6)} />
            <Chip k={spr(t, k.smart - 0.05, 1.5)} bg={P.teal} color="#FFFFFF">
              جرس ذكي
            </Chip>
          </div>
          {/* «تلقائيًا» */}
          <div style={{position: 'absolute', left: 60, top: 420}}>
            <Chip k={spr(t, k.auto - 0.05, 1.5)} bg={P.yellow}>
              تلقائيًا
            </Chip>
          </div>
          {/* «في وقت محدد»: under the display */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 955, display: 'flex', justifyContent: 'center'}}>
            <Chip k={spr(t, k.time - 0.05, 1.5)} bg={P.ink} color="#FFFFFF" size={40}>
              في وقت محدد
            </Chip>
          </div>
          {/* the button nobody pressed */}
          <div style={{position: 'absolute', left: BTN.x - BTN.size / 2, top: BTN.y - BTN.size / 2}}>
            <Button size={BTN.size} off={0.8} />
            <svg width={BTN.size} height={BTN.size} viewBox="0 0 300 300" style={{position: 'absolute', inset: 0}}>
              <path d="M 70 230 L 230 70" stroke={P.red} strokeWidth={18} strokeLinecap="round" />
            </svg>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: BTN.y + 130, display: 'flex', justifyContent: 'center'}}>
            <Chip k={1} color={P.inkSoft} size={40}>
              الزر ما انضغط
            </Chip>
          </div>
        </div>
        {/* series tag */}
        <div style={{position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: prog(t, 3.9, 0.4)}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl', background: 'rgba(255,255,255,0.85)', borderRadius: 999, padding: '6px 24px 6px 10px', boxShadow: '0 10px 30px rgba(60,45,20,0.12)'}}>
            <LogoMark size={46} />
            <span style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 32, color: P.ink}}>منهجي</span>
            <span style={{fontFamily: F.kufi, fontWeight: 700, fontSize: 28, color: P.inkSoft}}>| العبارات الشرطية</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
