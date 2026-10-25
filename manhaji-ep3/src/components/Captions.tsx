import React from 'react';
import {F} from '../theme';
import {clamp, LINES} from '../time';
import {P} from './Props';

/** the spoken line as a subtitle (inside the Shorts safe area) */
export const Captions: React.FC<{t: number}> = ({t}) => {
  const line = LINES.find(([a, b]) => t >= a - 0.1 && t < b + 0.35);
  if (!line) return null;
  const [a, b, text] = line;
  const k = clamp((t - (a - 0.1)) / 0.25) * (1 - clamp((t - b) / 0.35));
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1500, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${(1 - k) * 20}px)`}}>
      <div
        style={{
          fontFamily: F.kufi,
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 1.55,
          color: P.ink,
          background: 'rgba(255,255,255,0.88)',
          borderRadius: 28,
          padding: '10px 32px 16px',
          textAlign: 'center',
          direction: 'rtl',
          boxShadow: '0 14px 40px rgba(60,45,20,0.15)',
          maxWidth: 960,
        }}
      >
        {text}
      </div>
    </div>
  );
};
