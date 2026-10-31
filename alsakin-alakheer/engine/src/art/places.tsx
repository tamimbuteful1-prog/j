import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {P, VIDEO} from '../theme';
import {Beam, Glow, Layer} from '../fx';

/** Riyadh, night: an older four-storey block, one dim window lit (Nawaf's), street lamp, palms, empty street */
export const Exterior: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const lampFlick = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 3.7);
  return (
    <>
      <Layer d={0.15}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, #03060c 0%, #0a1424 55%, #16233a 100%)'}} />
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          {Array.from({length: 40}).map((_, i) => (
            <circle key={i} cx={random(`sx${i}`) * 1080} cy={random(`sy${i}`) * 700} r={random(`sr${i}`) * 1.6 + 0.4} fill="#cfe0ff" opacity={0.2 + 0.4 * random(`so${i}`) * (0.7 + 0.3 * Math.sin(t * 2 + i))} />
          ))}
        </svg>
      </Layer>
      {/* far skyline */}
      <Layer d={0.35}>
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <path d="M 0 1100 L 0 980 L 90 980 L 90 930 L 180 930 L 180 1010 L 260 1010 L 260 900 L 330 900 L 330 1000 L 470 1000 L 470 950 L 560 950 L 560 1020 L 700 1020 L 700 920 L 760 920 L 760 990 L 900 990 L 900 940 L 1080 940 L 1080 1100 Z" fill="#0b1322" />
          {Array.from({length: 18}).map((_, i) => (
            <rect key={i} x={20 + i * 58} y={960 + (i % 3) * 22} width={8} height={10} fill={P.warm} opacity={random(`fw${i}`) > 0.6 ? 0.35 : 0} />
          ))}
        </svg>
      </Layer>
      {/* the building */}
      <Layer d={0.7}>
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <defs>
            <linearGradient id="fac" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#1d2533" />
              <stop offset="1" stopColor="#121822" />
            </linearGradient>
          </defs>
          <rect x={170} y={560} width={760} height={900} fill="url(#fac)" />
          <rect x={150} y={540} width={800} height={30} fill="#0f141d" />
          {[0, 1, 2, 3].map((f) => (
            <g key={f}>
              <rect x={170} y={760 + f * 190} width={760} height={10} fill="#0e131b" />
              {[0, 1, 2].map((w) => {
                const lit = f === 1 && w === 2;
                const x = 230 + w * 240;
                const y = 610 + f * 190;
                return (
                  <g key={w}>
                    <rect x={x} y={y} width={150} height={120} fill={lit ? '#5a4526' : '#0a0e15'} />
                    {lit && <rect x={x} y={y} width={150} height={120} fill={P.warm} opacity={0.22} />}
                    <rect x={x} y={y} width={150} height={120} fill="none" stroke="#0a0d12" strokeWidth={8} />
                    <line x1={x + 75} y1={y} x2={x + 75} y2={y + 120} stroke="#0a0d12" strokeWidth={6} />
                    <rect x={x - 10} y={y + 120} width={170} height={12} fill="#0d1219" />
                  </g>
                );
              })}
            </g>
          ))}
          {/* entrance */}
          <rect x={470} y={1300} width={160} height={160} fill="#0a0e15" />
          <rect x={470} y={1300} width={160} height={160} fill={P.warm} opacity={0.06} />
        </svg>
        <Glow x={775} y={860} r={150} color="rgba(240,192,106,0.35)" />
      </Layer>
      {/* street, lamp, palms, a parked car */}
      <Layer d={1.1}>
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <rect x={0} y={1460} width={1080} height={460} fill="#0b0d11" />
          <rect x={0} y={1460} width={1080} height={26} fill="#151922" />
          <rect x={0} y={1680} width={1080} height={8} fill="#222832" opacity={0.6} />
          {/* palm (left) */}
          <path d="M 110 1470 C 120 1300, 104 1150, 128 1000" stroke="#0a0c10" strokeWidth={22} fill="none" />
          {[-60, -25, 10, 45, 80, 115, 150].map((a, i) => (
            <path key={i} d={`M 128 1000 Q ${128 + Math.cos((a * Math.PI) / 180) * 120} ${1000 - 60 + i * 8} ${128 + Math.cos((a * Math.PI) / 180) * 220} ${1000 + Math.sin((a * Math.PI) / 180) * 120}`} stroke="#090b0f" strokeWidth={14} fill="none" />
          ))}
          {/* lamp post (right) */}
          <rect x={942} y={1000} width={14} height={470} fill="#0b0d12" />
          <path d="M 949 1000 C 949 960, 900 950, 870 960" stroke="#0b0d12" strokeWidth={12} fill="none" />
          <rect x={846} y={956} width={46} height={16} rx={6} fill="#2a2418" />
          {/* parked car */}
          <path d="M 520 1600 C 540 1540, 600 1520, 680 1520 L 800 1520 C 860 1520, 900 1560, 920 1600 L 960 1610 L 960 1660 L 500 1660 L 500 1610 Z" fill="#0d1016" />
          <circle cx={590} cy={1662} r={30} fill="#050608" />
          <circle cx={880} cy={1662} r={30} fill="#050608" />
        </svg>
        <Beam points={`852,970 892,970 1080,1480 650,1480`} color={P.warm} a={0.28 * lampFlick} />
        <Glow x={869} y={972} r={70} color={`rgba(255,214,140,${0.9 * lampFlick})`} />
        <Glow x={860} y={1480} r={260} color={`rgba(240,192,106,${0.25 * lampFlick})`} sx={1.4} />
      </Layer>
    </>
  );
};

/** floor-level shot: the gap under the door, floor planks running toward it */
export const FloorGap: React.FC<{gap?: number; feet?: number; inside?: number; reveal?: number; sway?: number}> = ({gap = 1, feet = 0, inside = 0, reveal = 0, sway = 0}) => {
  const frame = useCurrentFrame();
  const t = frame / VIDEO.fps;
  const g = gap * (0.92 + 0.08 * Math.sin(t * 7.3) * Math.sin(t * 2.1));
  const gy = 820; // gap line height on screen
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        <defs>
          <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0d0c10" />
            <stop offset="1" stopColor="#17151a" />
          </linearGradient>
          <linearGradient id="spill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.warm} stopOpacity={0.6 * g} />
            <stop offset="1" stopColor={P.warm} stopOpacity={0} />
          </linearGradient>
          <filter id="sb">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="sb2">
            <feGaussianBlur stdDeviation="20" />
          </filter>
        </defs>
        {/* door (bottom part), dark */}
        <rect x={0} y={0} width={1080} height={gy} fill="#120d0a" />
        <rect x={0} y={0} width={1080} height={gy} fill="#000" opacity={0.5} />
        <rect x={90} y={120} width={900} height={560} fill="none" stroke="#000" strokeOpacity={0.4} strokeWidth={10} />
        {/* floor */}
        <rect x={0} y={gy} width={1080} height={1920 - gy} fill="url(#fl)" />
        {Array.from({length: 15}).map((_, i) => (
          <line key={i} x1={540 + (i - 7) * 80} y1={gy} x2={540 + (i - 7) * 420} y2={1920} stroke="#000" strokeOpacity={0.5} strokeWidth={3} />
        ))}
        {/* the gap: a line of warm light, spilling toward the camera */}
        <rect x={0} y={gy - 8} width={1080} height={14} fill={P.warm} opacity={g} />
        <polygon points={`0,${gy} 1080,${gy} 1080,${gy + 520} 0,${gy + 520}`} fill="url(#spill)" filter="url(#sb)" />
        {/* feet blocking the light: the "person standing at the door" */}
        <g opacity={feet}>
          <rect x={360} y={gy - 9} width={120} height={16} fill="#000" />
          <rect x={600} y={gy - 9} width={120} height={16} fill="#000" />
          <polygon points={`350,${gy} 490,${gy} 520,${gy + 380} 300,${gy + 380}`} fill="#000" opacity={0.6} filter="url(#sb)" />
          <polygon points={`590,${gy} 730,${gy} 780,${gy + 380} 560,${gy + 380}`} fill="#000" opacity={0.6} filter="url(#sb)" />
        </g>
        {/* the truth: that shadow starts from INSIDE the room (bottom of frame) and points to the door */}
        <g opacity={inside} filter="url(#sb)">
          <path
            d={`M ${300 + sway * 10} 1920 C ${340 + sway * 14} ${1500 - reveal * 80}, ${420 + sway * 8} ${1100 - reveal * 60}, 470 ${gy + 4} L 610 ${gy + 4} C ${660 + sway * 8} ${1100 - reveal * 60}, ${760 + sway * 12} ${1500 - reveal * 80}, ${800 + sway * 10} 1920 Z`}
            fill="#000"
            opacity={0.9}
          />
        </g>
      </svg>
      <Glow x={540} y={gy} r={420} color={`rgba(240,192,106,${0.25 * g})`} sx={1.8} />
    </AbsoluteFill>
  );
};

/** bedside: the digital clock on the nightstand */
export const Clock: React.FC<{time: string; jolt?: number; glow?: number}> = ({time, jolt = 0, glow = 1}) => (
  <AbsoluteFill style={{background: 'radial-gradient(70% 50% at 50% 55%, #10161f, #040507)'}}>
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <rect x={-50} y={1180} width={1180} height={760} fill="#120f0e" />
      <rect x={-50} y={1180} width={1180} height={14} fill="#1d1916" />
      <g transform={`translate(${jolt * 3} ${-Math.abs(jolt) * 2})`}>
        <rect x={180} y={820} width={720} height={360} rx={40} fill="#0a0b0e" />
        <rect x={210} y={850} width={660} height={300} rx={26} fill="#050506" />
      </g>
      {/* phone face-down + a glass of water */}
      <rect x={690} y={1214} width={260} height={30} rx={10} fill="#07080b" />
      <rect x={120} y={1060} width={80} height={130} rx={8} fill="#7f9bb8" opacity={0.15} />
    </svg>
    <div style={{position: 'absolute', left: 210 + jolt * 3, top: 850 - Math.abs(jolt) * 2, width: 660, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Alexandria', monospace", fontWeight: 400, fontSize: 210, letterSpacing: 6, color: '#ff3b2e', textShadow: `0 0 ${30 * glow}px rgba(255,60,40,0.85), 0 0 ${90 * glow}px rgba(255,60,40,0.4)`, direction: 'ltr'}}>
      {time}
    </div>
    <Glow x={540} y={1000} r={520} color={`rgba(255,60,40,${0.18 * glow})`} sx={1.3} />
  </AbsoluteFill>
);
