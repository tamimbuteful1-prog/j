import React from 'react';
import {CalculateMetadataFunction, Composition, Folder, staticFile} from 'remotion';
import {getVideoMetadata} from '@remotion/media-utils';
import {ManhajiLogic, VideoProps} from './Video';
import {HOOK} from './config/media';
import {SCENES, buildTimeline, sec} from './config/timeline';
import {VIDEO} from './config/theme';
import {SceneA_Store} from './scenes/SceneA_Store';
import {SceneB_TruthValue} from './scenes/SceneB_TruthValue';
import {SceneC_Or} from './scenes/SceneC_Or';
import {SceneD_OrToAnd} from './scenes/SceneD_OrToAnd';
import {SceneE_And} from './scenes/SceneE_And';
import {SceneF_Summary} from './scenes/SceneF_Summary';
import {Outro} from './scenes/Outro';
import './lib/fonts';

/** When the real hook is enabled, read its length and re-flow the whole film. */
const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({props}) => {
  let hookClipSec = props.hookClipSec;
  if (HOOK.enabled) {
    const meta = await getVideoMetadata(staticFile(HOOK.src));
    hookClipSec = meta.durationInSeconds;
  }
  return {durationInFrames: buildTimeline(hookClipSec).total, props: {...props, hookClipSec}};
};

const SOLO: [string, React.FC][] = [
  ['A-Store', SceneA_Store],
  ['B-TruthValue', SceneB_TruthValue],
  ['C-Disjunction-OR', SceneC_Or],
  ['D-OR-to-AND', SceneD_OrToAnd],
  ['E-Conjunction-AND', SceneE_And],
  ['F-Summary', SceneF_Summary],
  ['Outro', Outro],
];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ManhajiLogic"
      component={ManhajiLogic}
      width={VIDEO.width}
      height={VIDEO.height}
      fps={VIDEO.fps}
      durationInFrames={buildTimeline(HOOK.placeholderDurationSec).total}
      defaultProps={{hookClipSec: HOOK.placeholderDurationSec}}
      calculateMetadata={calculateMetadata}
    />
    {/* individual scenes for fast iteration in the Studio */}
    <Folder name="Scenes">
      {SOLO.map(([id, C], i) => (
        <Composition key={id} id={id} component={C} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={sec(SCENES[i].durationSec)} />
      ))}
    </Folder>
  </>
);
