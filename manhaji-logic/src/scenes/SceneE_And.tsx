import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SCENE_E} from '../config/timeline';
import {COLORS, FONTS} from '../config/theme';
import {StudioBackdrop} from '../components/Backdrop';
import {ProductActor, ProductArt, ProductKind} from '../components/Product';
import {BasketBack, BasketFront, BasketPlacement, basketSlot} from '../components/Basket';
import {ResultBadge} from '../components/ResultBadge';
import {Chip} from '../components/Type';
import {TruthTable} from '../components/TruthTable';
import {EASE, kf, mix, pop, ramp, shake} from '../lib/anim';

const B = SCENE_E.beats;

/**
 * SCENE E — عبارة الوصل (AND)
 * A two-key lock sits on the basket: it opens ONLY when both sockets are lit.
 *  1) both in → TRUE   2) the bread is pulled out → FALSE
 *  3) new camera angle + new rhythm: bread back, samoli gone → FALSE again
 */
export const SceneE_And: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const exit = ramp(frame, SCENE_E.durationSec - 0.4, SCENE_E.durationSec, EASE.in);

  // ── recomposed "camera" for the third case
  const reco = ramp(frame, B.recompose - 0.1, B.recompose + 0.8, EASE.inOut);
  const stageRotY = mix(reco, 0, -16);
  const stageRotX = mix(reco, 0, 7);
  const stageScale = mix(reco, 1, 1.07);
  const stageX = mix(reco, 0, 40);

  const basketIn = pop(frame, 0.75, {damping: 15, stiffness: 120});
  const basket: BasketPlacement = {
    x: 540,
    y: mix(basketIn, 2500, 1430),
    w: 460,
    rotate: shake(frame, B.false1, 2.6, 0.5),
  };
  const slotA = basketSlot(basket, 1);
  const slotS = basketSlot(basket, -1);

  // ── product states (0 = waiting outside, 1 = in the basket)
  const sIn =
    kf(frame, [B.samoliIn - 0.3, B.samoliIn + 0.05], [0, 1], EASE.in) * (1 - kf(frame, [B.recompose + 0.4, B.recompose + 0.85], [0, 1], EASE.out));
  const aIn =
    kf(frame, [B.aishIn - 0.3, B.aishIn + 0.05], [0, 1], EASE.in) * (1 - kf(frame, [B.removeAish, B.removeAish + 0.45], [0, 1], EASE.out)) +
    kf(frame, [B.recompose + 1.3, B.recompose + 1.6], [0, 1], EASE.in);

  // waiting positions: from the bonded pair (Scene D) out to the sides
  const unbond = ramp(frame, 0.2, 1.1, EASE.inOut);
  const waitA = {x: mix(unbond, 637, 870), y: mix(unbond, 1330, 1060)};
  const waitS = {x: mix(unbond, 443, 210), y: mix(unbond, 1330, 1060)};
  const waitScale = mix(unbond, 0.66, 0.5);

  // removal paths: bread exits up-right, samoli exits up-left (different gestures)
  const aYank = ramp(frame, B.removeAish, B.removeAish + 0.45, EASE.out) * (1 - ramp(frame, B.recompose, B.recompose + 1.3));
  const sYank = ramp(frame, B.recompose + 0.4, B.recompose + 0.85, EASE.out);

  const aX = mix(aIn, waitA.x, slotA.x) + aYank * 40;
  const aY = mix(aIn, waitA.y, slotA.y) - Math.sin(aIn * Math.PI) * 140 - aYank * 60;
  const sX = mix(sIn, waitS.x, slotS.x) - sYank * 20;
  const sY = mix(sIn, waitS.y, slotS.y) - Math.sin(sIn * Math.PI) * 140 - sYank * 60;

  // ghosts left behind
  const ghostA = ramp(frame, B.removeAish + 0.3, B.removeAish + 0.6) * (1 - ramp(frame, B.recompose, B.recompose + 0.3));
  const ghostS = ramp(frame, B.recompose + 0.7, B.recompose + 1.0) * (1 - exit);

  // ── lock state
  const litA = aIn > 0.9 ? 1 : 0;
  const litS = sIn > 0.9 ? 1 : 0;
  const open = litA && litS ? ramp(frame, B.bothTrue - 0.1, B.bothTrue + 0.2) : 0;

  // ── results
  const r1 = ramp(frame, B.bothTrue, B.bothTrue + 0.4);
  const r2 = ramp(frame, B.false1, B.false1 + 0.4);
  const r3 = ramp(frame, B.false2, B.false2 + 0.4);
  const phase = t < B.removeAish ? 1 : t < B.recompose ? 2 : 3;
  const badgeP = phase === 1 ? r1 : phase === 2 ? r2 * (1 - ramp(frame, B.recompose - 0.2, B.recompose + 0.1)) : r3;
  const badgeVal = phase === 1;
  const badgeAt = phase === 1 ? B.bothTrue : phase === 2 ? B.false1 : B.false2;

  const rows = [
    {aish: true, samoli: true, result: true, progress: r1, active: phase === 1 && r1 > 0 ? 1 : 0},
    {aish: false, samoli: true, result: false, progress: r2, active: phase === 2 && r2 > 0 ? 1 : 0},
    {aish: true, samoli: false, result: false, progress: r3, active: phase === 3 && r3 > 0 ? 1 : 0},
  ];

  const redFlash =
    (ramp(frame, B.false1, B.false1 + 0.05) - ramp(frame, B.false1 + 0.1, B.false1 + 0.6)) * 0.16 +
    (ramp(frame, B.false2, B.false2 + 0.05) - ramp(frame, B.false2 + 0.1, B.false2 + 0.6)) * 0.16;
  const glitch = t > B.false2 && t < B.false2 + 0.35;
  const greenFlash = ramp(frame, B.bothTrue, B.bothTrue + 0.05) - ramp(frame, B.bothTrue + 0.1, B.bothTrue + 0.7);

  const basketGlow = phase === 1 ? (open ? COLORS.true : undefined) : t > B.false1 ? COLORS.false : undefined;

  return (
    <AbsoluteFill>
      <StudioBackdrop tint={COLORS.and} tintAmount={0.38} floorY={1450} lightX={540 + reco * 120} />
      <AbsoluteFill style={{background: COLORS.false, opacity: Math.max(0, redFlash)}} />
      <AbsoluteFill style={{background: COLORS.true, opacity: Math.max(0, greenFlash) * 0.1}} />

      <AbsoluteFill style={{opacity: 1 - exit}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 236, display: 'flex', justifyContent: 'center', transform: 'scale(0.85)'}}>
          <Chip color={COLORS.and} op="and" latin="AND" arabic="عبارة وصل" />
        </div>
        <TruthTable x={540} y={330} rows={rows} op="and" appear={ramp(frame, B.slots, B.slots + 0.5)} width={760} />

        {/* the stage — re-angled for the last case */}
        <AbsoluteFill
          style={{
            perspective: 1800,
            transformStyle: 'preserve-3d',
          }}
        >
          <AbsoluteFill
            style={{
              transform: `translateX(${stageX}px) rotateY(${stageRotY}deg) rotateX(${stageRotX}deg) scale(${stageScale})`,
              transformOrigin: '50% 75%',
            }}
          >
            <TwoKeyLock
              y={760}
              appear={ramp(frame, B.slots, B.slots + 0.5)}
              litA={litA}
              litS={litS}
              open={open}
              rule={ramp(frame, B.bothRule, B.bothRule + 0.5) * (1 - ramp(frame, B.samoliIn - 0.4, B.samoliIn))}
              pulse={Math.sin(t * 6) * 0.5 + 0.5}
              shakeX={shake(frame, B.false1, 12) + shake(frame, B.false2, 12)}
            />

            <BasketBack {...basket} />
            {ghostA > 0 && <ProductActor kind="aish" x={slotA.x} y={slotA.y} scale={slotA.scale} ghost={1} opacity={ghostA} shadow={false} />}
            {ghostS > 0 && <ProductActor kind="samoli" x={slotS.x} y={slotS.y} scale={slotS.scale} ghost={1} opacity={ghostS} shadow={false} />}
            <ProductActor
              kind="samoli"
              x={sX}
              y={sY}
              scale={mix(sIn, waitScale, slotS.scale)}
              rotateY={12}
              rotate={-sYank * 8}
              shadow={sIn < 0.5}
              dim={sYank * 0.45}
            />
            <ProductActor
              kind="aish"
              x={aX}
              y={aY}
              scale={mix(aIn, waitScale, slotA.scale)}
              rotateY={-12}
              rotate={aYank * 10}
              shadow={aIn < 0.5}
              dim={aYank * 0.45}
            />
            <BasketFront {...basket} glow={basketGlow} glowAmount={basketGlow ? 1 : 0} />
          </AbsoluteFill>
        </AbsoluteFill>

        <div style={{position: 'absolute', inset: 0, transform: glitch ? `translateX(${(frame % 2 ? 1 : -1) * 10}px)` : undefined}}>
          <ResultBadge
            value={badgeVal}
            progress={badgeP}
            x={540}
            y={phase === 3 ? 980 : 940}
            scale={0.82}
            flash={ramp(frame, badgeAt, badgeAt + 0.6)}
            shakeX={phase === 2 ? shake(frame, B.false1, 16) : 0}
          />
          {glitch && (
            <div style={{position: 'absolute', left: 330, width: 420, top: 960, height: 14, background: COLORS.false, opacity: 0.6, mixBlendMode: 'screen'}} />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Two sockets (عيش · صامولي) + a padlock: AND made mechanical. */
const TwoKeyLock: React.FC<{
  y: number;
  appear: number;
  litA: number;
  litS: number;
  open: number;
  rule: number;
  pulse: number;
  shakeX: number;
}> = ({y, appear, litA, litS, open, rule, pulse, shakeX}) => {
  const socket = (kind: ProductKind, x: number, lit: number) => {
    const c = kind === 'aish' ? COLORS.aish : COLORS.samoli;
    const ring = lit ? c : `rgba(255,255,255,${0.18 + rule * pulse * 0.5})`;
    return (
      <div
        style={{
          position: 'absolute',
          left: x - 62,
          top: -62,
          width: 124,
          height: 124,
          borderRadius: '50%',
          border: `4px solid ${ring}`,
          background: lit ? `${c}30` : 'rgba(255,255,255,0.04)',
          boxShadow: lit ? `0 0 40px ${c}` : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <ProductArt kind={kind} style={{width: 74, height: 89, opacity: lit ? 1 : 0.28, filter: lit ? undefined : 'grayscale(1)'}} />
      </div>
    );
  };
  const lockC = open ? COLORS.true : COLORS.and;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, height: 0, opacity: appear, transform: `translateX(${shakeX}px) translateY(${(1 - appear) * 30}px)`}}>
      {/* connecting rail */}
      <div style={{position: 'absolute', left: 302, width: 476, top: -3, height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${litS ? COLORS.samoli : '#39405A'}, ${lockC}, ${litA ? COLORS.aish : '#39405A'})`}} />
      {socket('aish', 770, litA)}
      {socket('samoli', 310, litS)}
      {/* padlock */}
      <div style={{position: 'absolute', left: 540 - 56, top: -86, width: 112, height: 150}}>
        <svg width={112} height={150} viewBox="0 0 112 150" style={{overflow: 'visible', filter: `drop-shadow(0 0 ${18 + open * 20}px ${lockC})`}}>
          <path
            d="M28 70 V44 A28 28 0 0 1 84 44 V70"
            stroke={lockC}
            strokeWidth={12}
            fill="none"
            strokeLinecap="round"
            transform={`translate(0 ${-open * 22}) rotate(${-open * 18} 28 70)`}
          />
          <rect x={8} y={66} width={96} height={78} rx={18} fill={COLORS.ink3} stroke={lockC} strokeWidth={5} />
          <text x={56} y={118} textAnchor="middle" fontFamily={FONTS.text} fontWeight={700} fontSize={34} fill={lockC} direction="ltr">
            {litA + litS}/2
          </text>
        </svg>
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 80,
          textAlign: 'center',
          fontFamily: FONTS.display,
          fontWeight: 800,
          fontSize: 44,
          color: COLORS.and,
          opacity: rule,
        }}
      >
        كلا العبارتين
      </div>
    </div>
  );
};
