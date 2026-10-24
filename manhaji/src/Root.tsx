import React from 'react';
import {Composition} from 'remotion';
import {Manhaji} from './Manhaji';
import {DURATION_S, FPS, H, W} from './theme';

export const Root: React.FC = () => (
  <Composition id="Manhaji" component={Manhaji} durationInFrames={DURATION_S * FPS} fps={FPS} width={W} height={H} />
);
