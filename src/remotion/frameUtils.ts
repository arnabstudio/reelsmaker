import React from 'react';
import { ProjectConfig } from './types';
import { PhoneFrame } from './PhoneFrame';

export function getPhoneBox(config: ProjectConfig): { x: number; y: number; w: number; h: number } {
  const { canvasW, canvasH, displayMode, framePadding, phoneScreenRatio } = config;
  const isFrameMode = displayMode === 'frame';

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

  const screenRatio = phoneScreenRatio || 0.54;
  let targetW = containerW * 0.86;
  let targetH = targetW / screenRatio;
  if (targetH > containerH) {
    targetH = containerH;
    targetW = targetH * screenRatio;
  }
  const phoneX = containerX + (containerW - targetW) / 2;
  const phoneY = containerY + (containerH - targetH) / 2;

  return { x: phoneX, y: phoneY, w: targetW, h: targetH };
}
