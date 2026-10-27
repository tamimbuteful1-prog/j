import React from 'react';
import {COLORS, FONTS} from '../../kit/theme';
import {EASE, mix, ramp, shake} from '../../kit/anim';

/**
 * The conditional statement as two physical slots that persist through the lesson.
 * Block P (الفرض, blue) and block Q (النتيجة, gold) are swapped for the converse,
 * negated for the inverse, and both for the contrapositive. State is a pure function of
 * ABSOLUTE time + beats, so every scene that shows the stage continues it seamlessly.
 */
export const P_COLOR = COLORS.or;
export const Q_COLOR = '#F2B53A';
export const NEG_COLOR = '#FF7550';

type Beats = Record<string, number>;
const fps = 30;
const r = (t: number, a: number, b: number, e = EASE.out) => ramp(t * fps, a, b, e);
const has = (B: Beats, k: string) => B[k] !== undefined;

export const stageState = (t: number, B: Beats) => {
  const sw = (k: string) => (has(B, k) ? r(t, B[k], B[k] + 0.45, EASE.inOut) : 0);
  const posP = sw('swap') - sw('swapBack') + sw('swapNeg'); // 0 = «إذا» slot, 1 = «فإن» slot
  const neg = has(B, 'negate') ? r(t, B.negate, B.negate + 0.32) : 0;
  const phase =
    // the label follows the ACTION (swap / negate) so it never contradicts what is on screen
    t >= B.swapNeg + 0.25 ? 'contra' : t >= B.negate + 0.2 ? 'inverse' : t >= B.swapBack + 0.25 ? 'original' : t >= B.swap + 0.25 ? 'converse' : t >= B.labelQ ? 'original' : 'none';
  return {posP, neg, phase};
};

const NAMES: Record<string, {ar: string; nota: string}> = {
  original: {ar: 'العبارة الشرطية', nota: 'p → q'},
  converse: {ar: 'العكس', nota: 'q → p'},
  inverse: {ar: 'المعكوس', nota: '~p → ~q'},
  contra: {ar: 'المعاكس الإيجابي', nota: '~q → ~p'},
};

export const Nota: React.FC<{children: string; size?: number; color?: string}> = ({children, size = 40, color = COLORS.paper}) => (
  <span dir="ltr" style={{unicodeBidi: 'isolate', fontFamily: FONTS.text, fontWeight: 700, fontSize: size, color, letterSpacing: '0.04em'}}>
    {children.split(/(p|q)/).map((s, i) => (s === 'p' ? <span key={i} style={{color: P_COLOR}}>p</span> : s === 'q' ? <span key={i} style={{color: Q_COLOR}}>q</span> : <span key={i}>{s}</span>))}
  </span>
);

const SLOT_Y = [640, 905];
const BLOCK = {x: 455, w: 690, h: 168};

const Mark: React.FC<{ok: boolean; p: number; label: string}> = ({ok, p, label}) =>
  p > 0.01 ? (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        left: -18,
        top: -26,
        padding: '6px 16px',
        borderRadius: 999,
        background: ok ? COLORS.true : COLORS.false,
        color: COLORS.ink,
        fontFamily: FONTS.text,
        fontWeight: 700,
        fontSize: 32,
        transform: `scale(${0.6 + 0.4 * p})`,
        opacity: p,
        boxShadow: `0 0 24px ${ok ? COLORS.trueGlow : COLORS.falseGlow}`,
      }}
    >
      {ok ? '✓' : '✕'} {label}
    </div>
  ) : null;

const Block: React.FC<{
  kind: 'p' | 'q';
  pos: number;
  arc: number;
  fill: number;
  neg: number;
  mark?: {ok: boolean; p: number; label: string};
  dim?: number;
  /** 0..1 — this block is being read aloud right now */
  glow?: number;
}> = ({kind, pos, arc, fill, neg, mark, dim = 0, glow = 0}) => {
  const c = kind === 'p' ? P_COLOR : Q_COLOR;
  const y = mix(pos, SLOT_Y[0], SLOT_Y[1]);
  const text = kind === 'p' ? 'اشتريت بأكثر من 50 ريال' : 'أحصل على خصم';
  // negation with «لم» + jussive: لم أشترِ / لم أحصل
  const negRest = kind === 'p' ? 'أشترِ بأكثر من 50 ريال' : 'أحصل على خصم';
  const negText = `لم ${negRest}`;
  const showNeg = neg > 0.5;
  const swapTwist = Math.sin(Math.PI * Math.min(1, Math.max(0, pos))) ;
  return (
    <div
      style={{
        position: 'absolute',
        left: BLOCK.x - BLOCK.w / 2 + arc,
        top: y - BLOCK.h / 2 + (1 - fill) * -160,
        width: BLOCK.w,
        height: BLOCK.h,
        opacity: fill * (1 - dim * 0.55),
        transform: `rotate(${(kind === 'p' ? -1 : 1) * swapTwist * 4}deg) scale(${1 + swapTwist * 0.04 + glow * 0.045})`,
        zIndex: kind === 'p' ? 2 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 30,
          border: `3px solid ${c}`,
          boxShadow: `0 24px 60px rgba(0,0,0,0.45), 0 0 ${30 + 20 * swapTwist + 50 * glow}px ${c}${glow > 0.3 ? '99' : '44'}`,
          background: `linear-gradient(180deg, ${c}${glow > 0.3 ? '55' : '38'}, ${c}14)`,
        }}
      />
      <div dir="rtl" style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.display, fontWeight: 800, fontSize: 44, color: COLORS.paper, padding: '0 36px 0 110px'}}>
        <span style={{opacity: showNeg ? 0 : 1 - Math.min(1, neg * 2), position: 'absolute'}}>{text}</span>
        <span style={{opacity: showNeg ? Math.min(1, (neg - 0.5) * 2) : 0, position: 'absolute'}}>
          <span style={{color: NEG_COLOR}}>لم</span> {negRest}
        </span>
        <span style={{visibility: 'hidden'}}>{negText}</span>
      </div>
      {/* letter badge (left end) */}
      <div
        style={{
          position: 'absolute',
          left: 22,
          top: BLOCK.h / 2 - 34,
          height: 68,
          minWidth: 68,
          padding: '0 10px',
          borderRadius: 20,
          background: c,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 20px ${c}88`,
        }}
      >
        <span dir="ltr" style={{fontFamily: FONTS.text, fontWeight: 700, fontSize: 40, color: COLORS.ink}}>
          {neg > 0.5 ? '~' : ''}
          {kind}
        </span>
      </div>
      {/* negation tab */}
      {neg > 0.01 && (
        <div style={{position: 'absolute', right: -14, top: -22, width: 58, height: 58, borderRadius: 18, background: NEG_COLOR, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.text, fontWeight: 700, fontSize: 40, transform: `translateY(${(1 - neg) * -80}px) rotate(${(1 - neg) * 40}deg)`, opacity: Math.min(1, neg * 2), boxShadow: `0 0 20px ${NEG_COLOR}`}}>
          ~
        </div>
      )}
      {mark && <Mark {...mark} />}
    </div>
  );
};

/** Full stage. `t` = absolute seconds. */
export const ConditionStage: React.FC<{t: number; B: Beats; scale?: number; originY?: number; showName?: boolean; read?: [number, number]}> = ({t, B, scale = 1, originY = 260, showName = true, read = [0, 0]}) => {
  const {posP, neg, phase} = stageState(t, B);
  const arc = Math.sin(Math.PI * Math.max(0, Math.min(1, posP))) * 300;
  const slots = r(t, B.template, B.template + 0.28);
  const slot2 = r(t, B.thenSlot, B.thenSlot + 0.28);
  const fillP = has(B, 'fillP') ? r(t, B.fillP, B.fillP + 0.3, EASE.anticipate) : 0;
  const fillQ = has(B, 'fillQ') ? r(t, B.fillQ, B.fillQ + 0.3, EASE.anticipate) : 0;
  const labP = r(t, B.labelP, B.labelP + 0.25);
  const labQ = r(t, B.labelQ, B.labelQ + 0.25);

  // marks
  const clearAt = (k: string) => 1 - r(t, B[k] - 0.2, B[k] + 0.2);
  const pFailHook = r(t, B.notMore, B.notMore + 0.22) * clearAt('swap');
  const qOk = r(t, B.discountOK, B.discountOK + 0.22) * clearAt('swapBack');
  const pFailCounter = r(t, B.under50, B.under50 + 0.22) * clearAt('swapBack');
  const stamp = r(t, B.falseStamp, B.falseStamp + 0.25) * clearAt('swapBack');
  const question = r(t, B.notNecessarily, B.notNecessarily + 0.25) * (1 - r(t, B.falseStamp - 0.1, B.falseStamp + 0.2));

  const name = NAMES[phase];
  const nameP = phase === 'none' ? 0 : 1;
  const nameKey = `${phase}`;
  const nameBump = Math.max(...['labelQ', 'converseName', 'inverseName', 'contraName'].map((k) => (has(B, k) ? 1 - r(t, B[k], B[k] + 0.35) : 0) * (t >= (B[k] ?? Infinity) ? 1 : 0)));

  const ifLabel = (y: number, txt: string, sub: string, subP: number, appear: number, c: string) => (
    <div dir="rtl" style={{position: 'absolute', left: 820, width: 200, top: y - 70, opacity: appear, textAlign: 'center', transform: `translateX(${(1 - appear) * 40}px)`}}>
      <div style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: 76, color: c, textShadow: `0 0 26px ${c}66`, lineHeight: 1.2}}>{txt}</div>
      <div style={{fontFamily: FONTS.text, fontWeight: 700, fontSize: 30, color: COLORS.paperDim, opacity: subP}}>{sub}</div>
    </div>
  );

  return (
    <div style={{position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: `50% ${originY}px`}}>
      {/* name chip */}
      {showName && nameP > 0 && name && (
        <div key={nameKey} style={{position: 'absolute', left: 0, right: 0, top: 330, display: 'flex', justifyContent: 'center'}}>
          <div dir="rtl" style={{display: 'flex', alignItems: 'center', gap: 22, padding: '14px 34px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.18)', transform: `scale(${1 + 0.1 * nameBump})`, boxShadow: nameBump > 0 ? `0 0 ${40 * nameBump}px rgba(255,210,122,0.5)` : undefined}}>
            <span style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: 52, color: '#FFD27A'}}>{name.ar}</span>
            <span style={{width: 2, height: 44, background: 'rgba(255,255,255,0.25)'}} />
            <Nota size={44}>{name.nota}</Nota>
            {question > 0.01 && <span style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, color: NEG_COLOR, opacity: question, transform: `scale(${0.6 + 0.4 * question})`, display: 'inline-block'}}>؟</span>}
          </div>
        </div>
      )}
      {/* slots */}
      {[0, 1].map((i) => {
        const a = i === 0 ? slots : slot2;
        return (
          <div key={i} style={{position: 'absolute', left: BLOCK.x - BLOCK.w / 2, top: SLOT_Y[i] - BLOCK.h / 2, width: BLOCK.w, height: BLOCK.h, borderRadius: 30, border: '3px dashed rgba(255,255,255,0.28)', opacity: a * 0.9, transform: `scale(${0.94 + 0.06 * a})`}} />
        );
      })}
      {ifLabel(SLOT_Y[0], 'إذا', 'الفرض', labP, slots, P_COLOR)}
      {ifLabel(SLOT_Y[1], 'فإن', 'النتيجة', labQ, slot2, Q_COLOR)}
      {/* arrow */}
      <div style={{position: 'absolute', left: BLOCK.x - 3, top: SLOT_Y[0] + BLOCK.h / 2 + 6, width: 6, height: SLOT_Y[1] - SLOT_Y[0] - BLOCK.h - 12, background: 'rgba(255,255,255,0.35)', opacity: slot2}} />
      <div style={{position: 'absolute', left: BLOCK.x - 16, top: SLOT_Y[1] - BLOCK.h / 2 - 24, width: 0, height: 0, borderLeft: '16px solid transparent', borderRight: '16px solid transparent', borderTop: '20px solid rgba(255,255,255,0.35)', opacity: slot2}} />

      <Block kind="q" pos={1 - posP} arc={arc} fill={fillQ} neg={neg} glow={read[Math.round(1 - posP)]} mark={qOk > 0.01 ? {ok: true, p: qOk, label: 'تحقق'} : undefined} />
      <Block
        kind="p"
        pos={posP}
        glow={read[Math.round(posP)]}
        arc={-arc}
        fill={fillP}
        neg={neg}
        mark={pFailHook > 0.01 ? {ok: false, p: pFailHook, label: 'لم يتحقق'} : pFailCounter > 0.01 ? {ok: false, p: pFailCounter, label: 'لم يتحقق'} : undefined}
      />

      {/* FALSE stamp on the converse */}
      {stamp > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 540 - 230,
            top: 700,
            width: 460,
            height: 150,
            borderRadius: 24,
            border: `8px solid ${COLORS.false}`,
            color: COLORS.false,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONTS.text,
            fontWeight: 700,
            fontSize: 96,
            letterSpacing: '0.08em',
            transform: `rotate(-10deg) scale(${2.2 - 1.2 * Math.min(1, stamp * 1.4)}) translateX(${shake(t * fps, B.falseStamp + 0.15, 10)}px)`,
            opacity: Math.min(1, stamp * 1.6),
            background: 'rgba(9,13,24,0.72)',
            boxShadow: `0 0 50px ${COLORS.falseGlow}`,
          }}
        >
          FALSE
        </div>
      )}
    </div>
  );
};
