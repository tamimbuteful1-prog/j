import React, {useId} from 'react';
import {COLORS, FONTS} from '../config/theme';

export type ProductKind = 'aish' | 'samoli';

export const PRODUCT_W = 300;
export const PRODUCT_H = 360;

const LABEL: Record<ProductKind, {text: string; color: string; deep: string}> = {
  aish: {text: 'عيش', color: COLORS.aish, deep: COLORS.aishDeep},
  samoli: {text: 'صامولي', color: COLORS.samoli, deep: COLORS.samoliDeep},
};

// deterministic toasted spots for the flat bread
const SPOTS = [
  [118, 170, 16, 10, -20],
  [182, 160, 12, 8, 30],
  [150, 205, 20, 12, 10],
  [105, 232, 13, 8, 40],
  [196, 238, 17, 9, -35],
  [150, 262, 11, 7, 0],
  [135, 140, 9, 6, 15],
  [208, 196, 9, 6, 70],
  [92, 198, 8, 5, -50],
] as const;

const Bag: React.FC<{id: string; kind: ProductKind}> = ({id, kind}) => {
  const l = LABEL[kind];
  return (
    <>
      {/* plastic bag — translucent body with specular highlights */}
      <path
        d="M34 104 Q34 76 70 70 Q110 62 132 44 L168 44 Q190 62 230 70 Q266 76 266 104 L266 316 Q266 346 236 346 L64 346 Q34 346 34 316 Z"
        fill={`url(#${id}-bag)`}
        stroke="rgba(255,255,255,0.42)"
        strokeWidth={2.5}
      />
      <path d="M58 110 Q50 210 62 318" stroke="rgba(255,255,255,0.55)" strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.55} />
      <path d="M74 98 Q70 120 72 140" stroke="white" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.7} />
      <path d="M244 120 Q252 220 242 320" stroke="rgba(255,255,255,0.25)" strokeWidth={5} strokeLinecap="round" fill="none" />
      {/* gathered neck + tie */}
      <path d="M120 54 Q150 40 180 54" stroke="rgba(255,255,255,0.35)" strokeWidth={3} fill="none" />
      <path d="M134 44 L126 18 Q150 8 174 18 L166 44 Z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
      <rect x={128} y={36} width={44} height={16} rx={6} fill={l.color} />
      <rect x={128} y={36} width={44} height={6} rx={3} fill="rgba(255,255,255,0.35)" />
      {/* label sticker */}
      <g filter={`url(#${id}-soft)`}>
        <rect x={78} y={270} width={144} height={54} rx={16} fill={l.color} />
      </g>
      <rect x={78} y={270} width={144} height={22} rx={11} fill="rgba(255,255,255,0.22)" />
      <text
        x={150}
        y={308}
        textAnchor="middle"
        direction="rtl"
        fontFamily={FONTS.display}
        fontWeight={800}
        fontSize={kind === 'aish' ? 34 : 30}
        fill="#fff"
      >
        {l.text}
      </text>
    </>
  );
};

const Defs: React.FC<{id: string}> = ({id}) => (
  <defs>
    <linearGradient id={`${id}-bag`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="rgba(255,255,255,0.22)" />
      <stop offset="0.45" stopColor="rgba(255,255,255,0.06)" />
      <stop offset="1" stopColor="rgba(255,255,255,0.14)" />
    </linearGradient>
    <radialGradient id={`${id}-loaf`} cx="0.42" cy="0.36" r="0.75">
      <stop offset="0" stopColor="#F9DFA6" />
      <stop offset="0.55" stopColor={COLORS.crust} />
      <stop offset="1" stopColor={COLORS.crustDark} />
    </radialGradient>
    <radialGradient id={`${id}-loafBack`} cx="0.5" cy="0.4" r="0.7">
      <stop offset="0" stopColor="#E8BE7C" />
      <stop offset="1" stopColor="#9A5C25" />
    </radialGradient>
    <linearGradient id={`${id}-roll`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#F4C77C" />
      <stop offset="0.35" stopColor="#E0A257" />
      <stop offset="1" stopColor="#A35E24" />
    </linearGradient>
    <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.25" />
    </filter>
  </defs>
);

/** Pure illustration of the two hero products (stylised, product-ad lighting). */
export const ProductArt: React.FC<{kind: ProductKind; style?: React.CSSProperties}> = ({kind, style}) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={PRODUCT_W} height={PRODUCT_H} viewBox={`0 0 ${PRODUCT_W} ${PRODUCT_H}`} style={{overflow: 'visible', ...style}}>
      <Defs id={id} />
      {kind === 'aish' ? (
        <g>
          {/* stacked round flatbreads */}
          <circle cx={156} cy={200} r={112} fill={`url(#${id}-loafBack)`} />
          <circle cx={145} cy={206} r={112} fill={`url(#${id}-loafBack)`} opacity={0.9} />
          <circle cx={150} cy={212} r={110} fill={`url(#${id}-loaf)`} />
          <circle cx={150} cy={212} r={110} fill="none" stroke="rgba(120,60,15,0.45)" strokeWidth={5} />
          {SPOTS.map(([x, y, rx, ry, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${r} ${x} ${y})`} fill="#8E4F1C" opacity={0.42} />
          ))}
          <ellipse cx={120} cy={168} rx={46} ry={20} fill="white" opacity={0.16} transform="rotate(-25 120 168)" />
        </g>
      ) : (
        <g>
          {/* three soft samoli rolls */}
          {[118, 176, 234].map((y, i) => (
            <g key={y} transform={`rotate(${i === 1 ? 2 : -2} 150 ${y})`}>
              <rect x={46} y={y - 30} width={208} height={60} rx={30} fill={`url(#${id}-roll)`} />
              <path d={`M80 ${y - 4} Q150 ${y - 16} 222 ${y - 4}`} stroke="#F8DCA4" strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.85} />
              <ellipse cx={110} cy={y - 16} rx={40} ry={8} fill="white" opacity={0.22} />
              <rect x={46} y={y - 30} width={208} height={60} rx={30} fill="none" stroke="rgba(110,55,15,0.4)" strokeWidth={3} />
            </g>
          ))}
        </g>
      )}
      <Bag id={id} kind={kind} />
    </svg>
  );
};

export type ProductActorProps = {
  kind: ProductKind;
  /** Screen x of the product centre. */
  x: number;
  /** Screen y of the product's base (where it touches the surface). */
  y: number;
  scale?: number;
  /** Height above its own base (lifts the product, shrinks the floor shadow). */
  lift?: number;
  rotate?: number; // z tilt
  rotateY?: number; // 3D turn — gives the 2.5D feeling
  rotateX?: number;
  opacity?: number;
  /** 0..1 — outlined "missing item" ghost. */
  ghost?: number;
  glow?: string;
  glowAmount?: number;
  blur?: number;
  shadow?: boolean;
  dim?: number; // 0..1 darken
  zIndex?: number;
};

/** A positioned, lit, shadow-casting product with fake thickness for 3D turns. */
export const ProductActor: React.FC<ProductActorProps> = ({
  kind,
  x,
  y,
  scale = 1,
  lift = 0,
  rotate = 0,
  rotateY = 0,
  rotateX = 0,
  opacity = 1,
  ghost = 0,
  glow,
  glowAmount = 0,
  blur = 0,
  shadow = true,
  dim = 0,
  zIndex,
}) => {
  const w = PRODUCT_W * scale;
  const h = PRODUCT_H * scale;
  const shadowK = Math.max(0, 1 - lift / (260 * scale));
  const layers = 5;
  const filters = [
    blur > 0.2 ? `blur(${blur}px)` : '',
    dim > 0 ? `brightness(${1 - dim * 0.65}) saturate(${1 - dim * 0.5})` : '',
    glow && glowAmount > 0 ? `drop-shadow(0 0 ${30 * glowAmount * scale}px ${glow})` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h, width: w, height: h, zIndex, opacity, pointerEvents: 'none'}}>
      {shadow && (
        <div
          style={{
            position: 'absolute',
            left: w * 0.12,
            width: w * 0.76,
            top: h - 22 * scale,
            height: 40 * scale,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))',
            opacity: shadowK * (1 - ghost) * 0.9,
            transform: `scale(${0.6 + 0.4 * shadowK})`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${-lift}px) perspective(${1400 * scale}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotate}deg)`,
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 80%',
          filter: filters || undefined,
        }}
      >
        {/* fake extrusion: darker copies stacked behind */}
        {Math.abs(rotateY) > 1 &&
          Array.from({length: layers}).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateZ(${-(i + 1) * 5 * scale}px)`,
                filter: 'brightness(0.45)',
                opacity: (1 - ghost) * 0.95,
              }}
            >
              <ProductArt kind={kind} style={{width: w, height: h}} />
            </div>
          ))}
        <div style={{position: 'absolute', inset: 0, opacity: 1 - ghost}}>
          <ProductArt kind={kind} style={{width: w, height: h}} />
        </div>
        {ghost > 0 && <GhostOutline kind={kind} w={w} h={h} opacity={ghost} />}
      </div>
    </div>
  );
};

/** Dashed silhouette left behind when an item is "forgotten". */
const GhostOutline: React.FC<{kind: ProductKind; w: number; h: number; opacity: number}> = ({kind, w, h, opacity}) => (
  <svg width={w} height={h} viewBox={`0 0 ${PRODUCT_W} ${PRODUCT_H}`} style={{position: 'absolute', inset: 0, opacity, overflow: 'visible'}}>
    <path
      d="M34 104 Q34 76 70 70 Q110 62 132 44 L168 44 Q190 62 230 70 Q266 76 266 104 L266 316 Q266 346 236 346 L64 346 Q34 346 34 316 Z"
      fill="rgba(255,74,94,0.06)"
      stroke={COLORS.false}
      strokeWidth={4}
      strokeDasharray="14 12"
    />
    <text x={150} y={225} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={64} fill={COLORS.false} opacity={0.85}>
      ؟
    </text>
    <text x={150} y={300} textAnchor="middle" direction="rtl" fontFamily={FONTS.display} fontWeight={700} fontSize={28} fill="rgba(255,255,255,0.6)">
      {LABEL[kind].text}
    </text>
  </svg>
);
