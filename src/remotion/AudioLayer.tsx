import React from 'react';
import { Audio } from 'remotion';
import { ProjectConfig } from './types';

interface AudioLayerProps {
  config: ProjectConfig;
}

export const AudioLayer: React.FC<AudioLayerProps> = ({ config }) => {
  const { musicDataUrl, volume } = config;

  if (!musicDataUrl) {
    return null;
  }

  return (
    <Audio
      src={musicDataUrl}
      volume={volume !== undefined ? volume : 0.8}
    />
  );
};
