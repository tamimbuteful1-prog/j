import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource/cairo/arabic-700.css';
import '@fontsource/cairo/arabic-800.css';
import '@fontsource/cairo/arabic-900.css';
import '@fontsource/cairo/latin-700.css';
import '@fontsource/cairo/latin-800.css';
import '@fontsource/cairo/latin-900.css';
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css';
import '@fontsource/ibm-plex-sans-arabic/latin-600.css';
import {C} from './theme';
import {HOOK} from './timeline';
import {clamp} from './lib/anim';
import {HookLayer} from './hook/Hook';
import {World} from './world/World';
import {Captions, DiveFX, Finish, Outro} from './overlay/Overlays';
import {SoundTrack} from './audio/SoundTrack';

const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading Arabic fonts'));
  useEffect(() => {
    Promise.all(
      ['700 40px Cairo', '800 40px Cairo', '900 40px Cairo', '600 40px "IBM Plex Sans Arabic"'].map((f) => document.fonts.load(f, 'منهجي abc')),
    )
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};

export const Manhaji: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const showHook = t < 9.2;
  const showWorld = t >= HOOK.worldIn;
  const worldOpacity = clamp((t - HOOK.worldIn) / 0.25);

  return (
    <AbsoluteFill style={{background: C.bg0}}>
      {showHook ? <HookLayer t={t} /> : null}
      {showWorld ? <World t={t} opacity={worldOpacity} /> : null}
      <DiveFX t={t} />
      <Outro t={t} />
      <Captions t={t} />
      <Finish t={t} frame={frame} />
      <SoundTrack />
    </AbsoluteFill>
  );
};
