import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import './fonts';
import type {Timeline} from '../timeline/resolve';
import {EpisodeProvider} from '../timeline/context';
import {COLORS} from './theme';
import {Finish} from './Backdrop';
import {Captions} from './Captions';
import {SoundDesign} from './SoundDesign';
import {HookFrame, HookOverlayProps} from './HookFrame';

/** What every episode folder exports from src/episodes/<ID>/index.ts */
export type EpisodeModule = {
  id: string;
  meta: {subject_ar: string; grade_ar: string; lesson_ar: string};
  /** scene id (S01…) → component. Inside a scene, frame 0 = scene start; use useScene(). */
  scenes: Record<string, React.FC>;
  HookOverlay?: React.FC<HookOverlayProps>;
  /** timeline written by the orchestrator for Studio browsing */
  previewTimeline: Timeline;
};

export type EpisodeProps = {
  timeline: Timeline;
  media: {
    hookSrc?: string;
    framing: 'fit' | 'fill';
    trimStartSec: number;
    voice?: Record<string, string>;
    music?: {src: string; volume: number; ducked: number} | null;
  };
  hookText: string;
  keyWord?: string;
  captions?: boolean;
};

export const EpisodeFilm: React.FC<EpisodeProps & {module: EpisodeModule}> = ({module, timeline, media, hookText, keyWord, captions = true}) => {
  const f = (s: number) => Math.round(s * timeline.fps);
  return (
    <EpisodeProvider timeline={timeline}>
      <AbsoluteFill style={{background: COLORS.ink}}>
        {timeline.scenes.map((s) => {
          const C = module.scenes[s.id];
          return (
            <Sequence key={s.id} from={f(s.start)} durationInFrames={Math.max(1, f(s.end) - f(s.start))} name={s.id}>
              <EpisodeProvider timeline={timeline} sceneId={s.id}>
                {C ? <C /> : <MissingScene id={s.id} />}
              </EpisodeProvider>
            </Sequence>
          );
        })}
        <Sequence from={0} durationInFrames={f(timeline.hook.end)} name="Hook">
          <HookFrame src={media.hookSrc} framing={media.framing} trimStartSec={media.trimStartSec} hookText={hookText} keyWord={keyWord} meta={module.meta} Overlay={module.HookOverlay} />
        </Sequence>
        {captions && <Captions />}
        <Finish />
        <SoundDesign voice={media.voice} music={media.music} />
      </AbsoluteFill>
    </EpisodeProvider>
  );
};

const MissingScene: React.FC<{id: string}> = ({id}) => (
  <AbsoluteFill style={{background: '#3a0010', color: '#fff', fontSize: 60, alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace'}}>
    MISSING SCENE {id}
  </AbsoluteFill>
);
