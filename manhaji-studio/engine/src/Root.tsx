import React from 'react';
import {CalculateMetadataFunction, Composition} from 'remotion';
import {EPISODES} from './episodes/registry';
import {EpisodeFilm, EpisodeModule, EpisodeProps} from './kit/Episode';
import {VIDEO} from './kit/theme';
import './kit/fonts';

const calc: CalculateMetadataFunction<EpisodeProps & {module: EpisodeModule}> = ({props}) => ({
  durationInFrames: Math.max(1, Math.round(props.timeline.totalSec * props.timeline.fps)),
  fps: props.timeline.fps,
});

/**
 * One composition per episode (id = EPISODE_ID). The orchestrator renders it with
 * --props (timeline + media) and --public-dir=episodes/<ID>/production/public.
 */
const COMPONENTS = new Map(EPISODES.map((m) => [m.id, ((p: EpisodeProps) => <EpisodeFilm {...p} module={m} />) as React.FC<EpisodeProps>]));

export const RemotionRoot: React.FC = () => (
  <>
    {EPISODES.map((m) => (
      <Composition
        key={m.id}
        id={m.id}
        component={COMPONENTS.get(m.id)!}
        width={VIDEO.width}
        height={VIDEO.height}
        fps={VIDEO.fps}
        durationInFrames={Math.round(m.previewTimeline.totalSec * VIDEO.fps)}
        defaultProps={{timeline: m.previewTimeline, media: {framing: 'fit', trimStartSec: 0, music: {src: 'music/bed.wav', volume: 0.2, ducked: 0.07}}, hookText: ''} as EpisodeProps}
        calculateMetadata={calc as never}
      />
    ))}
  </>
);
