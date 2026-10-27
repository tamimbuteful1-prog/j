import React from 'react';

/**
 * ∨ (OR) / ∧ (AND) drawn as geometry — fonts rarely ship these glyphs well,
 * and drawing them lets ∨ literally flip into ∧ (same shape, rotated 180°).
 */
export const LogicSymbol: React.FC<{op: 'or' | 'and'; size: number; color: string; stroke?: number}> = ({op, size, color, stroke}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', transform: op === 'and' ? 'rotate(180deg)' : undefined}}>
    <path d="M18 18 L50 84 L82 18" fill="none" stroke={color} strokeWidth={stroke ?? 15} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
