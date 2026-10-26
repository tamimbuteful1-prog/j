import React from 'react';
import {useCurrentFrame} from 'remotion';
import {COLORS, FONTS} from '../config/theme';
import {fps, EASE, ramp} from '../lib/anim';
import {LogicSymbol} from './LogicSymbol';

/**
 * Arabic-safe kinetic typography.
 * Animation is applied PER WORD (never per letter) so Arabic letters always stay
 * joined. The only split we allow inside a word is the conjunction «و»: waw never
 * connects to the following letter, so «و» + «صامولي» renders identically to «وصامولي».
 */
export type Word = {
  t: string;
  color?: string;
  /** Render glued to the next word (no gap) — used for «و» + «صامولي». */
  glue?: boolean;
  /** Extra per-word transform hooks */
  scale?: number;
  x?: number;
  y?: number;
  opacity?: number;
  glow?: string;
  weight?: number;
  latin?: boolean;
};

export const KineticLine: React.FC<{
  words: Word[];
  /** seconds (scene-relative) when the first word starts */
  at: number;
  stagger?: number;
  size?: number;
  weight?: number;
  color?: string;
  font?: string;
  gap?: number;
  style?: React.CSSProperties;
  /** seconds — when the line exits (optional) */
  outAt?: number;
}> = ({words, at, stagger = 0.07, size = 96, weight = 800, color = COLORS.paper, font = FONTS.display, gap, style, outAt}) => {
  const frame = useCurrentFrame();
  const out = outAt !== undefined ? ramp(frame, outAt, outAt + 0.35, EASE.in) : 0;
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'center',
        alignItems: 'baseline',
        columnGap: gap ?? size * 0.26,
        fontFamily: font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.35,
        color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {groupGlued(words).map((group, gi) => (
        <span key={gi} style={{display: 'inline-flex', flexDirection: 'row', whiteSpace: 'nowrap'}}>
          {group.map(({w, i}) => {
            const p = ramp(frame, at + i * stagger, at + i * stagger + 0.55, EASE.out);
            return (
              <span
                key={i}
                dir={w.latin ? 'ltr' : 'rtl'}
                style={{
                  display: 'inline-block',
                  unicodeBidi: 'isolate',
                  color: w.color ?? color,
                  fontWeight: w.weight ?? weight,
                  fontFamily: w.latin ? FONTS.text : undefined,
                  opacity: p * (w.opacity ?? 1) * (1 - out),
                  transform: `translate(${w.x ?? 0}px, ${(1 - p) * size * 0.45 + (w.y ?? 0) - out * size * 0.3}px) scale(${(0.92 + 0.08 * p) * (w.scale ?? 1)})`,
                  filter: `blur(${(1 - p) * 10 + out * 8}px)` + (w.glow ? ` drop-shadow(0 0 ${size * 0.35}px ${w.glow})` : ''),
                  transformOrigin: '50% 60%',
                  padding: '0 0.02em',
                }}
              >
                {w.t}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

const groupGlued = (words: Word[]) => {
  const groups: {w: Word; i: number}[][] = [];
  let cur: {w: Word; i: number}[] = [];
  words.forEach((w, i) => {
    cur.push({w, i});
    if (!w.glue) {
      groups.push(cur);
      cur = [];
    }
  });
  if (cur.length) groups.push(cur);
  return groups;
};

/** Small tracked Latin/Arabic eyebrow label. */
export const Eyebrow: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties; latin?: boolean}> = ({
  children,
  color = COLORS.muted,
  style,
  latin,
}) => (
  <div
    dir={latin ? 'ltr' : 'rtl'}
    style={{
      fontFamily: FONTS.text,
      fontWeight: 600,
      fontSize: 30,
      letterSpacing: latin ? '0.32em' : 0,
      color,
      textTransform: latin ? 'uppercase' : undefined,
      textAlign: 'center',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Glass chip, e.g. "∨  OR · عبارة فصل". */
export const Chip: React.FC<{
  color: string;
  op: 'or' | 'and';
  latin: string;
  arabic: string;
  style?: React.CSSProperties;
  scale?: number;
}> = ({color, op, latin, arabic, style, scale = 1}) => (
  <div
    dir="rtl"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 22 * scale,
      padding: `${14 * scale}px ${30 * scale}px`,
      borderRadius: 999,
      background: 'rgba(255,255,255,0.06)',
      border: `2px solid ${color}`,
      boxShadow: `0 0 ${40 * scale}px ${color}55, inset 0 0 ${24 * scale}px ${color}22`,
      backdropFilter: 'blur(10px)',
      fontFamily: FONTS.display,
      color: COLORS.paper,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    <span style={{fontWeight: 800, fontSize: 46 * scale}}>{arabic}</span>
    <span style={{width: 2, height: 40 * scale, background: `${color}88`}} />
    <span dir="ltr" style={{fontFamily: FONTS.text, fontWeight: 700, fontSize: 34 * scale, letterSpacing: '0.12em', color}}>
      {latin}
    </span>
    <LogicSymbol op={op} size={40 * scale} color={color} />
  </div>
);

/** Seconds → frames convenience for scenes. */
export const S = (s: number) => s * fps;
