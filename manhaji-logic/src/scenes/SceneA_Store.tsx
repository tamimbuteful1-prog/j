import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {SCENE_A} from '../config/timeline';
import {COLORS} from '../config/theme';
import {AISLE, Aisle, project} from '../components/Aisle';
import {ProductActor} from '../components/Product';
import {Extruded} from '../components/Extruded';
import {Spotlight} from '../components/Backdrop';
import {Eyebrow} from '../components/Type';
import {FONTS} from '../config/theme';
import {EASE, clamp01, pop, ramp} from '../lib/anim';
import {A_END_ZOOM, HERO_WORLD} from './shared';

const B = SCENE_A.beats;

/** camera depth over time — already moving when the hook card flies past */
const camZAt = (fr: number) =>
  interpolate(fr / 30, [0, B.arrive + 0.1], [-260, AISLE.heroZ], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.33, 0.25, 0.15, 1),
  });

/**
 * SCENE A — «رحت البقالة… نسيت وش أبوي طلب مني»
 * One continuous dolly down the aisle to the bakery end-cap, then depth-of-field
 * isolates the two heroes and a solid 3D «؟» turns between them.
 */
export const SceneA_Store: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const camZ = camZAt(frame);
  const vz = Math.abs(camZ - camZAt(frame - 1));
  const camX = Math.sin(t * 1.3) * 26 * (1 - ramp(frame, B.arrive - 0.4, B.arrive + 0.4));
  const camY = interpolate(t, [0, B.arrive], [-60, 0], {extrapolateRight: 'clamp', easing: EASE.inOut});
  const cam = {z: camZ, x: camX, y: camY};

  const iso = ramp(frame, B.isolate, B.isolate + 0.7, EASE.inOut);
  const settleZoom = 1 + (A_END_ZOOM - 1) * ramp(frame, B.arrive, SCENE_A.durationSec - 0.6, EASE.soft);
  const roll = Math.sin(t * 0.9) * 1.1 * (1 - iso);

  const a = project(HERO_WORLD.aishX, HERO_WORLD.baseY, AISLE.heroZ, cam);
  const s = project(HERO_WORLD.samoliX, HERO_WORLD.baseY, AISLE.heroZ, cam);

  // indecision: attention swings between the two products, then calms before the hand-off
  const swingWin = ramp(frame, B.question, B.question + 0.4) * (1 - ramp(frame, 5.4, 6.0, EASE.inOut));
  const k = Math.sin((t - B.question) * Math.PI * 1.7) * swingWin;
  const aishFocus = Math.max(0, k);
  const samFocus = Math.max(0, -k);

  const q = pop(frame, B.question, {damping: 12, stiffness: 140});
  const qOut = ramp(frame, 5.45, 5.9, EASE.in);
  const qRot = Math.sin((t - B.question) * 2.4) * 32 - 8;

  return (
    <AbsoluteFill style={{background: COLORS.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${settleZoom}) rotate(${roll}deg)`, transformOrigin: '50% 55%'}}>
        <Aisle cam={cam} blur={Math.min(5, vz * 0.035) + iso * 9} dim={iso * 0.72} />

        {/* display table under the heroes */}
        <div
          style={{
            position: 'absolute',
            left: (a.x + s.x) / 2 - 330 * a.scale,
            top: a.y - 8 * a.scale,
            width: 660 * a.scale,
            height: 110 * a.scale,
            borderRadius: 20 * a.scale,
            background: 'linear-gradient(180deg, #4A3A2E 0%, #2A201A 30%, #17110D 100%)',
            boxShadow: `0 ${30 * a.scale}px ${60 * a.scale}px rgba(0,0,0,0.6), inset 0 ${3 * a.scale}px 0 rgba(255,220,170,0.25)`,
          }}
        />

        <Spotlight x={a.x} y={a.y - 200} r={330} opacity={iso * (0.45 + 0.55 * aishFocus)} />
        <Spotlight x={s.x} y={s.y - 200} r={330} opacity={iso * (0.45 + 0.55 * samFocus)} />

        <ProductActor
          kind="aish"
          x={a.x}
          y={a.y}
          scale={a.scale}
          lift={aishFocus * 34}
          rotateY={-10 * iso + aishFocus * -16}
          rotate={aishFocus * 3}
          dim={iso * samFocus * 0.6}
          glow={COLORS.aish}
          glowAmount={aishFocus * 0.6}
        />
        <ProductActor
          kind="samoli"
          x={s.x}
          y={s.y}
          scale={s.scale}
          lift={samFocus * 34}
          rotateY={10 * iso + samFocus * 16}
          rotate={-samFocus * 3}
          dim={iso * aishFocus * 0.6}
          glow={COLORS.samoli}
          glowAmount={samFocus * 0.6}
        />

        {/* solid 3D question mark between them */}
        {q > 0.001 && (
          <div
            style={{
              position: 'absolute',
              left: 540 - 130,
              top: 800 + Math.sin(t * 2.2) * 10,
              width: 260,
              display: 'flex',
              justifyContent: 'center',
              opacity: clamp01(q) * (1 - qOut),
              transform: `scale(${q * (1 - qOut * 0.4)})`,
            }}
          >
            <Extruded glyph="؟" size={220} color="#FFFFFF" side="#5C6B94" depth={46} layers={14} rotateY={qRot} glow="rgba(255,255,255,0.45)" />
          </div>
        )}
      </AbsoluteFill>

      {/* headline — short, never the full spoken line */}
      <div style={{position: 'absolute', top: 300, left: 0, right: 0}}>
        <Eyebrow color={COLORS.paperDim} style={{fontSize: 36, opacity: ramp(frame, B.question - 0.1, B.question + 0.4) * (1 - qOut), marginBottom: 6}}>طلب الأب كان…</Eyebrow>
        <ConnectorHeadline frame={frame} k={k} at={B.question} out={qOut} />
      </div>
    </AbsoluteFill>
  );
};

/**
 * «عيش [و | أو] صامولي» — the connector slot flips between «و» and «أو»
 * in sync with the attention swing: the doubt itself, typeset.
 */
const ConnectorHeadline: React.FC<{frame: number; k: number; at: number; out: number}> = ({frame, k, at, out}) => {
  const p = ramp(frame, at + 0.15, at + 0.6);
  const isOr = k < 0; // samoli in focus → «أو»
  const flip = Math.min(1, Math.abs(k) * 2.2);
  const slot = (txt: string, c: string, on: boolean) => (
    <span
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        color: c,
        opacity: on ? flip : (1 - flip) * 0.5,
        transform: `translateY(${on ? (1 - flip) * 40 : -flip * 40}px)`,
        filter: `blur(${on ? (1 - flip) * 6 : flip * 6}px) drop-shadow(0 0 22px ${c})`,
      }}
    >
      {txt}
    </span>
  );
  const word = (txt: string, c: string, side: 1 | -1, delay: number) => {
    const wp = ramp(frame, at + delay, at + delay + 0.55);
    return (
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 0,
          [side === 1 ? 'left' : 'right']: 540 + 105,
          color: c,
          opacity: wp,
          transform: `translateY(${(1 - wp) * 45}px)`,
          filter: `blur(${(1 - wp) * 10}px)`,
          whiteSpace: 'nowrap',
        }}
      >
        {txt}
      </div>
    );
  };
  return (
    <div
      style={{
        position: 'relative',
        height: 150,
        fontFamily: FONTS.display,
        fontWeight: 900,
        fontSize: 104,
        lineHeight: 1.35,
        opacity: 1 - out,
        transform: `translateY(${-out * 20}px)`,
      }}
    >
      {word('عيش', COLORS.aish, 1, 0)}
      {word('صامولي', COLORS.samoli, -1, 0.08)}
      <div dir="rtl" style={{position: 'absolute', left: 540 - 95, width: 190, top: 0, opacity: p}}>
        {slot('أو', COLORS.or, isOr)}
        {slot('و', COLORS.and, !isOr)}
      </div>
    </div>
  );
};
