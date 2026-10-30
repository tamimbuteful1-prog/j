import React from 'react';
import {AbsoluteFill, OffthreadVideo, interpolate, random, staticFile, useCurrentFrame} from 'remotion';
import {C, F, VIDEO} from '../theme';
import {EASE} from '../lib/anim';
import type {Layout, Line} from '../episodes/HR-E01/timeline';
import {useVariant} from '../lib/variant';

const LV: Record<Layout, number> = {full: 0, pip: 1, gone: 2};

/** 0 = full frame, 1 = picture-in-picture card, 2 = off screen — eased around each line start */
export const layoutAt = (lines: Line[], t: number) => {
  let v = LV[lines[0].layout];
  for (let i = 1; i < lines.length; i++) {
    const a = LV[lines[i - 1].layout];
    const b = LV[lines[i].layout];
    if (a === b) continue;
    const s = lines[i].start;
    const k = interpolate(t, [s - 0.45, s + 0.05], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOut});
    if (t >= s - 0.45) v = a + (b - a) * k;
  }
  return v;
};

/** The presenter's footage (or a placeholder until it is filmed), moving between full frame and a PiP card. */
export const Footage: React.FC<{lines: Line[]; src?: string}> = ({lines, src}) => {
  const frame = useCurrentFrame();
  const variant = useVariant();
  const t = frame / VIDEO.fps;
  const v = Math.min(1, layoutAt(lines, t));
  // PiP card: top-right (RTL reading starts on the right)
  const W = interpolate(v, [0, 1], [1080, 330]);
  const H = interpolate(v, [0, 1], [1920, 440]);
  const x = interpolate(v, [0, 1], [0, 1080 - 330 - 56]);
  const y = interpolate(v, [0, 1], [0, 132]);
  const r = interpolate(v, [0, 1], [0, 34]);
  // talking-head energy: a punch-in / re-frame at every line on the full shot (like a multi-cam cut), plus a slow push
  const ZOOM = [1, 1.13, 1.05, 1.18];
  const SHIFT = [0, -26, 18, -12];
  let li = 0;
  for (let i = 0; i < lines.length; i++) if (t >= lines[i].start - 0.05) li = i;
  const k = interpolate(t, [lines[li].start - 0.05, lines[li].start + 0.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
  const zPrev = ZOOM[Math.max(0, li - 1) % 4];
  const zCur = ZOOM[li % 4];
  const xPrev = SHIFT[Math.max(0, li - 1) % 4];
  const xCur = SHIFT[li % 4];
  const push = (zPrev + (zCur - zPrev) * k) * (1 + 0.02 * Math.sin(t * 0.35)) * (1 - 0.12 * v);
  const shift = (xPrev + (xCur - xPrev) * k) * (1 - v);
  if (variant === 'vo') return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: W,
        height: H,
        borderRadius: r,
        overflow: 'hidden',
        boxShadow: v > 0.05 ? `0 30px 80px rgba(0,0,0,${0.6 * v}), 0 0 0 ${3 * v}px ${C.green}, 0 0 ${40 * v}px ${C.greenGlow}` : 'none',
      }}
    >
      <div style={{position: 'absolute', inset: 0, transform: `translateX(${shift}px) scale(${push})`, transformOrigin: '50% 38%'}}>
        {src ? (
          <OffthreadVideo src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        ) : (
          <Placeholder />
        )}
      </div>
    </div>
  );
};

/** stand-in for Tamim's camera shot: a lit studio with a presenter silhouette */
const Placeholder: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 38%, #26364d 0%, #121c2b 45%, #070b12 100%)`}}>
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <defs>
        <linearGradient id="ph-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4c66" />
          <stop offset="1" stopColor="#151f2e" />
        </linearGradient>
      </defs>
      <ellipse cx="540" cy="760" rx="150" ry="185" fill="url(#ph-body)" opacity={0.95} />
      <path d="M240 1920 C 250 1260, 380 1080, 540 1080 C 700 1080, 830 1260, 840 1920 Z" fill="url(#ph-body)" opacity={0.95} />
    </svg>

  </AbsoluteFill>
);

/** the digital-border world behind everything (visible when the footage is a PiP card) */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = (frame / VIDEO.fps) * 30;
  return (
    <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 45%, ${C.night} 0%, ${C.ink} 100%)`}}>
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        <defs>
          <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${drift % 72})`}>
            <path d="M72 0H0V72" fill="none" stroke="rgba(130,170,210,0.07)" strokeWidth="1.2" />
          </pattern>
          <radialGradient id="fadeGrid" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="gm">
            <rect width="1080" height="1920" fill="url(#fadeGrid)" />
          </mask>
        </defs>
        <rect width="1080" height="1920" fill="url(#grid)" mask="url(#gm)" />
        {/* slow glowing light orbs */}
        {[0, 1, 2].map((i) => {
          const tt = frame / VIDEO.fps;
          const cx = 540 + Math.sin(tt * 0.13 + i * 2.1) * 380;
          const cy = 960 + Math.cos(tt * 0.11 + i * 1.7) * 640;
          return <circle key={`orb${i}`} cx={cx} cy={cy} r={420} fill={i === 1 ? '#1d4fd8' : C.green} opacity={0.07} style={{filter: 'blur(90px)'}} />;
        })}
        {Array.from({length: 40}).map((_, i) => {
          const px = random(`px${i}`) * 1080;
          const py = (random(`py${i}`) * 1920 - drift * (0.4 + random(`s${i}`))) % 1920;
          return <circle key={i} cx={px} cy={py < 0 ? py + 1920 : py} r={1 + random(`r${i}`) * 2} fill={C.green} opacity={0.08 + random(`o${i}`) * 0.18} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** cinematic finish over everything: vignette, film grain, faint scanlines */
export const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = frame % 6;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'radial-gradient(120% 85% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: 0.22}}>
        <filter id={`grain${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#grain${seed})`} />
      </svg>
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 5px)'}} />
    </AbsoluteFill>
  );
};

/** series mark: «الحدود الرقمية» with the send/receive border glyph */
export const SeriesMark: React.FC<{scale?: number; glow?: number}> = ({scale = 1, glow = 1}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 18 * scale, direction: 'rtl'}}>
    <svg width={64 * scale} height={64 * scale} viewBox="0 0 64 64">
      <path d="M32 6 L22 18 H29 V27 H35 V18 H42 Z" fill={C.text} />
      <rect x="4" y="30" width="56" height="4" rx="2" fill={C.green} style={{filter: `drop-shadow(0 0 ${8 * glow}px ${C.green})`}} />
      <path d="M32 58 L42 46 H35 V37 H29 V46 H22 Z" fill={C.dim} />
    </svg>
    <div style={{fontFamily: F.head, fontWeight: 800, fontSize: 46 * scale, color: C.text, letterSpacing: -0.5, lineHeight: 1}}>
      الحدود <span style={{color: C.green}}>الرقمية</span>
    </div>
  </div>
);

/** glass panel used by every card */
export const Glass: React.FC<{style?: React.CSSProperties; children?: React.ReactNode; tint?: string}> = ({style, children, tint}) => (
  <div
    style={{
      background: C.panel,
      border: `1.5px solid ${tint ?? 'rgba(31,191,117,0.35)'}`,
      borderRadius: 28,
      backdropFilter: 'blur(14px)',
      boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 36px ${tint ?? C.green}40, inset 0 0 24px ${tint ?? C.green}14`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** soft light leak drifting across the frame — adds glow on the full shot without hiding the face */
export const LightLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const x = 50 + Math.sin(t * 0.21) * 45;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: 0.32, background: `radial-gradient(60% 35% at ${x}% 8%, ${C.green}55, transparent 70%), radial-gradient(50% 30% at ${100 - x}% 98%, #1d4fd855, transparent 70%)`}} />
  );
};

/** glow sweep + flash at every switch between the full shot and the graphics */
export const SwitchFlash: React.FC<{lines: Line[]}> = ({lines}) => {
  const frame = useCurrentFrame();
  const variant = useVariant();
  const t = frame / VIDEO.fps;
  const at = lines.filter((l, i) => i > 0 && lines[i - 1].layout !== l.layout).map((l) => l.start - 0.25);
  const cur = at.find((a) => t >= a - 0.05 && t <= a + 0.6);
  if (cur === undefined || variant === 'vo') return null;
  const k = interpolate(t, [cur, cur + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOut});
  const flash = Math.sin(Math.PI * k);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: C.green, opacity: 0.1 * flash, mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', top: -400, bottom: -400, width: 260, left: `${-30 + k * 160}%`, transform: 'rotate(18deg)', background: `linear-gradient(90deg, transparent, ${C.green}66, #ffffffaa, ${C.green}66, transparent)`, filter: 'blur(18px)', opacity: flash, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};
