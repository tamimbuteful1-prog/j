import React from 'react';
import {AbsoluteFill} from 'remotion';
import '../../lib/fonts';
import {Backdrop, Footage, Grade, LightLeak} from '../../components/base';
import {Captions} from '../../components/Captions';
import {Graphics} from './scenes';
import {Sound} from './Sound';
import {LINES} from './timeline';

/** drop Tamim's take at public/footage/HR-E01.mp4 and set these */
export const MEDIA = {
  footage: undefined as string | undefined, // 'footage/HR-E01.mp4'
  voice: undefined as string | undefined, // only if the voice is recorded separately from the footage
};

export const HRE01: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <Backdrop />
    <Footage lines={LINES} src={MEDIA.footage} />
    <LightLeak />
    <Graphics />
    <Captions lines={LINES} />
    <Grade />
    <Sound voice={MEDIA.voice} />
  </AbsoluteFill>
);
