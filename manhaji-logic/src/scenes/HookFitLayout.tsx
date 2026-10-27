import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {HOOK} from '../config/media';
import {COLORS, FONTS} from '../config/theme';
import {EASE, clamp01, f, pop, ramp} from '../lib/anim';
import {ProductArt} from '../components/Product';
import {ClipTimeline} from './HookScene';

const CARD = {x: 44, w: 992, r: 44};
const cardH = Math.round((CARD.w * 9) / 16);

/**
 * Hook for a LANDSCAPE master, shown whole (no crop, no zoom).
 * The shot is framed as a card inside the Manhaji world, so the frame reads as design:
 *   • top    — a quiet Manhaji header
 *   • middle — the real footage, framed, lit, untouched
 *   • bottom — the father's order: عيش [ ؟ ] صامولي — the connector follows the speech:
 *              «و» when he says «وصامولي», «أو» on the second line, and on the hold
 *              it flickers between the two. The doubt, typeset under his face.
 * Exit: the layout dissolves and the footage card flies past camera into the aisle.
 */
export const HookFitLayout: React.FC<{hookFrames: number; clipFrames: number; exitFrames: number}> = ({hookFrames, clipFrames, exitFrames}) => {
  const frame = useCurrentFrame();
  const orF = f(HOOK.orWordSec);
  const hold = HOOK.freezeFrames;

  // output frame → time inside the clip (the hold freezes clip time)
  const clipFrame = frame < orF ? frame : frame < orF + hold ? orF : frame - hold;
  const clipT = clipFrame / 30;
  const inHold = frame >= orF && frame < orF + hold;

  // exit
  const exitStart = hookFrames - exitFrames;
  const e = clamp01((frame - exitStart) / exitFrames);
  const e1 = EASE.inOut(clamp01(e / 0.55));
  const e2 = EASE.in(clamp01((e - 0.42) / 0.58));
  const layoutOut = EASE.inOut(clamp01(e / 0.5));

  const cardTop = HOOK.fitTop;
  const intro = ramp(frame, 0, 0.45, EASE.out);

  return (
    <AbsoluteFill style={{perspective: 1700}}>
      {/* ── designed world (fades away on exit to reveal the aisle underneath) */}
      <AbsoluteFill style={{opacity: 1 - layoutOut}}>
        <World frame={frame} />
      </AbsoluteFill>

      {/* ── header */}
      <Header frame={frame} out={layoutOut} />

      {/* ── the footage card */}
      <div
        style={{
          position: 'absolute',
          left: CARD.x,
          top: cardTop,
          width: CARD.w,
          height: cardH,
          transformOrigin: '50% 50%',
          transform: `translateX(${60 * e1 + 980 * e2}px) rotateY(${-22 * e1 - 40 * e2}deg) scale(${(1 - 0.12 * e1) * (1 + e2 * 0.9) * (0.96 + 0.04 * intro)})`,
          filter: e2 > 0.02 ? `blur(${e2 * 16}px)` : undefined,
          opacity: 1 - clamp01((e - 0.85) / 0.15),
        }}
      >
        {/* glow halo behind the card */}
        <div
          style={{
            position: 'absolute',
            inset: -40,
            borderRadius: CARD.r + 40,
            background: `radial-gradient(closest-side, ${COLORS.or}40, transparent)`,
            filter: 'blur(30px)',
            opacity: 0.7,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: CARD.r,
            overflow: 'hidden',
            boxShadow: '0 50px 120px rgba(0,0,0,0.6)',
            filter: inHold ? `saturate(${1 - 0.6 * Math.sin(((frame - orF) / hold) * Math.PI)})` : undefined,
          }}
        >
          <ClipTimeline orF={orF} hold={hold} clipFrames={clipFrames} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          {/* top sheen + inner bevel — makes it read as a lit physical card */}
          <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0) 22%)'}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: CARD.r, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.16), inset 0 -40px 60px rgba(0,0,0,0.25)'}} />
          {/* recording tag */}
          <div
            dir="rtl"
            style={{
              position: 'absolute',
              top: 26,
              right: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 18px',
              borderRadius: 999,
              background: 'rgba(8,11,22,0.55)',
              backdropFilter: 'blur(8px)',
              fontFamily: FONTS.text,
              fontWeight: 600,
              fontSize: 24,
              color: COLORS.paper,
              opacity: intro * (1 - layoutOut),
            }}
          >
            <span style={{width: 12, height: 12, borderRadius: 6, background: COLORS.false, opacity: 0.55 + 0.45 * Math.sin(frame / 4)}} />
            في البقالة
          </div>
        </div>
      </div>

      {/* ── the father's order */}
      <OrderCard frame={frame} clipT={clipT} inHold={inHold} out={layoutOut} top={cardTop + cardH + 56} />
    </AbsoluteFill>
  );
};

/** Brand space: deep ink, soft light pools, a fine dot grid and slow drifting light. */
const World: React.FC<{frame: number}> = ({frame}) => {
  const drift = Math.sin(frame / 50) * 40;
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${540 + drift}px 860px, rgba(95,160,255,0.20), transparent 70%),
            radial-gradient(700px 600px at ${200 - drift}px 1500px, rgba(167,123,255,0.16), transparent 70%),
            radial-gradient(600px 500px at ${900 + drift}px 300px, rgba(242,181,58,0.10), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 1.6px, transparent 1.8px)',
          backgroundSize: '36px 36px',
          backgroundPosition: `0px ${(frame * 0.4) % 36}px`,
          maskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9), rgba(0,0,0,0) 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.9), rgba(0,0,0,0) 75%)',
        }}
      />
    </AbsoluteFill>
  );
};

const Header: React.FC<{frame: number; out: number}> = ({frame, out}) => {
  const p = ramp(frame, 0.05, 0.6, EASE.out);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        top: 300,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        opacity: p * (1 - out),
        transform: `translateY(${(1 - p) * 20 - out * 60}px)`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{width: 54, height: 54, borderRadius: 16, background: `linear-gradient(140deg, ${COLORS.or}, ${COLORS.and})`, position: 'relative'}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', right: 11 + i * 12, bottom: 12, width: 8, height: 10 + i * 9, borderRadius: 3, background: '#fff'}} />
          ))}
        </div>
        <span style={{fontFamily: FONTS.display, fontWeight: 900, fontSize: 56, color: COLORS.paper}}>منهجي</span>
      </div>
      <div style={{fontFamily: FONTS.text, fontWeight: 500, fontSize: 30, color: COLORS.paperDim, letterSpacing: 0.5}}>
        درس <span style={{color: '#FFD27A', fontWeight: 700}}>المنطق</span> · رياضيات أول ثانوي
      </div>
    </div>
  );
};

/** «عيش [ connector ] صامولي» — the connector follows what Tamim is saying. */
const OrderCard: React.FC<{frame: number; clipT: number; inHold: boolean; out: number; top: number}> = ({frame, clipT, inHold, out, top}) => {
  const p = pop(frame, 0.25, {damping: 16, stiffness: 130});
  const wa = clipT >= HOOK.waWordStartSec;
  const or = clipT >= HOOK.orWordStartSec;
  // which connector is showing
  let state: 'q' | 'wa' | 'or' = or ? 'or' : wa ? 'wa' : 'q';
  if (inHold) state = Math.floor(frame / 3) % 2 === 0 ? 'or' : 'wa';
  const changeAt = or ? HOOK.orWordStartSec : wa ? HOOK.waWordStartSec : 0;
  const bump = interpolate(clipT - changeAt, [0, 0.12, 0.4], [0.75, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const c = state === 'or' ? COLORS.or : state === 'wa' ? COLORS.and : COLORS.paperDim;
  const glyph = state === 'or' ? 'أو' : state === 'wa' ? 'و' : '؟';
  const holdPulse = inHold ? 1 : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top,
        height: 250,
        opacity: clamp01(p) * (1 - out),
        transform: `translateY(${(1 - p) * 60 + out * 80}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 36,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
          border: `1.5px solid ${holdPulse ? c : 'rgba(255,255,255,0.14)'}`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.45)${holdPulse ? `, 0 0 50px ${c}66` : ''}`,
        }}
      />
      <div dir="rtl" style={{position: 'absolute', top: 22, left: 0, right: 0, textAlign: 'center', fontFamily: FONTS.text, fontWeight: 600, fontSize: 28, color: COLORS.muted}}>
        طلب الأب
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 74,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 26,
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 70,
          lineHeight: 1.3,
        }}
      >
        <Item kind="aish" label="عيش" color={COLORS.aish} />
        <div
          style={{
            minWidth: 128,
            height: 116,
            borderRadius: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid ${c}`,
            background: `${c}1F`,
            color: c,
            boxShadow: state === 'q' ? undefined : `0 0 36px ${c}88`,
            transform: `scale(${inHold ? 1.08 : bump})`,
          }}
        >
          {glyph}
        </div>
        <Item kind="samoli" label="صامولي" color={COLORS.samoli} />
      </div>
    </div>
  );
};

const Item: React.FC<{kind: 'aish' | 'samoli'; label: string; color: string}> = ({kind, label, color}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12, color}}>
    <ProductArt kind={kind} style={{width: 62, height: 74}} />
    <span>{label}</span>
  </div>
);
