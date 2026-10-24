import React from 'react';
import {random} from 'remotion';
import {CUES as Q, seg} from '../timeline';
import {C, FALSE_C, TRUE_C} from '../theme';
import {BigWord, Chip, Glow, Verdict} from '../components/kit';
import {E, clamp, lerp, p, pop} from '../lib/anim';

// Scene 6 — Venn diagrams: draw the two circles live, then compare OR (union) and AND (intersection).
// The marker "موقفنا" sits where we actually were: battery on, electricity off.

const R = 230;
const DX = 150;

const Venn: React.FC<{t: number; id: string; cx: number; cy: number; s: number; draw: [number, number]; fill: 'none' | 'union' | 'inter'; fillK: number; marker: number; markerLit: number}> = ({
  t,
  id,
  cx,
  cy,
  s,
  draw,
  fill,
  fillK,
  marker,
  markerLit,
}) => {
  const P = {x: DX, y: 0}; // electricity (right)
  const Qc = {x: -DX, y: 0}; // battery (left)
  const circ = 2 * Math.PI * R;
  const fillCol = fill === 'union' ? C.cyan : C.sky;
  // drifting elements living in each region
  const dots = Array.from({length: 18}).map((_, i) => {
    const region = i % 3; // 0 = only electricity, 1 = only battery, 2 = both
    const base = region === 0 ? {x: DX + 95, y: 0} : region === 1 ? {x: -DX - 95, y: 0} : {x: 0, y: 0};
    const rr = region === 2 ? 55 : 85;
    const a = random(`a${i}`) * 6.28 + t * (0.4 + random(`s${i}`) * 0.5) * (i % 2 ? 1 : -1);
    const d = Math.sqrt(random(`d${i}`)) * rr;
    return {x: base.x + Math.cos(a) * d, y: base.y + Math.sin(a) * d * 1.4, region};
  });
  const markerPos = {x: -DX - 110, y: 40};
  return (
    <div style={{position: 'absolute', left: cx, top: cy, transform: `scale(${s})`, transformOrigin: '0 0'}}>
      <svg width={1} height={1} style={{position: 'absolute', overflow: 'visible'}}>
        <defs>
          <clipPath id={`clipP-${id}`}>
            <circle cx={P.x} cy={P.y} r={R} />
          </clipPath>
        </defs>
        {/* fills */}
        {fill === 'union' ? (
          <g opacity={0.42 * fillK}>
            <circle cx={P.x} cy={P.y} r={R} fill={fillCol} />
            <circle cx={Qc.x} cy={Qc.y} r={R} fill={fillCol} />
          </g>
        ) : null}
        {fill === 'inter' ? <circle cx={Qc.x} cy={Qc.y} r={R} fill={fillCol} opacity={0.5 * fillK} clipPath={`url(#clipP-${id})`} /> : null}
        {/* outlines drawn live */}
        <circle cx={P.x} cy={P.y} r={R} fill="none" stroke={C.sky} strokeWidth={7} strokeDasharray={circ} strokeDashoffset={circ * (1 - draw[0])} transform={`rotate(-90 ${P.x} ${P.y})`} strokeLinecap="round" />
        <circle cx={Qc.x} cy={Qc.y} r={R} fill="none" stroke={C.turq} strokeWidth={7} strokeDasharray={circ} strokeDashoffset={circ * (1 - draw[1])} transform={`rotate(-90 ${Qc.x} ${Qc.y})`} strokeLinecap="round" />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={7} fill={d.region === 0 ? C.sky : d.region === 1 ? C.turq : C.warm} opacity={0.55 * Math.min(draw[0], draw[1])} />
        ))}
        {/* our situation */}
        {marker > 0 ? (
          <g transform={`translate(${markerPos.x} ${markerPos.y}) scale(${marker})`}>
            <circle r={34 + 10 * markerLit * Math.abs(Math.sin(t * 4))} fill={markerLit > 0.5 ? TRUE_C : FALSE_C} opacity={0.25} />
            <path d="M 0 -26 L 7 -8 L 26 -8 L 11 4 L 17 23 L 0 12 L -17 23 L -11 4 L -26 -8 L -7 -8 Z" fill={C.warm} stroke={C.ink} strokeWidth={2} />
          </g>
        ) : null}
      </svg>
      <Chip x={P.x + 60} y={-R - 50} text="الكهرباء شغّالة" color={C.sky} size={36} o={draw[0]} />
      <Chip x={Qc.x - 60} y={-R - 50} text="البطارية شغّالة" color={C.turq} size={36} o={draw[1]} />
      <Chip x={markerPos.x} y={markerPos.y + 66} text="موقفنا" color={C.warm} size={28} o={marker} pad={[4, 18]} weight={700} />
    </div>
  );
};

export const S6Venn: React.FC<{t: number}> = ({t}) => {
  const v = seg('venn');
  const d1 = p(t, v.start + 0.2, 1.0, E.inOut);
  const d2 = p(t, v.start + 0.8, 1.0, E.inOut);
  const split = p(t, 62.95, 0.8, E.inOut);
  const title = p(t, Q.wShapes, 0.4);
  const union = p(t, 63.25, 0.5);
  const inter = p(t, 64.75, 0.5);
  const marker = pop(t, v.start + 2.2, 0.5);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Glow x={540} y={900} r={620} color={C.sky} o={0.25} />
      <BigWord x={540} y={lerp(300, 175, split)} text="أشكال فن" size={lerp(116, 84, split)} o={title} s={0.85 + 0.15 * pop(t, Q.wShapes, 0.5)} />

      {/* top copy → OR (union) */}
      <Venn t={t} id="a" cx={540} cy={lerp(930, 560, split)} s={lerp(1, 0.74, split)} draw={[d1, d2]} fill={split > 0.5 ? 'union' : 'none'} fillK={union} marker={marker} markerLit={union} />
      {/* bottom copy → AND (intersection) */}
      {split > 0 ? (
        <Venn t={t} id="b" cx={540} cy={lerp(930, 1310, split)} s={lerp(1, 0.74, split)} draw={[1, 1]} fill="inter" fillK={inter} marker={marker} markerLit={0} />
      ) : null}
      <div style={{position: 'absolute', left: 120, top: 935, width: 840, height: 4, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: split}} />

      <Chip x={120} y={430} text="أو" color={C.cyan} size={64} pad={[2, 30]} o={clamp(split * 2 - 1)} glow={union} />
      <Chip x={120} y={1180} text="و" color={C.sky} size={64} pad={[2, 34]} o={clamp(split * 2 - 1)} glow={inter} />
      <Verdict x={120} y={640} v="T" size={96} s={pop(t, 63.75, 0.4)} o={pop(t, 63.75, 0.4)} />
      <Verdict x={120} y={1390} v="F" size={96} s={pop(t, 65.25, 0.4)} o={pop(t, 65.25, 0.4)} />
    </div>
  );
};
