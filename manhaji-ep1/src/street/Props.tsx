import React from 'react';
import {Img, staticFile} from 'remotion';
import {C, F} from '../theme';
import {rand} from '../time';

const A = {
  side: staticFile('assets/car_side.png'),
  rear: staticFile('assets/car_rear.png'),
  front: staticFile('assets/car_front.png'),
  house: staticFile('assets/house.png'),
  road: staticFile('assets/road.png'),
};
export const ASSET = A;
export const SIZE = {
  side: {w: 1210, h: 460},
  rear: {w: 1193, h: 628},
  front: {w: 1036, h: 828},
  house: {w: 1536, h: 1024},
  road: {w: 1959, h: 803},
};

/** morning sky with a low sun and drifting clouds (fills its parent) */
export const Sky: React.FC<{t: number; sunX?: string; sunY?: string}> = ({t, sunX = '82%', sunY = '18%'}) => (
  <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(to bottom, #9ED2EA 0%, #CBE7F1 45%, #F6EAD6 78%, #F9E4C8 100%)'}}>
    <div style={{position: 'absolute', left: sunX, top: sunY, width: 900, height: 900, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(255,246,214,1) 0%, rgba(255,226,160,0.55) 12%, rgba(255,214,150,0.18) 35%, transparent 65%)'}} />
    {[0, 1, 2, 3, 4].map((i) => {
      const x = ((rand(i * 4) * 120 + t * (6 + i * 2)) % 140) - 20;
      const y = 6 + rand(i * 7) * 30;
      const s = 0.6 + rand(i * 9) * 0.8;
      return (
        <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `scale(${s})`, opacity: 0.85, filter: 'blur(2px)'}}>
          <div style={{position: 'absolute', width: 260, height: 70, borderRadius: 40, background: 'rgba(255,255,255,0.85)'}} />
          <div style={{position: 'absolute', left: 50, top: -40, width: 120, height: 100, borderRadius: 60, background: 'rgba(255,255,255,0.85)'}} />
          <div style={{position: 'absolute', left: 130, top: -22, width: 90, height: 80, borderRadius: 45, background: 'rgba(255,255,255,0.8)'}} />
        </div>
      );
    })}
  </div>
);

/** round bushy tree in the style of the street render (shaded with gradients) */
export const Tree: React.FC<{size: number; seed?: number; style?: React.CSSProperties}> = ({size, seed = 0, style}) => {
  const blobs = [
    [0, -0.62, 0.42],
    [-0.28, -0.5, 0.3],
    [0.28, -0.52, 0.31],
    [-0.12, -0.8, 0.28],
    [0.16, -0.78, 0.27],
  ];
  const id = `tr${seed}`;
  return (
    <svg width={size} height={size * 1.15} viewBox="-0.6 -1.1 1.2 1.15" style={{overflow: 'visible', ...style}}>
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#A8D86A" />
          <stop offset="0.45" stopColor="#5E9E3A" />
          <stop offset="1" stopColor="#2F6424" />
        </radialGradient>
      </defs>
      <ellipse cx={0.08} cy={0.02} rx={0.42} ry={0.07} fill="rgba(40,50,30,0.25)" />
      <path d="M -0.035 0 L -0.02 -0.45 L 0.02 -0.45 L 0.035 0 Z" fill="#6B4A2F" />
      {blobs.map(([x, y, r], i) => (
        <circle key={i} cx={x + (rand(seed + i) - 0.5) * 0.05} cy={y} r={r} fill={`url(#${id})`} />
      ))}
      {Array.from({length: 14}).map((_, i) => (
        <circle key={`l${i}`} cx={(rand(seed * 3 + i) - 0.5) * 0.7} cy={-0.45 - rand(seed * 5 + i) * 0.55} r={0.035 + rand(i + seed) * 0.03} fill="rgba(200,240,140,0.35)" />
      ))}
    </svg>
  );
};

export const Lamp: React.FC<{h: number; style?: React.CSSProperties}> = ({h, style}) => (
  <svg width={h * 0.25} height={h} viewBox="0 0 25 100" style={style}>
    <rect x={11} y={8} width={3} height={92} fill="#2E3238" />
    <path d="M 12.5 8 Q 12.5 2 20 2 L 22 2" stroke="#2E3238" strokeWidth={3} fill="none" />
    <rect x={18} y={2} width={7} height={4} rx={1.5} fill="#2E3238" />
    <rect x={8} y={96} width={9} height={4} fill="#2E3238" />
  </svg>
);

/** modern school building in 3/4 view, warm beige to match the villa render */
export const School: React.FC<{w: number; label?: boolean}> = ({w, label = true}) => (
  <svg width={w} height={w * 0.72} viewBox="0 0 500 360" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id="scF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F1E4CF" />
        <stop offset="1" stopColor="#E2CFAF" />
      </linearGradient>
      <linearGradient id="scS" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#CDB693" />
        <stop offset="1" stopColor="#B99F7A" />
      </linearGradient>
      <linearGradient id="scW" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE7A8" />
        <stop offset="1" stopColor="#F5B860" />
      </linearGradient>
    </defs>
    {/* ground plate */}
    <path d="M 0 330 L 400 330 L 500 290 L 110 290 Z" fill="#D9CDBA" />
    <path d="M 0 330 L 400 330 L 400 345 L 0 345 Z" fill="#C2B49E" />
    <path d="M 400 330 L 500 290 L 500 305 L 400 345 Z" fill="#AE9F88" />
    {/* side wall */}
    <path d="M 400 320 L 470 292 L 470 90 L 400 118 Z" fill="url(#scS)" />
    {/* roof */}
    <path d="M 22 118 L 400 118 L 470 90 L 92 90 Z" fill="#E9DDC9" />
    <path d="M 22 118 L 400 118 L 400 128 L 22 128 Z" fill="#D5C3A6" />
    {/* front wall */}
    <rect x={22} y={124} width={378} height={196} fill="url(#scF)" />
    {/* teal band */}
    <rect x={22} y={124} width={378} height={16} fill={C.teal} />
    <path d="M 400 118 L 470 90 L 470 104 L 400 132 Z" fill="#139C92" />
    {/* windows */}
    {[0, 1].map((r) =>
      Array.from({length: 6}).map((_, i) => {
        if (r === 1 && (i === 2 || i === 3)) return null;
        return <rect key={`${r}${i}`} x={40 + i * 58} y={158 + r * 74} width={42} height={46} rx={3} fill="url(#scW)" stroke="#3A3026" strokeWidth={3} />;
      }),
    )}
    {/* entrance */}
    <rect x={172} y={238} width={78} height={82} fill="#5B3A22" />
    <rect x={208} y={238} width={4} height={82} fill="#3B2615" />
    <path d="M 150 232 L 272 232 L 290 222 L 168 222 Z" fill="#E9DDC9" />
    <rect x={150} y={232} width={122} height={8} fill="#CDB693" />
    {/* side windows */}
    {[0, 1].map((r) => (
      <path key={r} d={`M 420 ${168 + r * 74} L 452 ${155 + r * 74} L 452 ${197 + r * 74} L 420 ${210 + r * 74} Z`} fill="url(#scW)" stroke="#3A3026" strokeWidth={3} />
    ))}
    {/* flag */}
    <rect x={455} y={10} width={4} height={290} fill="#9AA3AC" />
    <path d="M 459 14 L 500 22 L 459 34 Z" fill={C.teal} />
    {/* bushes */}
    {[30, 90, 300, 360].map((x, i) => (
      <ellipse key={i} cx={x} cy={322} rx={24} ry={14} fill={i % 2 ? '#4E8F35' : '#5FA040'} />
    ))}
    {label && (
      <g>
        <rect x={110} y={52} width={200} height={50} rx={12} fill="#F7F1E6" stroke={C.tealDeep} strokeWidth={4} />
        <text x={210} y={87} textAnchor="middle" fontFamily={F.kufi} fontWeight={800} fontSize={30} fill={C.tealDeep} direction="rtl">
          مدرسة
        </text>
      </g>
    )}
  </svg>
);

/** multiply-tint a white car sprite (keeps the shading) */
const Tint: React.FC<{src: string; color?: string; w: number; h: number}> = ({src, color, w, h}) =>
  color ? (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: w,
        height: h,
        background: color,
        mixBlendMode: 'multiply',
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: '100% 100%',
      }}
    />
  ) : null;

const Glow: React.FC<{x: number; y: number; r: number; color: string; a: number}> = ({x, y, r, color, a}) =>
  a > 0.01 ? (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, ${color}88 30%, transparent 70%)`,
        opacity: a,
        mixBlendMode: 'screen',
      }}
    />
  ) : null;

/** side view facing left; x,y = bottom-centre; spin = wheel angle in degrees */
export const CarSide: React.FC<{x: number; y: number; w: number; spin?: number; brake?: number; tint?: string; bob?: number}> = ({x, y, w, spin = 0, brake = 0, tint, bob = 0}) => {
  const k = w / SIZE.side.w;
  const h = SIZE.side.h * k;
  const wheel = (cx: number) => {
    const r = 66 * k;
    return (
      <div key={cx} style={{position: 'absolute', left: cx * k - r, top: 357 * k - r, width: r * 2, height: r * 2, borderRadius: '50%', overflow: 'hidden'}}>
        <Img
          src={A.side}
          style={{position: 'absolute', left: -(cx * k - r), top: -(357 * k - r), width: w, height: h, transform: `rotate(${spin}deg)`, transformOrigin: `${cx * k}px ${357 * k}px`}}
        />
      </div>
    );
  };
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h}}>
      <div style={{position: 'absolute', left: w * 0.04, right: w * 0.04, bottom: -h * 0.06, height: h * 0.16, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(30,30,30,0.45), transparent 70%)'}} />
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${bob}px)`}}>
        <Img src={A.side} style={{position: 'absolute', inset: 0, width: w, height: h}} />
        <Tint src={A.side} color={tint} w={w} h={h} />
      </div>
      {wheel(235)}
      {wheel(982)}
      <Glow x={1150 * k} y={178 * k + bob} r={70 * k} color="#FF3030" a={brake} />
    </div>
  );
};

/** rear three-quarter view; x,y = bottom-centre */
export const CarRear: React.FC<{x: number; y: number; w: number; brake?: number; tint?: string; rot?: number}> = ({x, y, w, brake = 0, tint, rot = 0}) => {
  const k = w / SIZE.rear.w;
  const h = SIZE.rear.h * k;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, transform: `rotate(${rot}deg)`, transformOrigin: '50% 100%'}}>
      <div style={{position: 'absolute', left: w * 0.02, right: w * 0.06, bottom: -h * 0.04, height: h * 0.14, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(30,30,30,0.45), transparent 70%)'}} />
      <Img src={A.rear} style={{position: 'absolute', inset: 0, width: w, height: h}} />
      <Tint src={A.rear} color={tint} w={w} h={h} />
      <Glow x={78 * k} y={240 * k} r={110 * k} color="#FF2A2A" a={brake} />
      <Glow x={470 * k} y={247 * k} r={110 * k} color="#FF2A2A" a={brake} />
    </div>
  );
};

/** front view; hazard = 0..1 blinker intensity */
export const CarFront: React.FC<{x: number; y: number; w: number; hazard?: number; lights?: number}> = ({x, y, w, hazard = 0, lights = 0}) => {
  const k = w / SIZE.front.w;
  const h = SIZE.front.h * k;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h}}>
      <div style={{position: 'absolute', left: w * 0.02, right: w * 0.02, bottom: -h * 0.04, height: h * 0.1, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(30,30,30,0.5), transparent 70%)'}} />
      <Img src={A.front} style={{position: 'absolute', inset: 0, width: w, height: h}} />
      <Glow x={130 * k} y={410 * k} r={120 * k} color="#EAF6FF" a={lights} />
      <Glow x={884 * k} y={410 * k} r={120 * k} color="#EAF6FF" a={lights} />
      <Glow x={70 * k} y={395 * k} r={150 * k} color="#FFA020" a={hazard} />
      <Glow x={966 * k} y={395 * k} r={150 * k} color="#FFA020" a={hazard} />
    </div>
  );
};

export const Warning: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size * 0.9} viewBox="0 0 120 108">
    <path d="M60 6 L114 100 L6 100 Z" fill={C.orange} stroke="#1A1206" strokeWidth={6} strokeLinejoin="round" />
    <rect x={54} y={36} width={12} height={36} rx={6} fill="#1A1206" />
    <circle cx={60} cy={84} r={7} fill="#1A1206" />
  </svg>
);

export const Cone: React.FC<{h: number}> = ({h}) => (
  <svg width={h * 0.7} height={h} viewBox="0 0 70 100">
    <path d="M 25 8 L 45 8 L 60 88 L 10 88 Z" fill="#FF7A1A" />
    <path d="M 21 32 L 49 32 L 52 48 L 18 48 Z" fill="#FFFFFF" />
    <path d="M 15 62 L 55 62 L 57 74 L 13 74 Z" fill="#FFFFFF" />
    <rect x={0} y={86} width={70} height={12} rx={3} fill="#E25F0A" />
  </svg>
);
