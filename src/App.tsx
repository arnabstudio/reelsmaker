import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { MainComposition } from './remotion/MainComposition';
import {
  ProjectConfig,
  SlideItem,
  TextOverlayItem,
  AspectRatioType,
  DisplayModeType,
  FrameBorderType,
  PhoneFrameType,
  PhoneScreenBgType,
  BgType,
  TransitionType,
  TextStylePresetType,
  TextAnimType,
  TextBgShapeType,
  TextLoopAnimType,
  WatermarkPositionType,
} from './remotion/types';
import { defaultProjectConfig } from './remotion/Root';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

const ASPECT_RATIO_DIMENSIONS: Record<AspectRatioType, { w: number; h: number }> = {
  '9:16': { w: 540, h: 960 },
  '1:1': { w: 720, h: 720 },
  '4:5': { w: 720, h: 900 },
  '16:9': { w: 960, h: 540 },
};

const TEXT_STYLE_PRESETS: Record<
  string,
  {
    font: string;
    color: string;
    bg: string;
    bgAlpha: number;
    animIn: TextAnimType;
    animOut: TextAnimType;
    effect: string;
  }
> = {
  minimal: { font: 'Montserrat', color: '#ffffff', bg: '#000000', bgAlpha: 0, animIn: 'fade', animOut: 'fade', effect: 'none' },
  bold: { font: 'Impact', color: '#ffffff', bg: '#000000', bgAlpha: 0.85, animIn: 'pop', animOut: 'fade', effect: 'none' },
  highlight: { font: 'Tahoma', color: '#000000', bg: '#ffd400', bgAlpha: 0.95, animIn: 'slideUp', animOut: 'fade', effect: 'none' },
  neon: { font: 'Oswald', color: '#00eaff', bg: '#000000', bgAlpha: 0, animIn: 'zoom', animOut: 'fade', effect: 'neon' },
  gradient: { font: 'Montserrat', color: '#ffffff', bg: '#000000', bgAlpha: 0, animIn: 'slideUp', animOut: 'fade', effect: 'gradient' },
  outline: { font: 'Impact', color: '#ffffff', bg: '#000000', bgAlpha: 0, animIn: 'pop', animOut: 'fade', effect: 'outline' },
};

const QUICK_SALES_PHRASES = [
  '50+ Muka Surat!',
  'RM10 Sahaja',
  'Link kat Bio 👇',
  'PDF Siap Download',
  'Boleh Print Berulang',
  'Sesuai Tahun 1-6',
  'Percuma Preview!',
  'Swipe Lagi →',
  'DM untuk Order',
  'Stok Terhad!',
  'Jimat Masa Cikgu',
  'Testimoni ⭐⭐⭐⭐⭐',
];

export default function App() {
  const [config, setConfig] = useState<ProjectConfig>(defaultProjectConfig);
  const [activeTab, setActiveTab] = useState<'tab-media' | 'tab-style' | 'tab-text' | 'tab-export'>('tab-media');

  // Preview & Player state
  const playerRef = useRef<PlayerRef>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  // Sections collapse state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    displaySection: true,
    phoneFrameSection: true,
    bgSection: true,
    transitionSection: true,
    textSection: false,
    musicSection: true,
    watermarkSection: true,
    presetSection: true,
  });

  // Modals & UI state
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [restorePromptOpen, setRestorePromptOpen] = useState(false);
  const [restoreSessionData, setRestoreSessionData] = useState<any>(null);
  const [presets, setPresets] = useState<Array<{ id: string; name: string; payload: any }>>([]);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [pexelsApiKey, setPexelsApiKey] = useState('');
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsStatus, setPexelsStatus] = useState('');
  const [pexelsResults, setPexelsResults] = useState<any[]>([]);

  // Export state
  const [exportFormat, setExportFormat] = useState<'mp4' | 'webm'>('mp4');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatusText, setExportStatusText] = useState('Ready');
  const [toasts, setToasts] = useState<Array<{ id: string; msg: string }>>([]);

  // Drag and drop thumbnails
  const [draggedThumbIndex, setDraggedThumbIndex] = useState<number | null>(null);
  const [dragOverThumbIndex, setDragOverThumbIndex] = useState<number | null>(null);

  // Footer editing
  const [isEditingFooter, setIsEditingFooter] = useState(false);
  const [footerInputValue, setFooterInputValue] = useState('');

  // Refs for hidden inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const bgVideoInputRef = useRef<HTMLInputElement>(null);
  const phoneScreenImageInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Helpers
  const showToast = (msg: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Calculate timing
  const effectiveImageDuration = useMemo(() => {
    if (config.autoFitDuration && config.images.length > 0) {
      const raw = (config.targetVideoLength || 20) / config.images.length;
      return Math.max(0.3, Math.min(10, raw));
    }
    return config.imageDuration || 3;
  }, [config.autoFitDuration, config.images.length, config.targetVideoLength, config.imageDuration]);

  const totalDuration = useMemo(() => {
    const count = config.images.length || 1;
    return count * effectiveImageDuration;
  }, [config.images.length, effectiveImageDuration]);

  const totalFrames = useMemo(() => {
    return Math.max(30, Math.ceil(totalDuration * (config.fps || 30)));
  }, [totalDuration, config.fps]);

  // Load presets & autosave on mount
  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem('reelsmaker_presets');
      if (savedPresets) setPresets(JSON.parse(savedPresets));
      const pKey = localStorage.getItem('reelsmaker_pexels_key');
      if (pKey) setPexelsApiKey(pKey);
      const savedFooter = localStorage.getItem('footerText');
      if (savedFooter) {
        setConfig((c) => ({ ...c, footerText: savedFooter }));
      }
      const savedSession = localStorage.getItem('reelsmaker_autosave_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.images?.length || parsed?.textOverlays?.length) {
          setRestoreSessionData(parsed);
          setRestorePromptOpen(true);
        }
      }
    } catch (e) {
      console.warn('Error loading stored data:', e);
    }
  }, []);

  // Autosave periodically
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('reelsmaker_autosave_session', JSON.stringify(config));
      } catch (e) {}
    }, 1500);
    return () => clearTimeout(timer);
  }, [config]);

  // Player synchronization
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = (e: any) => {
      const frame = e.detail?.frame ?? player.getCurrentFrame();
      const sec = frame / (config.fps || 30);
      setCurrentSec(sec);
    };

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [config.fps]);

  // Player controls
  const togglePlay = () => {
    if (config.images.length === 0) {
      showToast('Please add at least one image.');
      return;
    }
    if (editingImageIndex !== null) setEditingImageIndex(null);
    const player = playerRef.current;
    if (!player) return;
    if (player.isPlaying()) {
      player.pause();
    } else {
      player.play();
    }
  };

  const restartPlay = () => {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(0);
    player.play();
  };

  const stopPlay = () => {
    const player = playerRef.current;
    if (!player) return;
    player.pause();
    player.seekTo(0);
    setCurrentSec(0);
  };

  const handleSeek = (val: number) => {
    const player = playerRef.current;
    if (!player) return;
    const targetFrame = Math.round((val / 100) * totalFrames);
    player.seekTo(targetFrame);
  };

  // Section accordion
  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Preset operations
  const saveCurrentPreset = () => {
    if (!presetNameInput.trim()) {
      showToast('Type a name for this preset first.');
      return;
    }
    const newPreset = {
      id: Date.now().toString(36),
      name: presetNameInput.trim(),
      payload: {
        displayMode: config.displayMode,
        phoneFrame: config.phoneFrame,
        bgType: config.bgType,
        phoneScreenBgType: config.phoneScreenBgType,
        aspectRatio: config.aspectRatio,
        cornerRadius: config.cornerRadius,
        frameBorder: config.frameBorder,
        framePadding: config.framePadding,
        globalImageScale: config.globalImageScale,
        transition: config.transition,
        transitionDuration: config.transitionDuration,
        textStylePreset: config.textStylePreset,
        font: config.font,
        fontSize: config.fontSize,
        textColor: config.textColor,
        textBgColor: config.textBgColor,
        animIn: config.animIn,
        animOut: config.animOut,
        textBgShape: config.textBgShape,
        textLoopAnim: config.textLoopAnim,
        fillFrame: config.fillFrame,
      },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('reelsmaker_presets', JSON.stringify(updated));
    setPresetNameInput('');
    showToast(`Preset "${newPreset.name}" saved.`);
  };

  const applyPreset = (preset: any) => {
    setConfig((prev) => ({
      ...prev,
      ...preset.payload,
    }));
    showToast(`Preset "${preset.name}" applied.`);
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    localStorage.setItem('reelsmaker_presets', JSON.stringify(updated));
    showToast('Preset deleted.');
  };

  // Quick Start template
  const applyQuickStart = () => {
    const dims = ASPECT_RATIO_DIMENSIONS['9:16'];
    setConfig((prev) => ({
      ...prev,
      aspectRatio: '9:16',
      canvasW: dims.w,
      canvasH: dims.h,
      displayMode: 'frame',
      phoneFrame: 'minimal-bezel',
      transition: 'slide',
      textStylePreset: 'bold',
      font: 'Impact',
      fontSize: 40,
      textColor: '#ffffff',
      textBgColor: '#000000',
      animIn: 'pop',
      animOut: 'fade',
      imageDuration: 2,
      autoFitDuration: false,
    }));
    showToast('✨ Quick Start applied! Upload your worksheet images/PDF, then Export.');
  };

  // Media uploads & PDF splitting
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    const imageFiles = fileArr.filter((f) => f.type.startsWith('image/'));
    const pdfFiles = fileArr.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));

    if (imageFiles.length === 0 && pdfFiles.length === 0) {
      showToast('Please select image or PDF files.');
      return;
    }

    const newSlides: SlideItem[] = [];

    // Read images
    for (const f of imageFiles) {
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target?.result as string);
        reader.readAsDataURL(f);
      });
      newSlides.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        dataUrl,
        transform: { scale: 1, offsetX: 0, offsetY: 0 },
      });
    }

    // Read & split PDFs
    if (pdfFiles.length > 0) {
      if (!window.pdfjsLib) {
        showToast('PDF library still loading, please retry in a second.');
      } else {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        for (const pdfFile of pdfFiles) {
          showToast(`Converting "${pdfFile.name}" pages...`);
          try {
            const buf = await pdfFile.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const baseVp = page.getViewport({ scale: 1 });
              const scale = 1080 / baseVp.width;
              const vp = page.getViewport({ scale });
              const canvas = document.createElement('canvas');
              canvas.width = Math.round(vp.width);
              canvas.height = Math.round(vp.height);
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: ctx, viewport: vp }).promise;
                const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                newSlides.push({
                  id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                  dataUrl,
                  transform: { scale: 1, offsetX: 0, offsetY: 0 },
                });
              }
            }
          } catch (err: any) {
            console.error('PDF Conversion error:', err);
            showToast(`Could not convert "${pdfFile.name}"`);
          }
        }
      }
    }

    if (newSlides.length > 0) {
      setConfig((prev) => ({
        ...prev,
        images: [...prev.images, ...newSlides],
      }));
      showToast(`${newSlides.length} slide(s) added!`);
    }
  };

  // Thumbnail drag reorder
  const handleDragStartThumb = (idx: number) => {
    setDraggedThumbIndex(idx);
  };

  const handleDragOverThumb = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedThumbIndex !== null && draggedThumbIndex !== idx) {
      setDragOverThumbIndex(idx);
    }
  };

  const handleDropThumb = (idx: number) => {
    if (draggedThumbIndex !== null && draggedThumbIndex !== idx) {
      setConfig((prev) => {
        const copy = [...prev.images];
        const [moved] = copy.splice(draggedThumbIndex, 1);
        copy.splice(idx, 0, moved);
        return { ...prev, images: copy };
      });
      showToast('Reordered slides.');
    }
    setDraggedThumbIndex(null);
    setDragOverThumbIndex(null);
  };

  const removeImage = (id: string) => {
    if (editingImageIndex !== null) setEditingImageIndex(null);
    setConfig((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
    }));
  };

  const clearAllImages = () => {
    if (config.images.length === 0) return;
    if (editingImageIndex !== null) setEditingImageIndex(null);
    setConfig((prev) => ({ ...prev, images: [] }));
    showToast('All images cleared.');
  };

  // Image editing handles
  const enterImageEdit = (idx: number) => {
    setEditingImageIndex(idx);
    const player = playerRef.current;
    if (player) {
      player.pause();
      const targetSec = idx * effectiveImageDuration + effectiveImageDuration / 2;
      player.seekTo(Math.round(targetSec * (config.fps || 30)));
    }
  };

  const resetCurrentImageTransform = () => {
    if (editingImageIndex === null) return;
    setConfig((prev) => {
      const copy = [...prev.images];
      if (copy[editingImageIndex]) {
        copy[editingImageIndex] = {
          ...copy[editingImageIndex],
          transform: { scale: 1, offsetX: 0, offsetY: 0 },
        };
      }
      return { ...prev, images: copy };
    });
    showToast('Image position reset.');
  };

  // Pexels search
  const handlePexelsSearch = async () => {
    if (!pexelsApiKey.trim()) {
      showToast('Please enter your free Pexels API key first.');
      return;
    }
    localStorage.setItem('reelsmaker_pexels_key', pexelsApiKey.trim());
    if (!pexelsQuery.trim()) {
      showToast('Type a keyword to search.');
      return;
    }
    setPexelsStatus('Searching...');
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(pexelsQuery.trim())}&per_page=15&orientation=portrait`,
        { headers: { Authorization: pexelsApiKey.trim() } }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setPexelsResults(data.photos || []);
      setPexelsStatus(`${data.photos?.length || 0} results found`);
    } catch (e) {
      setPexelsStatus('❌ Search failed — check your API key');
    }
  };

  const selectPexelsPhoto = (photo: any) => {
    setConfig((prev) => ({
      ...prev,
      bgType: 'stock',
      bgImageDataUrl: photo.src.large2x || photo.src.original,
    }));
    showToast(`Background photo by ${photo.photographer} applied!`);
  };

  // Text overlay handlers
  const addTextOverlay = (text = '', duration = 2.0) => {
    const id = `text_${Date.now().toString(36)}`;
    const count = config.textOverlays.length;
    let yPos = 50;
    if (count === 1) yPos = 30;
    else if (count >= 2) yPos = 20 + count * 15;

    const newItem: TextOverlayItem = {
      id,
      text: text || `Text ${count + 1}`,
      duration,
      order: count,
      x: 50,
      y: Math.min(80, yPos),
    };

    setConfig((prev) => ({
      ...prev,
      textOverlays: [...prev.textOverlays, newItem],
    }));
    showToast(`Added: ${text || 'Text'}`);
  };

  const removeTextOverlay = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      textOverlays: prev.textOverlays.filter((t) => t.id !== id),
    }));
    showToast('Text removed');
  };

  const updateTextItem = (id: string, field: keyof TextOverlayItem, value: any) => {
    setConfig((prev) => ({
      ...prev,
      textOverlays: prev.textOverlays.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    }));
  };

  const applyTextPreset = (presetKey: string) => {
    const p = TEXT_STYLE_PRESETS[presetKey];
    if (!p) {
      setConfig((prev) => ({
        ...prev,
        textStylePreset: 'custom',
        textEffect: 'none',
        textBgAlpha: 0.85,
      }));
      return;
    }
    setConfig((prev) => ({
      ...prev,
      textStylePreset: presetKey as TextStylePresetType,
      font: p.font,
      textColor: p.color,
      textBgColor: p.bg,
      textBgAlpha: p.bgAlpha,
      animIn: p.animIn,
      animOut: p.animOut,
      textEffect: p.effect,
    }));
  };

  // Audio / Music
  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = (ev) => res(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    setConfig((prev) => ({
      ...prev,
      musicDataUrl: dataUrl,
      musicName: file.name,
    }));
    showToast(`Music loaded: ${file.name}`);
    e.target.value = '';
  };

  const removeMusic = () => {
    setConfig((prev) => ({
      ...prev,
      musicDataUrl: null,
      musicName: null,
    }));
    showToast('Music removed.');
  };

  // Watermark upload
  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = (ev) => res(ev.target?.result as string);
      reader.readAsDataURL(file);
    });
    setConfig((prev) => ({
      ...prev,
      watermarkImageDataUrl: dataUrl,
    }));
    showToast('Logo loaded.');
    e.target.value = '';
  };

  // Aspect ratio change
  const handleAspectRatioChange = (ratio: AspectRatioType) => {
    const dims = ASPECT_RATIO_DIMENSIONS[ratio] || ASPECT_RATIO_DIMENSIONS['9:16'];
    setConfig((prev) => ({
      ...prev,
      aspectRatio: ratio,
      canvasW: dims.w,
      canvasH: dims.h,
    }));
  };

  // Export video using Remotion Backend API
  const handleExport = async () => {
    if (config.images.length === 0) {
      showToast('Please add images to export.');
      return;
    }
    if (isExporting) return;

    setIsExporting(true);
    setExportStatusText('Preparing Remotion render job...');

    try {
      // 1. Post project configuration JSON to Remotion backend
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectConfig: config }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Server error starting render');
      }

      const { jobId } = await res.json();
      setExportStatusText('Rendering with Remotion engine (0%)...');

      // 2. Poll render status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/render-status/${jobId}`);
          if (!statusRes.ok) return;
          const { job } = await statusRes.json();

          if (job.status === 'rendering') {
            setExportStatusText(`Rendering with Remotion engine (${job.progress}%)...`);
          } else if (job.status === 'done' && job.downloadUrl) {
            clearInterval(pollInterval);
            setIsExporting(false);
            setExportStatusText('✅ Remotion render complete!');
            showToast('Video rendered with Remotion! Downloading... 🎉');

            // Trigger download
            const a = document.createElement('a');
            a.href = job.downloadUrl;
            a.download = job.fileName || `reels-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else if (job.status === 'error') {
            clearInterval(pollInterval);
            setIsExporting(false);
            setExportStatusText(`❌ Render failed: ${job.error || 'Unknown error'}`);
            showToast(`Export failed: ${job.error || 'Unknown error'}`);
          }
        } catch (err: any) {
          console.error('Polling error:', err);
        }
      }, 1500);
    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
      setExportStatusText(`❌ Render failed: ${err.message || 'Error'}`);
      showToast(`Export error: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="app-shell">
      {/* Top Bar */}
      <div className="app-topbar">
        <div className="app-logo">
          <div className="app-logo-icon">
            <i className="fas fa-clapperboard"></i>
          </div>
          <div>
            <div className="app-logo-title">ReelsMaker</div>
            <div className="app-logo-tagline">Remotion Video Engine</div>
          </div>
        </div>
        <button
          className="app-topbar-help"
          onClick={() => setTutorialOpen(true)}
          title="Tutorial"
        >
          <i className="fas fa-circle-question"></i>
        </button>
      </div>

      {/* Sticky Preview Dock hosting Remotion Player */}
      <div className="preview-dock">
        <div
          className="preview-container"
          id="previewContainer"
          ref={previewContainerRef}
          style={{ aspectRatio: `${config.canvasW}/${config.canvasH}` }}
        >
          {/* Remotion Player Component */}
          <Player
            ref={playerRef}
            component={MainComposition}
            inputProps={{ projectConfig: config }}
            durationInFrames={totalFrames}
            compositionWidth={config.canvasW}
            compositionHeight={config.canvasH}
            fps={config.fps || 30}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            controls={false}
            loop
          />

          {/* Interactive Text Overlay on Preview */}
          <div className="text-drag-overlay" id="textDragOverlay">
            {config.textOverlays.map((item) => (
              <div
                key={item.id}
                className="text-drag-item"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  const parentRect = previewContainerRef.current?.getBoundingClientRect();
                  if (!parentRect) return;

                  const onPointerMove = (ev: PointerEvent) => {
                    const newX = Math.max(5, Math.min(95, ((ev.clientX - parentRect.left) / parentRect.width) * 100));
                    const newY = Math.max(5, Math.min(95, ((ev.clientY - parentRect.top) / parentRect.height) * 100));
                    updateTextItem(item.id, 'x', Math.round(newX));
                    updateTextItem(item.id, 'y', Math.round(newY));
                  };

                  const onPointerUp = (ev: PointerEvent) => {
                    target.releasePointerCapture(ev.pointerId);
                    window.removeEventListener('pointermove', onPointerMove);
                    window.removeEventListener('pointerup', onPointerUp);
                  };

                  window.addEventListener('pointermove', onPointerMove);
                  window.addEventListener('pointerup', onPointerUp);
                }}
              >
                {item.text || 'Text'}
              </div>
            ))}
          </div>

          {/* Image Transform Handles Overlay when in image edit mode */}
          {editingImageIndex !== null && config.images[editingImageIndex] && (
            <div className="img-transform-overlay" id="imageTransformOverlay" style={{ display: 'block' }}>
              <div
                className="img-transform-box"
                id="imgTransformBox"
                style={{
                  left: '15%',
                  top: '15%',
                  width: '70%',
                  height: '70%',
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const curT = config.images[editingImageIndex].transform || { scale: 1, offsetX: 0, offsetY: 0 };
                  const startOffX = curT.offsetX;
                  const startOffY = curT.offsetY;

                  const onMove = (ev: PointerEvent) => {
                    const dx = (ev.clientX - startX) / (previewContainerRef.current?.clientWidth || 300);
                    const dy = (ev.clientY - startY) / (previewContainerRef.current?.clientHeight || 500);
                    setConfig((prev) => {
                      const copy = [...prev.images];
                      copy[editingImageIndex] = {
                        ...copy[editingImageIndex],
                        transform: {
                          ...curT,
                          offsetX: startOffX + dx,
                          offsetY: startOffY + dy,
                        },
                      };
                      return { ...prev, images: copy };
                    });
                  };

                  const onUp = () => {
                    window.removeEventListener('pointermove', onMove);
                    window.removeEventListener('pointerup', onUp);
                  };

                  window.addEventListener('pointermove', onMove);
                  window.addEventListener('pointerup', onUp);
                }}
              >
                {['tl', 'tr', 'bl', 'br'].map((corner) => (
                  <div
                    key={corner}
                    className="img-transform-handle"
                    data-corner={corner}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const curT = config.images[editingImageIndex].transform || { scale: 1, offsetX: 0, offsetY: 0 };
                      const startScale = curT.scale;
                      const startY = e.clientY;

                      const onMove = (ev: PointerEvent) => {
                        const delta = (startY - ev.clientY) / 100;
                        const newScale = Math.max(0.3, Math.min(3.5, startScale + delta));
                        setConfig((prev) => {
                          const copy = [...prev.images];
                          copy[editingImageIndex] = {
                            ...copy[editingImageIndex],
                            transform: { ...curT, scale: newScale },
                          };
                          return { ...prev, images: copy };
                        });
                      };

                      const onUp = () => {
                        window.removeEventListener('pointermove', onMove);
                        window.removeEventListener('pointerup', onUp);
                      };

                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                    }}
                  />
                ))}
              </div>
              <button
                id="resetEditImageBtn"
                className="img-edit-done-btn"
                style={{ right: '100px', background: '#333' }}
                onClick={resetCurrentImageTransform}
              >
                <i className="fas fa-undo"></i> Reset
              </button>
              <button
                id="doneEditImageBtn"
                className="img-edit-done-btn"
                onClick={() => setEditingImageIndex(null)}
              >
                <i className="fas fa-check"></i> Done
              </button>
            </div>
          )}

          {/* Overlay Controls */}
          <div className="preview-overlay">
            <button id="restartBtn" title="Restart" onClick={restartPlay}>
              <i className="fas fa-backward"></i>
            </button>
            <button className="play-btn" id="playBtn" title="Play/Pause" onClick={togglePlay}>
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button id="stopBtn" title="Stop" onClick={stopPlay}>
              <i className="fas fa-stop"></i>
            </button>
          </div>
        </div>

        {/* Seek Bar and Time display */}
        <div style={{ width: '100%', maxWidth: '400px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: '#666' }} id="currentTime">
            {formatTime(currentSec)}
          </span>
          <input
            type="range"
            id="seekBar"
            style={{ flex: 1, accentColor: '#4a9eff', background: '#333', height: '4px', borderRadius: '4px' }}
            min="0"
            max="100"
            value={totalDuration > 0 ? (currentSec / totalDuration) * 100 : 0}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
          />
          <span style={{ fontSize: '12px', color: '#666' }} id="totalTime">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Main Column with Tabs and Bottom Navigation */}
      <div className="main-col">
        <div className="tab-content">
          {/* TAB 1: MEDIA */}
          <div className={`tab-panel ${activeTab === 'tab-media' ? 'active' : ''}`} id="tab-media">
            <button id="tutorialBtn" className="tutorial-btn" onClick={() => setTutorialOpen(true)}>
              <i className="fas fa-circle-question"></i> Tutorial — How to Use
            </button>
            <button id="quickStartBtn" className="quick-start-btn" onClick={applyQuickStart}>
              <i className="fas fa-wand-magic-sparkles"></i> Quick Start: Worksheet Promo
            </button>
            <hr className="divider" />
            <h3>
              <i className="fas fa-images"></i> Images
            </h3>
            <div
              className="upload-area"
              id="uploadArea"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
              }}
            >
              <i className="fas fa-cloud-upload-alt"></i>
              <span>Drag & Drop Images or PDF</span>
              <input
                type="file"
                id="fileInput"
                ref={fileInputRef}
                multiple
                accept="image/*,application/pdf,.pdf"
                onChange={(e) => {
                  if (e.target.files) handleFileUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            <div className="stock-hint" style={{ marginTop: '4px' }}>
              Upload a PDF worksheet and every page auto-splits into its own slide.
            </div>
            <div className="flex-between">
              <span style={{ fontSize: '12px', color: '#888' }} id="imageCount">
                {config.images.length} images
              </span>
              <button
                id="clearImages"
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px' }}
                onClick={clearAllImages}
              >
                <i className="fas fa-trash"></i> Clear All
              </button>
            </div>

            {/* Thumbnail Grid with Drag & Drop Reordering */}
            <div className="thumbnail-grid" id="thumbnailGrid">
              {config.images.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-plus-circle"></i>
                  Add images to start
                </div>
              ) : (
                config.images.map((img, idx) => (
                  <div
                    key={img.id}
                    className={`thumbnail-item ${draggedThumbIndex === idx ? 'dragging' : ''} ${
                      dragOverThumbIndex === idx ? 'drag-over' : ''
                    }`}
                    draggable
                    onDragStart={() => handleDragStartThumb(idx)}
                    onDragOver={(e) => handleDragOverThumb(e, idx)}
                    onDrop={() => handleDropThumb(idx)}
                    onDragEnd={() => {
                      setDraggedThumbIndex(null);
                      setDragOverThumbIndex(null);
                    }}
                  >
                    <img src={img.dataUrl} alt={`Slide ${idx + 1}`} />
                    <span className="order-num">#{idx + 1}</span>
                    <button
                      className="edit-transform-btn"
                      title="Resize / reposition this image"
                      onClick={(e) => {
                        e.stopPropagation();
                        enterImageEdit(idx);
                      }}
                    >
                      <i className="fas fa-arrows-alt"></i>
                    </button>
                    <button
                      className="delete-btn"
                      title="Delete image"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.id);
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
            <hr className="divider" />
            <div style={{ fontSize: '12px', color: '#555' }}>
              <i className="fas fa-grip-vertical"></i> Drag thumbnails to reorder
            </div>
          </div>

          {/* TAB 2: STYLE */}
          <div className={`tab-panel ${activeTab === 'tab-style' ? 'active' : ''}`} id="tab-style">
            <div className="style-grid">
              {/* Display Section */}
              <div className="section-block">
                <h3
                  className={`section-toggle ${collapsedSections.displaySection ? 'collapsed' : ''}`}
                  onClick={() => toggleSection('displaySection')}
                >
                  <span>
                    <i className="fas fa-expand"></i> Display Mode
                  </span>
                  <i className="fas fa-chevron-down"></i>
                </h3>
                <div className={`section-content ${collapsedSections.displaySection ? 'collapsed' : ''}`} id="displaySection">
                  <div className="text-input-group">
                    <label>Video Size</label>
                    <select
                      id="aspectRatioSelect"
                      value={config.aspectRatio}
                      onChange={(e) => handleAspectRatioChange(e.target.value as AspectRatioType)}
                    >
                      <option value="9:16">9:16 — Reels / TikTok / Shorts</option>
                      <option value="1:1">1:1 — Instagram Post</option>
                      <option value="4:5">4:5 — Instagram Portrait</option>
                      <option value="16:9">16:9 — YouTube / Landscape</option>
                    </select>
                  </div>
                  <div className="display-mode-options">
                    <button
                      className={config.displayMode === 'frame' ? 'active' : ''}
                      onClick={() => setConfig((c) => ({ ...c, displayMode: 'frame' }))}
                    >
                      🖼️ Frame
                    </button>
                    <button
                      className={config.displayMode === 'full' ? 'active' : ''}
                      onClick={() => setConfig((c) => ({ ...c, displayMode: 'full' }))}
                    >
                      📱 Fit Screen
                    </button>
                  </div>
                  <div className="display-mode-desc" id="displayModeDesc">
                    {config.displayMode === 'frame'
                      ? 'Image in frame with background visible'
                      : 'Image fills entire screen (no background)'}
                  </div>
                  {config.displayMode === 'frame' && (
                    <div className="frame-controls" id="frameControls">
                      <div className="frame-control">
                        <label>Padding</label>
                        <input
                          type="range"
                          id="framePadding"
                          min="2"
                          max="20"
                          step="1"
                          value={config.framePadding}
                          onChange={(e) => setConfig((c) => ({ ...c, framePadding: parseFloat(e.target.value) }))}
                        />
                        <span id="framePaddingLabel">{config.framePadding}%</span>
                      </div>
                      <div className="frame-control">
                        <label>Radius</label>
                        <input
                          type="range"
                          id="cornerRadius"
                          min="0"
                          max="40"
                          step="1"
                          value={config.cornerRadius}
                          onChange={(e) => setConfig((c) => ({ ...c, cornerRadius: parseFloat(e.target.value) }))}
                        />
                        <span id="cornerRadiusLabel">{config.cornerRadius}px</span>
                      </div>
                      <div className="frame-control">
                        <label>Image Size</label>
                        <input
                          type="range"
                          id="globalImageScale"
                          min="50"
                          max="200"
                          step="5"
                          value={Math.round((config.globalImageScale || 1) * 100)}
                          onChange={(e) => setConfig((c) => ({ ...c, globalImageScale: parseFloat(e.target.value) / 100 }))}
                        />
                        <span id="globalImageScaleLabel">{Math.round((config.globalImageScale || 1) * 100)}%</span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ccc', cursor: 'pointer', margin: '4px 0 8px 0' }}>
                        <input
                          type="checkbox"
                          id="fillFrame"
                          checked={config.fillFrame}
                          onChange={(e) => setConfig((c) => ({ ...c, fillFrame: e.target.checked }))}
                          style={{ width: '16px', height: '16px', accentColor: '#4a9eff' }}
                        />
                        Fill Frame (crop to remove empty space)
                      </label>
                      <div className="stock-hint" style={{ marginTop: 0, marginBottom: '8px' }}>
                        Good for A4/KDP-sized worksheets on 9:16 — fills the frame fully instead of leaving empty space top/bottom, by cropping the sides slightly instead.
                      </div>
                      <div className="text-input-group" style={{ marginBottom: 0 }}>
                        <label>Border</label>
                        <select
                          id="frameBorder"
                          value={config.frameBorder}
                          onChange={(e) => setConfig((c) => ({ ...c, frameBorder: e.target.value as FrameBorderType }))}
                        >
                          <option value="none">None</option>
                          <option value="white">White</option>
                          <option value="black">Black</option>
                          <option value="gradient">Gradient</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <hr className="divider" />
              </div>

              {/* Phone Frame Section */}
              <div className="section-block">
                <h3
                  className={`section-toggle ${collapsedSections.phoneFrameSection ? 'collapsed' : ''}`}
                  onClick={() => toggleSection('phoneFrameSection')}
                >
                  <span>
                    <i className="fas fa-mobile-alt"></i> Phone Frame
                  </span>
                  <i className="fas fa-chevron-down"></i>
                </h3>
                <div className={`section-content ${collapsedSections.phoneFrameSection ? 'collapsed' : ''}`} id="phoneFrameSection">
                  <div className="phone-frame-options">
                    <button
                      className={config.phoneFrame === 'none' ? 'active' : ''}
                      onClick={() => setConfig((c) => ({ ...c, phoneFrame: 'none' }))}
                    >
                      <i className="fas fa-ban"></i>
                      None
                    </button>
                    <button
                      className={config.phoneFrame === 'iphone-notch' ? 'active' : ''}
                      onClick={() => setConfig((c) => ({ ...c, phoneFrame: 'iphone-notch' }))}
                    >
                      <i className="fas fa-mobile-alt"></i>
                      iPhone Notch
                    </button>
                    <button
                      className={config.phoneFrame === 'dynamic-island' ? 'active' : ''}
                      onClick={() => setConfig((c) => ({ ...c, phoneFrame: 'dynamic-island' }))}
                    >
                      <i className="fas fa-mobile-alt"></i>
                      Dynamic Island
                    </button>
                    <button
                      className={config.phoneFrame === 'android-punch' ? 'active' : ''}
                      onClick={() => setConfig((c) => ({ ...c, phoneFrame: 'android-punch' }))}
                    >
                      <i className="fas fa-mobile-alt"></i>
                      Android Punch-Hole
                    </button>
                    <button
                      className={config.phoneFrame === 'minimal-bezel' ? 'active' : ''}
                      onClick={() => setConfig((c) => ({ ...c, phoneFrame: 'minimal-bezel' }))}
                    >
                      <i className="fas fa-mobile-alt"></i>
                      Minimal Bezel
                    </button>
                  </div>
                  <div className="stock-hint">
                    Adds a device bezel on top of your video so it looks like a real phone screen recording.
                  </div>

                  {config.phoneFrame !== 'none' && (
                    <div id="phoneFrameExtras" style={{ marginTop: '10px' }}>
                      <hr className="divider" />
                      <div className="text-input-group">
                        <label>Frame Shape</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="range"
                            id="phoneScreenRatio"
                            min="46"
                            max="65"
                            step="1"
                            value={Math.round((config.phoneScreenRatio || 0.54) * 100)}
                            onChange={(e) => setConfig((c) => ({ ...c, phoneScreenRatio: parseFloat(e.target.value) / 100 }))}
                            style={{ flex: 1, accentColor: '#4a9eff', background: '#333', height: '4px', borderRadius: '4px' }}
                          />
                          <span id="phoneScreenRatioLabel" style={{ minWidth: '44px', textAlign: 'center', fontSize: '12px', color: '#aaa' }}>
                            {Math.round((config.phoneScreenRatio || 0.54) * 100)}%
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#555', marginTop: '2px' }}>
                          Drag right to make the phone shorter/wider.
                        </div>
                      </div>
                      <hr className="divider" />
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                        Screen Background <span style={{ color: '#555' }}>(fills empty space around your image)</span>
                      </div>
                      <div className="bg-options" id="phoneScreenBgOptions">
                        <button
                          className={config.phoneScreenBgType === 'colour' ? 'active' : ''}
                          onClick={() => setConfig((c) => ({ ...c, phoneScreenBgType: 'colour' }))}
                        >
                          Colour
                        </button>
                        <button
                          className={config.phoneScreenBgType === 'image' ? 'active' : ''}
                          onClick={() => setConfig((c) => ({ ...c, phoneScreenBgType: 'image' }))}
                        >
                          Image
                        </button>
                      </div>
                      {config.phoneScreenBgType === 'colour' ? (
                        <div className="color-picker-wrap" id="phoneScreenColorWrap">
                          <input
                            type="color"
                            id="phoneScreenColor"
                            value={config.phoneScreenColor || '#000000'}
                            onChange={(e) => setConfig((c) => ({ ...c, phoneScreenColor: e.target.value }))}
                          />
                          <span style={{ fontSize: '12px', color: '#888' }}>Screen colour</span>
                        </div>
                      ) : (
                        <div id="phoneScreenImageWrap" style={{ marginTop: '8px' }}>
                          <input
                            type="file"
                            id="phoneScreenImageInput"
                            ref={phoneScreenImageInputRef}
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dataUrl = await new Promise<string>((res) => {
                                  const r = new FileReader();
                                  r.onload = (ev) => res(ev.target?.result as string);
                                  r.readAsDataURL(file);
                                });
                                setConfig((c) => ({ ...c, phoneScreenImageDataUrl: dataUrl }));
                                showToast('Screen background image loaded.');
                              }
                              e.target.value = '';
                            }}
                          />
                          <button
                            id="phoneScreenImageBtn"
                            style={{ width: '100%', padding: '8px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#ccc', cursor: 'pointer', fontSize: '12px' }}
                            onClick={() => phoneScreenImageInputRef.current?.click()}
                          >
                            <i className="fas fa-image"></i> Upload Screen Background
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <hr className="divider" />
              </div>

              {/* Background Section */}
              <div className="section-block">
                <h3
                  className={`section-toggle ${collapsedSections.bgSection ? 'collapsed' : ''}`}
                  onClick={() => toggleSection('bgSection')}
                >
                  <span>
                    <i className="fas fa-layer-group"></i> Background
                  </span>
                  <i className="fas fa-chevron-down"></i>
                </h3>
                <div className={`section-content ${collapsedSections.bgSection ? 'collapsed' : ''}`} id="bgSection">
                  <div className="bg-options">
                    <button className={config.bgType === 'colour' ? 'active' : ''} onClick={() => setConfig((c) => ({ ...c, bgType: 'colour' }))}>
                      Colour
                    </button>
                    <button className={config.bgType === 'image' ? 'active' : ''} onClick={() => setConfig((c) => ({ ...c, bgType: 'image' }))}>
                      Image
                    </button>
                    <button className={config.bgType === 'video' ? 'active' : ''} onClick={() => setConfig((c) => ({ ...c, bgType: 'video' }))}>
                      Video
                    </button>
                    <button className={config.bgType === 'stock' ? 'active' : ''} onClick={() => setConfig((c) => ({ ...c, bgType: 'stock' }))}>
                      Stock
                    </button>
                    <button className={config.bgType === 'none' ? 'active' : ''} onClick={() => setConfig((c) => ({ ...c, bgType: 'none' }))}>
                      None
                    </button>
                  </div>

                  {config.bgType === 'colour' && (
                    <div className="color-picker-wrap" id="colorPickerWrap">
                      <input
                        type="color"
                        id="bgColor"
                        value={config.bgColour || '#1a1a2e'}
                        onChange={(e) => setConfig((c) => ({ ...c, bgColour: e.target.value }))}
                      />
                      <span style={{ fontSize: '12px', color: '#888' }}>Solid colour</span>
                    </div>
                  )}

                  {config.bgType === 'image' && (
                    <div id="bgImageWrap" style={{ marginTop: '8px' }}>
                      <input
                        type="file"
                        id="bgImageInput"
                        ref={bgImageInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const dataUrl = await new Promise<string>((res) => {
                              const r = new FileReader();
                              r.onload = (ev) => res(ev.target?.result as string);
                              r.readAsDataURL(file);
                            });
                            setConfig((c) => ({ ...c, bgImageDataUrl: dataUrl }));
                            showToast('Background image loaded.');
                          }
                          e.target.value = '';
                        }}
                      />
                      <button
                        id="bgImageBtn"
                        style={{ width: '100%', padding: '8px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#ccc', cursor: 'pointer', fontSize: '12px' }}
                        onClick={() => bgImageInputRef.current?.click()}
                      >
                        <i className="fas fa-image"></i> Upload Background Image
                      </button>
                    </div>
                  )}

                  {config.bgType === 'video' && (
                    <div id="bgVideoWrap" style={{ marginTop: '8px' }}>
                      <input
                        type="file"
                        id="bgVideoInput"
                        ref={bgVideoInputRef}
                        accept="video/*"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const dataUrl = await new Promise<string>((res) => {
                              const r = new FileReader();
                              r.onload = (ev) => res(ev.target?.result as string);
                              r.readAsDataURL(file);
                            });
                            setConfig((c) => ({ ...c, bgVideoDataUrl: dataUrl }));
                            showToast('Background video loaded.');
                          }
                          e.target.value = '';
                        }}
                      />
                      <button
                        id="bgVideoBtn"
                        style={{ width: '100%', padding: '8px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#ccc', cursor: 'pointer', fontSize: '12px' }}
                        onClick={() => bgVideoInputRef.current?.click()}
                      >
                        <i className="fas fa-video"></i> Upload Background Video
                      </button>
                    </div>
                  )}

                  {config.bgType === 'stock' && (
                    <div id="bgStockWrap" className="stock-search">
                      <input
                        type="password"
                        id="pexelsApiKey"
                        placeholder="Pexels API Key (free — pexels.com/api)"
                        value={pexelsApiKey}
                        onChange={(e) => setPexelsApiKey(e.target.value)}
                      />
                      <div className="stock-search-row">
                        <input
                          type="text"
                          id="pexelsQuery"
                          placeholder="Search e.g. 'ocean', 'classroom'..."
                          value={pexelsQuery}
                          onChange={(e) => setPexelsQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePexelsSearch();
                          }}
                        />
                        <button id="pexelsSearchBtn" onClick={handlePexelsSearch}>
                          <i className="fas fa-search"></i>
                        </button>
                      </div>
                      <div id="pexelsStatus" style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
                        {pexelsStatus}
                      </div>
                      <div className="stock-results" id="pexelsResults">
                        {pexelsResults.map((photo) => (
                          <img
                            key={photo.id}
                            src={photo.src.small}
                            title={`Photo by ${photo.photographer}`}
                            onClick={() => selectPexelsPhoto(photo)}
                          />
                        ))}
                      </div>
                      <div className="stock-hint">
                        Powered by <a href="https://www.pexels.com" target="_blank" rel="noreferrer">Pexels</a>. Get a free API key at pexels.com/api.
                      </div>
                    </div>
                  )}
                </div>
                <hr className="divider" />
              </div>

              {/* Transition Section */}
              <div className="section-block">
                <h3
                  className={`section-toggle ${collapsedSections.transitionSection ? 'collapsed' : ''}`}
                  onClick={() => toggleSection('transitionSection')}
                >
                  <span>
                    <i className="fas fa-exchange-alt"></i> Transitions
                  </span>
                  <i className="fas fa-chevron-down"></i>
                </h3>
                <div className={`section-content ${collapsedSections.transitionSection ? 'collapsed' : ''}`} id="transitionSection">
                  <div className="text-input-group">
                    <label>Image Transition</label>
                    <select
                      id="transitionSelect"
                      value={config.transition}
                      onChange={(e) => setConfig((c) => ({ ...c, transition: e.target.value as TransitionType }))}
                    >
                      <option value="none">None</option>
                      <option value="fade">Fade</option>
                      <option value="slide">Slide (Left)</option>
                      <option value="slideup">Slide (Up)</option>
                      <option value="zoom">Zoom</option>
                      <option value="flip">Flip</option>
                      <option value="wipe">Wipe</option>
                      <option value="circlereveal">Circle Reveal</option>
                      <option value="blur">Blur</option>
                      <option value="spin">Spin</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </div>
                  <div className="frame-control">
                    <label>Trans. Speed</label>
                    <input
                      type="range"
                      id="transitionDuration"
                      min="10"
                      max="150"
                      step="5"
                      value={Math.round((config.transitionDuration || 0.35) * 100)}
                      onChange={(e) => setConfig((c) => ({ ...c, transitionDuration: parseFloat(e.target.value) / 100 }))}
                    />
                    <span id="transitionDurationLabel">{(config.transitionDuration || 0.35).toFixed(2)}s</span>
                  </div>
                  <div className="text-input-group">
                    <label>Image Duration (seconds)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="range"
                        id="imageDuration"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={config.imageDuration}
                        onChange={(e) => setConfig((c) => ({ ...c, imageDuration: parseFloat(e.target.value) }))}
                        style={{ flex: 1, accentColor: '#4a9eff', background: '#333', height: '4px', borderRadius: '4px' }}
                      />
                      <span id="imageDurationLabel" style={{ minWidth: '40px', textAlign: 'center', fontSize: '14px', color: '#aaa' }}>
                        {(config.imageDuration || 3).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ccc', cursor: 'pointer', margin: '4px 0 8px 0' }}>
                    <input
                      type="checkbox"
                      id="autoFitDuration"
                      checked={config.autoFitDuration}
                      onChange={(e) => setConfig((c) => ({ ...c, autoFitDuration: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#4a9eff' }}
                    />
                    Auto-fit slide speed (great for big bundles)
                  </label>
                  {config.autoFitDuration && (
                    <div id="autoFitControls">
                      <div className="text-input-group" style={{ marginBottom: 0 }}>
                        <label>Target Video Length (seconds)</label>
                        <input
                          type="number"
                          id="targetVideoLength"
                          min="3"
                          max="180"
                          step="1"
                          value={config.targetVideoLength || 20}
                          onChange={(e) => setConfig((c) => ({ ...c, targetVideoLength: parseInt(e.target.value) || 20 }))}
                          style={{ width: '100%', padding: '7px 8px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#ccc', fontSize: '12px' }}
                        />
                      </div>
                      <div className="stock-hint" style={{ marginTop: '6px' }}>
                        Slide speed auto-divides across all your images to fit this length — no need to guess per-slide timing when showing 20-50 designs.
                      </div>
                    </div>
                  )}
                </div>
                <hr className="divider" />
              </div>
            </div>
          </div>

          {/* TAB 3: TEXT */}
          <div className={`tab-panel ${activeTab === 'tab-text' ? 'active' : ''}`} id="tab-text">
            {/* Text Overlays Section */}
            <h3
              className={`section-toggle ${collapsedSections.textSection ? 'collapsed' : ''}`}
              onClick={() => toggleSection('textSection')}
            >
              <span>
                <i className="fas fa-font"></i> Text Overlays
              </span>
              <i className="fas fa-chevron-down"></i>
            </h3>
            <div className={`section-content ${collapsedSections.textSection ? 'collapsed' : ''}`} id="textSection">
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px' }}>
                <i className="fas fa-plus-circle"></i> Add text, set duration, drag in preview
              </div>
              <div id="textOverlayList">
                {config.textOverlays.length === 0 ? (
                  <div className="empty-state" style={{ padding: '12px 0', fontSize: '12px' }}>
                    <i className="fas fa-plus" style={{ fontSize: '20px' }}></i>
                    No text overlays yet
                  </div>
                ) : (
                  config.textOverlays.map((item, idx) => (
                    <div key={item.id} className="text-overlay-item">
                      <div className="text-header">
                        <span className="text-number">#{idx + 1}</span>
                        <div>
                          <button
                            className="delete-text-btn"
                            title="Delete"
                            onClick={() => removeTextOverlay(item.id)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={item.text}
                        placeholder="Enter text..."
                        onChange={(e) => updateTextItem(item.id, 'text', e.target.value)}
                      />
                      <div className="duration-row">
                        <label>Duration</label>
                        <input
                          type="range"
                          min="0.5"
                          max="10"
                          step="0.1"
                          value={item.duration}
                          onChange={(e) => updateTextItem(item.id, 'duration', parseFloat(e.target.value))}
                        />
                        <span className="duration-label">{item.duration.toFixed(1)}s</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button className="add-text-btn" id="addTextBtn" onClick={() => addTextOverlay()}>
                <i className="fas fa-plus"></i> Add Text
              </button>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '10px', marginBottom: '6px' }}>
                Quick Add (Jualan)
              </div>
              <div className="quick-text-chips" id="quickTextChips">
                {QUICK_SALES_PHRASES.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    className="quick-text-chip"
                    onClick={() => addTextOverlay(phrase, 2.0)}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
              <hr className="divider" />
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Global Settings</div>
              <div className="text-input-group">
                <label>Style Preset</label>
                <select
                  id="textStylePreset"
                  value={config.textStylePreset}
                  onChange={(e) => applyTextPreset(e.target.value)}
                >
                  <option value="custom">Custom</option>
                  <option value="minimal">Minimal Clean</option>
                  <option value="bold">Bold Caption</option>
                  <option value="highlight">Highlight Marker</option>
                  <option value="neon">Neon Glow</option>
                  <option value="gradient">Gradient Pop</option>
                  <option value="outline">Outline Pop</option>
                </select>
              </div>
              <div className="text-input-group">
                <label>Font</label>
                <select
                  id="fontSelect"
                  value={config.font}
                  onChange={(e) => setConfig((c) => ({ ...c, font: e.target.value }))}
                >
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Impact">Impact</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Oswald">Oswald</option>
                </select>
              </div>
              <div className="text-input-group">
                <label>Font Size</label>
                <input
                  type="number"
                  id="fontSize"
                  value={config.fontSize}
                  min="12"
                  max="120"
                  onChange={(e) => setConfig((c) => ({ ...c, fontSize: parseInt(e.target.value) || 36 }))}
                />
              </div>
              <div className="text-row">
                <div className="text-input-group" style={{ flex: 1 }}>
                  <label>Text Color</label>
                  <input
                    type="color"
                    id="textColor"
                    value={config.textColor || '#ffffff'}
                    onChange={(e) => setConfig((c) => ({ ...c, textColor: e.target.value }))}
                  />
                </div>
                <div className="text-input-group" style={{ flex: 1 }}>
                  <label>Background Color</label>
                  <input
                    type="color"
                    id="textBgColor"
                    value={config.textBgColor?.slice(0, 7) || '#000000'}
                    onChange={(e) => setConfig((c) => ({ ...c, textBgColor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="text-input-group">
                <label>Animation In</label>
                <select
                  id="animIn"
                  value={config.animIn}
                  onChange={(e) => setConfig((c) => ({ ...c, animIn: e.target.value as TextAnimType }))}
                >
                  <option value="fade">Fade</option>
                  <option value="pop">Pop</option>
                  <option value="slideUp">Slide Up</option>
                  <option value="slideDown">Slide Down</option>
                  <option value="slideLeft">Slide Left</option>
                  <option value="slideRight">Slide Right</option>
                  <option value="zoom">Zoom</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="text-input-group">
                <label>Animation Out</label>
                <select
                  id="animOut"
                  value={config.animOut}
                  onChange={(e) => setConfig((c) => ({ ...c, animOut: e.target.value as TextAnimType }))}
                >
                  <option value="fade">Fade</option>
                  <option value="pop">Pop</option>
                  <option value="slideUp">Slide Up</option>
                  <option value="slideDown">Slide Down</option>
                  <option value="slideLeft">Slide Left</option>
                  <option value="slideRight">Slide Right</option>
                  <option value="zoom">Zoom</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div className="text-input-group">
                <label>Background Shape</label>
                <select
                  id="textBgShape"
                  value={config.textBgShape}
                  onChange={(e) => setConfig((c) => ({ ...c, textBgShape: e.target.value as TextBgShapeType }))}
                >
                  <option value="rounded">Rounded Box</option>
                  <option value="ribbon">Ribbon Banner</option>
                  <option value="starburst">Starburst Badge</option>
                </select>
              </div>
              <div className="text-input-group">
                <label>Loop Animation</label>
                <select
                  id="textLoopAnim"
                  value={config.textLoopAnim}
                  onChange={(e) => setConfig((c) => ({ ...c, textLoopAnim: e.target.value as TextLoopAnimType }))}
                >
                  <option value="none">None</option>
                  <option value="pulse">Pulse (denyut)</option>
                  <option value="shake">Shake (goncang)</option>
                </select>
                <div className="stock-hint" style={{ marginTop: '4px' }}>
                  Plays continuously while the text is on screen — great for a &quot;Beli Sekarang&quot; call-to-action.
                </div>
              </div>
              <div className="text-input-group">
                <label>Gap Between Texts (seconds)</label>
                <input
                  type="number"
                  id="textGap"
                  value={config.textGap}
                  min="0"
                  max="2"
                  step="0.1"
                  onChange={(e) => setConfig((c) => ({ ...c, textGap: parseFloat(e.target.value) || 0.3 }))}
                />
              </div>
              <button
                className="reset-btn"
                id="clearTextBtn"
                onClick={() => {
                  if (confirm('Clear all texts?')) setConfig((c) => ({ ...c, textOverlays: [] }));
                }}
              >
                <i className="fas fa-trash"></i> Clear All Texts
              </button>
            </div>
            <hr className="divider" />

            {/* Music Section */}
            <h3
              className={`section-toggle ${collapsedSections.musicSection ? 'collapsed' : ''}`}
              onClick={() => toggleSection('musicSection')}
            >
              <span>
                <i className="fas fa-music"></i> Music
              </span>
              <i className="fas fa-chevron-down"></i>
            </h3>
            <div className={`section-content ${collapsedSections.musicSection ? 'collapsed' : ''}`} id="musicSection">
              <div className="music-controls">
                <div className="file-input-wrap">
                  <button id="musicBtn" onClick={() => musicInputRef.current?.click()}>
                    <i className="fas fa-upload"></i> Upload Music
                  </button>
                  <input
                    type="file"
                    id="musicInput"
                    ref={musicInputRef}
                    accept="audio/*"
                    style={{ display: 'none' }}
                    onChange={handleMusicUpload}
                  />
                  {config.musicDataUrl && (
                    <button
                      id="removeMusicBtn"
                      style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}
                      onClick={removeMusic}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#888' }}>Volume</span>
                  <input
                    type="range"
                    id="volumeControl"
                    min="0"
                    max="100"
                    value={Math.round((config.volume ?? 0.8) * 100)}
                    onChange={(e) => setConfig((c) => ({ ...c, volume: parseInt(e.target.value) / 100 }))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '12px', color: '#666' }} id="volumeLabel">
                    {Math.round((config.volume ?? 0.8) * 100)}%
                  </span>
                </div>
                <div
                  id="musicStatus"
                  style={{ fontSize: '12px', color: config.musicDataUrl ? '#4a9eff' : '#555' }}
                >
                  {config.musicName ? `🎵 ${config.musicName}` : 'No music uploaded'}
                </div>
              </div>
            </div>
            <hr className="divider" />

            {/* Watermark Section */}
            <h3
              className={`section-toggle ${collapsedSections.watermarkSection ? 'collapsed' : ''}`}
              onClick={() => toggleSection('watermarkSection')}
            >
              <span>
                <i className="fas fa-stamp"></i> Watermark / Logo
              </span>
              <i className="fas fa-chevron-down"></i>
            </h3>
            <div className={`section-content ${collapsedSections.watermarkSection ? 'collapsed' : ''}`} id="watermarkSection">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#ccc', cursor: 'pointer', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  id="watermarkEnabled"
                  checked={config.watermarkEnabled}
                  onChange={(e) => setConfig((c) => ({ ...c, watermarkEnabled: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#4a9eff' }}
                />
                Show watermark/logo on video
              </label>
              {config.watermarkEnabled && (
                <div id="watermarkControls">
                  <input
                    type="file"
                    id="watermarkImageInput"
                    ref={watermarkImageInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleWatermarkUpload}
                  />
                  <button
                    id="watermarkImageBtn"
                    style={{ width: '100%', padding: '8px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '6px', color: '#ccc', cursor: 'pointer', fontSize: '12px', marginBottom: '6px' }}
                    onClick={() => watermarkImageInputRef.current?.click()}
                  >
                    <i className="fas fa-image"></i> Upload Logo (PNG, transparent)
                  </button>
                  {config.watermarkImageDataUrl && (
                    <div id="watermarkImageName" style={{ fontSize: '11px', color: '#4a9eff', marginBottom: '10px' }}>
                      🖼️ Custom Logo Loaded
                    </div>
                  )}

                  <div className="text-input-group">
                    <label>Position</label>
                    <select
                      id="watermarkPosition"
                      value={config.watermarkPosition}
                      onChange={(e) => setConfig((c) => ({ ...c, watermarkPosition: e.target.value as WatermarkPositionType }))}
                    >
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="top-left">Top Left</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                  <div className="frame-control">
                    <label>Size</label>
                    <input
                      type="range"
                      id="watermarkScale"
                      min="6"
                      max="40"
                      step="1"
                      value={Math.round((config.watermarkScale || 0.18) * 100)}
                      onChange={(e) => setConfig((c) => ({ ...c, watermarkScale: parseInt(e.target.value) / 100 }))}
                    />
                    <span id="watermarkScaleLabel">{Math.round((config.watermarkScale || 0.18) * 100)}%</span>
                  </div>
                  <div className="frame-control">
                    <label>Opacity</label>
                    <input
                      type="range"
                      id="watermarkOpacity"
                      min="10"
                      max="100"
                      step="5"
                      value={Math.round((config.watermarkOpacity ?? 0.8) * 100)}
                      onChange={(e) => setConfig((c) => ({ ...c, watermarkOpacity: parseInt(e.target.value) / 100 }))}
                    />
                    <span id="watermarkOpacityLabel">{Math.round((config.watermarkOpacity ?? 0.8) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
            <hr className="divider" />
          </div>

          {/* TAB 4: EXPORT */}
          <div className={`tab-panel ${activeTab === 'tab-export' ? 'active' : ''}`} id="tab-export">
            {/* Presets Section */}
            <h3
              className={`section-toggle ${collapsedSections.presetSection ? 'collapsed' : ''}`}
              onClick={() => toggleSection('presetSection')}
            >
              <span>
                <i className="fas fa-bookmark"></i> My Presets
              </span>
              <i className="fas fa-chevron-down"></i>
            </h3>
            <div className={`section-content ${collapsedSections.presetSection ? 'collapsed' : ''}`} id="presetSection">
              <div className="stock-hint" style={{ marginTop: 0, marginBottom: '8px' }}>
                Save the current look (frame, transition, text style, background colour) to reuse on future videos. Your images are not included.
              </div>
              <div className="stock-search-row" style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  id="presetNameInput"
                  placeholder="Preset name, e.g. 'Wasza Brand'"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveCurrentPreset();
                  }}
                />
                <button id="savePresetBtn" onClick={saveCurrentPreset}>
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div id="presetList">
                {presets.length === 0 ? (
                  <div className="preset-empty">No presets saved yet.</div>
                ) : (
                  presets.map((p) => (
                    <div key={p.id} className="preset-item">
                      <span className="preset-item-name" title={p.name}>
                        {p.name}
                      </span>
                      <button title="Apply this preset" onClick={() => applyPreset(p)}>
                        <i className="fas fa-check"></i>
                      </button>
                      <button
                        className="preset-delete"
                        title="Delete this preset"
                        onClick={() => {
                          if (confirm(`Delete preset "${p.name}"?`)) deletePreset(p.id);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <hr className="divider" />

            {/* Video Export */}
            <div className="text-input-group">
              <label>Export Format</label>
              <select
                id="exportFormat"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'mp4' | 'webm')}
              >
                <option value="mp4">MP4 (Remotion Server Renderer — Instagram, TikTok, Shorts)</option>
                <option value="webm">WebM (Fast)</option>
              </select>
            </div>
            <button
              className="export-btn"
              id="exportBtn"
              disabled={isExporting}
              onClick={handleExport}
            >
              {isExporting ? (
                <>
                  <span className="loading-spinner"></span> RENDERING REMOTION VIDEO...
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i> EXPORT VIDEO
                </>
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#555' }}>
              <span id="exportStatus">{exportStatusText}</span>
            </div>
          </div>
        </div>

        {/* Bottom Tab Navigation */}
        <div className="tab-nav" id="tabNav">
          <button
            className={activeTab === 'tab-media' ? 'active' : ''}
            data-tab="tab-media"
            onClick={() => setActiveTab('tab-media')}
          >
            <i className="fas fa-images"></i>Media
          </button>
          <button
            className={activeTab === 'tab-style' ? 'active' : ''}
            data-tab="tab-style"
            onClick={() => setActiveTab('tab-style')}
          >
            <i className="fas fa-sliders-h"></i>Style
          </button>
          <button
            className={activeTab === 'tab-text' ? 'active' : ''}
            data-tab="tab-text"
            onClick={() => setActiveTab('tab-text')}
          >
            <i className="fas fa-font"></i>Text
          </button>
          <button
            className={activeTab === 'tab-export' ? 'active' : ''}
            data-tab="tab-export"
            onClick={() => setActiveTab('tab-export')}
          >
            <i className="fas fa-download"></i>Export
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="app-footer" id="appFooter">
        {isEditingFooter ? (
          <input
            type="text"
            value={footerInputValue}
            onChange={(e) => setFooterInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const text = footerInputValue.trim() || 'Made with ❤️ by ReelsMaker';
                setConfig((c) => ({ ...c, footerText: text }));
                localStorage.setItem('footerText', text);
                setIsEditingFooter(false);
                showToast('Footer updated!');
              }
              if (e.key === 'Escape') setIsEditingFooter(false);
            }}
            onBlur={() => setIsEditingFooter(false)}
            autoFocus
            style={{
              background: '#1a1a1a',
              border: '1px solid #4a9eff',
              borderRadius: '4px',
              color: '#e0e0e0',
              padding: '2px 8px',
              fontSize: '11px',
              width: '240px',
            }}
          />
        ) : (
          <span
            className="footer-text"
            id="footerText"
            dangerouslySetInnerHTML={{ __html: config.footerText || 'Made with ❤️ by <a href="#" target="_blank">ReelsMaker</a>' }}
          />
        )}
        <button
          className="footer-edit"
          id="footerEditBtn"
          title="Edit footer text"
          onClick={() => {
            setFooterInputValue(config.footerText || 'Made with ❤️ by ReelsMaker');
            setIsEditingFooter(true);
          }}
        >
          <i className="fas fa-pen"></i>
        </button>
      </div>

      {/* Restore Session Modal */}
      {restorePromptOpen && (
        <div className="tutorial-modal-overlay open" id="restorePromptOverlay">
          <div className="tutorial-modal" style={{ maxWidth: '400px' }}>
            <h2>
              <i className="fas fa-clock-rotate-left"></i> Restore Session?
            </h2>
            <div className="tutorial-sub" id="restorePromptText" style={{ marginBottom: '20px' }}>
              Found a previous session with {restoreSessionData?.images?.length || 0} image(s). Restore it?
            </div>
            <button
              className="tutorial-close-btn"
              id="restoreSessionBtn"
              onClick={() => {
                if (restoreSessionData) {
                  setConfig(restoreSessionData);
                  showToast('Session restored ✅');
                }
                setRestorePromptOpen(false);
              }}
            >
              Restore It
            </button>
            <button
              className="tutorial-close-btn"
              id="discardSessionBtn"
              style={{ background: '#333', marginTop: '8px' }}
              onClick={() => {
                localStorage.removeItem('reelsmaker_autosave_session');
                setRestorePromptOpen(false);
              }}
            >
              Start Fresh Instead
            </button>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {tutorialOpen && (
        <div className="tutorial-modal-overlay open" id="tutorialModalOverlay">
          <div className="tutorial-modal">
            <h2>
              <i className="fas fa-clapperboard"></i> Cara Guna ReelsMaker (Remotion Engine)
            </h2>
            <div className="tutorial-sub">
              Dari gambar/PDF worksheet → video Reels/TikTok siap dirender menggunakan <b>Remotion Video Engine</b>. Ikut 4 tab bawah ni ikut turutan.
            </div>

            <div className="tutorial-flow">
              <span>
                <i className="fas fa-images"></i> 1. Media
              </span>
              <span className="arrow">→</span>
              <span>
                <i className="fas fa-sliders-h"></i> 2. Style
              </span>
              <span className="arrow">→</span>
              <span>
                <i className="fas fa-font"></i> 3. Text
              </span>
              <span className="arrow">→</span>
              <span>
                <i className="fas fa-download"></i> 4. Export
              </span>
            </div>

            <div className="tutorial-step">
              <div className="tutorial-step-num">1</div>
              <div>
                <div className="tutorial-step-title">Preview di atas — Remotion Player Langsung</div>
                <div className="tutorial-step-desc">
                  Kotak video kat atas skrin menggunakan Remotion Player, rendering langsung composition Remotion frame-demi-frame.
                </div>
                <div className="tutorial-icon-row">
                  <i className="fas fa-backward"></i> <b>Restart</b> — ulang video dari mula.
                </div>
                <div className="tutorial-icon-row">
                  <i className="fas fa-play"></i> <b>Play/Pause</b> — main atau jeda preview.
                </div>
                <div className="tutorial-icon-row">
                  <i className="fas fa-stop"></i> <b>Stop</b> — henti terus, balik ke slide pertama.
                </div>
              </div>
            </div>

            <div className="tutorial-group-title">
              <i className="fas fa-images"></i> TAB 1 — MEDIA (mula sini)
            </div>
            <div className="tutorial-step-desc" style={{ marginBottom: '8px' }}>
              Tab ni untuk letak gambar/PDF yang nak jadi video.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-wand-magic-sparkles"></i> <b>Quick Start: Worksheet Promo</b> — template siap terus untuk promo worksheet.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-cloud-upload-alt"></i> <b>Kotak Upload</b> — pilih gambar atau fail <b>PDF</b> — setiap muka surat PDF automatik jadi satu slide.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-grip-vertical"></i> <b>Drag thumbnail</b> — tekan & tarik untuk tukar susunan gambar.
            </div>

            <div className="tutorial-group-title">
              <i className="fas fa-sliders-h"></i> TAB 2 — STYLE (rekabentuk video)
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-expand"></i> <b>Display Mode</b> — Video Size (9:16/1:1/16:9), Padding, Radius, Image Size, Border.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-mobile-alt"></i> <b>Phone Frame</b> — iPhone Notch, Dynamic Island, Android Punch, Minimal Bezel.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-layer-group"></i> <b>Background</b> — Solid colour, gambar sendiri, video sendiri, atau Pexels stock.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-exchange-alt"></i> <b>Transitions</b> — Fade, Slide, Zoom, Flip, Wipe, Circle Reveal, Blur, Spin, Bounce.
            </div>

            <div className="tutorial-group-title">
              <i className="fas fa-font"></i> TAB 3 — TEXT (caption, muzik, logo)
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-font"></i> <b>Text Overlays</b> — tambah caption, drag terus dalam preview Remotion.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-music"></i> <b>Music</b> — upload lagu latar audio Remotion.
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-stamp"></i> <b>Watermark / Logo</b> — letak logo jenama sendiri.
            </div>

            <div className="tutorial-group-title">
              <i className="fas fa-download"></i> TAB 4 — EXPORT (Remotion Server Renderer)
            </div>
            <div className="tutorial-icon-row">
              <i className="fas fa-download"></i> Tekan <b>EXPORT VIDEO</b>. Server Remotion akan render video MP4 berkualiti tinggi dan auto-download ke peranti anda.
            </div>

            <button
              className="tutorial-close-btn"
              id="tutorialCloseBtn"
              onClick={() => setTutorialOpen(false)}
            >
              Faham, jom mula!
            </button>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div id="toastContainer">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
