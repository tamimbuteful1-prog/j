import React from 'react';
import {CUES as Q} from '../timeline';
import {C, FONT_HEAD} from '../theme';
import {BigWord, Glow, Lamp} from '../components/kit';
import {E, p, pop} from '../lib/anim';

// Scene 2 — split screen: "what's the difference if I said the lamp runs on electricity AND the backup battery?"

type Word = {w: string; at: number; key?: boolean};

const Sentence: React.FC<{t: number; words: Word[]; y: number; keyColor: string}> = ({t, words, y, keyColor}) => (
  <div
    dir="rtl"
    style={{
      position: 'absolute',
      right: 90,
      top: y,
      width: 610,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px 16px',
      fontFamily: FONT_HEAD,
      fontWeight: 800,
      fontSize: 54,
      lineHeight: 1.35,
      color: C.warm,
    }}
  >
    {words.map((wd, i) => {
      const k = p(t, wd.at, 0.35, E.out);
      const s = wd.key ? 0.5 + 0.5 * pop(t, wd.at, 0.5) : 1;
      return (
        <span
          key={i}
          style={{
            opacity: k,
            transform: `translateY(${(1 - k) * 26}px) scale(${s})`,
            display: 'inline-block',
            color: wd.key ? keyColor : C.warm,
            textShadow: wd.key ? `0 0 26px ${keyColor}` : '0 6px 20px rgba(0,0,0,0.5)',
            padding: wd.key ? '0 14px' : 0,
            borderRadius: 18,
            border: wd.key ? `3px solid ${keyColor}` : 'none',
            background: wd.key ? `${keyColor}1A` : 'none',
          }}
        >
          {wd.w}
        </span>
      );
    })}
  </div>
);

export const S2Question: React.FC<{t: number}> = ({t}) => {
  const recap = 18.25;
  const q = Q.wAnd2;
  const panelIn = (d: number) => p(t, recap + d, 0.6, E.out);
  const qMark = pop(t, q + 0.35, 0.6);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <BigWord x={540} y={175} text="وش الفرق؟" size={96} color={C.warm} o={p(t, Q.wWhatDiff, 0.3)} s={0.85 + 0.15 * pop(t, Q.wWhatDiff, 0.5)} />

      {/* split screen panels */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 60,
            top: i === 0 ? 300 : 1010,
            width: 960,
            height: 640,
            borderRadius: 44,
            background: 'linear-gradient(165deg, rgba(18,44,70,0.75), rgba(6,18,32,0.75))',
            border: `2px solid ${i === 0 ? C.cyan : C.sky}44`,
            boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
            opacity: panelIn(i * 0.15),
            transform: `translateX(${(1 - panelIn(i * 0.15)) * (i ? -120 : 120)}px)`,
            overflow: 'hidden',
          }}
        />
      ))}
      <div style={{position: 'absolute', left: 120, top: 948, width: 840, height: 4, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, opacity: panelIn(0.3)}} />

      {/* top: what really happened — electricity OR battery → lamp on */}
      <div style={{opacity: panelIn(0)}}>
        <Lamp id="s2a" x={205} y={480} cord={120} on={1} scale={0.95} cone={false} />
        <Sentence
          t={t}
          y={450}
          keyColor={C.cyan}
          words={[
            {w: 'اللمبة', at: recap + 0.1},
            {w: 'تشتغل', at: recap + 0.15},
            {w: 'بالكهرباء', at: recap + 0.2},
            {w: 'أو', at: recap + 0.3, key: true},
            {w: 'البطارية', at: recap + 0.35},
          ]}
        />
      </div>

      {/* bottom: the new sentence, built word by word as he says it */}
      <div style={{opacity: panelIn(0.15)}}>
        <Lamp id="s2b" x={205} y={1190} cord={120} on={0} scale={0.95} cone={false} />
        <Glow x={205} y={1230} r={170} color={C.amber} o={qMark * (0.35 + 0.15 * Math.sin(t * 7))} />
        <BigWord x={205} y={1250} text="؟" size={150} color={C.amber} o={qMark} s={0.6 + 0.4 * qMark} depth={6} />
        <Sentence
          t={t}
          y={1160}
          keyColor={C.sky}
          words={[
            {w: 'اللمبة', at: Q.wLamp2},
            {w: 'تشتغل', at: Q.wLamp2 + 0.55},
            {w: 'بالكهرباء', at: Q.wElec2},
            {w: 'و', at: q, key: true},
            {w: 'البطارية', at: q + 0.15},
          ]}
        />
      </div>
    </div>
  );
};
