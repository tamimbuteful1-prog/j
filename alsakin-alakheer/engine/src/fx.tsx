import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {VIDEO} from './theme';

/** camera for one shot: every <Layer> moves by its depth (parallax), so foregrounds slide past backgrounds */
export type Cam = {x: number; y: number; s: number; r?: number};
const CamCtx = React.createContext<Cam>({x: 0, y: 0, s: 1, r: 0});

export const Shot: React.FC<{cam: Cam; children: React.ReactNode; tilt?: number}> = ({cam, children, tilt = 0}) => (
  <AbsoluteFill style={{overflow: 'hidden', perspective: 1400}}>
    <AbsoluteFill style={{transform: `rotateX(${tilt}deg)`, transformOrigin: '50% 40%'}}>
      <CamCtx.Provider value={cam}>{children}</CamCtx.Provider>
    </AbsoluteFill>
  </AbsoluteFill>
);

/** depth 0 = locked to the camera, 1 = full parallax; >1 = foreground (moves faster) */
export const Layer: React.FC<{d: number; children: React.ReactNode; blur?: number; style?: React.CSSProperties}> = ({d, children, blur = 0, style}) => {
  const c = React.useContext(CamCtx);
  const s = 1 + (c.s - 1) * d;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${-c.x * d}px, ${-c.y * d}px) scale(${s}) rotate(${(c.r ?? 0) * d}deg)`,
        transformOrigin: '50% 50%',
        filter: blur ? `blur(${blur}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** quiet anxiety: a slow handheld drift, never a shake */
export const handheld = (t: number, amt = 1) => ({
  x: (Math.sin(t * 0.7) * 6 + Math.sin(t * 1.9 + 1) * 2) * amt,
  y: (Math.cos(t * 0.6) * 5 + Math.sin(t * 1.4) * 2) * amt,
  r: Math.sin(t * 0.45) * 0.25 * amt,
});

/** film grain + vignette + a faint flicker, over everything */
export const Finish: React.FC<{flicker?: number}> = ({flicker = 0}) => {
  const frame = useCurrentFrame();
  const seed = frame % 8;
  const fl = flicker * (random(`fl${Math.floor(frame / 2)}`) - 0.5) * 0.08;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(110% 75% at 50% 45%, transparent 45%, rgba(0,0,0,0.78) 100%)'}} />
      <AbsoluteFill style={{background: '#000', opacity: Math.max(0, fl)}} />
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.28}}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** soft additive light (radial) */
export const Glow: React.FC<{x: number; y: number; r: number; color: string; a?: number; sx?: number}> = ({x, y, r, color, a = 1, sx = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r * sx,
      top: y - r,
      width: r * 2 * sx,
      height: r * 2,
      borderRadius: '50%',
      background: `radial-gradient(closest-side, ${color}, transparent)`,
      opacity: a,
      mixBlendMode: 'screen',
    }}
  />
);

/** a cone of volumetric light with drifting dust */
export const Beam: React.FC<{points: string; color: string; a?: number; dust?: boolean}> = ({points, color, a = 0.35, dust = true}) => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const id = React.useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'screen', opacity: a}}>
      <defs>
        <clipPath id={`bc${id}`}>
          <polygon points={points} />
        </clipPath>
        <filter id={`bb${id}`}>
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <polygon points={points} fill={color} filter={`url(#bb${id})`} />
      {dust && (
        <g clipPath={`url(#bc${id})`}>
          {Array.from({length: 46}).map((_, i) => {
            const x = random(`dx${id}${i}`) * 1080;
            const y = ((random(`dy${id}${i}`) * 1920 - t * (6 + random(`ds${i}`) * 10)) % 1920 + 1920) % 1920;
            return <circle key={i} cx={x + Math.sin(t * 0.5 + i) * 8} cy={y} r={1 + random(`dr${i}`) * 1.8} fill="#fff" opacity={0.25 + random(`do${i}`) * 0.4} />;
          })}
        </g>
      )}
    </svg>
  );
};
