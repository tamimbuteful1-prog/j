import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {FPS, TOTAL_FRAMES} from './time';

export const RemotionRoot: React.FC = () => (
  <Composition id="Short" component={Main} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
);
