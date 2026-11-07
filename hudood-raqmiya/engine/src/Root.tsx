import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './theme';
import {HRE01} from './episodes/HR-E01/Episode';
import {TOTAL} from './episodes/HR-E01/timeline';
import {DBS, DBS_TOTAL} from './episodes/DBS/Episode';
import {DBSE01, DBS_E01_TOTAL} from './episodes/DBS-E01/Episode';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HR-E01" component={HRE01} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={Math.round(TOTAL * VIDEO.fps)} defaultProps={{variant: 'camera' as const}} />
    <Composition id="HR-E01-VO" component={HRE01} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={Math.round(TOTAL * VIDEO.fps)} defaultProps={{variant: 'vo' as const}} />
    <Composition id="DBS" component={DBS} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={Math.round(DBS_TOTAL * VIDEO.fps)} />
    <Composition id="DBS-E01" component={DBSE01} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={Math.round(DBS_E01_TOTAL * VIDEO.fps)} />
  </>
);
