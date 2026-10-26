import React from 'react';
import {interpolate} from 'remotion';
import {COLORS, FONTS} from '../config/theme';

/**
 * TRUE ✓ / FALSE ✕ — icon strokes draw on with `progress`,
 * `flash` adds a burst ring (confirmation / rejection energy).
 */
export const ResultBadge: React.FC<{
  value: boolean;
  progress: number; // 0..1
  x: number;
  y: number;
  scale?: number;
  flash?: number; // 0..1 ring burst
  shakeX?: number;
  showArabic?: boolean;
  dim?: number;
}> = ({value, progress, x, y, scale = 1, flash = 0, shakeX = 0, showArabic = true, dim = 0}) => {
  if (progress <= 0.001) return null;
  const c = value ? COLORS.true : COLORS.false;
  const glow = value ? COLORS.trueGlow : COLORS.falseGlow;
  const draw = interpolate(progress, [0.25, 0.9], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const s = interpolate(progress, [0, 0.6, 1], [0.6, 1.06, 1]) * scale;
  const W = 420;
  const H = 150;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - W / 2,
        top: y - H / 2,
        width: W,
        height: H,
        transform: `translateX(${shakeX}px) scale(${s})`,
        opacity: Math.min(1, progress * 2.5) * (1 - dim * 0.6),
        filter: dim ? `saturate(${1 - dim * 0.7})` : undefined,
      }}
    >
      {flash > 0 && flash < 1 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 300,
            height: 300,
            marginLeft: -150,
            marginTop: -150,
            borderRadius: '50%',
            border: `${8 * (1 - flash)}px solid ${c}`,
            transform: `scale(${0.4 + flash * 1.8})`,
            opacity: 1 - flash,
          }}
        />
      )}
      <div
        dir="ltr"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          background: `linear-gradient(180deg, ${c}26, ${c}10)`,
          border: `3px solid ${c}`,
          boxShadow: `0 0 50px ${glow}, inset 0 0 30px ${c}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        <svg width={74} height={74} viewBox="0 0 74 74">
          <circle cx={37} cy={37} r={33} fill={c} />
          {value ? (
            <path d="M21 38 L32 49 L54 26" stroke={COLORS.ink} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
          ) : (
            <path d="M24 24 L50 50 M50 24 L24 50" stroke={COLORS.ink} strokeWidth={8} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={draw} />
          )}
        </svg>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1}}>
          <span style={{fontFamily: FONTS.text, fontWeight: 700, fontSize: 64, color: c, letterSpacing: '0.04em'}}>{value ? 'TRUE' : 'FALSE'}</span>
          {showArabic && (
            <span dir="rtl" style={{fontFamily: FONTS.display, fontWeight: 700, fontSize: 28, color: COLORS.paperDim, marginTop: 6}}>
              {value ? 'صائبة' : 'خاطئة'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
