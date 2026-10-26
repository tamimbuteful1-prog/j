import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SCENE_OUTRO} from '../config/timeline';
import {COLORS} from '../config/theme';
import {StudioBackdrop} from '../components/Backdrop';
import {ProductActor} from '../components/Product';
import {Eyebrow, KineticLine} from '../components/Type';
import {EASE, pop, ramp} from '../lib/anim';

const B = SCENE_OUTRO.beats;

/** MANHAJI end card — «وهذا درس المنطق، من مادة الرياضيات للصف الأول الثانوي». */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const mark = pop(frame, B.logo, {damping: 12, stiffness: 110});
  const sweep = ramp(frame, B.logo + 0.5, B.logo + 1.5, EASE.inOut);
  const fadeOut = ramp(frame, 5.0, 5.6, EASE.in);
  const prod = ramp(frame, B.subject, B.subject + 0.7);
  return (
    <AbsoluteFill>
      <StudioBackdrop tint="#6F6BFF" tintAmount={0.35} floorY={1520} />
      <AbsoluteFill style={{opacity: 1 - fadeOut}}>
        {/* logo mark: three rising steps — a method, step by step */}
        <div style={{position: 'absolute', left: 540 - 110, top: 520, width: 220, height: 220, transform: `scale(${mark}) rotate(${(1 - mark) * -20}deg)`}}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 56,
              background: `linear-gradient(140deg, ${COLORS.or}, ${COLORS.and})`,
              boxShadow: `0 30px 90px ${COLORS.andGlow}`,
            }}
          />
          {[0, 1, 2].map((i) => {
            const p = ramp(frame, B.logo + 0.25 + i * 0.12, B.logo + 0.6 + i * 0.12, EASE.out);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  right: 46 + i * 46,
                  bottom: 48,
                  width: 34,
                  height: (44 + i * 38) * p,
                  borderRadius: 12,
                  background: '#fff',
                  opacity: 0.95,
                }}
              />
            );
          })}
        </div>
        {/* wordmark with a light sweep */}
        <div style={{position: 'absolute', left: 0, right: 0, top: 780, display: 'flex', justifyContent: 'center'}}>
          <div style={{position: 'relative'}}>
            <KineticLine at={B.logo + 0.35} size={170} weight={900} words={[{t: 'منهجي'}]} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(100deg, transparent ${sweep * 140 - 40}%, rgba(255,255,255,0.65) ${sweep * 140 - 25}%, transparent ${sweep * 140 - 10}%)`,
                mixBlendMode: 'overlay',
              }}
            />
          </div>
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 1030}}>
          <KineticLine at={B.logo + 0.7} size={70} weight={800} color="#FFD27A" words={[{t: 'المنطق'}]} />
          <Eyebrow color={COLORS.paperDim} style={{fontSize: 38, marginTop: 14, opacity: ramp(frame, B.subject, B.subject + 0.5)}}>
            الرياضيات · الصف الأول الثانوي
          </Eyebrow>
        </div>
        <ProductActor kind="aish" x={700} y={1470 + (1 - prod) * 60} scale={0.42} opacity={prod} rotateY={-14 + Math.sin(t) * 4} />
        <ProductActor kind="samoli" x={380} y={1470 + (1 - prod) * 60} scale={0.42} opacity={prod} rotateY={14 - Math.sin(t) * 4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
