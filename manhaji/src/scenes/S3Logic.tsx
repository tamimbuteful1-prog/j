import React from 'react';
import {CUES as Q} from '../timeline';
import {C, FALSE_C, FONT_HEAD, TRUE_C} from '../theme';
import {BigWord, Chip, Glow, Label, StatementCard} from '../components/kit';
import {E, clamp, keys, p, pop} from '../lib/anim';

// Scene 3 — "Here comes the logic lesson. In logic, a sentence we can judge as true or false is called a statement."

const GATE_Y = 1000;

export const S3Logic: React.FC<{t: number}> = ({t}) => {
  const slam = Q.wMantiq;
  const titleK = p(t, slam - 0.08, 0.35, E.expo);
  const ring = clamp((t - slam) / 0.7);

  const cardX = keys(t, [
    [Q.wJumla - 0.2, 1300],
    [Q.wJudge + 0.5, 540, E.out],
  ]);
  const scanning = t > Q.wJudge + 0.4 && t < Q.wIbara;
  const scanY = GATE_Y - 150 + ((Math.sin((t - Q.wJudge) * 4.2) + 1) / 2) * 300;
  const yes = pop(t, Q.wTrueFalse, 0.4);
  const no = pop(t, Q.wTrueFalse + 0.35, 0.4);
  const stamp = pop(t, Q.wIbara + 0.15, 0.45);
  const isStatement = t > Q.wIbara + 0.15;

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Glow x={540} y={330} r={520} color={C.sky} o={0.35 * titleK} />
      <Chip x={540} y={170} text="درس" color={C.sky} size={40} o={p(t, Q.wHere + 0.3, 0.3)} s={0.8 + 0.2 * pop(t, Q.wHere + 0.3)} />
      <BigWord x={540} y={345} text="المنطق" size={190} color={C.warm} o={titleK} s={1.7 - 0.7 * titleK} depth={14} />
      {/* shockwave from the title slam */}
      {ring > 0 && ring < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: 540 - 380 * ring - 60,
            top: 345 - 380 * ring - 60,
            width: (380 * ring + 60) * 2,
            height: (380 * ring + 60) * 2,
            borderRadius: '50%',
            border: `${6 * (1 - ring) + 1}px solid ${C.cyan}`,
            opacity: 1 - ring,
          }}
        />
      ) : null}

      {/* the judging gate */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible', opacity: p(t, Q.wFiMantiq, 0.6)}}>
        <defs>
          <linearGradient id="gate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#163A5C" />
            <stop offset="1" stopColor="#0A1C2F" />
          </linearGradient>
        </defs>
        <path d={`M 290 ${GATE_Y + 200} V ${GATE_Y - 120} Q 290 ${GATE_Y - 250} 420 ${GATE_Y - 250} H 660 Q 790 ${GATE_Y - 250} 790 ${GATE_Y - 120} V ${GATE_Y + 200}`} fill="none" stroke="url(#gate)" strokeWidth={56} strokeLinecap="round" />
        <path d={`M 290 ${GATE_Y + 200} V ${GATE_Y - 120} Q 290 ${GATE_Y - 250} 420 ${GATE_Y - 250} H 660 Q 790 ${GATE_Y - 250} 790 ${GATE_Y - 120} V ${GATE_Y + 200}`} fill="none" stroke={C.sky} strokeOpacity={0.5} strokeWidth={3} />
        {/* conveyor */}
        <line x1={40} y1={GATE_Y + 205} x2={1040} y2={GATE_Y + 205} stroke="#1D3A57" strokeWidth={10} strokeLinecap="round" />
        <line x1={40} y1={GATE_Y + 205} x2={1040} y2={GATE_Y + 205} stroke={C.sky} strokeOpacity={0.5} strokeWidth={3} strokeDasharray="18 26" strokeDashoffset={t < Q.wJudge + 0.5 ? t * 160 : (Q.wJudge + 0.5) * 160} />
        {scanning ? (
          <>
            <rect x={320} y={scanY - 3} width={440} height={6} fill={C.cyan} opacity={0.9} />
            <rect x={320} y={scanY - 30} width={440} height={60} fill={C.cyan} opacity={0.12} />
          </>
        ) : null}
      </svg>

      {/* verdict lights on top of the gate: صح / خطأ */}
      <div style={{position: 'absolute', left: 0, top: 0, opacity: p(t, Q.wFiMantiq + 0.2, 0.5)}}>
        <Glow x={640} y={GATE_Y - 330} r={130} color={TRUE_C} o={yes * (0.6 + 0.4 * Math.abs(Math.sin(t * 5)))} />
        <Glow x={440} y={GATE_Y - 330} r={130} color={FALSE_C} o={no * (0.6 + 0.4 * Math.abs(Math.cos(t * 5)))} />
        <Chip x={640} y={GATE_Y - 330} text="✓ صح" color={TRUE_C} size={40} s={0.85 + 0.25 * yes} glow={yes} bg={yes > 0.5 ? 'rgba(10,40,40,0.9)' : undefined} />
        <Chip x={440} y={GATE_Y - 330} text="✗ خطأ" color={FALSE_C} size={40} s={0.85 + 0.25 * no} glow={no} bg={no > 0.5 ? 'rgba(45,14,18,0.9)' : undefined} />
      </div>

      {/* the sentence card rides into the gate and comes out as a statement */}
      <StatementCard
        x={cardX}
        y={GATE_Y + 110}
        text={isStatement ? 'عبارة' : 'جملة'}
        icon="lines"
        accent={isStatement ? C.turq : C.sky}
        width={330}
        size={56}
        o={p(t, Q.wJumla - 0.2, 0.3)}
        s={isStatement ? 1 + 0.12 * (1 - stamp) : 1}
      />
      <Glow x={540} y={GATE_Y + 110} r={260} color={C.turq} o={stamp * 0.6} />
      <Label x={540} y={GATE_Y + 330} w={860} size={40} color={C.warm} o={p(t, Q.wIbara + 0.35, 0.4)} text="جملة نقدر نحكم عليها: صح أو خطأ" />
    </div>
  );
};
