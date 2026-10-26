import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SCENE_F} from '../config/timeline';
import {COLORS, FONTS} from '../config/theme';
import {StudioBackdrop} from '../components/Backdrop';
import {ProductActor} from '../components/Product';
import {BasketBack, BasketFront, BasketPlacement, basketSlot} from '../components/Basket';
import {Chip} from '../components/Type';
import {EASE, mix, pop, ramp} from '../lib/anim';

const B = SCENE_F.beats;

/**
 * SCENE F — one-frame summary (no new voice-over).
 * Top: OR — one product is enough. Bottom: AND — both are required.
 */
export const SceneF_Summary: React.FC = () => {
  const frame = useCurrentFrame();
  const exit = ramp(frame, 3.45, 3.9, EASE.in);
  return (
    <AbsoluteFill>
      <StudioBackdrop tint="#7A7CFF" tintAmount={0.3} floorY={1700} />
      <AbsoluteFill style={{transform: `scale(${1 - exit * 0.25})`, opacity: 1 - exit, filter: `blur(${exit * 12}px)`}}>
        <Panel op="or" top={250} at={B.or} from={1} />
        <Panel op="and" top={870} at={B.and} from={-1} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Panel: React.FC<{op: 'or' | 'and'; top: number; at: number; from: 1 | -1}> = ({op, top, at, from}) => {
  const frame = useCurrentFrame();
  const p = pop(frame, at, {damping: 16, stiffness: 130});
  const c = op === 'or' ? COLORS.or : COLORS.and;
  const H = 560;
  const basket: BasketPlacement = {x: 330, y: top + H - 50, w: 380, glow: COLORS.true, glowAmount: ramp(frame, at + 0.8, at + 1.0)};
  const dropP = ramp(frame, at + 0.35, at + 0.75, EASE.in);
  const dropP2 = ramp(frame, at + 0.5, at + 0.9, EASE.in);
  const sa = basketSlot(basket, op === 'or' ? 0 : 1);
  const ss = basketSlot(basket, -1);
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        top,
        height: H,
        borderRadius: 48,
        background: `linear-gradient(160deg, ${c}24, rgba(255,255,255,0.03) 60%)`,
        border: `2px solid ${c}66`,
        boxShadow: `0 40px 100px rgba(0,0,0,0.45), inset 0 0 60px ${c}18`,
        transform: `translateX(${(1 - p) * 1100 * from}px)`,
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', top: 40, right: 44}}>
        <Chip color={c} op={op} latin={op === 'or' ? 'OR' : 'AND'} arabic={op === 'or' ? 'عبارة الفصل' : 'عبارة الوصل'} scale={0.9} />
      </div>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          right: 50,
          top: 190,
          width: 470,
          fontFamily: FONTS.display,
          fontWeight: 800,
          fontSize: 60,
          lineHeight: 1.35,
          color: COLORS.paper,
          opacity: ramp(frame, at + 0.25, at + 0.6),
        }}
      >
        {op === 'or' ? (
          <>
            يكفي تحقق <span style={{color: c}}>واحدة</span> على الأقل
          </>
        ) : (
          <>
            يجب تحقق <span style={{color: c}}>الاثنتين</span>
          </>
        )}
      </div>
      {/* mini basket, coordinates local to the panel */}
      <div style={{position: 'absolute', left: -70, top: -top, width: 1080, height: 1920}}>
        <BasketBack {...basket} />
        <ProductActor kind="aish" x={sa.x} y={mix(dropP, sa.y - 260, sa.y)} scale={sa.scale} opacity={Math.min(1, dropP * 3)} shadow={false} />
        {op === 'and' && <ProductActor kind="samoli" x={ss.x} y={mix(dropP2, ss.y - 260, ss.y)} scale={ss.scale} opacity={Math.min(1, dropP2 * 3)} shadow={false} />}
        <BasketFront {...basket} />
      </div>
    </div>
  );
};
