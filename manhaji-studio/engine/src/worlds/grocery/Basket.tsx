import React, {useId} from 'react';
import {COLORS} from '../../kit/theme';

export const BASKET_W = 520;
export const BASKET_H = 400;

export type BasketPlacement = {
  /** centre x of the basket */
  x: number;
  /** bottom y of the basket */
  y: number;
  /** rendered width */
  w: number;
  rotate?: number;
  opacity?: number;
  /** colour of the rim light (state feedback) */
  glow?: string;
  glowAmount?: number;
};

const box = (p: BasketPlacement): React.CSSProperties => {
  const k = p.w / BASKET_W;
  return {
    position: 'absolute',
    left: p.x - p.w / 2,
    top: p.y - BASKET_H * k,
    width: p.w,
    height: BASKET_H * k,
    opacity: p.opacity ?? 1,
    transform: `rotate(${p.rotate ?? 0}deg)`,
    transformOrigin: '50% 100%',
    pointerEvents: 'none',
  };
};

/**
 * Where a product should stand when it is inside the basket.
 * side: 1 = right (عيش), -1 = left (صامولي), 0 = centre.
 */
export const basketSlot = (p: BasketPlacement, side: -1 | 0 | 1) => {
  const k = p.w / BASKET_W;
  return {x: p.x + side * 112 * k, y: p.y - 150 * k, scale: 0.72 * k};
};

/** Interior + back rim — render BEFORE the products. */
export const BasketBack: React.FC<BasketPlacement> = (p) => {
  const id = useId().replace(/:/g, '');
  const k = p.w / BASKET_W;
  return (
    <div style={box(p)}>
      {/* contact shadow */}
      <div
        style={{
          position: 'absolute',
          left: '4%',
          right: '4%',
          bottom: -26 * k,
          height: 60 * k,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0))',
        }}
      />
      <svg width="100%" height="100%" viewBox={`0 0 ${BASKET_W} ${BASKET_H}`} style={{overflow: 'visible'}}>
        <defs>
          <linearGradient id={`${id}-in`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B1B4F" />
            <stop offset="1" stopColor="#14307F" />
          </linearGradient>
        </defs>
        {/* back wall + floor of the basket */}
        <path d="M52 112 L468 112 L490 158 L30 158 Z" fill={`url(#${id}-in)`} />
        <path d="M52 112 L468 112" stroke="#6E95FF" strokeWidth={10} strokeLinecap="round" />
        {/* back handles */}
        <path d="M150 112 Q160 30 260 26 Q360 30 370 112" stroke="#25459C" strokeWidth={14} fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};

/** Front panel with perforations — render AFTER the products. */
export const BasketFront: React.FC<BasketPlacement & {children?: React.ReactNode}> = (p) => {
  const id = useId().replace(/:/g, '');
  const holes: React.ReactNode[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 7; c++) {
      const y = 200 + r * 56;
      const inset = (y - 158) * 0.13;
      const x0 = 40 + inset + 22;
      const span = 440 - inset * 2 - 44;
      const x = x0 + (span / 6) * c;
      holes.push(<rect key={`${r}-${c}`} x={x - 20} y={y - 16} width={40} height={32} rx={9} fill="rgba(5,12,40,0.55)" />);
    }
  }
  const glowAmount = p.glowAmount ?? 0;
  return (
    <div style={box(p)}>
      <svg width="100%" height="100%" viewBox={`0 0 ${BASKET_W} ${BASKET_H}`} style={{overflow: 'visible'}}>
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4B82FF" />
            <stop offset="0.5" stopColor={COLORS.basket} />
            <stop offset="1" stopColor={COLORS.basketDeep} />
          </linearGradient>
          <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0)" />
            <stop offset="0.3" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="0.45" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path d="M30 158 L490 158 L452 372 Q448 390 428 390 L92 390 Q72 390 68 372 Z" fill={`url(#${id}-body)`} />
        {holes}
        <path d="M30 158 L490 158 L452 372 Q448 390 428 390 L92 390 Q72 390 68 372 Z" fill={`url(#${id}-sheen)`} />
        {/* rim */}
        <path
          d="M30 158 L490 158"
          stroke={p.glow && glowAmount > 0 ? p.glow : '#8AAEFF'}
          strokeWidth={16}
          strokeLinecap="round"
          style={{filter: p.glow && glowAmount > 0 ? `drop-shadow(0 0 ${18 * glowAmount}px ${p.glow})` : undefined}}
        />
        {/* folded front handles */}
        <path d="M120 170 Q130 230 200 236" stroke="#7FA3FF" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.7} />
        <path d="M400 170 Q390 230 320 236" stroke="#7FA3FF" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.7} />
      </svg>
      {p.children}
    </div>
  );
};
