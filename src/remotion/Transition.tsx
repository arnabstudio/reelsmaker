import React from 'react';
import { TransitionType } from './types';

export interface TransitionEffect {
  opacity: number;
  transform: string;
  filter?: string;
  clipPath?: string;
}

export function computeTransitionEffect(
  type: TransitionType,
  role: 'solo' | 'in' | 'out',
  p: number
): TransitionEffect {
  if (role === 'solo' || type === 'none') {
    return {
      opacity: 1,
      transform: 'none',
    };
  }

  // p goes from 0 to 1 during the transition
  switch (type) {
    case 'fade': {
      const alpha = role === 'out' ? 1 - p : p;
      return {
        opacity: alpha,
        transform: 'none',
      };
    }
    case 'zoom': {
      const alpha = role === 'out' ? 1 - p : p;
      const s = 0.85 + 0.15 * (role === 'out' ? 1 - p : p);
      return {
        opacity: alpha,
        transform: `scale(${s})`,
      };
    }
    case 'slide': {
      const offsetX = role === 'out' ? -p * 35 : (1 - p) * 35;
      const alpha = role === 'out' ? Math.max(0, 1 - p * 0.8) : Math.min(1, p * 1.2);
      return {
        opacity: alpha,
        transform: `translateX(${offsetX}%)`,
      };
    }
    case 'slideup': {
      const offsetY = role === 'out' ? -p * 35 : (1 - p) * 35;
      const alpha = role === 'out' ? Math.max(0, 1 - p * 0.8) : Math.min(1, p * 1.2);
      return {
        opacity: alpha,
        transform: `translateY(${offsetY}%)`,
      };
    }
    case 'flip': {
      const scaleX = role === 'out' ? Math.max(0.02, 1 - p) : Math.max(0.02, p);
      return {
        opacity: 1,
        transform: `scaleX(${scaleX})`,
      };
    }
    case 'wipe': {
      if (role === 'in') {
        return {
          opacity: 1,
          transform: 'none',
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        };
      }
      return {
        opacity: 1,
        transform: 'none',
      };
    }
    case 'circlereveal': {
      if (role === 'in') {
        const radius = p * 75; // percentage
        return {
          opacity: 1,
          transform: 'none',
          clipPath: `circle(${radius}% at 50% 50%)`,
        };
      }
      return {
        opacity: 1,
        transform: 'none',
      };
    }
    case 'blur': {
      const blurAmt = (role === 'out' ? p : 1 - p) * 16;
      const alpha = role === 'out' ? 1 - p : p;
      return {
        opacity: alpha,
        transform: 'none',
        filter: blurAmt > 0.1 ? `blur(${blurAmt}px)` : undefined,
      };
    }
    case 'spin': {
      const rotateDeg = (role === 'out' ? p : -(1 - p)) * 20;
      const s = 0.8 + 0.2 * (role === 'out' ? 1 - p : p);
      const alpha = role === 'out' ? 1 - p : p;
      return {
        opacity: alpha,
        transform: `rotate(${rotateDeg}deg) scale(${s})`,
      };
    }
    case 'bounce': {
      if (role === 'in') {
        const s = p < 0.7 ? (p / 0.7) * 1.1 : 1.1 - ((p - 0.7) / 0.3) * 0.1;
        return {
          opacity: Math.min(1, p * 2.5),
          transform: `scale(${s})`,
        };
      }
      return {
        opacity: 1 - p,
        transform: `scale(${1 - p * 0.15})`,
      };
    }
    default:
      return {
        opacity: 1,
        transform: 'none',
      };
  }
}
