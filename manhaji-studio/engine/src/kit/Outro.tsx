import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {StudioBackdrop} from './Backdrop';
import {Eyebrow, KineticLine} from './Type';
import {EASE, pop, ramp} from './anim';
import {ManhajiMark} from './HookFrame';
import {usePalette} from './ThemeContext';

/** Unified «منهجي» end card. `at` = seconds (scene-local) for the logo; `children` = episode props flanking it. */
export const Outro: React.FC<{lesson_ar: string; subject_ar: string; grade_ar: string; at?: number; subjectAt?: number; children?: React.ReactNode}> = ({
  lesson_ar,
  subject_ar,
  grade_ar,
  at = 0.25,
  subjectAt = 1.6,
  children,
}) => {
  const frame = useCurrentFrame();
  const pal = usePalette();
  const mark = pop(frame, at, {damping: 12, stiffness: 110});
  const sweep = ramp(frame, at + 0.5, at + 1.5, EASE.inOut);
  return (
    <AbsoluteFill>
      <StudioBackdrop tint="#6F6BFF" tintAmount={0.35} floorY={1520} />
      <div style={{position: 'absolute', left: 540 - 110, top: 520, transform: `scale(${mark * 4.07}) rotate(${(1 - mark) * -20}deg)`, transformOrigin: '0 0', width: 54, height: 54}}>
        <ManhajiMark size={54} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 780, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative'}}>
          <KineticLine at={at + 0.35} size={170} weight={900} words={[{t: 'منهجي'}]} />
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(100deg, transparent ${sweep * 140 - 40}%, ${pal.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)'} ${sweep * 140 - 25}%, transparent ${sweep * 140 - 10}%)`, mixBlendMode: 'overlay'}} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1030}}>
        <KineticLine at={at + 0.7} size={70} weight={800} color={pal.accent} words={[{t: lesson_ar}]} />
        <Eyebrow color={pal.sub} style={{fontSize: 38, marginTop: 14, opacity: ramp(frame, subjectAt, subjectAt + 0.5)}}>
          {subject_ar} · {grade_ar}
        </Eyebrow>
      </div>
      {children}
    </AbsoluteFill>
  );
};
