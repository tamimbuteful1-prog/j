import React from 'react';
import {C, F} from '../theme';
import {clamp, easeOutCubic, rand} from '../time';

// ---------------------------------------------------------------- odometer clock
const Strip: React.FC<{pos: number; h: number; color: string; size: number; wrap: number}> = ({pos, h, color, size, wrap}) => {
  const digits = Array.from({length: wrap + 1}, (_, i) => i % wrap);
  return (
    <div style={{height: h, overflow: 'hidden', width: size * 0.62, position: 'relative'}}>
      <div style={{transform: `translateY(${-pos * h}px)`}}>
        {digits.map((d, i) => (
          <div key={i} style={{height: h, lineHeight: `${h}px`, textAlign: 'center', fontFamily: F.mono, fontWeight: 800, fontSize: size, color}}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

/** HH:MM odometer; `minutes` since midnight can be fractional (digits roll smoothly) */
export const Clock: React.FC<{minutes: number; size?: number; color?: string; glitch?: number}> = ({minutes, size = 120, color = C.text, glitch = 0}) => {
  const m = Math.max(0, minutes);
  // odometer: a wheel turns only while the wheel to its right goes 9 -> 0
  const mOnes = m % 10;
  const mTens = (Math.floor(m / 10) % 6) + Math.max(0, mOnes - 9);
  const H = Math.floor(m / 60) + Math.max(0, (m % 60) - 59);
  const hOnes = H % 10;
  const hTens = (Math.floor(H / 10) % 10) + Math.max(0, hOnes - 9);
  const h = size * 1.12;
  const g = glitch > 0 ? (rand(Math.floor(glitch * 40)) - 0.5) * glitch * 18 : 0;
  return (
    <div style={{display: 'flex', direction: 'ltr', alignItems: 'center', transform: `translateX(${g}px)`}}>
      <Strip pos={hTens} h={h} color={color} size={size} wrap={10} />
      <Strip pos={hOnes} h={h} color={color} size={size} wrap={10} />
      <div style={{fontFamily: F.mono, fontWeight: 800, fontSize: size, color, width: size * 0.34, textAlign: 'center', marginTop: -size * 0.08, marginLeft: -size * 0.04}}>:</div>
      <Strip pos={mTens} h={h} color={color} size={size} wrap={6} />
      <Strip pos={mOnes} h={h} color={color} size={size} wrap={10} />
    </div>
  );
};

/** card with a label and an odometer clock */
export const TimeCard: React.FC<{
  label: string;
  minutes: number;
  accent: string;
  size?: number;
  glow?: number;
  dim?: number;
  glitch?: number;
  color?: string;
}> = ({label, minutes, accent, size = 92, glow = 0, dim = 0, glitch = 0, color}) => (
  <div
    style={{
      background: 'linear-gradient(160deg, rgba(30,36,45,0.96), rgba(16,20,26,0.96))',
      border: `2px solid ${accent}`,
      borderRadius: 28,
      padding: `${size * 0.16}px ${size * 0.34}px ${size * 0.2}px`,
      boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 ${60 * glow}px ${accent}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      filter: dim ? `saturate(${1 - dim * 0.8}) brightness(${1 - dim * 0.35})` : undefined,
    }}
  >
    <div style={{fontFamily: F.kufi, fontWeight: 700, fontSize: size * 0.36, color: accent, direction: 'rtl', marginBottom: size * 0.02}}>{label}</div>
    <Clock minutes={minutes} size={size} color={color ?? C.text} glitch={glitch} />
  </div>
);

// ---------------------------------------------------------------- strokes / icons
/** stroke-draw helper for an SVG path of known length */
export const Draw: React.FC<{d: string; k: number; len?: number; color: string; w: number; cap?: 'round' | 'butt'; opacity?: number}> = ({
  d,
  k,
  len = 1000,
  color,
  w,
  cap = 'round',
  opacity = 1,
}) => (
  <path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth={w}
    strokeLinecap={cap}
    strokeLinejoin="round"
    pathLength={len}
    strokeDasharray={len}
    strokeDashoffset={len * (1 - clamp(k))}
    opacity={k > 0 ? opacity : 0}
  />
);

export const CheckBadge: React.FC<{k: number; size?: number; color?: string}> = ({k, size = 64, color = C.teal}) => {
  const s = clamp(k * 1.6);
  const pop = k <= 0 ? 0 : Math.min(1.2, 1 - Math.exp(-9 * k) * Math.cos(12 * k));
  return (
    <div style={{width: size, height: size, transform: `scale(${pop})`, opacity: k > 0 ? 1 : 0}}>
      <svg width={size} height={size} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={29} fill={color} />
        <Draw d="M18 33 L28 43 L47 22" k={clamp((k - 0.15) * 2.2)} color="#0B0E12" w={7} len={100} />
        <circle cx={32} cy={32} r={29 + 14 * s} fill="none" stroke={color} strokeWidth={3} opacity={(1 - s) * 0.8} />
      </svg>
    </div>
  );
};

export const HouseIcon: React.FC<{size?: number; color?: string}> = ({size = 56, color = C.orange}) => (
  <svg width={size} height={size} viewBox="0 0 56 56">
    <path d="M8 26 L28 9 L48 26" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 24 V46 H42 V24" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
    <rect x={24} y={32} width={8} height={14} rx={2} fill={color} />
  </svg>
);

export const SchoolIcon: React.FC<{size?: number; color?: string}> = ({size = 56, color = C.teal}) => (
  <svg width={size} height={size} viewBox="0 0 56 56">
    <path d="M6 22 L28 10 L50 22" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 24 V46 H46 V24" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
    <path d="M19 30 V40 M28 30 V40 M37 30 V40" stroke={color} strokeWidth={4} strokeLinecap="round" />
    <path d="M28 10 V2 H38 V7 H28" fill={color} stroke={color} strokeWidth={2} />
  </svg>
);

export const CarIcon: React.FC<{size?: number; color?: string}> = ({size = 40, color = C.yellow}) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 60 36">
    <path d="M6 22 Q6 14 14 14 L20 6 H40 L48 14 Q56 14 56 22 V28 H6 Z" fill={color} />
    <circle cx={17} cy={29} r={6} fill="#0B0E12" stroke={color} strokeWidth={2} />
    <circle cx={45} cy={29} r={6} fill="#0B0E12" stroke={color} strokeWidth={2} />
    <path d="M23 9 H38 L43 14 H19 Z" fill="#0B0E12" opacity={0.5} />
  </svg>
);

/** arrow pointing left (RTL "forward") drawn as stroke */
export const ArrowL: React.FC<{w: number; k: number; color?: string; thick?: number}> = ({w, k, color = C.text, thick = 8}) => {
  const h = thick * 5;
  const head = clamp((k - 0.75) * 4);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{overflow: 'visible'}}>
      <line x1={w - thick} y1={h / 2} x2={w - thick - (w - thick * 2) * clamp(k / 0.8)} y2={h / 2} stroke={color} strokeWidth={thick} strokeLinecap="round" opacity={k > 0.01 ? 1 : 0} />
      <path
        d={`M ${thick + h * 0.45} ${h / 2 - h * 0.42} L ${thick} ${h / 2} L ${thick + h * 0.45} ${h / 2 + h * 0.42}`}
        fill="none"
        stroke={color}
        strokeWidth={thick}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={head > 0 ? 1 : 0}
        transform={`translate(${(1 - easeOutCubic(head)) * 30} 0)`}
      />
    </svg>
  );
};

// ---------------------------------------------------------------- brand
/** «منهجي» mark: rounded square with three rising steps and a dot (method -> result) */
export const LogoMark: React.FC<{size?: number; k?: number}> = ({size = 120, k = 1}) => {
  const st = (i: number) => clamp((k - i * 0.12) * 2.2);
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2EE6D6" />
          <stop offset="1" stopColor="#0FA89C" />
        </linearGradient>
      </defs>
      <rect x={6} y={6} width={108} height={108} rx={30} fill="url(#lm)" transform={`rotate(${(1 - clamp(k * 1.5)) * -90} 60 60) scale(${clamp(k * 1.5)})`} style={{transformOrigin: '60px 60px'}} />
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={84 - i * 24}
          y={78 - i * 18 - 8}
          width={16}
          height={(26 + i * 18) * st(i + 1)}
          rx={5}
          fill="#0B0E12"
          transform={`translate(0 ${(26 + i * 18) * (1 - st(i + 1))})`}
        />
      ))}
      <circle cx={36} cy={32} r={9 * clamp((k - 0.5) * 3)} fill={C.yellow} />
    </svg>
  );
};

export const Wordmark: React.FC<{size?: number; color?: string}> = ({size = 64, color = C.text}) => (
  <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: size, color, direction: 'rtl', lineHeight: 1.25, letterSpacing: 0}}>منهجي</div>
);

export const BrandBug: React.FC<{a: number; scale?: number; color?: string}> = ({a, scale = 1, color = C.text}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 14 * scale, opacity: a, direction: 'rtl'}}>
    <LogoMark size={54 * scale} />
    <Wordmark size={30 * scale} color={color} />
  </div>
);

// ---------------------------------------------------------------- big type
export const Pill: React.FC<{children: React.ReactNode; color?: string; bg?: string; size?: number; style?: React.CSSProperties}> = ({
  children,
  color = '#0B0E12',
  bg = C.yellow,
  size = 40,
  style,
}) => (
  <div
    style={{
      fontFamily: F.kufi,
      fontWeight: 800,
      fontSize: size,
      color,
      background: bg,
      padding: `${size * 0.12}px ${size * 0.55}px ${size * 0.26}px`,
      borderRadius: size * 0.45,
      direction: 'rtl',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);
