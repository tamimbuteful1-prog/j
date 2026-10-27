import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS} from './theme';
import {usePalette} from './ThemeContext';

/**
 * Clean explainer "studio": deep ink space, a soft key light, a glossy floor
 * that catches reflections, and a tint that shifts with the logic colour.
 */
export const StudioBackdrop: React.FC<{
  tint?: string;
  tintAmount?: number;
  floorY?: number;
  opacity?: number;
  lightX?: number;
}> = ({tint = COLORS.or, tintAmount = 0.35, floorY = 1260, opacity = 1, lightX = 540}) => {
  const frame = useCurrentFrame();
  const pal = usePalette();
  const drift = Math.sin(frame / 90) * 30;
  if (pal.mode === 'light') return <LightStudio tint={tint} tintAmount={tintAmount} floorY={floorY} opacity={opacity} frame={frame} />;
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${COLORS.ink2} 0%, ${COLORS.ink} 70%)`}} />
      {/* key light */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at ${lightX + drift}px 620px, rgba(255,255,255,0.10), rgba(255,255,255,0) 70%)`,
        }}
      />
      {/* colour wash */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 800px at 540px 1000px, ${tint}, transparent 70%)`,
          opacity: tintAmount * 0.55,
          mixBlendMode: 'screen',
        }}
      />
      {/* floor */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: floorY,
          bottom: 0,
          background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0) 40%), linear-gradient(180deg, ${COLORS.ink3}, ${COLORS.ink})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: floorY - 1,
          height: 2,
          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)`,
        }}
      />
      <FloorGrid floorY={floorY} />
      <Particles frame={frame} tint={tint} />
      {/* slow light sweep */}
      <AbsoluteFill style={{background: `linear-gradient(105deg, transparent ${((frame * 0.35) % 260) - 80}%, rgba(255,255,255,0.045) ${((frame * 0.35) % 260) - 60}%, transparent ${((frame * 0.35) % 260) - 40}%)`}} />
    </AbsoluteFill>
  );
};

/** Floating bokeh particles with depth (deterministic). Keeps every frame alive. */
const Particles: React.FC<{frame: number; tint: string}> = ({frame, tint}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {Array.from({length: 26}).map((_, i) => {
      const depth = 0.4 + ((i * 37) % 60) / 100;
      const x = ((i * 211) % 1080) + Math.sin(frame / (60 + i * 3) + i) * 30 * depth;
      const y = 1920 - ((frame * (0.6 + depth * 1.6) + i * 173) % 2100);
      const r = 3 + depth * 7;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: r * 2,
            height: r * 2,
            borderRadius: '50%',
            background: i % 3 === 0 ? tint : 'rgba(255,255,255,0.9)',
            opacity: 0.06 + depth * 0.12,
            filter: `blur(${(1.2 - depth) * 4}px)`,
          }}
        />
      );
    })}
  </AbsoluteFill>
);

/** Perspective grid on the floor — gives depth and a "system" feeling. */
const FloorGrid: React.FC<{floorY: number}> = ({floorY}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: -540,
        width: 2160,
        top: floorY,
        height: 900,
        perspective: 700,
        perspectiveOrigin: '50% 0%',
        overflow: 'hidden',
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: 'rotateX(68deg)',
          transformOrigin: '50% 0%',
          backgroundImage:
            'linear-gradient(rgba(140,160,255,0.16) 2px, transparent 2px), linear-gradient(90deg, rgba(140,160,255,0.16) 2px, transparent 2px)',
          backgroundSize: '120px 120px',
          backgroundPosition: `0px ${(frame * 0.6) % 120}px`,
        }}
      />
    </div>
  );
};

/** Film grain + vignette — the "premium" finish, applied once over everything. */
/** Bright, airy studio for light-theme episodes: warm paper, soft tinted glows, faint grid. */
const LightStudio: React.FC<{tint: string; tintAmount: number; floorY: number; opacity: number; frame: number}> = ({tint, tintAmount, floorY, opacity, frame}) => {
  const drift = Math.sin(frame / 80) * 40;
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg, #FFFDF8 0%, #F7F1E7 75%)'}} />
      <AbsoluteFill style={{background: `radial-gradient(900px 700px at ${540 + drift}px 820px, ${tint}2E, transparent 70%)`, opacity: 0.6 + tintAmount}} />
      <AbsoluteFill style={{background: `radial-gradient(600px 500px at ${180 - drift}px 300px, ${tint}18, transparent 70%)`}} />
      {/* fine dot grid */}
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(26,31,51,0.10) 1.6px, transparent 1.8px)',
          backgroundSize: '40px 40px',
          backgroundPosition: `0px ${(frame * 0.4) % 40}px`,
          maskImage: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.9), rgba(0,0,0,0) 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.9), rgba(0,0,0,0) 72%)',
        }}
      />
      {/* table / floor */}
      <div style={{position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, background: 'linear-gradient(180deg, #EFE6D8, #E7DCCB)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: floorY - 1, height: 3, background: 'linear-gradient(90deg, transparent, rgba(26,31,51,0.12), transparent)'}} />
      {/* floating soft particles */}
      {Array.from({length: 22}).map((_, i) => {
        const depth = 0.4 + ((i * 37) % 60) / 100;
        const x = ((i * 211) % 1080) + Math.sin(frame / (60 + i * 3) + i) * 30 * depth;
        const y = 1920 - ((frame * (0.5 + depth * 1.4) + i * 173) % 2100);
        const r = 4 + depth * 8;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: r * 2, height: r * 2, borderRadius: '50%', background: i % 3 === 0 ? tint : '#C9B79A', opacity: 0.08 + depth * 0.12, filter: `blur(${(1.2 - depth) * 4}px)`}} />;
      })}
      <AbsoluteFill style={{background: `linear-gradient(105deg, transparent ${((frame * 0.35) % 260) - 80}%, rgba(255,255,255,0.55) ${((frame * 0.35) % 260) - 60}%, transparent ${((frame * 0.35) % 260) - 40}%)`, mixBlendMode: 'soft-light'}} />
    </AbsoluteFill>
  );
};

export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  const pal = usePalette();
  if (pal.mode === 'light')
    return <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(90,60,30,0.14) 100%)'}} />;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)'}} />
      <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay'}}>
        <svg width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Soft spotlight cone used to isolate a hero element. */
export const Spotlight: React.FC<{x: number; y: number; r?: number; color?: string; opacity?: number}> = ({
  x,
  y,
  r = 380,
  color = 'rgba(255,240,215,0.22)',
  opacity = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: '50%',
      background: `radial-gradient(closest-side, ${color}, rgba(0,0,0,0))`,
      opacity,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
    }}
  />
);
