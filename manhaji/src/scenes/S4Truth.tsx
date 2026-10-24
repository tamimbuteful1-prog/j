import React from 'react';
import {CUES as Q, seg} from '../timeline';
import {C, FALSE_C, FONT_HEAD, TRUE_C} from '../theme';
import {Chip, Glow, StatementCard} from '../components/kit';
import {E, clamp, lerp, p, pop} from '../lib/anim';

// Scene 4 — "In the situation earlier: is the electricity on? No → False. Is the backup battery on? Yes → True."

const TRAY_Y = 1230;
const FALSE_X = 290;
const TRUE_X = 790;

const Tray: React.FC<{x: number; label: string; ar: string; color: string; lit: number; o: number}> = ({x, label, ar, color, lit, o}) => (
  <div style={{position: 'absolute', left: x - 205, top: TRAY_Y - 190, width: 410, height: 400, opacity: o}}>
    <Glow x={205} y={220} r={300} color={color} o={lit * 0.6} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 40,
        border: `3px solid ${color}${lit > 0.5 ? 'FF' : '88'}`,
        background: `linear-gradient(180deg, ${color}${lit > 0.5 ? '30' : '14'}, rgba(6,16,28,0.9) 70%)`,
        boxShadow: `inset 0 0 50px ${color}22, 0 30px 60px rgba(0,0,0,0.5)`,
      }}
    />
    <div style={{position: 'absolute', top: 24, width: '100%', textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 76, color, letterSpacing: 2, textShadow: `0 0 ${20 + lit * 30}px ${color}88`}}>{label}</div>
    <div dir="rtl" style={{position: 'absolute', top: 128, width: '100%', textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 38, color: C.warm, opacity: 0.75}}>{ar}</div>
  </div>
);

/** mini memory of scene 1 (four lamps, only one alive) */
const Memory: React.FC<{o: number; s: number}> = ({o, s}) => (
  <div style={{position: 'absolute', left: 540 - 230, top: 170, width: 460, height: 230, opacity: o, transform: `scale(${s}) rotate(-3deg)`, borderRadius: 26, background: '#0B1B2C', border: `2px solid ${C.sky}55`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden'}}>
    <svg width={460} height={230} viewBox="0 0 460 230">
      <line x1={40} y1={40} x2={420} y2={40} stroke="#24425F" strokeWidth={8} strokeLinecap="round" />
      {[90, 180, 270, 360].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={40} x2={x} y2={90} stroke="#24425F" strokeWidth={3} />
          {i === 2 ? <circle cx={x} cy={105} r={46} fill={C.amber} opacity={0.25} /> : null}
          <circle cx={x} cy={105} r={18} fill={i === 2 ? '#FFE7B8' : '#1C3045'} stroke={i === 2 ? C.amber : '#2E4A66'} strokeWidth={3} />
        </g>
      ))}
      <rect x={380} y={150} width={34} height={56} rx={8} fill="none" stroke={C.turq} strokeWidth={4} />
      <rect x={40} y={160} width={46} height={46} rx={12} fill="none" stroke="#2E4A66" strokeWidth={4} />
    </svg>
  </div>
);

/** card that asks, gets an answer, then flies into its tray */
const AskCard: React.FC<{
  t: number;
  text: string;
  icon: 'plug' | 'battery';
  appear: number;
  answer: number;
  answerText: string;
  answerColor: string;
  fly: number;
  land: number;
  tx: number;
}> = ({t, text, icon, appear, answer, answerText, answerColor, fly, land, tx}) => {
  const a = pop(t, appear, 0.5);
  const f = p(t, fly, land - fly, E.inOut);
  const x = lerp(540, tx, f);
  const y = lerp(720, TRAY_Y + 80, f) - Math.sin(f * Math.PI) * 220;
  const s = lerp(1, 0.66, f) * (0.7 + 0.3 * a);
  const rot = Math.sin(f * Math.PI) * (tx < 540 ? -10 : 10);
  const shake = t > answer && t < answer + 0.3 && answerColor === FALSE_C ? Math.sin((t - answer) * 70) * 10 * (1 - (t - answer) / 0.3) : 0;
  const ans = pop(t, answer, 0.4);
  const q = clamp(1 - p(t, answer - 0.1, 0.2));
  return (
    <>
      <StatementCard x={x + shake} y={y} text={text} icon={icon} accent={f > 0.95 ? answerColor : C.sky} o={p(t, appear, 0.25)} s={s} rot={rot} width={580} size={48} />
      {/* question mark → answer badge */}
      <Chip x={x + 250 * s} y={y - 95 * s} text="؟" color={C.amber} size={46} pad={[2, 22]} o={q * a} s={a} glow={0.5} />
      <Chip x={x + 250 * s} y={y - 95 * s} text={answerText} color={answerColor} size={46} pad={[4, 26]} o={ans * (1 - p(t, land - 0.25, 0.2))} s={ans} glow={1} />
    </>
  );
};

export const S4Truth: React.FC<{t: number}> = ({t}) => {
  const ex = seg('example');
  const fLand = 37.0;
  const tLand = 42.05;
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <Memory o={p(t, ex.start, 0.5) * (1 - 0.5 * p(t, Q.wP3 ?? 99, 1))} s={0.9 + 0.1 * pop(t, ex.start, 0.6)} />
      <Chip x={540} y={455} text="الموقف قبل شوي" color={C.sky} size={34} o={p(t, ex.start + 0.3, 0.4)} weight={700} />

      <Tray x={FALSE_X} label="False" ar="خطأ" color={FALSE_C} lit={pop(t, fLand, 0.35)} o={p(t, ex.start + 0.4, 0.6)} />
      <Tray x={TRUE_X} label="True" ar="صح" color={TRUE_C} lit={pop(t, tLand, 0.35)} o={p(t, ex.start + 0.55, 0.6)} />

      <AskCard t={t} text="الكهرباء شغّالة" icon="plug" appear={seg('pQ').start - 0.05} answer={seg('pNo').start} answerText="لا" answerColor={FALSE_C} fly={seg('pF').start + 0.25} land={fLand} tx={FALSE_X} />
      <AskCard t={t} text="البطارية الاحتياطية شغّالة" icon="battery" appear={seg('qQ').start - 0.05} answer={seg('qYes').start} answerText="نعم" answerColor={TRUE_C} fly={seg('qT').start + 0.3} land={tLand} tx={TRUE_X} />
    </div>
  );
};
