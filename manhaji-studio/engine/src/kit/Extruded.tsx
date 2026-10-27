import React from 'react';
import {FONTS} from './theme';

/**
 * Extruded 3D glyph built from stacked layers in a preserve-3d context —
 * reads as a solid object when it turns (question mark, ∨ / ∧ symbols).
 */
export const Extruded: React.FC<{
  glyph?: string;
  /** Custom content (e.g. an SVG symbol) instead of a text glyph. Receives the layer colour. */
  render?: (color: string) => React.ReactNode;
  size: number;
  color: string;
  side: string;
  depth?: number;
  layers?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  glow?: string;
  font?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({glyph, render, size, color, side, depth = 60, layers = 14, rotateX = 0, rotateY = 0, rotateZ = 0, glow, font = FONTS.display, weight = 900, style}) => {
  const text: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: font,
    fontWeight: weight,
    fontSize: size,
    lineHeight: 1,
  };
  return (
    <div style={{width: size * 1.2, height: size * 1.3, perspective: size * 6, ...style}}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
        }}
      >
        {Array.from({length: layers}).map((_, i) => {
          const z = -depth / 2 + (depth * i) / (layers - 1);
          const front = i === layers - 1;
          return (
            <div
              key={i}
              style={{
                ...text,
                transform: `translateZ(${z}px)`,
                color: front ? color : side,
                filter: front && glow ? `drop-shadow(0 0 ${size * 0.15}px ${glow})` : undefined,
                opacity: front ? 1 : 0.96,
              }}
            >
              {render ? render(front ? color : side) : glyph}
            </div>
          );
        })}
        {/* back face so it reads solid from behind as well */}
        <div style={{...text, transform: `translateZ(${-depth / 2 - 1}px) rotateY(180deg)`, color: side}}>{render ? render(side) : glyph}</div>
      </div>
    </div>
  );
};
