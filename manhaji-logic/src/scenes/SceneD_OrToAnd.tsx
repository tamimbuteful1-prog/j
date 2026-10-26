import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {SCENE_D} from '../config/timeline';
import {COLORS, FONTS} from '../config/theme';
import {StudioBackdrop} from '../components/Backdrop';
import {ProductActor} from '../components/Product';
import {Chip, Eyebrow, KineticLine} from '../components/Type';
import {Extruded} from '../components/Extruded';
import {LogicSymbol} from '../components/LogicSymbol';
import {EASE, kf, mix, pop, ramp} from '../lib/anim';

const B = SCENE_D.beats;
const FLIP_AT = B.flip + 0.4;

/**
 * SCENE D — from «أو» to «و».
 * ∨ physically flips 180° and lands as ∧ (it is the same shape, upside down),
 * the world re-tints from blue to violet, and the two products — apart until now —
 * are pulled into one locked unit.
 */
export const SceneD_OrToAnd: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const exit = ramp(frame, 7.0, 7.4, EASE.in);

  const enter = pop(frame, B.flip - 0.1, {damping: 14, stiffness: 150});
  const flip = ramp(frame, FLIP_AT - 0.1, FLIP_AT + 0.4, EASE.anticipate);
  const color = interpolateColors(flip, [0, 0.5, 1], [COLORS.or, '#FFFFFF', COLORS.and]);
  const shock = ramp(frame, FLIP_AT + 0.15, FLIP_AT + 0.9, EASE.out);

  // camera whip around the flip
  const whip = kf(frame, [FLIP_AT - 0.15, FLIP_AT + 0.15, FLIP_AT + 0.7], [0, -7, 0], EASE.inOut);
  const punch = 1 + 0.08 * Math.sin(Math.min(1, Math.max(0, (t - FLIP_AT) / 0.5)) * Math.PI);

  // symbol docks into the header
  const dock = ramp(frame, B.card - 0.2, B.card + 0.5, EASE.inOut);
  const symY = mix(dock, 760, 300);
  const symS = mix(dock, 1, 0.24);
  const chip = ramp(frame, B.term - 0.1, B.term + 0.4);

  // products: apart → slammed together on the flip → bonded on «الواو»
  const together = ramp(frame, FLIP_AT + 0.05, FLIP_AT + 0.35, EASE.in);
  const bond = ramp(frame, B.bond - 0.15, B.bond + 0.35, EASE.out);
  const aX = mix(together, 930, 655) - bond * 18;
  const sX = mix(together, 150, 425) + bond * 18;
  const pY = 1330;
  const pS = 0.66;
  const impactBounce = t > FLIP_AT + 0.35 ? Math.exp(-(t - FLIP_AT - 0.35) * 9) * Math.sin((t - FLIP_AT - 0.35) * 40) * 12 : 0;

  // «و» lifts out of the sentence
  const wa = ramp(frame, B.waGrow, B.waGrow + 0.6, EASE.out);
  const cardOut = ramp(frame, B.term, B.term + 0.4);

  return (
    <AbsoluteFill>
      <StudioBackdrop tint={interpolateColors(flip, [0, 1], [COLORS.or, COLORS.and])} tintAmount={0.45} floorY={1460} />
      <AbsoluteFill style={{opacity: 1 - exit, transform: `rotate(${whip}deg) scale(${punch})`, transformOrigin: '50% 50%'}}>
        {/* shockwave */}
        {shock > 0 && shock < 1 && (
          <div
            style={{
              position: 'absolute',
              left: 540 - 300,
              top: 760 - 300,
              width: 600,
              height: 600,
              borderRadius: '50%',
              border: `${14 * (1 - shock)}px solid ${COLORS.and}`,
              transform: `scale(${0.3 + shock * 2.4})`,
              opacity: 1 - shock,
              boxShadow: `0 0 60px ${COLORS.andGlow}`,
            }}
          />
        )}

        {/* ∨ → ∧ */}
        <div
          style={{
            position: 'absolute',
            left: 540 - 180,
            top: symY - 200,
            width: 360,
            display: 'flex',
            justifyContent: 'center',
            transform: `scale(${enter * symS})`,
            opacity: 1 - ramp(frame, B.card + 0.3, B.card + 0.5),
          }}
        >
          <Extruded
            size={300}
            color={color}
            side={interpolateColors(flip, [0, 1], ['#1B2F66', '#35206B'])}
            depth={56}
            layers={12}
            rotateX={(flip < 0.5 ? flip * 180 : flip * 180 - 180) + 6}
            rotateY={Math.sin(t * 1.4) * 14}
            glow={flip > 0.5 ? COLORS.andGlow : COLORS.orGlow}
            render={(c) => <LogicSymbol op={flip < 0.5 ? 'or' : 'and'} size={260} color={c} stroke={16} />}
          />
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1000, opacity: ramp(frame, FLIP_AT + 0.3, FLIP_AT + 0.6) * (1 - dock)}}>
          <Eyebrow latin color={COLORS.and} style={{fontSize: 40}}>
            OR → AND
          </Eyebrow>
        </div>

        {/* header chip */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center', opacity: chip}}>
          <Chip color={COLORS.and} op="and" latin="AND" arabic="عبارة وصل" />
        </div>

        {/* the new order */}
        <div style={{position: 'absolute', left: 90, right: 90, top: 520, height: 250, opacity: ramp(frame, B.card - 0.2, B.card + 0.3) * (1 - cardOut * 0.0)}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 40,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))',
              border: `1.5px solid ${COLORS.and}55`,
              opacity: 1 - cardOut,
            }}
          />
          <Eyebrow color={COLORS.paperDim} style={{position: 'absolute', top: 30, left: 0, right: 0, fontSize: 32, opacity: (1 - cardOut) * (1 - wa)}}>
            لو قال الأب
          </Eyebrow>
          <div style={{position: 'absolute', top: 92, left: 0, right: 0, opacity: 1 - cardOut * 0.85, transform: `scale(${1 - cardOut * 0.12}) translateY(${cardOut * -10}px)`}}>
            <KineticLine
              at={B.card}
              size={84}
              weight={800}
              gap={22}
              words={[
                {t: 'جيب', opacity: 1 - wa * 0.6},
                {t: 'عيش', color: COLORS.aish, opacity: 1 - wa * 0.4},
                {t: 'و', color: COLORS.and, glue: true, scale: 1 + wa * 0.9, y: -wa * 70, glow: wa > 0.1 ? COLORS.andGlow : undefined},
                {t: 'صامولي', color: COLORS.samoli, opacity: 1 - wa * 0.4},
              ]}
            />
          </div>
        </div>

        {/* term */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 820}}>
          <KineticLine at={B.term} size={110} weight={900} words={[{t: 'عبارة'}, {t: 'وصل', color: COLORS.and, glow: COLORS.andGlow}]} />
        </div>

        {/* products — pulled into one system */}
        <ProductActor kind="samoli" x={sX + impactBounce} y={pY} scale={pS} rotateY={12 * (1 - together)} rotate={-6 * (1 - together)} />
        <ProductActor kind="aish" x={aX - impactBounce} y={pY} scale={pS} rotateY={-12 * (1 - together)} rotate={6 * (1 - together)} />

        {/* the bond: a violet clamp around both */}
        {bond > 0 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 540 - mix(bond, 360, 300),
                width: mix(bond, 720, 600),
                top: pY - 290,
                height: 320,
                borderRadius: 44,
                border: `5px solid ${COLORS.and}`,
                boxShadow: `0 0 50px ${COLORS.andGlow}, inset 0 0 40px ${COLORS.and}33`,
                opacity: bond,
              }}
            />
            <div
              dir="rtl"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: pY + 30,
                textAlign: 'center',
                fontFamily: FONTS.display,
                fontWeight: 800,
                fontSize: 48,
                color: COLORS.and,
                opacity: ramp(frame, B.bond + 0.2, B.bond + 0.6),
              }}
            >
              الاثنين معًا
            </div>
          </>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

