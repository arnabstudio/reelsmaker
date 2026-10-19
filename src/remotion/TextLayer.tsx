import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ProjectConfig, TextOverlayItem } from './types';

interface TextLayerProps {
  config: ProjectConfig;
}

export const TextLayer: React.FC<TextLayerProps> = ({ config }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  const {
    textOverlays,
    font,
    fontSize,
    textColor,
    textBgColor,
    animIn,
    animOut,
    textBgShape,
    textLoopAnim,
    textGap,
    textBgAlpha,
    textEffect,
    canvasW,
    canvasH,
  } = config;

  if (!textOverlays || textOverlays.length === 0) {
    return null;
  }

  // Calculate active text based on sequential order with gap
  const gap = textGap ?? 0.3;
  let activeText: (TextOverlayItem & { startTime: number; endTime: number }) | null = null;

  let timeline = 0;
  for (const item of textOverlays) {
    const dur = item.duration || 2;
    const start = timeline;
    const end = start + dur;
    if (currentTime >= start && currentTime < end) {
      activeText = { ...item, startTime: start, endTime: end };
      break;
    }
    timeline = end + gap;
  }

  if (!activeText) {
    return null;
  }

  const { startTime, endTime, text, x = 50, y = 50 } = activeText;
  const durIn = Math.min(0.3, (endTime - startTime) / 3);
  const durOut = Math.min(0.3, (endTime - startTime) / 3);

  let alpha = 1;
  let offsetX = 0;
  let offsetY = 0;
  let scale = 1;

  if (currentTime < startTime + durIn) {
    const p = Math.min(1, Math.max(0, (currentTime - startTime) / durIn));
    if (animIn === 'fade') alpha = p;
    else if (animIn === 'pop') {
      scale = 0.3 + 0.7 * p;
      alpha = p;
    } else if (animIn === 'slideUp') {
      offsetY = (1 - p) * 60;
      alpha = p;
    } else if (animIn === 'slideDown') {
      offsetY = -(1 - p) * 60;
      alpha = p;
    } else if (animIn === 'slideLeft') {
      offsetX = (1 - p) * 80;
      alpha = p;
    } else if (animIn === 'slideRight') {
      offsetX = -(1 - p) * 80;
      alpha = p;
    } else if (animIn === 'zoom') {
      scale = 0.5 + 0.5 * p;
      alpha = p;
    }
  } else if (currentTime > endTime - durOut) {
    const p = Math.min(1, Math.max(0, (endTime - currentTime) / durOut));
    if (animOut === 'fade') alpha = p;
    else if (animOut === 'pop') {
      scale = 0.3 + 0.7 * p;
      alpha = p;
    } else if (animOut === 'slideUp') {
      offsetY = -(1 - p) * 60;
      alpha = p;
    } else if (animOut === 'slideDown') {
      offsetY = (1 - p) * 60;
      alpha = p;
    } else if (animOut === 'slideLeft') {
      offsetX = -(1 - p) * 80;
      alpha = p;
    } else if (animOut === 'slideRight') {
      offsetX = (1 - p) * 80;
      alpha = p;
    } else if (animOut === 'zoom') {
      scale = 0.5 + 0.5 * p;
      alpha = p;
    }
  }

  // Loop Animation
  if (textLoopAnim === 'pulse') {
    scale *= 1 + Math.sin(currentTime * 4) * 0.045;
  } else if (textLoopAnim === 'shake') {
    offsetX += Math.sin(currentTime * 18) * 4;
  }

  // Background shape
  const bgAlpha = textBgAlpha ?? 0.85;
  let bgStyle: React.CSSProperties = {
    backgroundColor: textBgColor || 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: '8px 20px',
  };

  if (textBgShape === 'ribbon') {
    bgStyle = {
      backgroundColor: textBgColor || 'rgba(0,0,0,0.5)',
      padding: '8px 28px',
      clipPath: 'polygon(0 0, 100% 0, calc(100% - 12px) 50%, 100% 100%, 0 100%, 12px 50%)',
    };
  } else if (textBgShape === 'starburst') {
    bgStyle = {
      backgroundColor: textBgColor || 'rgba(0,0,0,0.5)',
      borderRadius: '50%',
      padding: '16px 24px',
    };
  }

  if (bgAlpha === 0) {
    bgStyle = {
      backgroundColor: 'transparent',
      padding: '4px 8px',
    };
  }

  // Effect styling (neon, gradient, outline)
  let textCustomStyle: React.CSSProperties = {
    color: textColor || '#ffffff',
    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
  };

  if (textEffect === 'neon') {
    textCustomStyle = {
      color: textColor || '#00eaff',
      textShadow: `0 0 10px ${textColor || '#00eaff'}, 0 0 25px ${textColor || '#00eaff'}, 0 0 45px ${textColor || '#00eaff'}`,
    };
  } else if (textEffect === 'gradient') {
    textCustomStyle = {
      background: 'linear-gradient(90deg, #ff5ecb, #7c5cff, #4ad3ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: 'none',
    };
  } else if (textEffect === 'outline') {
    textCustomStyle = {
      color: textColor || '#ffffff',
      WebkitTextStroke: '2px #000000',
      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
    };
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
        opacity: alpha,
        pointerEvents: 'none',
        zIndex: 50,
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ ...bgStyle, opacity: bgAlpha > 0 ? 1 : 0.9 }}>
        <span
          style={{
            fontFamily: font || 'Arial',
            fontSize: `${fontSize || 36}px`,
            fontWeight: 700,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.2,
            display: 'inline-block',
            ...textCustomStyle,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
