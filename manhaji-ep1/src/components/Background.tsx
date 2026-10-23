import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../theme';
import {rand} from '../time';

/** dark "math paper" stage: soft gradient, drifting grid, faint geometry, vignette */
export const Stage: React.FC<{t: number; accent?: string; grid?: number; tint?: number}> = ({t, accent = C.teal, grid = 1, tint = 1}) => {
  const ox = (t * 14) % 80;
  const oy = (t * 9) % 80;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #FFFFFF 0%, #F2F5F5 50%, #E3EAEB 100%)'}}>
      <AbsoluteFill
        style={{
          opacity: 0.55 * grid,
          backgroundImage:
            'linear-gradient(rgba(20,40,50,0.07) 1.5px, transparent 1.5px), linear-gradient(90deg, rgba(20,40,50,0.07) 1.5px, transparent 1.5px), linear-gradient(rgba(20,40,50,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(20,40,50,0.035) 1px, transparent 1px)',
          backgroundSize: '160px 160px, 160px 160px, 40px 40px, 40px 40px',
          backgroundPosition: `${ox}px ${oy}px, ${ox}px ${oy}px, ${ox}px ${oy}px, ${ox}px ${oy}px`,
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, #000 20%, transparent 80%)',
        }}
      />
      {/* faint floating geometry */}
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.5 * grid}}>
        {Array.from({length: 9}).map((_, i) => {
          const x = rand(i * 3) * 100;
          const y = rand(i * 5 + 1) * 100;
          const s = 30 + rand(i * 7) * 50;
          const r = t * (10 + rand(i) * 20) * (i % 2 ? 1 : -1);
          const fy = Math.sin(t * 0.6 + i) * 12;
          const st = {fill: 'none', stroke: i % 3 === 0 ? accent : 'rgba(20,30,40,0.5)', strokeWidth: 2, opacity: 0.25};
          return (
            <g key={i} transform={`translate(0 ${fy})`}>
              <svg x={`${x}%`} y={`${y}%`} overflow="visible">
                <g transform={`rotate(${r})`}>
                  {i % 3 === 0 && <circle r={s / 2} {...st} />}
                  {i % 3 === 1 && <polygon points={`0,${-s / 2} ${s / 2},${s / 2} ${-s / 2},${s / 2}`} {...st} />}
                  {i % 3 === 2 && <rect x={-s / 2.6} y={-s / 2.6} width={s / 1.3} height={s / 1.3} {...st} />}
                </g>
              </svg>
            </g>
          );
        })}
      </svg>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 120%, ${accent}33, transparent 60%)`, opacity: tint}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(90,110,120,0.18) 100%)'}} />
    </AbsoluteFill>
  );
};
