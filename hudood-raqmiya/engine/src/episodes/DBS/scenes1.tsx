import React from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {EASE, ramp} from '../../lib/anim';
import {VIDEO} from '../../theme';
import {Beam, Blinds, Cam, Dust, Glow, K} from './look';
import {Person} from './icons';

const useT = () => useCurrentFrame() / VIDEO.fps;
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** dark desk surface, seen from above */
export const Desk: React.FC<{tone?: string}> = ({tone = K.wood}) => (
  <AbsoluteFill style={{background: `radial-gradient(90% 70% at 50% 50%, ${tone} 0%, #05080c 100%)`}}>
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5}}>
      {Array.from({length: 26}).map((_, i) => (
        <path key={i} d={`M -40 ${i * 78 + random(`g${i}`) * 30} C 300 ${i * 78 + 20}, 700 ${i * 78 - 18}, 1120 ${i * 78 + random(`h${i}`) * 30}`} stroke="#000" strokeOpacity={0.35} strokeWidth={1 + random(`w${i}`) * 2} fill="none" />
      ))}
    </svg>
  </AbsoluteFill>
);

/** a phone lying on the desk; screen = the incident (cracked, pulsing red) */
const PhoneOnDesk: React.FC<{t: number; light: number}> = ({t, light}) => {
  const buzz = (a: number) => (t > a && t < a + 0.5 ? Math.sin(t * 160) * 4 * (1 - (t - a) / 0.5) : 0);
  const j = buzz(0.8) + buzz(2.0);
  const pulse = 0.55 + 0.45 * Math.sin(t * 5.2) ** 2;
  return (
    <g transform={`translate(${540 + j} 980) rotate(-14)`}>
      <rect x={-205} y={-420} width={410} height={840} rx={56} fill="#05070a" stroke="#1a2230" strokeWidth={6} />
      <rect x={-188} y={-402} width={376} height={804} rx={42} fill="#140608" />
      <rect x={-188} y={-402} width={376} height={804} rx={42} fill={K.red} opacity={0.18 * pulse} />
      {/* the post on screen: avatar + blank bars, red-tinted */}
      <g opacity={0.85}>
        <circle cx={120} cy={-320} r={34} fill={K.red} opacity={0.7} />
        <rect x={-150} y={-336} width={220} height={16} rx={8} fill="#5a2a31" />
        <rect x={-110} y={-304} width={180} height={12} rx={6} fill="#3e1d22" />
        <rect x={-150} y={-250} width={300} height={260} rx={18} fill="#3a1218" />
        {[40, 72, 104].map((y, i) => (
          <rect key={y} x={-150 + i * 30} y={y} width={300 - i * 30} height={14} rx={7} fill="#4b2329" />
        ))}
      </g>
      {/* cracks spreading from the impact point */}
      <g stroke="#ffd6dc" strokeOpacity={0.55} strokeWidth={2.5} fill="none">
        {Array.from({length: 11}).map((_, i) => {
          const a = (i / 11) * Math.PI * 2 + random(`ca${i}`) * 0.4;
          const L = 120 + random(`cl${i}`) * 300;
          const mx = Math.cos(a) * L * 0.5 + (random(`cm${i}`) - 0.5) * 40;
          const my = Math.sin(a) * L * 0.5 + (random(`cn${i}`) - 0.5) * 40;
          return <path key={i} d={`M 40 -60 L ${40 + mx} ${-60 + my} L ${40 + Math.cos(a) * L} ${-60 + Math.sin(a) * L}`} />;
        })}
      </g>
      <rect x={-188} y={-402} width={376} height={804} rx={42} fill="#fff" opacity={0.05 + 0.08 * light} />
    </g>
  );
};

/** S1 — the scene of the incident: a dark desk, the phone, a forensic flashlight finding it */
export const S1Scene: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const find = ramp(f, 1.9, 3.0, EASE.inOut);
  const lx = interpolate(find, [0, 1], [180, 600]);
  const ly = interpolate(find, [0, 1], [500, 930]);
  const on = ramp(f, 0.35, 0.5);
  const dive = ramp(f, 4.4, 5.3, EASE.in);
  const s = interpolate(t, [0, 4.4], [1.05, 1.22], cl) * (1 + dive * 4.2);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Cam s={s} r={interpolate(t, [0, 5], [-2, 2])} ox={575} oy={920}>
        <Desk />
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          {/* evidence markers (blank tents), a cup ring, a pen, a fingerprint card */}
          {[[230, 420], [860, 1480], [180, 1560]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${i * 23 - 10})`}>
              <path d="M -40 30 L 0 -40 L 40 30 Z" fill={K.amber} opacity={0.85} />
              <circle cx={0} cy={8} r={9} fill="#3a2a12" />
            </g>
          ))}
          <circle cx={860} cy={420} r={92} fill="none" stroke="#2a1e14" strokeWidth={12} opacity={0.7} />
          <rect x={720} y={1180} width={300} height={16} rx={8} fill="#1b2533" transform="rotate(32 870 1188)" />
          <g transform="translate(250 1250) rotate(8)">
            <rect x={-110} y={-80} width={220} height={160} rx={8} fill="#cfd8e2" opacity={0.85} />
            {Array.from({length: 7}).map((_, i) => (
              <ellipse key={i} cx={0} cy={0} rx={18 + i * 7} ry={24 + i * 8} fill="none" stroke="#5b6878" strokeWidth={2} />
            ))}
          </g>
          <PhoneOnDesk t={t} light={find} />
        </svg>
        {/* the incident's own light on the desk */}
        <Glow x={560} y={980} r={560} c={`rgba(255,84,104,${0.22 + 0.1 * Math.sin(t * 5.2) ** 2})`} />
        <Blinds a={0.55 * on} />
        {/* investigator's flashlight */}
        <Glow x={lx} y={ly} r={360} c="rgba(200,226,255,0.55)" a={on} />
        <Dust n={50} a={on * 0.8} box={[lx - 380, ly - 380, 760, 760]} />
      </Cam>
      {/* off-screen torch cone sweeping in from the top-left */}
      <Beam x={-120} y={-160} tx={lx} ty={ly} w0={40} w1={300} a={on * 0.55 * (1 - dive)} />
      <AbsoluteFill style={{background: '#000', opacity: 1 - on}} />
    </AbsoluteFill>
  );
};

/** S2 — inside the screen: every reply inflates the red balloon; the algorithm feeds on interaction */
export const S2Balloon: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const N = 22;
  const at = (i: number) => 0.5 + 3.9 * Math.pow(i / N, 0.75);
  const count = Array.from({length: N}).filter((_, i) => t > at(i)).length;
  const grow = interpolate(count, [0, N], [70, 460]);
  const wob = Math.sin(t * 9) * 6 * (count / N);
  const R = grow + wob;
  const press = ramp(f, 4.2, 5.2, EASE.in);
  const pull = interpolate(t, [0, 5.4], [1.25, 0.92], {...cl, easing: EASE.soft});
  return (
    <AbsoluteFill style={{background: `radial-gradient(80% 60% at 50% 40%, #142235, ${K.bg})`}}>
      <Cam s={pull} shake={1 + press * 6} oy={900}>
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          <defs>
            <pattern id="s2g" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="rgba(120,196,252,0.07)" />
            </pattern>
            <radialGradient id="bal" cx="38%" cy="32%" r="70%">
              <stop offset="0" stopColor="#ff9aa6" />
              <stop offset="0.35" stopColor={K.red} />
              <stop offset="1" stopColor="#5d0c18" />
            </radialGradient>
          </defs>
          <rect width="1080" height="1920" fill="url(#s2g)" />
          {/* spread network reaching the edges as the balloon grows */}
          {Array.from({length: 30}).map((_, i) => {
            const a = random(`na${i}`) * Math.PI * 2;
            const d = 520 + random(`nd${i}`) * 520;
            const x = 540 + Math.cos(a) * d * 0.7, y = 720 + Math.sin(a) * d;
            const k = interpolate(count, [i * 0.7, i * 0.7 + 2], [0, 1], cl);
            return (
              <g key={i} opacity={k}>
                <line x1={540} y1={720} x2={540 + (x - 540) * k} y2={720 + (y - 720) * k} stroke={K.red} strokeOpacity={0.3} strokeWidth={2} />
                <circle cx={x} cy={y} r={8 + random(`nr${i}`) * 10} fill={K.red} opacity={0.6 * k} />
              </g>
            );
          })}
          {/* the balloon */}
          <ellipse cx={540} cy={720 - (R - 70) * 0.3} rx={R * 0.92} ry={R} fill="url(#bal)" />
          <ellipse cx={540 - R * 0.35} cy={720 - (R - 70) * 0.3 - R * 0.45} rx={R * 0.16} ry={R * 0.26} fill="#fff" opacity={0.35} transform={`rotate(-25 ${540 - R * 0.35} ${720 - R * 0.45})`} />
          <path d={`M 540 ${720 - (R - 70) * 0.3 + R} l -14 20 l 28 0 z`} fill="#7a1220" />
          <path d={`M 540 ${720 - (R - 70) * 0.3 + R + 20} C 520 ${1000}, 560 1060, 540 1140`} stroke="#ffb3bc" strokeOpacity={0.5} strokeWidth={3} fill="none" />
        </svg>
        {/* the post the balloon is tied to */}
        <div style={{position: 'absolute', left: 190, top: 1140, width: 700, height: 300, borderRadius: 34, background: K.panel, border: `2px solid ${K.red}`, boxShadow: `0 0 60px rgba(255,84,104,0.35)`}}>
          <div style={{position: 'absolute', right: 34, top: 34, width: 74, height: 74, borderRadius: 37, background: K.red, opacity: 0.8}} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', right: 130, top: 44 + i * 40, width: 460 - i * 90, height: 18, borderRadius: 9, background: '#2a3d52'}} />
          ))}
          <div style={{position: 'absolute', left: 34, right: 34, bottom: 34, height: 70, borderRadius: 14, background: '#1b2a3c'}} />
        </div>
        {/* replies stacking under it, each pumping the balloon */}
        {Array.from({length: N}).map((_, i) => {
          const k = ramp(f, at(i), at(i) + 0.25);
          if (k <= 0) return null;
          const col = i % 3;
          const x = 120 + col * 290 + (random(`bx${i}`) - 0.5) * 50;
          const y = 1500 + Math.floor(i / 3) * 70 - (count > 9 ? (count - 9) * 22 : 0);
          return (
            <div key={i} style={{position: 'absolute', left: x, top: y, width: 230, height: 92, borderRadius: 22, background: '#16263a', border: `2px solid rgba(255,84,104,${0.4 + 0.5 * (1 - k)})`, opacity: k, transform: `scale(${0.6 + 0.4 * k})`}}>
              <div style={{position: 'absolute', right: 18, top: 18, width: 30, height: 30, borderRadius: 15, background: '#ff8a97', opacity: 0.6}} />
              <div style={{position: 'absolute', right: 60, top: 24, width: 130, height: 12, borderRadius: 6, background: '#2f4660'}} />
              <div style={{position: 'absolute', right: 60, top: 50, width: 90, height: 12, borderRadius: 6, background: '#263a51'}} />
            </div>
          );
        })}
        {/* pump pulses up the string */}
        {Array.from({length: N}).map((_, i) => {
          const k = ramp(f, at(i), at(i) + 0.45, EASE.soft);
          if (k <= 0 || k >= 1) return null;
          return <Glow key={`p${i}`} x={540} y={1140 - k * 260} r={40} c="rgba(255,150,165,0.9)" a={1 - k} />;
        })}
      </Cam>
      <AbsoluteFill style={{background: K.red, opacity: press * 0.25, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

/** S3 — the evidence wall: accounts, masks, strings… all leading to one target: you */
export const S3Wall: React.FC = () => {
  const f = useCurrentFrame();
  const t = useT();
  const pan = interpolate(t, [0, 3.2], [260, 0], {...cl, easing: EASE.soft});
  const push = interpolate(t, [2.8, 6.6], [1, 1.5], {...cl, easing: EASE.inOut});
  const swing = Math.sin(t * 1.3) * 120;
  const puppet = ramp(f, 2.2, 3.6, EASE.out);
  const pull = Math.sin(t * 2.2) * 12 * puppet;
  const target = {x: 540, y: 1040};
  const cards: [number, number, number, 'mask' | 'smile' | 'plain'][] = [
    [190, 520, -6, 'mask'], [520, 400, 3, 'plain'], [870, 560, 7, 'mask'], [150, 1000, 4, 'smile'], [930, 1060, -5, 'plain'],
    [230, 1490, -3, 'mask'], [860, 1520, 6, 'smile'], [540, 1620, -2, 'plain'],
  ];
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Cam s={push} x={pan} ox={540} oy={1040}>
        <AbsoluteFill style={{background: `radial-gradient(70% 55% at ${50 + swing / 22}% 45%, #1a2431 0%, ${K.wall} 60%, #040609 100%)`}} />
        <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
          {/* strings */}
          {cards.map(([x, y], i) => {
            const k = ramp(f, 0.4 + i * 0.18, 1.2 + i * 0.18, EASE.inOut);
            return <line key={`s${i}`} x1={x} y1={y - 90} x2={x + (target.x - x) * k} y2={y - 90 + (target.y - 120 - (y - 90)) * k} stroke={K.red} strokeWidth={4} opacity={0.85} />;
          })}
          {/* cards */}
          {cards.map(([x, y, r, kind], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
              <rect x={-110} y={-120} width={220} height={250} fill="#c9d2dc" />
              <rect x={-94} y={-104} width={188} height={178} fill="#1a2533" />
              <g transform="translate(0 -10)">
                <Person c="#3a4a5e" s={1.05} />
              </g>
              {kind === 'mask' && <path d="M -46 -50 C -30 -66, -10 -60, 0 -48 C 10 -60, 30 -66, 46 -50 C 44 -30, 20 -26, 0 -36 C -20 -26, -44 -30, -46 -50 Z" fill="#0a0d12" stroke={K.red} strokeWidth={3} />}
              {kind === 'smile' && (
                <g>
                  <ellipse cx={0} cy={-44} rx={38} ry={44} fill="#e8edf2" />
                  <path d="M -20 -30 Q 0 -10, 20 -30" stroke="#0a0d12" strokeWidth={4} fill="none" />
                  <circle cx={-14} cy={-56} r={5} fill="#0a0d12" />
                  <circle cx={14} cy={-56} r={5} fill="#0a0d12" />
                  {/* poison hidden between the words */}
                  <path d={`M 26 ${-10 + (t * 30) % 60} q 6 10 0 16 q -6 -6 0 -16`} fill={K.red} />
                </g>
              )}
              <circle cx={0} cy={-110} r={10} fill={K.red} />
            </g>
          ))}
          {/* the target: YOU — a figure holding a glowing phone, circled in red marker */}
          <g transform={`translate(${target.x} ${target.y + pull})`}>
            <rect x={-150} y={-170} width={300} height={330} fill="#d9e1ea" />
            <rect x={-130} y={-150} width={260} height={250} fill="#101a26" />
            <g transform="translate(0 0)">
              <Person c="#56708f" s={1.4} />
              <rect x={-18} y={20} width={36} height={58} rx={6} fill={K.blue} />
            </g>
            <ellipse cx={0} cy={-10} rx={230} ry={250} fill="none" stroke={K.red} strokeWidth={8} strokeDasharray={1600} strokeDashoffset={1600 * (1 - ramp(f, 1.6, 2.6, EASE.inOut))} transform="rotate(-8)" />
            <circle cx={0} cy={-170} r={12} fill={K.red} />
          </g>
        </svg>
        {/* swinging lamp pool on the wall */}
        <Glow x={540 + swing} y={820} r={720} c="rgba(255,195,135,0.28)" />
      </Cam>
      {/* the shadow of a hand working puppet strings, cast over the wall */}
      <AbsoluteFill style={{opacity: 0.88 * puppet, filter: 'blur(9px)', transform: `translate(${swing * 0.3}px, ${(1 - puppet) * -500}px)`}}>
        <svg viewBox="0 0 1080 1920" style={{width: '100%', height: '100%'}}>
          <g transform="translate(540 120) scale(1.6) translate(-540 0)">
          <g fill="#000">
            <path d="M 380 -40 C 400 120, 440 210, 520 240 C 600 270, 700 250, 760 190 C 800 150, 790 60, 760 -40 Z" />
            <rect x={300} y={250} width={480} height={26} rx={13} transform={`rotate(${Math.sin(t * 2.2) * 6} 540 263)`} />
            <rect x={527} y={160} width={26} height={250} rx={13} />
          </g>
          <g stroke="#000" strokeWidth={4} opacity={0.9}>
            {[320, 430, 650, 760].map((x, i) => (
              <line key={x} x1={x} y1={265} x2={540 + (i - 1.5) * 50} y2={(880 + pull - 120) / 1.6} />
            ))}
          </g>
          </g>
        </svg>
      </AbsoluteFill>
      <Dust n={40} a={0.5} />
    </AbsoluteFill>
  );
};
