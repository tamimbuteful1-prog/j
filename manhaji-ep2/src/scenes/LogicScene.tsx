import React from 'react';
import {AbsoluteFill} from 'remotion';
import {F} from '../theme';
import {clamp, cue, easeInOutCubic, easeInOutQuint, easeOutBack, easeOutCubic, easeOutExpo, lerp, prog, spr} from '../time';
import {Bell, Button, P, World, shake} from '../components/Props';
import {Draw} from '../components/Kit';

const TOP = 760; // centre y of the «إذا» slot
const BOT = 1230; // centre y of the «فإن» slot
const SLOT_W = 900;
const SLOT_H = 270;

/** the two ideas the statements are built from */
const Card: React.FC<{kind: 'btn' | 'bell'; neg: number; t: number; act: number; pulse: number}> = ({kind, neg, t, act, pulse}) => {
  const text = kind === 'btn' ? (neg > 0.5 ? 'لم يُضغط الزر' : 'ضُغط الزر') : neg > 0.5 ? 'لم يرن الجرس' : 'رنّ الجرس';
  const accent = kind === 'btn' ? P.teal : P.orange;
  return (
    <div
      style={{
        width: 720,
        height: 190,
        borderRadius: 40,
        background: '#FFFFFF',
        boxShadow: `0 26px 60px rgba(60,45,20,0.22), 0 0 0 ${4 + 6 * pulse}px ${neg > 0.5 ? P.red : accent}${pulse > 0 ? 'FF' : '55'}`,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '0 40px',
        direction: 'rtl',
        position: 'relative',
        overflow: 'hidden',
        transform: `scale(${1 + 0.05 * pulse})`,
      }}
    >
      <div style={{width: 150, height: 150, position: 'relative', flexShrink: 0, filter: neg > 0.5 ? 'grayscale(0.8)' : undefined}}>
        {kind === 'btn' ? (
          <div style={{position: 'absolute', left: -10, top: -10}}>
            <Button size={170} press={act * (neg > 0.5 ? 0 : 1)} />
          </div>
        ) : (
          <div style={{position: 'absolute', left: 18, top: 4}}>
            <Bell size={116} t={t} ring={neg > 0.5 ? 0 : act} led={neg > 0.5 ? 0 : act} />
          </div>
        )}
        {neg > 0 && (
          <svg width={150} height={150} viewBox="0 0 150 150" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
            <circle cx={75} cy={75} r={70} fill="none" stroke={P.red} strokeWidth={12} opacity={clamp(neg * 2)} />
            <Draw d="M 25 125 L 125 25" k={neg} color={P.red} w={12} len={100} />
          </svg>
        )}
      </div>
      <div style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 70, color: neg > 0.5 ? P.red : P.ink, lineHeight: 1.2, whiteSpace: 'nowrap'}}>{text}</div>
      {/* negation stamp flash */}
      {neg > 0 && neg < 1 && <div style={{position: 'absolute', inset: 0, background: P.red, opacity: (1 - neg) * 0.35}} />}
    </div>
  );
};

const Slot: React.FC<{word: string; color: string; k: number; tag?: React.ReactNode}> = ({word, color, k, tag}) => (
  <div style={{position: 'relative', width: SLOT_W, height: SLOT_H, opacity: clamp(k * 2), transform: `scale(${0.9 + 0.1 * Math.min(1, k)})`}}>
    <svg width={SLOT_W} height={SLOT_H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <rect x={4} y={4} width={SLOT_W - 8} height={SLOT_H - 8} rx={56} fill={`${color}14`} stroke={color} strokeWidth={6} strokeDasharray="22 16" pathLength={1000} strokeDashoffset={1000 * (1 - clamp(k))} />
    </svg>
    <div
      style={{
        position: 'absolute',
        right: -18,
        top: -46,
        fontFamily: F.kufi,
        fontWeight: 900,
        fontSize: 58,
        color: '#FFFFFF',
        background: color,
        borderRadius: 26,
        padding: '0 34px 12px',
        boxShadow: `0 14px 30px ${color}66`,
        transform: `scale(${Math.min(1.1, k)})`,
        direction: 'rtl',
      }}
    >
      {word}
    </div>
    {tag}
  </div>
);

const Tag: React.FC<{k: number; label: string; v: string; color: string}> = ({k, label, v, color}) =>
  k > 0.001 ? (
    <div style={{position: 'absolute', left: -14, top: -40, display: 'flex', alignItems: 'center', gap: 12, transform: `scale(${Math.min(1.1, k)})`, opacity: clamp(k * 3), transformOrigin: '0 50%'}}>
      <span style={{fontFamily: F.mono, fontWeight: 800, fontSize: 50, color: '#FFFFFF', background: P.ink, borderRadius: 16, padding: '0 18px', direction: 'ltr'}}>{v}</span>
      <span style={{fontFamily: F.kufi, fontWeight: 900, fontSize: 48, color, background: '#FFFFFF', borderRadius: 999, padding: '0 26px 8px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)'}}>{label}</span>
    </div>
  ) : null;

/** p → q style formula; '~' rendered as a proper negation tilde */
export const Formula: React.FC<{a: string; b: string; size?: number; k?: number}> = ({a, b, size = 64, k = 1}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: size * 0.35, direction: 'ltr', fontFamily: F.mono, fontWeight: 800, fontSize: size, color: P.ink, opacity: clamp(k * 3), transform: `scale(${0.7 + 0.3 * Math.min(1.05, k)})`}}>
    <span style={{color: P.tealDeep}}>{a}</span>
    <svg width={size * 1.3} height={size * 0.6} viewBox="0 0 80 36">
      <path d="M 4 18 L 72 18 M 56 4 L 74 18 L 56 32" stroke={P.ink} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span style={{color: P.orange}}>{b}</span>
  </div>
);

export const LogicScene: React.FC<{t: number}> = ({t}) => {
  const k = {
    say: cue('say'),
    stmtIf: cue('stmtIf'),
    stmtPress: cue('stmtPress'),
    stmtThen: cue('stmtThen'),
    stmtRing: cue('stmtRing'),
    cond: cue('condWord'),
    hyp: cue('hyp'),
    concl: cue('concl'),
    swapAsk: cue('swapAsk'),
    swap: cue('swap'),
    convIf: cue('convIf'),
    convThen: cue('convThen'),
    converse: cue('converse'),
    negAsk: cue('negAsk'),
    negBoth: cue('negBoth'),
    invIf: cue('invIf'),
    invThen: cue('invThen'),
    inverse: cue('inverse'),
    bothAsk: cue('bothAsk'),
    swapNeg: cue('swapNeg'),
    same: cue('sameTime'),
    contraIf: cue('contraIf'),
    contraThen: cue('contraThen'),
    contra: cue('contra'),
    summary: cue('summary'),
  };
  const enter = prog(t, k.say - 0.3, 0.5, easeOutCubic);
  const exit = prog(t, k.summary - 0.1, 0.5, easeInOutQuint);

  // swaps: 0 = button on top (original), 1 = bell on top
  const sw1 = prog(t, k.swap, 0.75, easeInOutCubic);
  const back = prog(t, k.negAsk - 0.25, 0.45, easeInOutCubic);
  const sw2 = prog(t, k.swapNeg, 0.75, easeInOutCubic);
  const swapK = sw1 * (1 - back) + sw2;
  const swapping = (x: number) => Math.sin(Math.PI * x);
  const arc = Math.max(swapping(sw1), swapping(back), swapping(sw2));
  const negTop = prog(t, k.negBoth, 0.35, easeOutCubic);
  const negBot = prog(t, k.negBoth + 0.18, 0.35, easeOutCubic);
  // button card and bell card negations follow the cards, not the slots
  const negBtn = negTop;
  const negBell = negBot;

  const btnY = lerp(TOP, BOT, swapK);
  const bellY = lerp(BOT, TOP, swapK);
  const btnX = 540 - arc * 140;
  const bellX = 540 + arc * 140;
  const btnZ = 1 + arc * 0.12;
  const bellZ = 1 - arc * 0.12;

  const dropA = spr(t, k.stmtPress - 0.1, 1.4);
  const dropB = spr(t, k.stmtRing - 0.1, 1.4);
  const slotA = spr(t, k.stmtIf - 0.15, 1.3);
  const slotB = spr(t, k.stmtThen - 0.15, 1.3);
  const arrow = prog(t, k.stmtThen - 0.1, 0.6, easeInOutCubic);

  const pulseAt = (c: number) => Math.max(0, 1 - Math.abs(t - c - 0.25) * 2.5);
  const topPulse = Math.max(pulseAt(k.convIf), pulseAt(k.invIf), pulseAt(k.contraIf), pulseAt(k.same));
  const botPulse = Math.max(pulseAt(k.convThen), pulseAt(k.invThen), pulseAt(k.contraThen), pulseAt(k.same));
  const btnPulse = swapK < 0.5 ? topPulse : botPulse;
  const bellPulse = swapK < 0.5 ? botPulse : topPulse;

  // header: name of the current statement + its formula
  const stage = t < k.converse ? 0 : t < k.inverse ? 1 : t < k.contra ? 2 : 3;
  const stageStart = [k.cond, k.converse, k.inverse, k.contra][stage];
  const hide = stage === 0 ? prog(t, k.swapAsk - 0.1, 0.3) : stage === 1 ? prog(t, k.negAsk - 0.2, 0.3) : stage === 2 ? prog(t, k.bothAsk - 0.2, 0.3) : 0;
  const hk = spr(t, stageStart, 1.5) * (1 - hide);
  const names = ['عبارة شرطية', 'العكس', 'المعكوس', 'المعاكس الإيجابي'];
  const colors = [P.ink, P.orange, P.red, P.tealDeep];
  const forms: [string, string][] = [
    ['p', 'q'],
    ['q', 'p'],
    ['~p', '~q'],
    ['~q', '~p'],
  ];
  const tags = spr(t, k.hyp - 0.05, 1.5) * (1 - prog(t, k.swapAsk - 0.1, 0.3));
  const tagsQ = spr(t, k.concl - 0.05, 1.5) * (1 - prog(t, k.swapAsk - 0.1, 0.3));
  const bracket = prog(t, k.cond - 0.05, 0.6, easeInOutCubic) * (1 - prog(t, k.swapAsk - 0.1, 0.3));
  // «في نفس الوقت»: swap + negate badge
  const both = spr(t, k.same - 0.1, 1.5) * (1 - prog(t, k.contra - 0.2, 0.3));

  const camS = 1 + 0.03 * Math.sin(t * 0.35) + 0.05 * pulseAt(k.converse) + 0.05 * pulseAt(k.inverse) + 0.06 * pulseAt(k.contra);
  const camY = (stage === 0 && t > k.hyp && t < k.concl ? -40 : t > k.concl && t < k.swapAsk ? 40 : 0) * 1;
  const sh = shake(t, k.negBoth, 10) + shake(t, k.negBoth + 0.18, 8) + shake(t, k.contra, 8);

  return (
    <AbsoluteFill style={{opacity: enter * (1 - exit)}}>
      <World t={t} cam={{x: 0, y: camY * 2, s: camS}} tint={stage === 2 ? P.red : P.teal} />
      <AbsoluteFill style={{transform: `translate(${sh}px, ${-camY}px) scale(${camS * (1 - exit * 0.35)})`, transformOrigin: '50% 55%'}}>
        {/* header */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
          {hk > 0.001 && (
            <>
              <div
                style={{
                  fontFamily: F.kufi,
                  fontWeight: 900,
                  fontSize: stage === 3 ? 104 : 120,
                  lineHeight: 1.2,
                  color: colors[stage],
                  direction: 'rtl',
                  transform: `scale(${(1.6 - 0.6 * Math.min(1.04, hk))}) translateY(${(1 - clamp(hk)) * -20}px)`,
                  opacity: clamp(hk * 3),
                  filter: `blur(${(1 - clamp(hk * 1.5)) * 8}px)`,
                  whiteSpace: 'nowrap',
                }}
              >
                {names[stage]}
              </div>
              <div style={{background: '#FFFFFF', borderRadius: 999, padding: '6px 40px', boxShadow: '0 16px 40px rgba(60,45,20,0.15)', opacity: clamp(hk * 2)}}>
                <Formula a={forms[stage][0]} b={forms[stage][1]} size={64} k={prog(t, stageStart + 0.3, 0.4, easeOutExpo)} />
              </div>
            </>
          )}
        </div>

        {/* slots */}
        <div style={{position: 'absolute', left: 540 - SLOT_W / 2, top: TOP - SLOT_H / 2}}>
          <Slot word="إذا" color={P.teal} k={slotA} tag={<Tag k={tags} label="الفرض" v="p" color={P.tealDeep} />} />
        </div>
        <div style={{position: 'absolute', left: 540 - SLOT_W / 2, top: BOT - SLOT_H / 2}}>
          <Slot word="فإن" color={P.orange} k={slotB} tag={<Tag k={tagsQ} label="النتيجة" v="q" color={P.orange} />} />
        </div>
        {/* arrow between slots */}
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
          <Draw d={`M 540 ${TOP + SLOT_H / 2 + 14} L 540 ${BOT - SLOT_H / 2 - 30}`} k={arrow} color={P.ink} w={12} len={100} />
          <Draw d={`M 510 ${BOT - SLOT_H / 2 - 56} L 540 ${BOT - SLOT_H / 2 - 24} L 570 ${BOT - SLOT_H / 2 - 56}`} k={clamp((arrow - 0.7) * 3.3)} color={P.ink} w={12} len={100} />
          {/* bracket: «هذه عبارة شرطية» */}
          <Draw d={`M 88 ${TOP - 120} Q 40 ${TOP - 120} 40 ${TOP - 60} L 40 ${BOT + 60} Q 40 ${BOT + 120} 88 ${BOT + 120}`} k={bracket} color={P.ink} w={8} len={100} opacity={0.7} />
        </svg>
        {/* swap + negate badge */}
        {both > 0.001 && (
          <div style={{position: 'absolute', left: 700, top: (TOP + BOT) / 2 - 60, transform: `scale(${Math.min(1.1, both)})`, opacity: clamp(both * 3)}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 10, background: P.ink, borderRadius: 999, padding: '10px 26px 16px', direction: 'rtl'}}>
              <span style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 40, color: '#FFFFFF'}}>تبديل</span>
              <span style={{fontFamily: F.mono, fontWeight: 800, fontSize: 40, color: P.yellow}}>+</span>
              <span style={{fontFamily: F.kufi, fontWeight: 800, fontSize: 40, color: '#FFFFFF'}}>نفي</span>
            </div>
          </div>
        )}

        {/* the two cards (painter order: the one in front during a swap last) */}
        {(() => {
          const btn = (
            <div key="btn" style={{position: 'absolute', left: btnX - 360, top: btnY - 95 - (1 - Math.min(1, dropA)) * 700, transform: `scale(${btnZ})`, opacity: clamp(dropA * 4), filter: arc > 0.2 ? `blur(${arc * 2}px)` : undefined}}>
              <Card kind="btn" neg={negBtn} t={t} act={clamp((t - k.stmtPress) * 3) * (1 - clamp((t - k.stmtPress - 0.5) * 3))} pulse={btnPulse} />
            </div>
          );
          const bell = (
            <div key="bell" style={{position: 'absolute', left: bellX - 360, top: bellY - 95 - (1 - Math.min(1, dropB)) * 700, transform: `scale(${bellZ})`, opacity: clamp(dropB * 4), filter: arc > 0.2 ? `blur(${arc * 1.5}px)` : undefined}}>
              <Card kind="bell" neg={negBell} t={t} act={clamp((t - k.stmtRing) * 3) * (1 - clamp((t - k.stmtRing - 1.2) * 2))} pulse={bellPulse} />
            </div>
          );
          return btnZ >= bellZ ? [bell, btn] : [btn, bell];
        })()}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

void easeOutBack;
