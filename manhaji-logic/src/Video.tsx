import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import './lib/fonts';
import {HOOK, SHOW_CAPTIONS, SHOW_SAFE_GUIDES} from './config/media';
import {HOOK_CAPTIONS, Timeline, buildTimeline, sec} from './config/timeline';
import {COLORS, SAFE} from './config/theme';
import {AbsCaption, Captions} from './components/Captions';
import {Finish} from './components/Backdrop';
import {SoundDesign} from './audio/SoundDesign';
import {HookScene} from './scenes/HookScene';
import {SceneA_Store} from './scenes/SceneA_Store';
import {SceneB_TruthValue} from './scenes/SceneB_TruthValue';
import {SceneC_Or} from './scenes/SceneC_Or';
import {SceneD_OrToAnd} from './scenes/SceneD_OrToAnd';
import {SceneE_And} from './scenes/SceneE_And';
import {SceneF_Summary} from './scenes/SceneF_Summary';
import {Outro} from './scenes/Outro';

export type VideoProps = {hookClipSec: number};

const SCENE_COMPONENTS: Record<string, React.FC> = {
  A: SceneA_Store,
  B: SceneB_TruthValue,
  C: SceneC_Or,
  D: SceneD_OrToAnd,
  E: SceneE_And,
  F: SceneF_Summary,
  OUTRO: Outro,
};

/** Absolute caption windows (also drive the music ducking). */
export const collectCaptions = (tl: Timeline): AbsCaption[] => {
  const orF = sec(HOOK.orWordSec);
  const mapHook = (s: number) => {
    const fr = sec(s);
    return fr < orF ? fr : fr + HOOK.freezeFrames;
  };
  const hook = HOOK_CAPTIONS.map((c) => ({...c, start: mapHook(c.from), end: Math.min(mapHook(c.to), tl.hookFrames - sec(0.5))}));
  const rest = tl.scenes.flatMap(({def, from}) => def.captions.map((c) => ({...c, start: from + sec(c.from), end: from + sec(c.to)})));
  return [...hook, ...rest];
};

export const ManhajiLogic: React.FC<VideoProps> = ({hookClipSec}) => {
  const tl = buildTimeline(hookClipSec);
  const captions = collectCaptions(tl);
  const exitFrames = sec(tl.scenes[0].def.overlapSec);
  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      {tl.scenes.map(({def, from, durationInFrames}) => {
        const C = SCENE_COMPONENTS[def.id];
        return (
          <Sequence key={def.id} from={from} durationInFrames={durationInFrames} name={`${def.id} · ${def.title}`}>
            <C />
          </Sequence>
        );
      })}
      {/* hook last → it sits on top while it flies away over Scene A */}
      <Sequence from={0} durationInFrames={tl.hookFrames} name="Hook · تصوير حقيقي">
        <HookScene hookFrames={tl.hookFrames} clipFrames={sec(hookClipSec)} exitFrames={exitFrames} />
      </Sequence>

      {SHOW_CAPTIONS && <Captions captions={captions} />}
      <Finish />
      {SHOW_SAFE_GUIDES && <SafeGuides />}
      <SoundDesign tl={tl} speech={captions} />
    </AbsoluteFill>
  );
};

const SafeGuides: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', inset: `${SAFE.top}px ${SAFE.side}px ${SAFE.bottom}px`, border: '2px dashed rgba(0,255,200,0.6)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: SAFE.captionTop, height: SAFE.captionBottom - SAFE.captionTop, background: 'rgba(255,200,0,0.12)'}} />
  </AbsoluteFill>
);
