import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SCENE_B} from '../config/timeline';
import {COLORS, FONTS} from '../config/theme';
import {StudioBackdrop} from '../components/Backdrop';
import {ProductActor} from '../components/Product';
import {BasketBack, BasketFront, BasketPlacement, basketSlot} from '../components/Basket';
import {ResultBadge} from '../components/ResultBadge';
import {Eyebrow, KineticLine} from '../components/Type';
import {EASE, drop, kf, mix, pop, ramp, shake} from '../lib/anim';
import {HANDOFF} from './shared';

const B = SCENE_B.beats;

/**
 * SCENE B — «قيمة الصواب»
 * The aisle dissolves into a clean studio while the products stay (match cut).
 * TRUE / FALSE are not just words: the bread physically lands in the basket (TRUE)
 * and is pulled out again (FALSE).
 */
export const SceneB_TruthValue: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const exit = ramp(frame, SCENE_B.durationSec - 0.55, SCENE_B.durationSec, EASE.in);

  // ── backdrop arrives over the aisle
  const bg = ramp(frame, 0, 0.55, EASE.inOut);

  // ── title
  const titleUp = ramp(frame, B.system - 0.3, B.system + 0.5, EASE.inOut);
  const titleY = mix(titleUp, 520, 300);
  const titleScale = mix(titleUp, 1, 0.68);

  // ── basket
  const basketIn = pop(frame, B.system - 0.1, {damping: 16, stiffness: 120});
  const basket: BasketPlacement = {
    x: 540,
    y: mix(basketIn, 2500, 1420),
    w: 500,
    rotate: shake(frame, B.falseCase, 2.2, 0.5),
    glow: t < B.falseCase ? COLORS.true : COLORS.false,
    glowAmount: t > B.trueCase - 0.05 ? (t < B.falseCase ? 1 : ramp(frame, B.falseCase, B.falseCase + 0.15)) : 0,
  };
  const slot = basketSlot(basket, 0);

  // ── aish: hand-off → standby → hover above basket → drop → yanked out (FALSE)
  const dropT = drop(frame, B.trueCase - 0.42, 0.34);
  const yank = ramp(frame, B.falseCase - 0.35, B.falseCase + 0.25, EASE.in);
  const hoverX = kf(frame, [0, 1.5, B.system - 0.2, B.system + 0.6], [HANDOFF.aish.x, 820, 820, 540]);
  const hoverY = kf(frame, [0, 1.5, B.system - 0.2, B.system + 0.6], [HANDOFF.aish.y, 1380, 1380, 1010]);
  const hoverS = kf(frame, [0, 1.5, B.system + 0.6], [HANDOFF.scale, 0.62, slot.scale]);
  let aX = t < B.trueCase - 0.42 ? hoverX : slot.x;
  let aY = t < B.trueCase - 0.42 ? hoverY : mix(dropT, 1010, slot.y);
  const aS = hoverS;
  aX += yank * 520;
  aY -= yank * 760 - yank * yank * 120;
  const aRot = yank * 38 + (t < B.trueCase - 0.42 ? Math.sin(t * 2.6) * 2 : 0);
  const aOpacity = 1 - ramp(frame, B.falseCase - 0.05, B.falseCase + 0.25);

  // ── samoli: steps aside and watches
  const sX = kf(frame, [0, 1.5, B.system - 0.2, B.system + 0.6], [HANDOFF.samoli.x, 260, 260, 150]);
  const sY = kf(frame, [0, 1.5, B.system + 0.6], [HANDOFF.samoli.y, 1380, 1420]);
  const sS = kf(frame, [0, 1.5, B.system + 0.6], [HANDOFF.scale, 0.62, 0.42]);
  const sDim = ramp(frame, B.system, B.system + 0.6) * 0.3;

  // ── results
  const tr = ramp(frame, B.trueCase, B.trueCase + 0.45, EASE.out);
  const fa = ramp(frame, B.falseCase, B.falseCase + 0.45, EASE.out);
  const split = ramp(frame, B.falseCase + 0.75, B.falseCase + 1.3, EASE.inOut);
  const trueFlash = ramp(frame, B.trueCase, B.trueCase + 0.6, EASE.out);
  const falseFlash = ramp(frame, B.falseCase, B.falseCase + 0.6, EASE.out);

  // statement card
  const card = ramp(frame, B.system + 0.2, B.system + 0.75);

  return (
    <AbsoluteFill style={{opacity: 1 - exit * 0}}>
      <StudioBackdrop opacity={bg} tint={COLORS.true} tintAmount={0.12 + 0.25 * tr * (1 - fa)} floorY={1330} />
      <AbsoluteFill style={{background: COLORS.false, opacity: (1 - falseFlash) * fa * 0.12}} />

      {/* title — kinetic, weighted, with Latin counterpart */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: titleY - 120,
          transform: `scale(${titleScale}) translateY(${-exit * 40}px)`,
          opacity: 1 - exit,
          filter: `blur(${exit * 10}px)`,
        }}
      >
        <Eyebrow latin color={COLORS.muted} style={{opacity: ramp(frame, B.title + 0.3, B.title + 0.8), marginBottom: 10}}>
          TRUTH VALUE
        </Eyebrow>
        <KineticLine at={B.title} size={150} weight={900} stagger={0.12} words={[{t: 'قيمة'}, {t: 'الصواب', color: '#FFD27A'}]} />
        <div
          style={{
            margin: '6px auto 0',
            height: 6,
            borderRadius: 3,
            width: 520 * ramp(frame, B.title + 0.25, B.title + 0.9),
            background: `linear-gradient(90deg, ${COLORS.false}, #FFD27A, ${COLORS.true})`,
          }}
        />
      </div>

      {/* the statement being judged */}
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 470,
          display: 'flex',
          justifyContent: 'center',
          opacity: card * (1 - split) * (1 - exit),
          transform: `translateY(${(1 - card) * 20}px)`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '14px 34px',
            borderRadius: 22,
            background: 'rgba(255,255,255,0.06)',
            border: '1.5px solid rgba(255,255,255,0.14)',
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: 46,
            color: COLORS.paper,
          }}
        >
          <span style={{color: COLORS.muted, fontSize: 34}}>العبارة:</span>
          <span>
            <span style={{color: COLORS.aish}}>العيش</span> في السلة
          </span>
        </div>
      </div>

      <BasketBack {...basket} opacity={1 - exit} />
      <ProductActor kind="samoli" x={sX} y={sY} scale={sS} dim={sDim} opacity={1 - exit} rotateY={8} />
      <ProductActor kind="aish" x={aX} y={aY} scale={aS} rotate={aRot} rotateY={-6} opacity={aOpacity * (1 - exit)} shadow={t < B.trueCase - 0.42} />
      <BasketFront {...basket} opacity={1 - exit} />

      {/* result badges: one value at a time, then both values side by side */}
      <ResultBadge
        value
        progress={tr * (1 - exit)}
        x={mix(split, 540, 750)}
        y={mix(split, 760, 640)}
        scale={mix(split, 1, 0.78)}
        flash={trueFlash}
        dim={fa * (1 - split)}
      />
      {fa > 0 && (
        <ResultBadge
          value={false}
          progress={fa * (1 - exit)}
          x={mix(split, 540, 330)}
          y={mix(split, 900, 640)}
          scale={mix(split, 1, 0.78)}
          flash={falseFlash}
          shakeX={shake(frame, B.falseCase, 16)}
        />
      )}
    </AbsoluteFill>
  );
};
