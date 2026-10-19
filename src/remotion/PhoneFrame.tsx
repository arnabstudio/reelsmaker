import React from 'react';
import { Img } from 'remotion';
import { ProjectConfig } from './types';

interface PhoneFrameProps {
  config: ProjectConfig;
  box: { x: number; y: number; w: number; h: number };
  children?: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ config, box, children }) => {
  const { phoneFrame, phoneScreenBgType, phoneScreenColor, phoneScreenImageDataUrl, cornerRadius } = config;
  const { x, y, w, h } = box;

  if (phoneFrame === 'none') {
    return children ? <>{children}</> : null;
  }

  const bezel = Math.max(8, w * 0.05);
  const innerRadius = Math.max(8, cornerRadius || 16);
  const outerRadius = Math.max(16, innerRadius + bezel * 0.5);

  const topY = bezel * 0.45;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        pointerEvents: 'none',
      }}
    >
      {/* Screen Backdrop / Screen container (stays static) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: w,
          height: h,
          borderRadius: innerRadius,
          overflow: 'hidden',
          backgroundColor: phoneScreenColor || '#000000',
        }}
      >
        {phoneScreenBgType === 'image' && phoneScreenImageDataUrl && (
          <Img
            src={phoneScreenImageDataUrl}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {children}
      </div>

      {/* Phone Outer Bezel Shell - Always on top, completely static! */}
      <div
        style={{
          position: 'absolute',
          left: -bezel / 2,
          top: -bezel / 2,
          width: w + bezel,
          height: h + bezel,
          borderRadius: outerRadius,
          boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
          border: `${bezel}px solid #18181b`,
          boxSizing: 'border-box',
          pointerEvents: 'none',
          outline: '1.5px solid rgba(255,255,255,0.14)',
          zIndex: 5,
        }}
      >
        {/* Notch / Dynamic Island / Punch Hole */}
        {phoneFrame === 'iphone-notch' && (
          <>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: Math.max(70, w * 0.34),
                height: Math.max(14, bezel * 0.6),
                backgroundColor: '#050505',
                borderBottomLeftRadius: Math.max(8, bezel * 0.3),
                borderBottomRightRadius: Math.max(8, bezel * 0.3),
                zIndex: 10,
              }}
            />
            {/* Home indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: bezel * 0.25,
                left: '50%',
                transform: 'translateX(-50%)',
                width: Math.max(40, w * 0.28),
                height: Math.max(3, bezel * 0.14),
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.6)',
                zIndex: 10,
              }}
            />
          </>
        )}

        {phoneFrame === 'dynamic-island' && (
          <>
            <div
              style={{
                position: 'absolute',
                top: Math.max(4, topY * 0.5),
                left: '50%',
                transform: 'translateX(-50%)',
                width: Math.max(50, w * 0.24),
                height: Math.max(12, bezel * 0.55),
                borderRadius: 999,
                backgroundColor: '#050505',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 6,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: Math.max(5, bezel * 0.22),
                  height: Math.max(5, bezel * 0.22),
                  borderRadius: '50%',
                  backgroundColor: '#16324a',
                }}
              />
            </div>
            {/* Home indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: bezel * 0.25,
                left: '50%',
                transform: 'translateX(-50%)',
                width: Math.max(40, w * 0.28),
                height: Math.max(3, bezel * 0.14),
                borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.6)',
                zIndex: 10,
              }}
            />
          </>
        )}

        {phoneFrame === 'android-punch' && (
          <div
            style={{
              position: 'absolute',
              top: Math.max(4, topY * 0.5),
              left: '50%',
              transform: 'translateX(-50%)',
              width: Math.max(8, bezel * 0.4),
              height: Math.max(8, bezel * 0.4),
              borderRadius: '50%',
              backgroundColor: '#050505',
              border: '1px solid rgba(255,255,255,0.15)',
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
};
