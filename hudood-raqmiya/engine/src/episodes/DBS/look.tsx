import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {VIDEO} from '../../theme';

/**
 * «جندي على الحدود الرقمية» — visual identity: the investigation room after a digital incident.
 * Palette taken from the initiative's site (night navy, forensic blue, trusted green, lamp amber),
 * plus one incident red. No text anywhere: the story lives in light, shadow and objects.
 */
export const K = {
  bg: '#070d15',
  panel: '#0c1928',
  line: '#24435b',
  blue: '#78c4fc',
  green: '#74e3b0',
  amber: '#ffc387',
  red: '#ff5468',
  paper: '#d9e1ea',
  wall: '#0b121b',
  wood: '#0d1219',
} as const;

export const T = () => useCurrentFrame() / VIDEO.fps;

/** handheld investigator camera: tiny organic drift, never a wobble */
export const hand = (t: number, amt = 1) => ({
  x: (Math.sin(t * 0.9) * 5 + Math.sin(t * 2.3 + 1) * 2) * amt,
  y: (Math.cos(t * 0.7) * 4 + Math.sin(t * 1.9 + 2) * 2) * amt,
  r: (Math.sin(t * 0.5) * 0.35 + Math.sin(t * 1.3) * 0.12) * amt,
});

export const Cam: React.FC<{s?: number; x?: number; y?: number; r?: number; ox?: number; oy?: number; shake?: number; children: React.ReactNode}> = ({s = 1, x = 0, y = 0, r = 0, ox = 540, oy = 960, shake = 1, children}) => {
  const t = T();
  const h = hand(t, shake);
  return (
    <AbsoluteFill style={{transform: `translate(${x + h.x}px, ${y + h.y}px) rotate(${r + h.r}deg) scale(${s})`, transformOrigin: `${ox}px ${oy}px`}}>
      {children}
    </AbsoluteFill>
  );
};

/** soft light pool (screen blended) */
export const Glow: React.FC<{x: number; y: number; r: number; c: string; a?: number; sx?: number; sy?: number}> = ({x, y, r, c, a = 1, sx = 1, sy = 1}) => (
  <div style={{position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(closest-side, ${c}, transparent)`, opacity: a, transform: `scale(${sx}, ${sy})`, mixBlendMode: 'screen', pointerEvents: 'none'}} />
);

/** venetian-blind light: bright slats with hard-soft shadow between, sliding slowly (passing car lights) */
export const Blinds: React.FC<{a?: number; angle?: number; speed?: number; color?: string; gap?: number; offset?: number}> = ({a = 0.5, angle = -28, speed = 18, color = 'rgba(170,205,240,0.16)', gap = 120, offset = 0}) => {
  const t = T();
  const o = (t * speed + offset) % gap;
  return (
    <div style={{position: 'absolute', inset: -600, transform: `rotate(${angle}deg) translateY(${o}px)`, opacity: a, mixBlendMode: 'screen', pointerEvents: 'none', filter: 'blur(6px)', background: `repeating-linear-gradient(0deg, ${color} 0px, ${color} ${gap * 0.42}px, transparent ${gap * 0.52}px, transparent ${gap}px)`, maskImage: 'radial-gradient(60% 50% at 60% 40%, #000 30%, transparent 80%)', WebkitMaskImage: 'radial-gradient(60% 50% at 60% 40%, #000 30%, transparent 80%)'}} />
  );
};

/** dust motes floating in a beam */
export const Dust: React.FC<{n?: number; a?: number; c?: string; box?: [number, number, number, number]}> = ({n = 60, a = 1, c = '#dfe9f5', box = [0, 0, 1080, 1920]}) => {
  const t = T();
  const [x0, y0, w, h] = box;
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'screen', opacity: a, pointerEvents: 'none'}}>
      {Array.from({length: n}).map((_, i) => {
        const px = x0 + ((random(`dx${i}`) * w + Math.sin(t * 0.3 + i) * 30 + t * 6) % w);
        const py = y0 + ((random(`dy${i}`) * h - t * (8 + random(`ds${i}`) * 14) + h * 10) % h);
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + random(`dt${i}`)) + i));
        return <circle key={i} cx={px} cy={py} r={0.8 + random(`dr${i}`) * 2.2} fill={c} opacity={0.15 + 0.45 * tw * random(`do${i}`)} />;
      })}
    </svg>
  );
};

/** a volumetric cone of light (flashlight / lamp) from (x,y) toward a target pool */
export const Beam: React.FC<{x: number; y: number; tx: number; ty: number; w0?: number; w1?: number; c?: string; a?: number}> = ({x, y, tx, ty, w0 = 30, w1 = 380, c = 'rgba(200,225,255,0.22)', a = 1}) => {
  const ang = Math.atan2(ty - y, tx - x);
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const pts = [
    [x + nx * w0, y + ny * w0],
    [tx + nx * w1, ty + ny * w1],
    [tx - nx * w1, ty - ny * w1],
    [x - nx * w0, y - ny * w0],
  ].map((p) => p.join(',')).join(' ');
  const id = `bm${Math.round(x)}${Math.round(y)}`;
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'screen', opacity: a, pointerEvents: 'none'}}>
      <defs>
        <linearGradient id={id} x1={x} y1={y} x2={tx} y2={ty} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={c} />
          <stop offset="1" stopColor={c} stopOpacity={0.15} />
        </linearGradient>
        <filter id={`${id}f`}>
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>
      <polygon points={pts} fill={`url(#${id})`} filter={`url(#${id}f)`} />
    </svg>
  );
};

/** film finish: grain + vignette + slight lift of blacks toward navy */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{background: 'radial-gradient(75% 60% at 50% 48%, transparent 45%, rgba(0,0,0,0.78) 100%)', pointerEvents: 'none'}} />
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.09, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{background: 'rgba(16,40,70,0.08)', mixBlendMode: 'lighten', pointerEvents: 'none'}} />
    </>
  );
};

/** digital tear used on cuts: horizontal slices of the frame offset + RGB fringe */
export const Tear: React.FC<{k: number}> = ({k}) => {
  if (k <= 0.001) return null;
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {Array.from({length: 9}).map((_, i) => {
        const y = random(`ty${i}${f >> 1}`) * 1920;
        const h = 6 + random(`th${i}${f >> 1}`) * 60;
        const dx = (random(`tx${i}${f >> 1}`) - 0.5) * 140 * k;
        return (
          <div key={i} style={{position: 'absolute', left: dx, top: y, width: 1080, height: h, background: i % 3 === 0 ? `rgba(255,84,104,${0.35 * k})` : i % 3 === 1 ? `rgba(120,196,252,${0.3 * k})` : `rgba(255,255,255,${0.12 * k})`}} />
        );
      })}
    </AbsoluteFill>
  );
};
