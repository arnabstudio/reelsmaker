import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { startRenderJob, getJob, getOutputFile } from './server/renderer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

// API: Start video render
app.post('/api/render', async (req: Request, res: Response) => {
  try {
    const { projectConfig } = req.body;
    if (!projectConfig) {
      return res.status(400).json({ error: 'projectConfig is required' });
    }
    const jobId = await startRenderJob(projectConfig);
    return res.json({ success: true, jobId });
  } catch (err: any) {
    console.error('Error starting render:', err);
    return res.status(500).json({ error: err.message || 'Failed to start render' });
  }
});

// API: Check render status
app.get('/api/render-status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.json({ job });
});

// API: Download rendered video
app.get('/api/download/:fileName', (req: Request, res: Response) => {
  const { fileName } = req.params;
  const filePath = getOutputFile(fileName);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  const stream = fs.createReadStream(filePath);
  return stream.pipe(res);
});

// Setup dev server with Vite middlewares or serve static build
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
