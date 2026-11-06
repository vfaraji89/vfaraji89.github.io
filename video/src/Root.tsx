import React from 'react';
import { Composition } from 'remotion';
import { AnimatedCV, FPS, TOTAL } from './AnimatedCV';

export const Root: React.FC = () => (
  <Composition
    id="AnimatedCV"
    component={AnimatedCV}
    durationInFrames={TOTAL}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
