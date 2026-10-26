import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Caption} from '../config/timeline';
import {COLORS, FONTS, SAFE} from '../config/theme';

export type AbsCaption = Caption & {start: number; end: number};

const HL: Record<NonNullable<Caption['highlight']>[number]['color'], string> = {
  or: COLORS.or,
  and: COLORS.and,
  true: COLORS.true,
  false: COLORS.false,
  aish: COLORS.aish,
  samoli: COLORS.samoli,
  accent: '#FFD27A',
};

const isLatin = (s: string) => /^[A-Za-z]/.test(s);

/**
 * Clean synced captions, living in the reserved caption band (never over heroes).
 * Words are separate spans (RTL flex) so mixed Arabic/English stays in correct order.
 */
export const Captions: React.FC<{captions: AbsCaption[]}> = ({captions}) => {
  const frame = useCurrentFrame();
  const c = captions.find((x) => frame >= x.start && frame < x.end);
  if (!c) return null;
  const local = frame - c.start;
  const len = c.end - c.start;
  const inP = interpolate(local, [0, 6], [0, 1], {extrapolateRight: 'clamp'});
  const outP = interpolate(local, [len - 5, len], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const words = c.text.split(' ');
  return (
    <div
      style={{
        position: 'absolute',
        left: SAFE.side,
        right: SAFE.side,
        top: SAFE.captionTop,
        height: SAFE.captionBottom - SAFE.captionTop,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: inP * outP,
        transform: `translateY(${(1 - inP) * 14}px)`,
      }}
    >
      <div
        dir="rtl"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: 14,
          rowGap: 4,
          maxWidth: '100%',
          padding: '16px 34px 20px',
          borderRadius: 26,
          background: 'rgba(8,11,22,0.58)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(14px)',
          fontFamily: FONTS.text,
          fontWeight: 600,
          fontSize: 50,
          lineHeight: 1.45,
          color: COLORS.paper,
        }}
      >
        {words.map((w, i) => {
          const h = c.highlight?.find((x) => x.word === w);
          // karaoke-style progress: words "light up" as they are spoken
          const wordAt = (i / words.length) * len * 0.85;
          const lit = interpolate(local, [wordAt - 2, wordAt + 4], [0.55, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <span
              key={i}
              dir={isLatin(w) ? 'ltr' : 'rtl'}
              style={{
                unicodeBidi: 'isolate',
                color: h ? HL[h.color] : COLORS.paper,
                fontWeight: h ? 700 : 600,
                opacity: lit,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
