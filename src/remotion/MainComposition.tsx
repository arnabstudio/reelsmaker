import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ProjectConfig } from './types';
import { Background } from './Background';
import { Slide } from './Slide';
import { PhoneFrame } from './PhoneFrame';
import { TextLayer } from './TextLayer';
import { WatermarkLayer } from './WatermarkLayer';
import { AudioLayer } from './AudioLayer';
import { computeTransitionEffect } from './Transition';
import { getPhoneBox } from './frameUtils';

export interface MainCompositionProps {
  projectConfig: ProjectConfig;
}

export const MainComposition: React.FC<MainCompositionProps> = ({ projectConfig }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const images = projectConfig.images || [];
  const canvasW = projectConfig.canvasW || 540;
  const canvasH = projectConfig.canvasH || 960;
  const phoneFrame = projectConfig.phoneFrame || 'none';
  const hasPhoneFrame = phoneFrame !== 'none';

  // Calculate slide timing
  const effectiveImageDuration =
    projectConfig.autoFitDuration && images.length > 0
      ? Math.max(0.3, Math.min(10, (projectConfig.targetVideoLength || 20) / images.length))
      : projectConfig.imageDuration || 3;

  const trans = projectConfig.transition || 'fade';
  const transDurSec = Math.min(projectConfig.transitionDuration || 0.35, effectiveImageDuration * 0.45);
  const transFrac = effectiveImageDuration > 0 ? Math.max(0.02, transDurSec / effectiveImageDuration) : 0.1;

  const currentTime = frame / fps;
  const rawIndex = effectiveImageDuration > 0 ? currentTime / effectiveImageDuration : 0;
  const currentIdx = Math.floor(rawIndex);
  const progressInSlide = rawIndex - currentIdx;

  let renderEntries: Array<{
    imgIndex: number;
    role: 'solo' | 'in' | 'out';
    p: number;
  }> = [];

  if (images.length === 0) {
    renderEntries = [];
  } else if (
    trans !== 'none' &&
    progressInSlide > 1 - transFrac &&
    currentIdx + 1 < images.length
  ) {
    const localP = Math.min(1, Math.max(0, (progressInSlide - (1 - transFrac)) / transFrac));
    renderEntries = [
      { imgIndex: currentIdx, role: 'out', p: localP },
      { imgIndex: currentIdx + 1, role: 'in', p: localP },
    ];
  } else {
    const safeIdx = Math.min(images.length - 1, Math.max(0, currentIdx));
    renderEntries = [{ imgIndex: safeIdx, role: 'solo', p: 0 }];
  }

  // Pre-calculate phone geometry if phone frame is active
  const phoneBox = hasPhoneFrame ? getPhoneBox(projectConfig) : null;

  // Render slides content (images undergoing transitions)
  const slidesContent =
    images.length === 0 ? (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '18px',
          fontFamily: 'sans-serif',
        }}
      >
        Add images to preview
      </div>
    ) : (
      renderEntries.map((entry) => {
        const slide = images[entry.imgIndex];
        if (!slide) return null;
        const effect = computeTransitionEffect(trans, entry.role, entry.p);
        const transitionStyle: React.CSSProperties = {
          opacity: effect.opacity,
          transform: effect.transform !== 'none' ? effect.transform : undefined,
          filter: effect.filter,
          clipPath: effect.clipPath,
          zIndex: entry.role === 'in' ? 2 : 1,
        };

        return (
          <Slide
            key={`${slide.id}-${entry.imgIndex}-${entry.role}`}
            slide={slide}
            config={projectConfig}
            transitionStyle={transitionStyle}
          />
        );
      })
    );

  return (
    <div
      style={{
        position: 'relative',
        width: canvasW,
        height: canvasH,
        overflow: 'hidden',
        backgroundColor: '#000000',
      }}
    >
      {/* 1. Background */}
      <Background config={projectConfig} />

      {/* 2. Slides & Phone Frame */}
      {hasPhoneFrame && phoneBox ? (
        // When Phone Frame is active:
        // The PhoneFrame bezel & backdrop are completely static.
        // The images inside transition smoothly within the phone screen area.
        <PhoneFrame config={projectConfig} box={phoneBox}>
          {slidesContent}
        </PhoneFrame>
      ) : (
        // Standard mode (no phone frame)
        slidesContent
      )}

      {/* 3. Text Overlays */}
      <TextLayer config={projectConfig} />

      {/* 4. Watermarks */}
      <WatermarkLayer config={projectConfig} />

      {/* 5. Music / Audio */}
      <AudioLayer config={projectConfig} />
    </div>
  );
};
