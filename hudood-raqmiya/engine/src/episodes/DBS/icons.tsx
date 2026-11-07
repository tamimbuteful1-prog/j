import React from 'react';
import {K} from './look';

/** all symbols are drawn shapes — no letters, digits or words */
type P = {c?: string; w?: number; k?: number};

export const Bubble: React.FC<P & {children?: React.ReactNode}> = ({c = K.paper, w = 6, children}) => (
  <g>
    <path d="M -90 -70 Q -90 -100 -60 -100 L 60 -100 Q 90 -100 90 -70 L 90 20 Q 90 50 60 50 L -10 50 L -50 86 L -44 50 L -60 50 Q -90 50 -90 20 Z" fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" />
    {children}
  </g>
);

/** silence: a zipped mouth line */
export const Zip: React.FC<P> = ({c = K.paper, w = 6}) => (
  <g stroke={c} strokeWidth={w} strokeLinecap="round">
    <line x1={-50} y1={-25} x2={50} y2={-25} />
    {[-36, -18, 0, 18, 36].map((x) => (
      <line key={x} x1={x} y1={-37} x2={x} y2={-13} strokeWidth={w * 0.6} />
    ))}
  </g>
);

/** a balance scale knocked off balance and cracked (replying in good faith, but against the rules) */
export const Scale: React.FC<P> = ({c = K.amber, w = 6, k = 1}) => {
  const tilt = 16 * k;
  return (
    <g stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={0} y1={-78} x2={0} y2={30} />
      <line x1={-30} y1={32} x2={30} y2={32} />
      <g transform={`rotate(${tilt} 0 -62)`}>
        <line x1={-58} y1={-62} x2={58} y2={-62} />
        <path d="M -58 -62 L -74 -26 L -42 -26 Z" />
        <path d="M 58 -62 L 42 -26 L 74 -26 Z" />
      </g>
      <path d="M 4 -40 L -6 -22 L 6 -10 L -4 6" strokeWidth={w * 0.5} stroke={K.red} />
    </g>
  );
};

export const Flame: React.FC<P & {flick?: number}> = ({c = K.red, flick = 0}) => (
  <g>
    <path d={`M 0 ${-88 - flick * 6} C 30 -60, 46 -36, 40 -10 C 34 18, 14 30, 0 30 C -14 30, -36 18, -40 -6 C -44 -30, -24 -40, -18 -64 C -6 -50, -4 -40, 0 -30 C 8 -50, 4 -70, 0 ${-88 - flick * 6} Z`} fill={c} opacity={0.92} />
    <path d="M 0 -30 C 14 -18, 18 -4, 12 8 C 8 18, -8 18, -12 8 C -16 -4, -6 -12, 0 -30 Z" fill="#ffd2a0" opacity={0.9} />
  </g>
);

/** awareness: a magnifier over a chain link (verify + cite a source) */
export const Verify: React.FC<P> = ({c = K.green, w = 6}) => (
  <g stroke={c} strokeWidth={w} strokeLinecap="round" fill="none">
    <circle cx={-12} cy={-40} r={34} />
    <line x1={12} y1={-16} x2={42} y2={14} strokeWidth={w * 1.6} />
    <rect x={-34} y={-50} width={26} height={18} rx={9} transform="rotate(-35 -21 -41)" strokeWidth={w * 0.6} />
    <rect x={-16} y={-46} width={26} height={18} rx={9} transform="rotate(-35 -3 -37)" strokeWidth={w * 0.6} />
  </g>
);

export const Block: React.FC<P> = ({c = K.blue, w = 10}) => (
  <g stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
    <circle r={58} />
    <line x1={-41} y1={41} x2={41} y2={-41} />
  </g>
);

export const Flag: React.FC<P> = ({c = K.blue, w = 10}) => (
  <g stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
    <line x1={-36} y1={-62} x2={-36} y2={64} />
    <path d="M -36 -58 C -10 -72, 10 -44, 40 -56 L 40 2 C 10 14, -10 -14, -36 0 Z" fill={c} fillOpacity={0.25} />
  </g>
);

export const EyeOff: React.FC<P> = ({c = K.blue, w = 10}) => (
  <g stroke={c} strokeWidth={w} fill="none" strokeLinecap="round">
    <path d="M -66 0 C -40 -40, 40 -40, 66 0 C 40 40, -40 40, -66 0 Z" />
    <circle r={16} fill={c} />
    <line x1={-56} y1={48} x2={56} y2={-48} />
  </g>
);

/** API path: a connector plug with chevrons */
export const Plug: React.FC<P> = ({c = K.blue, w = 8}) => (
  <g stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x={-46} y={-30} width={92} height={70} rx={14} />
    <line x1={-20} y1={-30} x2={-20} y2={-62} />
    <line x1={20} y1={-30} x2={20} y2={-62} />
    <line x1={0} y1={40} x2={0} y2={78} />
    <path d="M -16 -6 L -28 6 L -16 18 M 16 -6 L 28 6 L 16 18" strokeWidth={w * 0.7} />
  </g>
);

/** files + prompt path: a download arrow into a folder carrying a document and a sparkle */
export const Download: React.FC<P> = ({c = K.green, w = 8}) => (
  <g stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M -62 0 L -62 60 L 62 60 L 62 0" />
    <line x1={0} y1={-76} x2={0} y2={22} />
    <path d="M -30 -8 L 0 24 L 30 -8" />
    <path d="M 44 -70 L 50 -56 L 64 -50 L 50 -44 L 44 -30 L 38 -44 L 24 -50 L 38 -56 Z" fill={c} strokeWidth={w * 0.4} />
  </g>
);

/** a reference book (the Saudi media regulations) opening */
export const Book: React.FC<P> = ({c = K.amber, w = 6, k = 1}) => (
  <g stroke={c} strokeWidth={w} fill="none" strokeLinejoin="round">
    <path d={`M 0 -40 C -30 -${50 * k}, -60 -${48 * k}, -80 -40 L -80 50 C -60 42, -30 42, 0 52 Z`} />
    <path d={`M 0 -40 C 30 -${50 * k}, 60 -${48 * k}, 80 -40 L 80 50 C 60 42, 30 42, 0 52 Z`} />
    {[-14, 4, 22].map((y) => (
      <g key={y} strokeWidth={w * 0.5} opacity={0.7}>
        <line x1={-62} y1={y} x2={-16} y2={y + 2} />
        <line x1={16} y1={y + 2} x2={62} y2={y} />
      </g>
    ))}
  </g>
);

/** a generic person silhouette (head + shoulders) */
export const Person: React.FC<{c?: string; s?: number}> = ({c = '#2b3a4d', s = 1}) => (
  <g transform={`scale(${s})`} fill={c}>
    <circle cx={0} cy={-34} r={30} />
    <path d="M -62 60 C -60 10, -30 -2, 0 -2 C 30 -2, 60 10, 62 60 Z" />
  </g>
);

/**
 * The initiative's emblem (original): a phone outline that becomes a shield, crossed by a notched
 * border line, with the green "on watch" dot from the initiative's site above it.
 */
export const Emblem: React.FC<{draw?: number; glow?: number; s?: number}> = ({draw = 1, glow = 1, s = 1}) => {
  const L = 1300;
  return (
    <g transform={`scale(${s})`}>
      <defs>
        <filter id="emb-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={10 * glow} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#emb-glow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M -120 -190 Q -120 -230 -80 -230 L 80 -230 Q 120 -230 120 -190 L 120 40 C 120 130, 60 190, 0 236 C -60 190, -120 130, -120 40 Z" stroke={K.blue} strokeWidth={14} strokeDasharray={L} strokeDashoffset={L * (1 - draw)} />
        <line x1={-30} y1={-200} x2={30} y2={-200} stroke={K.blue} strokeWidth={10} opacity={draw} />
        <path d="M -120 20 L -80 20 L -80 0 L -50 0 L -50 20 L -15 20 L -15 0 L 15 0 L 15 20 L 50 20 L 50 0 L 80 0 L 80 20 L 120 20" stroke={K.green} strokeWidth={10} strokeDasharray={420} strokeDashoffset={420 * (1 - Math.max(0, draw * 1.4 - 0.4))} />
        <circle cx={0} cy={-80} r={22} fill={K.green} stroke="none" opacity={Math.max(0, draw * 2 - 1)} />
      </g>
    </g>
  );
};
