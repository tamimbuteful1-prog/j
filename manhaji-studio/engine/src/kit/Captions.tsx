import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {useTimeline} from '../timeline/context';
import {FONTS, SAFE} from './theme';
import {usePalette} from './ThemeContext';

const isLatin = (s: string) => /^[A-Za-z0-9]/.test(s);

/**
 * Synced captions in the reserved band. Words are separate RTL spans so mixed
 * Arabic/English keeps its order; emphasised words get the accent.
 */
export const Captions: React.FC<{accent?: (word: string) => string | undefined}> = ({accent}) => {
  const frame = useCurrentFrame();
  const tl = useTimeline();
  const pal = usePalette();
  const t = frame / tl.fps;
  const c = tl.captions.find((x) => t >= x.start && t < x.end);
  if (!c) return null;
  const local = (t - c.start) * tl.fps;
  const len = (c.end - c.start) * tl.fps;
  const o = interpolate(local, [0, 5], [0, 1], {extrapolateRight: 'clamp'}) * interpolate(local, [len - 4, len], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const words = c.text.split(' ');
  return (
    <div style={{position: 'absolute', left: SAFE.side, right: SAFE.side, top: SAFE.captionTop, height: SAFE.captionBottom - SAFE.captionTop, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o}}>
      <div
        dir="rtl"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 14,
          padding: '16px 34px 20px',
          borderRadius: 26,
          background: pal.glass,
          border: `1px solid ${pal.line}`,
          boxShadow: pal.mode === 'light' ? '0 10px 30px rgba(26,31,51,0.12)' : undefined,
          backdropFilter: 'blur(14px)',
          fontFamily: FONTS.text,
          fontWeight: 600,
          fontSize: 50,
          lineHeight: 1.45,
          color: pal.text,
        }}
      >
        {words.map((w, i) => {
          const hl = c.highlight.some((h) => w.includes(h));
          const lit = interpolate(local, [(i / words.length) * len * 0.85 - 2, (i / words.length) * len * 0.85 + 4], [0.55, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <span key={i} dir={isLatin(w) ? 'ltr' : 'rtl'} style={{unicodeBidi: 'isolate', opacity: lit, fontWeight: hl ? 700 : 600, color: hl ? accent?.(w) ?? pal.accent : pal.text}}>
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
