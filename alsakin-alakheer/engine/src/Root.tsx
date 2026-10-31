import React from 'react';
import {Composition} from 'remotion';
import {VIDEO} from './theme';
import {E01} from './Episode';
import {TOTAL} from './timeline';

export const RemotionRoot: React.FC = () => (
  <Composition id="E01" component={E01} width={VIDEO.width} height={VIDEO.height} fps={VIDEO.fps} durationInFrames={Math.round(TOTAL * VIDEO.fps)} />
);
