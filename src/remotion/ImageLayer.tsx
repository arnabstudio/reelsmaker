import React from 'react';
import { Img } from 'remotion';
import { ProjectConfig, SlideItem } from './types';

interface ImageLayerProps {
  slide: SlideItem;
  config: ProjectConfig;
  boxWidth: number;
  boxHeight: number;
}

export const ImageLayer: React.FC<ImageLayerProps> = ({
  slide,
  config,
  boxWidth,
  boxHeight,
}) => {
  const {
    fillFrame,
    globalImageScale,
    cornerRadius,
    frameBorder,
  } = config;

  const userScale = slide.transform?.scale ?? 1;
  const userOffsetX = slide.transform?.offsetX ?? 0;
  const userOffsetY = slide.transform?.offsetY ?? 0;
  const totalScale = userScale * (globalImageScale || 1);

  // Border styles
  let borderStyle = 'none';
  let boxShadow = '0 10px 30px rgba(0, 0, 0, 0.4)';
  if (frameBorder === 'white') {
    borderStyle = '1.5px solid rgba(255, 255, 255, 0.3)';
  } else if (frameBorder === 'black') {
    borderStyle = '1.5px solid rgba(0, 0, 0, 0.4)';
  } else if (frameBorder === 'gradient') {
    borderStyle = '2px solid rgba(255, 255, 255, 0.5)';
  }

  const radius = cornerRadius ?? 16;

  return (
    <div
      style={{
        position: 'relative',
        width: boxWidth,
        height: boxHeight,
        borderRadius: radius,
        overflow: 'hidden',
        border: borderStyle,
        boxShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#050505',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(${userOffsetX * boxWidth}px, ${userOffsetY * boxHeight}px) scale(${totalScale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={slide.dataUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: fillFrame ? 'cover' : 'contain',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};
