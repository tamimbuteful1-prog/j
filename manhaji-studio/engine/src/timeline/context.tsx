import React, {createContext, useContext} from 'react';
import type {Timeline} from './resolve';

type Ctx = {timeline: Timeline; sceneId?: string};
const EpisodeCtx = createContext<Ctx | null>(null);

export const EpisodeProvider: React.FC<{timeline: Timeline; sceneId?: string; children: React.ReactNode}> = ({timeline, sceneId, children}) => (
  <EpisodeCtx.Provider value={{timeline, sceneId}}>{children}</EpisodeCtx.Provider>
);

export const useTimeline = () => {
  const c = useContext(EpisodeCtx);
  if (!c) throw new Error('useTimeline must be used inside an episode');
  return c.timeline;
};

/**
 * Scene-local timing. Inside a scene, frame 0 = scene start, so every value here is
 * seconds RELATIVE TO THE SCENE — plug straight into ramp()/pop()/kf() with useCurrentFrame().
 *
 *   const {beat, line, duration} = useScene();
 *   const p = ramp(frame, beat('orGrow'), beat('orGrow') + 0.6);
 */
export const useScene = () => {
  const c = useContext(EpisodeCtx);
  if (!c?.sceneId) throw new Error('useScene must be used inside a scene');
  const tl = c.timeline;
  const sc = tl.scenes.find((s) => s.id === c.sceneId)!;
  const beat = (name: string) => {
    const v = tl.beats[name];
    if (v === undefined) throw new Error(`unknown beat "${name}" — declare it in storyboard.json`);
    return v - sc.start;
  };
  const line = (id: string) => {
    const l = tl.lines.find((x) => x.id === id);
    if (!l) throw new Error(`unknown line ${id}`);
    return {start: l.start - sc.start, end: l.end - sc.start, text: l.text};
  };
  /** absolute beat time (seconds since film start) — for state that persists across scenes */
  const abs = (name: string) => beat(name) + sc.start;
  return {beat, line, abs, start: sc.start, duration: sc.end - sc.start, sceneId: sc.id, mode: tl.mode, beats: tl.beats};
};
