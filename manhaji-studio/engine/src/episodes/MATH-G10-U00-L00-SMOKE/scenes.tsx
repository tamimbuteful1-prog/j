import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useScene} from '../../timeline/context';
import {StudioBackdrop} from '../../kit/Backdrop';
import {KineticLine} from '../../kit/Type';
import {ResultBadge} from '../../kit/ResultBadge';
import {Outro} from '../../kit/Outro';
import {COLORS} from '../../kit/theme';
import {ramp, shake} from '../../kit/anim';

export const S01: React.FC = () => {
  const {beat} = useScene();
  return (
    <AbsoluteFill>
      <StudioBackdrop tint={COLORS.or} />
      <div style={{position: 'absolute', top: 700, left: 0, right: 0}}>
        <KineticLine at={beat('title')} size={110} words={[{t: 'خط'}, {t: 'الإنتاج', color: '#FFD27A'}]} />
      </div>
    </AbsoluteFill>
  );
};

export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const {beat} = useScene();
  return (
    <AbsoluteFill>
      <StudioBackdrop tint={COLORS.and} />
      <ResultBadge value progress={ramp(frame, beat('trueHit'), beat('trueHit') + 0.45)} x={540} y={700} flash={ramp(frame, beat('trueHit'), beat('trueHit') + 0.6)} />
      <ResultBadge value={false} progress={ramp(frame, beat('falseHit'), beat('falseHit') + 0.45)} x={540} y={950} shakeX={shake(frame, beat('falseHit'))} />
    </AbsoluteFill>
  );
};

export const S03: React.FC = () => {
  const {beat} = useScene();
  return <Outro lesson_ar="اختبار المحرك" subject_ar="الرياضيات" grade_ar="أول ثانوي" at={beat('logo')} />;
};
