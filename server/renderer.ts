import path from 'path';
import fs from 'fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition, ensureBrowser } from '@remotion/renderer';
import { ProjectConfig } from '../src/remotion/types';

export interface RenderJob {
  id: string;
  status: 'pending' | 'rendering' | 'done' | 'error';
  progress: number;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
  startedAt: number;
}

const jobs = new Map<string, RenderJob>();
const OUTPUT_DIR = path.resolve(process.cwd(), 'renders');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let cachedBundleUrl: string | null = null;
let bundlingPromise: Promise<string> | null = null;

async function getOrBuildBundle(): Promise<string> {
  if (cachedBundleUrl) {
    return cachedBundleUrl;
  }
  if (bundlingPromise) {
    return bundlingPromise;
  }

  bundlingPromise = (async () => {
    console.log('[Remotion Renderer] Bundling Remotion composition...');
    const entryPoint = path.resolve(process.cwd(), 'src/remotion/index.ts');
    const bundleLocation = await bundle({
      entryPoint,
      onProgress: (p) => {
        if (p % 25 === 0) console.log(`[Remotion Bundler] Progress: ${p}%`);
      },
    });
    cachedBundleUrl = bundleLocation;
    console.log('[Remotion Renderer] Composition bundled at:', bundleLocation);
    return bundleLocation;
  })();

  return bundlingPromise;
}

export function getJob(id: string): RenderJob | undefined {
  return jobs.get(id);
}

export function getOutputFile(fileName: string): string | null {
  const filePath = path.join(OUTPUT_DIR, fileName);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}

export async function startRenderJob(projectConfig: ProjectConfig): Promise<string> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const fileName = `reels-${Date.now()}.mp4`;
  const outputPath = path.join(OUTPUT_DIR, fileName);

  const job: RenderJob = {
    id: jobId,
    status: 'pending',
    progress: 0,
    fileName,
    startedAt: Date.now(),
  };

  jobs.set(jobId, job);

  // Run rendering in background
  (async () => {
    try {
      console.log(`[Job ${jobId}] Starting Remotion render...`);
      job.status = 'rendering';
      job.progress = 5;

      // Ensure headless browser is ready
      await ensureBrowser();

      job.progress = 10;
      const bundleLocation = await getOrBuildBundle();

      job.progress = 20;
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'SlideshowVideo',
        inputProps: { projectConfig },
      });

      console.log(`[Job ${jobId}] Composition selected: ${composition.width}x${composition.height}, ${composition.durationInFrames} frames`);

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: { projectConfig },
        onProgress: ({ progress }) => {
          const pct = Math.min(99, Math.round(20 + progress * 79));
          job.progress = pct;
        },
      });

      job.status = 'done';
      job.progress = 100;
      job.downloadUrl = `/api/download/${fileName}`;
      console.log(`[Job ${jobId}] Render complete: ${outputPath}`);
    } catch (err: any) {
      console.error(`[Job ${jobId}] Rendering failed:`, err);
      job.status = 'error';
      job.error = err.message || 'Unknown render error';
    }
  })();

  return jobId;
}
