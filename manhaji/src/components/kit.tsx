import React from 'react';
import {C, FALSE_C, FONT_BODY, FONT_HEAD, TRUE_C} from '../theme';
import {clamp} from '../lib/anim';

type XY = {x: number; y: number};

/** Soft additive light pool */
export const Glow: React.FC<XY & {r: number; color: string; o: number}> = ({x, y, r, color, o}) =>
  o <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, ${color}55 28%, transparent 68%)`,
        opacity: o,
        pointerEvents: 'none',
      }}
    />
  );

/** Pendant studio lamp. on: 0..1 */
export const Lamp: React.FC<XY & {on: number; cord?: number; scale?: number; id: string; cone?: boolean}> = ({
  x,
  y,
  on,
  cord = 220,
  scale = 1,
  id,
  cone = true,
}) => {
  const warm = `rgba(255, 214, 140, ${0.25 + on * 0.75})`;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      {cone && on > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: -230,
            top: 40,
            width: 460,
            height: 560,
            clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
            background: `linear-gradient(to bottom, rgba(255,210,140,${0.26 * on}), rgba(255,210,140,0) 85%)`,
          }}
        />
      ) : null}
      <Glow x={0} y={36} r={210} color={C.amber} o={on * 0.85} />
      <svg width={160} height={cord + 120} viewBox={`-80 ${-cord} 160 ${cord + 120}`} style={{position: 'absolute', left: -80, top: -cord, overflow: 'visible'}}>
        <defs>
          <radialGradient id={`bulb-${id}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={on > 0.05 ? '#FFFDF5' : '#2A3D52'} />
            <stop offset="55%" stopColor={on > 0.05 ? warm : '#1A2B3D'} />
            <stop offset="100%" stopColor={on > 0.05 ? `rgba(255,170,80,${0.5 * on})` : '#132232'} />
          </radialGradient>
        </defs>
        <line x1={0} y1={-cord} x2={0} y2={-6} stroke="#28445F" strokeWidth={4} />
        <path d="M -26 -8 L 26 -8 L 20 14 L -20 14 Z" fill="#1E3349" stroke="#35587A" strokeWidth={2} />
        <path d="M -20 14 C -46 34 -40 78 0 84 C 40 78 46 34 20 14 Z" fill={`url(#bulb-${id})`} stroke={on > 0.05 ? 'rgba(255,230,180,0.9)' : '#2E4A66'} strokeWidth={2.5} />
        <path d="M -8 30 Q 0 46 8 30" stroke={on > 0.05 ? '#FFB347' : '#3A5671'} strokeWidth={2.5} fill="none" />
      </svg>
    </div>
  );
};

/** Backup battery */
export const Battery: React.FC<XY & {level: number; active: number; scale?: number}> = ({x, y, level, active, scale = 1}) => {
  const bars = 4;
  return (
    <div style={{position: 'absolute', left: x - 70 * scale, top: y - 110 * scale, width: 140, height: 220, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
      <Glow x={70} y={110} r={170} color={C.turq} o={active * 0.55} />
      <svg width={140} height={220} viewBox="0 0 140 220" style={{position: 'absolute', overflow: 'visible'}}>
        <rect x={48} y={2} width={44} height={20} rx={6} fill={active > 0.1 ? C.turq : '#2B4560'} />
        <rect x={10} y={20} width={120} height={196} rx={22} fill="#0C1C2D" stroke={active > 0.1 ? C.turq : '#2B4560'} strokeWidth={6} />
        {Array.from({length: bars}).map((_, i) => {
          const filled = level * bars > i;
          return (
            <rect
              key={i}
              x={26}
              y={180 - i * 42}
              width={88}
              height={30}
              rx={8}
              fill={filled ? C.turq : '#15293D'}
              opacity={filled ? 0.35 + active * 0.65 : 1}
            />
          );
        })}
        <path d="M 78 52 L 56 104 L 74 104 L 62 150 L 92 92 L 72 92 L 84 52 Z" fill={C.warm} opacity={0.9} transform="translate(0,6)" />
      </svg>
    </div>
  );
};

/** Wall power / grid source. alive: 0..1 */
export const PowerSource: React.FC<XY & {alive: number; scale?: number; dead?: number}> = ({x, y, alive, scale = 1, dead = 0}) => (
  <div style={{position: 'absolute', left: x - 75 * scale, top: y - 75 * scale, width: 150, height: 150, transform: `scale(${scale})`, transformOrigin: '0 0'}}>
    <Glow x={75} y={75} r={170} color={C.sky} o={alive * 0.6} />
    <svg width={150} height={150} viewBox="0 0 150 150" style={{position: 'absolute', overflow: 'visible'}}>
      <rect x={6} y={6} width={138} height={138} rx={34} fill="#0C1C2D" stroke={alive > 0.1 ? C.sky : '#2B4560'} strokeWidth={6} />
      <circle cx={75} cy={75} r={44} fill="#0A1726" stroke={alive > 0.1 ? C.sky : '#2B4560'} strokeWidth={4} />
      <rect x={55} y={56} width={10} height={26} rx={4} fill={alive > 0.1 ? C.sky : '#2B4560'} />
      <rect x={85} y={56} width={10} height={26} rx={4} fill={alive > 0.1 ? C.sky : '#2B4560'} />
      <circle cx={75} cy={98} r={6} fill={alive > 0.1 ? C.sky : '#2B4560'} />
      {dead > 0 ? (
        <g opacity={dead} transform="translate(118,22)">
          <circle r={24} fill={FALSE_C} />
          <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
    </svg>
  </div>
);

/** A wire with optional flowing current. draw: 0..1 reveal; live: 0..1 current */
export const Wire: React.FC<{d: string; t: number; live: number; draw?: number; color?: string; width?: number; len?: number; speed?: number; dim?: number}> = ({
  d,
  t,
  live,
  draw = 1,
  color = C.cyan,
  width = 7,
  len = 2400,
  speed = 160,
  dim = 1,
}) => (
  <g>
    <path d={d} fill="none" stroke="#1B3550" strokeWidth={width + 4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} opacity={dim} />
    {live > 0.01 ? (
      <>
        <path d={d} fill="none" stroke={color} strokeWidth={width + 14} strokeLinecap="round" strokeLinejoin="round" opacity={0.16 * live} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <path d={d} fill="none" stroke={color} strokeWidth={width - 1} strokeLinecap="round" strokeLinejoin="round" opacity={0.55 * live} strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
        <path
          d={d}
          fill="none"
          stroke="#E9FDFF"
          strokeWidth={width - 2}
          strokeLinecap="round"
          strokeDasharray="10 34"
          strokeDashoffset={-t * speed}
          opacity={live * clamp(draw * 3 - 2)}
        />
      </>
    ) : null}
  </g>
);

/** Glass pill / label */
export const Chip: React.FC<
  XY & {text: string; color?: string; size?: number; o?: number; s?: number; weight?: number; bg?: string; glow?: number; pad?: [number, number]; font?: string}
> = ({x, y, text, color = C.warm, size = 44, o = 1, s = 1, weight = 800, bg = 'rgba(8,24,40,0.78)', glow = 0, pad = [14, 34], font = FONT_HEAD}) =>
  o <= 0.001 ? null : (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: o,
        padding: `${pad[0]}px ${pad[1]}px`,
        borderRadius: 999,
        background: bg,
        border: `2.5px solid ${color}`,
        color,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.25,
        whiteSpace: 'nowrap',
        boxShadow: `0 0 ${10 + glow * 40}px ${color}${glow > 0 ? '88' : '33'}, inset 0 0 18px ${color}22`,
        backdropFilter: 'none',
      }}
    >
      {text}
    </div>
  );

/** Big kinetic word with extruded depth */
export const BigWord: React.FC<XY & {text: string; size: number; color?: string; o?: number; s?: number; depth?: number; ls?: number; font?: string}> = ({
  x,
  y,
  text,
  size,
  color = C.warm,
  o = 1,
  s = 1,
  depth = 10,
  ls = 0,
  font = FONT_HEAD,
}) =>
  o <= 0.001 ? null : (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        opacity: o,
        fontFamily: font,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1.1,
        color,
        letterSpacing: ls,
        whiteSpace: 'nowrap',
        textShadow: [
          ...Array.from({length: depth}).map((_, i) => `0 ${i + 1}px 0 rgba(4, 30, 52, ${0.9 - i * 0.05})`),
          `0 ${depth + 6}px 30px rgba(0,0,0,0.6)`,
          `0 0 40px ${color}55`,
        ].join(','),
      }}
    >
      {text}
    </div>
  );

/** T / F verdict badge */
export const Verdict: React.FC<XY & {v: 'T' | 'F'; s?: number; o?: number; size?: number}> = ({x, y, v, s = 1, o = 1, size = 96}) => {
  const col = v === 'T' ? TRUE_C : FALSE_C;
  return o <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size * 0.3,
        transform: `scale(${s})`,
        opacity: o,
        background: `linear-gradient(160deg, ${col}, ${col}AA)`,
        boxShadow: `0 0 40px ${col}88, 0 12px 30px rgba(0,0,0,0.5)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT_HEAD,
        fontWeight: 900,
        fontSize: size * 0.62,
        color: C.ink,
      }}
    >
      {v}
    </div>
  );
};

/** Statement card */
export const StatementCard: React.FC<
  XY & {text: string; icon: 'plug' | 'battery' | 'lines'; o?: number; s?: number; rot?: number; accent?: string; width?: number; size?: number}
> = ({x, y, text, icon, o = 1, s = 1, rot = 0, accent = C.sky, width = 560, size = 46}) =>
  o <= 0.001 ? null : (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        opacity: o,
        padding: '26px 30px',
        borderRadius: 28,
        background: 'linear-gradient(160deg, rgba(20,48,74,0.96), rgba(9,25,42,0.96))',
        border: `2.5px solid ${accent}AA`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.55), 0 0 30px ${accent}33`,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        color: C.warm,
        fontFamily: FONT_HEAD,
        fontWeight: 800,
        fontSize: size,
      }}
    >
      <Icon kind={icon} color={accent} />
      <div style={{flex: 1, lineHeight: 1.25}}>{text}</div>
    </div>
  );

export const Icon: React.FC<{kind: 'plug' | 'battery' | 'lines'; color: string; size?: number}> = ({kind, color, size = 64}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{flex: 'none'}}>
    <rect x={2} y={2} width={60} height={60} rx={18} fill={`${color}22`} stroke={color} strokeWidth={3} />
    {kind === 'plug' ? (
      <g fill={color}>
        <rect x={22} y={14} width={6} height={14} rx={2} />
        <rect x={36} y={14} width={6} height={14} rx={2} />
        <path d="M 16 28 H 48 V 34 C 48 42 42 46 35 46 V 52 H 29 V 46 C 22 46 16 42 16 34 Z" />
      </g>
    ) : kind === 'battery' ? (
      <g>
        <rect x={16} y={18} width={32} height={34} rx={6} fill="none" stroke={color} strokeWidth={3.5} />
        <rect x={26} y={12} width={12} height={6} rx={2} fill={color} />
        <path d="M 34 22 L 26 36 H 32 L 29 47 L 39 32 H 33 L 36 22 Z" fill={color} />
      </g>
    ) : (
      <g stroke={color} strokeWidth={4} strokeLinecap="round">
        <line x1={16} y1={22} x2={48} y2={22} />
        <line x1={16} y1={32} x2={48} y2={32} />
        <line x1={24} y1={42} x2={48} y2={42} />
      </g>
    )}
  </svg>
);

/** small dim caption-like label used inside scenes */
export const Label: React.FC<XY & {text: string; o?: number; size?: number; color?: string; w?: number}> = ({x, y, text, o = 1, size = 32, color = C.dim, w = 700}) =>
  o <= 0.001 ? null : (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%,-50%)',
        opacity: o,
        fontFamily: FONT_BODY,
        fontWeight: 600,
        fontSize: size,
        color,
        width: w,
        textAlign: 'center',
        lineHeight: 1.45,
      }}
    >
      {text}
    </div>
  );
