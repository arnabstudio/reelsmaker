import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './MainComposition';
import { ProjectConfig } from './types';

export const defaultProjectConfig: ProjectConfig = {
  images: [],
  canvasW: 540,
  canvasH: 960,
  aspectRatio: '9:16',
  displayMode: 'frame',
  fillFrame: false,
  framePadding: 8,
  cornerRadius: 16,
  globalImageScale: 1,
  frameBorder: 'white',
  phoneFrame: 'none',
  phoneScreenRatio: 0.54,
  phoneScreenBgType: 'colour',
  phoneScreenColor: '#000000',
  bgType: 'colour',
  bgColour: '#1a1a2e',
  transition: 'fade',
  transitionDuration: 0.35,
  imageDuration: 3,
  autoFitDuration: false,
  targetVideoLength: 20,
  textOverlays: [
    {
      id: 'text_1',
      text: 'Your Text Here',
      duration: 2.0,
      order: 0,
      x: 50,
      y: 50,
    },
  ],
  textStylePreset: 'custom',
  font: 'Arial',
  fontSize: 36,
  textColor: '#ffffff',
  textBgColor: '#00000088',
  animIn: 'fade',
  animOut: 'fade',
  textBgShape: 'rounded',
  textLoopAnim: 'none',
  textGap: 0.3,
  volume: 0.8,
  watermarkEnabled: false,
  watermarkPosition: 'bottom-right',
  watermarkScale: 0.18,
  watermarkOpacity: 0.8,
  fps: 30,
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition<any, any>
      id="SlideshowVideo"
      component={MainComposition}
      durationInFrames={180}
      fps={30}
      width={540}
      height={960}
      defaultProps={{
        projectConfig: defaultProjectConfig,
      }}
      calculateMetadata={({ props }: { props: { projectConfig?: ProjectConfig } }) => {
        const config = props.projectConfig || defaultProjectConfig;
        const count = config.images?.length || 1;
        const effectiveDuration =
          config.autoFitDuration && config.images && config.images.length > 0
            ? Math.max(0.3, Math.min(10, (config.targetVideoLength || 20) / config.images.length))
            : config.imageDuration || 3;
        const totalDurationSec = Math.max(1, count * effectiveDuration);
        const fps = config.fps || 30;
        return {
          durationInFrames: Math.max(30, Math.ceil(totalDurationSec * fps)),
          width: config.canvasW || 540,
          height: config.canvasH || 960,
          fps,
        };
      }}
    />
  );
};
