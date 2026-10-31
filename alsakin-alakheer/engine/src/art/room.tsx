import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {P, VIDEO} from '../theme';
import {Beam, Glow} from '../fx';

/**
 * Nawaf's bedroom — ONE fixed layout, seen from the bed toward the door.
 * Every wide/medium shot of the room renders this same set, so furniture never moves.
 *   back wall x150–960 / y380–1240 · door x600–840 / y640–1240 (handle on the left)
 *   wardrobe left of the door · window on the left wall (moonlight) · floor planks to the door
 */
export type RoomState = {
  gap?: number; // warm hallway light under/around the door (0–1)
  gapShadow?: number; // two dark "feet" interrupting the light under the door (0–1)
  inside?: number; // the impossible shadow: starts inside the room and runs TO the door (0–1)
  sway?: number; // tiny independent movement of that shadow
  phone?: number; // phone screen light from the bed (bottom-left), 0–1
  knock?: number; // door/frame jolt in px
};

export const DOOR = {x0: 600, x1: 840, y0: 640, y1: 1240};

export const RoomBack: React.FC<RoomState> = ({gap = 1, gapShadow = 0, inside = 0, sway = 0, phone = 0, knock = 0}) => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const hum = 0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 2.1); // hallway bulb hums
  const g = gap * hum;
  const planks = Array.from({length: 13}).map((_, i) => {
    const fx = -260 + i * 135; // spread at the bottom edge
    const tx = 150 + (i / 12) * 810;
    return <line key={i} x1={tx} y1={1240} x2={fx} y2={1920} stroke="#000" strokeOpacity={0.45} strokeWidth={2} />;
  });
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        <defs>
          <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0c121b" />
            <stop offset="1" stopColor={P.wall2} />
          </linearGradient>
          <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f0e12" />
            <stop offset="1" stopColor={P.floor} />
          </linearGradient>
          <linearGradient id="doorG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={P.wood} />
            <stop offset="0.5" stopColor={P.wood2} />
            <stop offset="1" stopColor={P.wood} />
          </linearGradient>
          <linearGradient id="leak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.warm} stopOpacity={0.55 * g} />
            <stop offset="1" stopColor={P.warm} stopOpacity={0} />
          </linearGradient>
          <filter id="soft">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="soft2">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        {/* ceiling, side walls, back wall, floor */}
        <polygon points="0,0 1080,0 960,380 150,380" fill="#07090e" />
        <polygon points="0,0 150,380 150,1240 0,1700" fill="#0d131c" />
        <polygon points="1080,0 960,380 960,1240 1080,1700" fill="#0b1018" />
        <rect x={150} y={380} width={810} height={860} fill="url(#wallG)" />
        <polygon points="0,1700 150,1240 960,1240 1080,1700 1080,1920 0,1920" fill="url(#floorG)" />
        <g clipPath="none" opacity={0.7}>{planks}</g>
        <rect x={150} y={1222} width={810} height={18} fill="#0a0d12" />
        {/* window on the left wall + curtain */}
        <polygon points="30,560 118,612 118,900 30,950" fill="#2a4566" opacity={0.85} />
        <polygon points="30,560 118,612 118,900 30,950" fill="none" stroke="#0a0f16" strokeWidth={10} />
        <line x1={74} y1={586} x2={74} y2={925} stroke="#0a0f16" strokeWidth={7} />
        <path d="M 22 545 C 60 640, 40 760, 70 960 L 18 980 Z" fill="#101823" />
        {/* wardrobe */}
        <rect x={190} y={520} width={300} height={720} fill="#0f141c" />
        <rect x={190} y={520} width={300} height={720} fill="none" stroke="#07090d" strokeWidth={6} />
        <line x1={340} y1={530} x2={340} y2={1232} stroke="#07090d" strokeWidth={5} />
        <rect x={318} y={850} width={8} height={70} rx={4} fill="#2a3340" />
        <rect x={354} y={850} width={8} height={70} rx={4} fill="#2a3340" />
        {/* door frame + door */}
        <g transform={`translate(${knock * 0.6} 0)`}>
          <rect x={DOOR.x0 - 18} y={DOOR.y0 - 18} width={DOOR.x1 - DOOR.x0 + 36} height={DOOR.y1 - DOOR.y0 + 18} fill="#0c0f14" />
          {/* light around the door edges */}
          <rect x={DOOR.x0 - 3} y={DOOR.y0} width={4} height={DOOR.y1 - DOOR.y0} fill={P.warm} opacity={0.5 * g} filter="url(#soft)" />
          <rect x={DOOR.x1 - 1} y={DOOR.y0} width={4} height={DOOR.y1 - DOOR.y0} fill={P.warm} opacity={0.35 * g} filter="url(#soft)" />
          <rect x={DOOR.x0} y={DOOR.y0} width={DOOR.x1 - DOOR.x0} height={DOOR.y1 - DOOR.y0} fill="url(#doorG)" />
          <rect x={DOOR.x0 + 26} y={DOOR.y0 + 30} width={188} height={240} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={4} />
          <rect x={DOOR.x0 + 26} y={DOOR.y0 + 310} width={188} height={250} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={4} />
          <rect x={DOOR.x0} y={DOOR.y0} width={DOOR.x1 - DOOR.x0} height={DOOR.y1 - DOOR.y0} fill="#000" opacity={0.42} />
          <circle cx={DOOR.x0 + 30} cy={960} r={11} fill="#6b5a3e" />
          <circle cx={DOOR.x0 + 30} cy={960} r={11} fill={P.warm} opacity={0.25 * g} />
        </g>
        {/* the line of light under the door, and its spill on the floor */}
        <rect x={DOOR.x0 + 4} y={DOOR.y1 - 5} width={DOOR.x1 - DOOR.x0 - 8} height={6} fill={P.warm} opacity={0.95 * g} />
        <polygon points={`${DOOR.x0 - 30},${DOOR.y1} ${DOOR.x1 + 30},${DOOR.y1} ${DOOR.x1 + 160},${DOOR.y1 + 230} ${DOOR.x0 - 170},${DOOR.y1 + 230}`} fill="url(#leak)" filter="url(#soft)" />
        {/* feet shadows breaking the light under the door */}
        <g opacity={gapShadow}>
          <rect x={DOOR.x0 + 62} y={DOOR.y1 - 6} width={38} height={8} fill="#000" />
          <rect x={DOOR.x0 + 128} y={DOOR.y1 - 6} width={38} height={8} fill="#000" />
          <polygon points={`${DOOR.x0 + 60},${DOOR.y1} ${DOOR.x0 + 168},${DOOR.y1} ${DOOR.x0 + 200},${DOOR.y1 + 120} ${DOOR.x0 + 20},${DOOR.y1 + 120}`} fill="#000" opacity={0.55} filter="url(#soft)" />
        </g>
        {/* THE impossible shadow: begins inside the room (near the camera) and runs to the door */}
        <g opacity={inside} filter="url(#soft)">
          <path
            d={`M ${150 + sway * 8} 1920 C ${220 + sway * 12} 1720, ${560 + sway * 6} 1460, ${DOOR.x0 + 90} ${DOOR.y1 + 4} L ${DOOR.x0 + 170} ${DOOR.y1 + 4} C ${640 + sway * 6} 1480, ${470 + sway * 10} 1720, ${430 + sway * 8} 1920 Z`}
            fill="#000"
            opacity={0.88}
          />
        </g>
      </svg>
      {/* moonlight through the window: a cold beam and a patch on the floor */}
      <Beam points="30,560 118,612 118,900 30,950 330,1700 600,1560" color={P.moon} a={0.22} />
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'screen'}}>
        <polygon points="250,1480 470,1420 560,1560 330,1640" fill={P.moon} opacity={0.18} filter="url(#soft2)" />
      </svg>
      <Glow x={720} y={1250} r={260} color={`rgba(240,192,106,${0.22 * g})`} sx={1.6} />
      {phone > 0 && <Glow x={160} y={1820} r={620} color={`rgba(150,190,255,${0.28 * phone})`} />}
    </AbsoluteFill>
  );
};
