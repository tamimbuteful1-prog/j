import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './theme';
import {HRE01} from './episodes/HR-E01/Episode';
import {TOTAL} from './episodes/HR-E01/timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HR-E01" component={HRE01} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={Math.round(TOTAL * VIDEO.fps)} defaultProps={{variant: 'camera' as const}} />
    <Composition id="HR-E01-VO" component={HRE01} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={Math.round(TOTAL * VIDEO.fps)} defaultProps={{variant: 'vo' as const}} />
  </>
);
