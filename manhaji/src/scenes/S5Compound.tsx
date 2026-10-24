import React from 'react';
import {CUES as Q, seg} from '../timeline';
import {C, FALSE_C, FONT_HEAD, TRUE_C} from '../theme';
import {BigWord, Battery, Chip, Glow, Lamp, PowerSource, StatementCard, Verdict, Wire} from '../components/kit';
import {E, clamp, p, pop} from '../lib/anim';

// Scene 5 — the same two statements, joined two ways.
//   OR  (عبارة فصل): sources wired in parallel  → either one lights the lamp → True
//   AND (عبارة وصل): sources wired in series    → the dead grid breaks the chain → False

const LAMP = {x: 540, y: 560};
const NODE_Y = 820;
const PLUG = {x: 800, y: 1060};
const BATT = {x: 280, y: 1060};

// wire paths
const A = `M ${PLUG.x} ${PLUG.y - 75} V ${NODE_Y} H ${LAMP.x}`; // grid → junction
const B = `M ${BATT.x} ${BATT.y - 110} V ${NODE_Y} H ${LAMP.x}`; // battery → junction (parallel)
const L = `M ${LAMP.x} ${NODE_Y} V ${LAMP.y + 88}`; // junction → lamp
const BS = `M ${BATT.x} ${BATT.y + 110} V 1210 H ${PLUG.x} V ${PLUG.y + 75}`; // battery → grid (series)

const Eq: React.FC<{t: number; y: number; tokens: {s: string; at: number; c: string; big?: boolean}[]; o: number; children?: React.ReactNode}> = ({t, y, tokens, o, children}) => (
  <div dir="rtl" style={{position: 'absolute', left: 0, top: y, width: 1080, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, opacity: o}}>
    {tokens.map((k, i) => {
      const a = pop(t, k.at, 0.45);
      return (
        <div
          key={i}
          style={{
            fontFamily: FONT_HEAD,
            fontWeight: 900,
            fontSize: k.big ? 104 : 84,
            color: k.c,
            opacity: clamp(a * 1.5),
            transform: `translateY(${(1 - a) * 30}px) scale(${0.6 + 0.4 * a})`,
            textShadow: `0 0 30px ${k.c}66, 0 8px 20px rgba(0,0,0,0.6)`,
            minWidth: 60,
            textAlign: 'center',
          }}
        >
          {k.s}
        </div>
      );
    })}
    <div style={{position: 'relative', width: 124, height: 124}}>{children}</div>
  </div>
);

export const S5Compound: React.FC<{t: number}> = ({t}) => {
  const orSeg = seg('or');
  const andSeg = seg('and');
  const isAnd = t >= Q.wAnd4;

  // circuit lifecycle
  const drawIn = p(t, orSeg.start + 0.1, 1.0, E.inOut);
  const orLive = t >= Q.wQ3 + 0.1 && t < andSeg.start + 0.25 ? p(t, Q.wQ3 + 0.1, 0.25) : 0;
  const lampOr = t >= 46.35 && t < andSeg.start + 0.25 ? Math.min(1, (t - 46.35) / 0.12) : 0;
  const rewire = p(t, Q.wAnd4, 0.7, E.inOut);
  const seriesLive = t >= Q.wAnd4 + 0.75 ? 1 : 0;
  const seriesDraw = p(t, Q.wAnd4 + 0.75, 0.5, E.inOut); // current racing along the series wire
  const zapT = Q.wAnd4 + 1.25;
  const zap = t > zapT && t < zapT + 0.6 ? 1 - (t - zapT) / 0.6 : 0;

  // builder row
  const pIn = pop(t, Q.wP3, 0.5);
  const qIn = pop(t, Q.wQ3, 0.5);
  const conn = pop(t, Q.wOr3, 0.5);
  const morph = p(t, Q.wAnd4 - 0.05, 0.35, E.inOut);
  const waw = p(t, Q.wWaw + 0.3, 0.6, E.out);

  // verdicts
  const orResult = pop(t, 46.6, 0.45);
  const orFade = 1 - p(t, andSeg.start, 0.4);
  const andResult = pop(t, Q.wKhata, 0.4);
  const flash = t > Q.wKhata && t < Q.wKhata + 0.5 ? 1 - (t - Q.wKhata) / 0.5 : 0;
  const fasl = pop(t, Q.wFasl + 0.62, 0.4);
  const wasl = pop(t, Q.wWasl + 0.85, 0.4);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {/* builder: [الكهرباء شغالة] (أو / و) [البطارية شغالة] */}
      <StatementCard x={830} y={330} text="الكهرباء شغّالة" icon="plug" width={380} size={36} o={clamp(pIn * 2)} s={0.6 + 0.4 * pIn} accent={FALSE_C} />
      <StatementCard x={250} y={330} text="البطارية شغّالة" icon="battery" width={380} size={36} o={clamp(qIn * 2)} s={0.6 + 0.4 * qIn} accent={TRUE_C} />
      <Verdict x={990} y={262} v="F" size={64} s={pIn} o={pIn} />
      <Verdict x={410} y={262} v="T" size={64} s={qIn} o={qIn} />
      <Glow x={540} y={330} r={200} color={C.cyan} o={conn * 0.5 + waw * 0.6} />
      <BigWord x={540} y={330} text="أو" size={110} color={C.cyan} o={conn * (1 - morph)} s={(0.5 + 0.5 * conn) * (1 - 0.4 * morph)} depth={8} />
      <BigWord x={540} y={330} text="و" size={130} color={C.sky} o={morph} s={(0.6 + 0.4 * morph) * (1 + 0.55 * waw)} depth={8} />
      {waw > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 - 150 - 120 * waw,
            top: 330 - 150 - 120 * waw,
            width: (150 + 120 * waw) * 2,
            height: (150 + 120 * waw) * 2,
            borderRadius: '50%',
            border: `4px solid ${C.sky}`,
            opacity: (1 - waw) * 0.9,
          }}
        />
      ) : null}

      {/* the circuit */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <Wire d={A} t={t} live={0} draw={drawIn} len={900} />
        <Wire d={B} t={t} live={orLive} draw={drawIn * (1 - rewire)} color={C.turq} len={900} />
        <Wire d={L} t={t} live={orLive} draw={drawIn} color={C.turq} len={300} />
        <Wire d={BS} t={t} live={seriesLive} draw={rewire} color={C.turq} len={1000} />
        {/* the current only makes it to the dead grid source */}
        {seriesLive ? <Wire d={BS} t={t} live={1} draw={seriesDraw} color="#E9FDFF" width={5} len={1000} dim={0} /> : null}
        <circle cx={LAMP.x} cy={NODE_Y} r={12} fill={orLive ? C.turq : '#24425F'} opacity={drawIn * (1 - rewire * 0.6)} />
        {zap > 0
          ? Array.from({length: 14}).map((_, i) => {
              const a = (i / 14) * Math.PI * 2 + i * 1.7;
              const r0 = 70 + (1 - zap) * 50;
              const r1 = r0 + 50 * zap;
              return <line key={i} x1={PLUG.x + Math.cos(a) * r0} y1={PLUG.y + Math.sin(a) * r0} x2={PLUG.x + Math.cos(a) * r1} y2={PLUG.y + Math.sin(a) * r1} stroke={i % 2 ? C.warm : FALSE_C} strokeWidth={6} strokeLinecap="round" opacity={zap} />;
            })
          : null}
      </svg>
      <Lamp id="s5" x={LAMP.x} y={LAMP.y} cord={180} on={lampOr} cone={false} />
      <PowerSource x={PLUG.x} y={PLUG.y} alive={0} dead={drawIn} scale={0.9} />
      <Battery x={BATT.x} y={BATT.y} level={0.75} active={Math.max(0.2, orLive, seriesLive)} scale={0.9} />
      <Glow x={PLUG.x} y={PLUG.y} r={220} color={FALSE_C} o={zap * 0.8} />

      {/* the equation: F (أو | و) T = ? */}
      <Eq
        t={t}
        y={1255}
        o={drawIn}
        tokens={[
          {s: 'F', at: Q.wP3 + 0.6, c: FALSE_C},
          {s: isAnd ? 'و' : 'أو', at: Q.wOr3, c: isAnd ? C.sky : C.cyan},
          {s: 'T', at: Q.wQ3 + 0.3, c: TRUE_C},
          {s: '=', at: 46.45, c: C.warm},
        ]}
      >
        <Verdict x={62} y={62} v="T" size={124} s={orResult} o={orResult * orFade} />
        <Verdict x={62} y={62} v="F" size={124} s={andResult * (1 + 0.25 * flash)} o={andResult} />
      </Eq>
      <Chip x={540} y={1470} text="عبارة فصل" color={C.cyan} size={50} o={fasl * orFade} s={1.4 - 0.4 * fasl} glow={0.6} />
      <Chip x={540} y={1470} text="عبارة وصل" color={C.sky} size={50} o={wasl} s={1.4 - 0.4 * wasl} glow={0.6} />
      {/* verdict flash */}
      {flash > 0 ? <div style={{position: 'absolute', inset: -400, background: `radial-gradient(circle at 50% 70%, ${FALSE_C}55, transparent 60%)`, opacity: flash}} /> : null}
    </div>
  );
};
