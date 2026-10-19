export interface SlideItem {
  id: string;
  dataUrl: string;
  transform?: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface TextOverlayItem {
  id: string;
  text: string;
  duration: number;
  order: number;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export type AspectRatioType = '9:16' | '1:1' | '4:5' | '16:9';
export type DisplayModeType = 'frame' | 'full';
export type FrameBorderType = 'none' | 'white' | 'black' | 'gradient';
export type PhoneFrameType = 'none' | 'iphone-notch' | 'dynamic-island' | 'android-punch' | 'minimal-bezel';
export type PhoneScreenBgType = 'colour' | 'image';
export type BgType = 'colour' | 'image' | 'video' | 'stock' | 'none';
export type TransitionType =
  | 'none'
  | 'fade'
  | 'slide'
  | 'slideup'
  | 'zoom'
  | 'flip'
  | 'wipe'
  | 'circlereveal'
  | 'blur'
  | 'spin'
  | 'bounce';
export type TextStylePresetType = 'custom' | 'minimal' | 'bold' | 'highlight' | 'neon' | 'gradient' | 'outline';
export type TextAnimType = 'fade' | 'pop' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoom' | 'none';
export type TextBgShapeType = 'rounded' | 'ribbon' | 'starburst';
export type TextLoopAnimType = 'none' | 'pulse' | 'shake';
export type WatermarkPositionType = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';

export interface ProjectConfig {
  images: SlideItem[];
  canvasW: number;
  canvasH: number;
  aspectRatio: AspectRatioType;
  displayMode: DisplayModeType;
  fillFrame: boolean;
  framePadding: number; // percentage (e.g. 8)
  cornerRadius: number; // px (e.g. 16)
  globalImageScale: number; // multiplier (e.g. 1)
  frameBorder: FrameBorderType;
  phoneFrame: PhoneFrameType;
  phoneScreenRatio: number; // e.g. 0.54
  phoneScreenBgType: PhoneScreenBgType;
  phoneScreenColor: string; // e.g. '#000000'
  phoneScreenImageDataUrl?: string | null;
  bgType: BgType;
  bgColour: string; // e.g. '#1a1a2e'
  bgImageDataUrl?: string | null;
  bgVideoDataUrl?: string | null;
  transition: TransitionType;
  transitionDuration: number; // seconds
  imageDuration: number; // seconds
  autoFitDuration: boolean;
  targetVideoLength: number; // seconds
  textOverlays: TextOverlayItem[];
  textStylePreset: TextStylePresetType;
  font: string;
  fontSize: number;
  textColor: string;
  textBgColor: string;
  animIn: TextAnimType;
  animOut: TextAnimType;
  textBgShape: TextBgShapeType;
  textLoopAnim: TextLoopAnimType;
  textGap: number; // seconds
  textBgAlpha?: number;
  textEffect?: string;
  musicDataUrl?: string | null;
  musicName?: string | null;
  volume: number; // 0 to 1
  watermarkEnabled: boolean;
  watermarkImageDataUrl?: string | null;
  watermarkPosition: WatermarkPositionType;
  watermarkScale: number; // fraction 0.06 - 0.40
  watermarkOpacity: number; // fraction 0.1 - 1.0
  footerText?: string;
  fps?: number;
}
