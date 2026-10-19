import React from 'react';
import { ProjectConfig, SlideItem } from './types';
import { ImageLayer } from './ImageLayer';
import { getPhoneBox } from './frameUtils';

interface SlideProps {
  slide: SlideItem;
  config: ProjectConfig;
  transitionStyle?: React.CSSProperties;
}

export const Slide: React.FC<SlideProps> = ({ slide, config, transitionStyle }) => {
  const { canvasW, canvasH, displayMode, framePadding, phoneFrame } = config;
  const isFrameMode = displayMode === 'frame';

  // Calculate base container box
  let containerX = 0;
  let containerY = 0;
  let containerW = canvasW;
  let containerH = canvasH;

  if (isFrameMode) {
    const pad = (framePadding || 8) / 100;
    containerX = canvasW * pad;
    containerY = canvasH * pad;
    containerW = canvasW * (1 - pad * 2);
    containerH = canvasH * (1 - pad * 2);
  }

  // If phoneFrame is enabled, the image lives strictly INSIDE the phone screen area.
  // The transition effect applies ONLY to this image layer, keeping the outer phone frame static!
  if (phoneFrame !== 'none') {
    const box = getPhoneBox(config);

    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: box.w,
          height: box.h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          ...transitionStyle,
        }}
      >
        <ImageLayer
          slide={slide}
          config={config}
          boxWidth={box.w}
          boxHeight={box.h}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: containerX,
        top: containerY,
        width: containerW,
        height: containerH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        ...transitionStyle,
      }}
    >
      <ImageLayer
        slide={slide}
        config={config}
        boxWidth={containerW}
        boxHeight={containerH}
      />
    </div>
  );
};
