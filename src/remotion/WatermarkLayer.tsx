import React from 'react';
import { Img } from 'remotion';
import { ProjectConfig } from './types';

interface WatermarkLayerProps {
  config: ProjectConfig;
}

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ config }) => {
  const {
    watermarkEnabled,
    watermarkImageDataUrl,
    watermarkPosition,
    watermarkScale,
    watermarkOpacity,
    canvasW,
  } = config;

  const margin = Math.max(10, canvasW * 0.04);
  const targetW = canvasW * (watermarkScale || 0.18);

  // Position styles
  let posStyle: React.CSSProperties = { bottom: margin, right: margin };
  if (watermarkPosition === 'top-left') {
    posStyle = { top: margin, left: margin };
  } else if (watermarkPosition === 'top-right') {
    posStyle = { top: margin, right: margin };
  } else if (watermarkPosition === 'bottom-left') {
    posStyle = { bottom: margin, left: margin };
  } else if (watermarkPosition === 'center') {
    posStyle = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  const fontSize = Math.max(11, Math.round(canvasW * 0.032));

  return (
    <>
      {/* Custom User Watermark */}
      {watermarkEnabled && watermarkImageDataUrl && (
        <div
          style={{
            position: 'absolute',
            ...posStyle,
            opacity: watermarkOpacity !== undefined ? watermarkOpacity : 0.8,
            pointerEvents: 'none',
            zIndex: 90,
          }}
        >
          <Img
            src={watermarkImageDataUrl}
            style={{
              width: targetW,
              height: 'auto',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* App Watermark Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: Math.max(8, canvasW * 0.03),
          right: Math.max(8, canvasW * 0.03),
          fontFamily: "'Segoe UI', Arial, sans-serif",
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.85)',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.8), 0 0 1px #000',
          pointerEvents: 'none',
          zIndex: 95,
          userSelect: 'none',
        }}
      >
        Wasza ReelsMaker
      </div>
    </>
  );
};
