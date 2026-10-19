import React from 'react';
import { Img, Video } from 'remotion';
import { ProjectConfig } from './types';

interface BackgroundProps {
  config: ProjectConfig;
}

export const Background: React.FC<BackgroundProps> = ({ config }) => {
  const { displayMode, bgType, bgColour, bgImageDataUrl, bgVideoDataUrl, canvasW, canvasH } = config;
  const isFrameMode = displayMode === 'frame';
  const hasBg = bgType !== 'none';

  if (!isFrameMode || !hasBg) {
    return <div style={{ width: canvasW, height: canvasH, backgroundColor: '#000000', position: 'absolute', top: 0, left: 0 }} />;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: canvasW,
        height: canvasH,
        overflow: 'hidden',
        backgroundColor: bgColour || '#1a1a2e',
      }}
    >
      {(bgType === 'image' || bgType === 'stock') && bgImageDataUrl && (
        <Img
          src={bgImageDataUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
      {bgType === 'video' && bgVideoDataUrl && (
        <Video
          src={bgVideoDataUrl}
          loop
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      )}
    </div>
  );
};
