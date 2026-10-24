import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, rand} from '../time';

export const P = {
  paper: '#F4F0E8',
  paper2: '#EAE3D6',
  ink: '#151B23',
  inkSoft: '#5E6A78',
  teal: '#14B8AC',
  tealDeep: '#0B8379',
  orange: '#FF7A2F',
  yellow: '#FFC845',
  red: '#E5484D',
  brass: '#E2A93B',
  white: '#FFFFFF',
};

/** warm paper world: gradient, parallax colour blobs, dot grid and grain */
export const World: React.FC<{t: number; cam?: {x: number; y: number; s: number}; tint?: string}> = ({t, cam = {x: 0, y: 0, s: 1}, tint = P.teal}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, #FFFDF8 0%, ${P.paper} 55%, ${P.paper2} 100%)`, overflow: 'hidden'}}>
    {[0, 1, 2].map((i) => {
      const f = 0.15 + i * 0.12;
      const x = [18, 80, 40][i] + Math.sin(t * 0.25 + i) * 3;
      const y = [22, 58, 88][i] + Math.cos(t * 0.2 + i * 2) * 2;
      const col = [tint, P.orange, P.yellow][i];
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: 900,
            height: 900,
            transform: `translate(-50%,-50%) translate(${-cam.x * f}px, ${-cam.y * f}px) scale(${1 + (cam.s - 1) * f})`,
            background: `radial-gradient(circle, ${col}2E 0%, ${col}12 40%, transparent 70%)`,
          }}
        />
      );
    })}
    <AbsoluteFill
      style={{
        backgroundImage: 'radial-gradient(rgba(21,27,35,0.11) 2px, transparent 2.5px)',
        backgroundSize: '54px 54px',
        backgroundPosition: `${-cam.x * 0.35}px ${-cam.y * 0.35}px`,
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, #000 15%, transparent 75%)',
        opacity: 0.8,
      }}
    />
    <Grain seed={Math.floor(t * 12)} />
  </AbsoluteFill>
);

export const Grain: React.FC<{seed: number; opacity?: number}> = ({seed, opacity = 0.07}) => (
  <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'multiply', pointerEvents: 'none'}}>
    <filter id={`gr${seed % 4}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed % 4} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#gr${seed % 4})`} />
  </svg>
);

/** smart school bell: brass dome, hammer, wall plate with LED ring + display */
export const Bell: React.FC<{
  size: number;
  ring?: number; // 0..1 ringing intensity
  t: number;
  led?: number; // 0..1 LED glow
  screen?: React.ReactNode;
}> = ({size, ring = 0, t, led = 0, screen}) => {
  const wob = ring * Math.sin(t * 60) * 7;
  const ham = ring * Math.sin(t * 60) * 16;
  return (
    <div style={{position: 'relative', width: size, height: size * 1.15}}>
      <svg width={size} height={size * 1.15} viewBox="0 0 400 460" style={{overflow: 'visible', position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="plate" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#DCD6CB" />
          </linearGradient>
          <radialGradient id="dome" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#FFF1C2" />
            <stop offset="0.35" stopColor="#F2C35A" />
            <stop offset="0.75" stopColor={P.brass} />
            <stop offset="1" stopColor="#9C6A16" />
          </radialGradient>
          <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="22" stdDeviation="20" floodColor="#5A4A30" floodOpacity="0.28" />
          </filter>
        </defs>
        {/* wall plate */}
        <rect x={70} y={250} width={260} height={190} rx={40} fill="url(#plate)" filter="url(#soft)" />
        <rect x={70} y={250} width={260} height={190} rx={40} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
        {/* LED ring */}
        <circle cx={200} cy={250} r={64} fill="none" stroke={P.teal} strokeWidth={10} opacity={0.25 + 0.75 * led} />
        {led > 0 && <circle cx={200} cy={250} r={64} fill="none" stroke={P.teal} strokeWidth={26} opacity={0.35 * led} style={{filter: 'blur(10px)'}} />}
        {/* bracket */}
        <rect x={188} y={190} width={24} height={70} rx={8} fill="#3A3F47" />
        {/* dome */}
        <g transform={`rotate(${wob} 200 120)`} filter="url(#soft)">
          <path d="M 70 210 Q 70 40 200 40 Q 330 40 330 210 Z" fill="url(#dome)" />
          <ellipse cx={200} cy={210} rx={130} ry={22} fill="#B07C1F" />
          <ellipse cx={200} cy={206} rx={124} ry={16} fill="#7A520F" />
          <ellipse cx={150} cy={95} rx={30} ry={46} fill="rgba(255,255,255,0.35)" transform="rotate(-25 150 95)" />
          <circle cx={200} cy={40} r={14} fill="#C9922D" />
        </g>
        {/* hammer */}
        <g transform={`rotate(${ham} 200 232)`}>
          <rect x={196} y={190} width={8} height={44} rx={4} fill="#2C3138" />
          <circle cx={200} cy={190} r={13} fill="#2C3138" />
        </g>
      </svg>
      {/* display on the plate */}
      <div
        style={{
          position: 'absolute',
          left: (110 / 400) * size,
          top: (330 / 460) * size * 1.15,
          width: (180 / 400) * size,
          height: (80 / 460) * size * 1.15,
          borderRadius: (14 / 400) * size,
          background: '#141A21',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {screen}
      </div>
    </div>
  );
};

/** sound waves around the bell */
export const Waves: React.FC<{t: number; k: number; r0: number; color?: string}> = ({t, k, r0, color = P.orange}) =>
  k > 0.01 ? (
    <svg width={r0 * 6} height={r0 * 6} viewBox={`${-r0 * 3} ${-r0 * 3} ${r0 * 6} ${r0 * 6}`} style={{position: 'absolute', left: -r0 * 3, top: -r0 * 3, overflow: 'visible', pointerEvents: 'none'}}>
      {[0, 1, 2].map((i) => {
        const ph = (t * 1.6 + i / 3) % 1;
        const r = r0 * (1 + ph * 1.6);
        return (
          <g key={i} opacity={(1 - ph) * k}>
            <path d={`M ${-r * 0.92} ${-r * 0.4} A ${r} ${r} 0 0 1 ${-r * 0.92} ${r * 0.4}`} transform="scale(-1,1)" fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
            <path d={`M ${-r * 0.92} ${-r * 0.4} A ${r} ${r} 0 0 1 ${-r * 0.92} ${r * 0.4}`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
          </g>
        );
      })}
    </svg>
  ) : null;

/** wall push-button on a plate; press = 0..1 depression */
export const Button: React.FC<{size: number; press?: number; glow?: number; off?: number}> = ({size, press = 0, glow = 0, off = 0}) => (
  <svg width={size} height={size} viewBox="0 0 300 300" style={{overflow: 'visible'}}>
    <defs>
      <radialGradient id="btn" cx="40%" cy="35%" r="70%">
        <stop offset="0" stopColor={off ? '#B8C0C4' : '#6FF0E3'} />
        <stop offset="0.6" stopColor={off ? '#8E979C' : P.teal} />
        <stop offset="1" stopColor={off ? '#6B7378' : P.tealDeep} />
      </radialGradient>
      <filter id="bsoft" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#5A4A30" floodOpacity="0.28" />
      </filter>
    </defs>
    <rect x={20} y={20} width={260} height={260} rx={56} fill="#FBF9F4" filter="url(#bsoft)" />
    <rect x={20} y={20} width={260} height={260} rx={56} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={3} />
    <circle cx={150} cy={160} r={88} fill="#D9D2C5" />
    {glow > 0 && <circle cx={150} cy={150} r={110} fill={P.teal} opacity={0.35 * glow} style={{filter: 'blur(16px)'}} />}
    <circle cx={150} cy={150 + 12 * press} r={80} fill="#0E6F67" />
    <circle cx={150} cy={142 + 14 * press} r={76} fill="url(#btn)" />
    <ellipse cx={128} cy={112 + 14 * press} rx={30} ry={16} fill="rgba(255,255,255,0.45)" />
  </svg>
);

/** stylised pointing hand (from the right) */
export const Hand: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size * 0.62} viewBox="0 0 400 250" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#E9B48C" />
        <stop offset="1" stopColor="#C98B62" />
      </linearGradient>
    </defs>
    <path d="M 400 70 L 230 70 Q 205 70 205 95 L 205 105 L 40 105 Q 10 105 10 128 Q 10 150 40 150 L 200 150 Q 205 200 245 205 L 400 205 Z" fill="url(#skin)" />
    <path d="M 205 105 L 205 150" stroke="rgba(120,70,40,0.35)" strokeWidth={4} />
    <path d="M 250 150 Q 275 150 300 158" stroke="rgba(120,70,40,0.3)" strokeWidth={4} fill="none" />
    <path d="M 400 60 L 330 60 L 330 215 L 400 215 Z" fill="#FFFFFF" />
    <path d="M 330 60 L 330 215" stroke="rgba(0,0,0,0.08)" strokeWidth={6} />
  </svg>
);

/** curved wire with a travelling pulse */
export const Wire: React.FC<{d: string; pulse: number; draw?: number; color?: string}> = ({d, pulse, draw = 1, color = P.teal}) => (
  <g>
    <path d={d} fill="none" stroke="#3A3F47" strokeWidth={10} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 * (1 - draw)} />
    {pulse > 0 && pulse < 1 && (
      <path d={d} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" pathLength={100} strokeDasharray="14 100" strokeDashoffset={-pulse * 100 + 7} style={{filter: `drop-shadow(0 0 12px ${color})`}} />
    )}
  </g>
);

export const shake = (t: number, t0: number, amp: number, decay = 10) => (t > t0 ? Math.exp(-(t - t0) * decay) * Math.sin((t - t0) * 70) * amp : 0);
export const seeded = rand;
export const k01 = clamp;
