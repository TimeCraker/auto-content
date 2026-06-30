import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as fs from 'fs/promises';
import path from 'path';
import { OUTPUT_DIR, todayStr } from '../scripts/lib/paths.js';
import { runCrawlTrends } from '../scripts/crawl-trends.js';
import { runGenerateDrafts } from '../scripts/generate-drafts.js';
import { runToImage } from '../scripts/to-image.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/trends', async (_req, res) => {
  try {
    const file = path.join(OUTPUT_DIR, `trends-${todayStr()}.json`);
    const data = await fs.readFile(file, 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.json([]);
  }
});

app.post('/api/crawl', async (_req, res) => {
  try {
    const trends = await runCrawlTrends();
    res.json({ count: trends.length, trends });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'crawl failed' });
  }
});

app.get('/api/drafts', async (_req, res) => {
  try {
    const dir = path.join(OUTPUT_DIR, `drafts-${todayStr()}`);
    const files = await fs.readdir(dir);
    const drafts = await Promise.all(
      files.filter((f) => f.endsWith('.md')).map(async (f) => ({
        name: f,
        content: await fs.readFile(path.join(dir, f), 'utf-8'),
      }))
    );
    res.json(drafts);
  } catch {
    res.json([]);
  }
});

app.post('/api/generate', async (_req, res) => {
  try {
    const result = await runGenerateDrafts();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'generate failed' });
  }
});

app.get('/api/images', async (_req, res) => {
  try {
    const dir = path.join(OUTPUT_DIR, `images-${todayStr()}`);
    const files = await fs.readdir(dir);
    res.json(files.filter((f) => f.endsWith('.png')));
  } catch {
    res.json([]);
  }
});

app.get('/api/images/file/:name', async (req, res) => {
  try {
    const dir = path.join(OUTPUT_DIR, `images-${todayStr()}`);
    const filePath = path.join(dir, path.basename(req.params.name));
    res.sendFile(filePath);
  } catch {
    res.status(404).end();
  }
});

app.post('/api/images', async (_req, res) => {
  try {
    const result = await runToImage();
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'image failed' });
  }
});

app.post('/api/weekly', async (_req, res) => {
  try {
    const trends = await runCrawlTrends();
    const drafts = await runGenerateDrafts();
    const images = await runToImage();
    res.json({ trends: trends.length, drafts: drafts.generated, images: images.generated });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'pipeline failed' });
  }
});

const port = Number(process.env.PORT) || 3101;
app.listen(port, () => console.log(`[auto-content] API http://127.0.0.1:${port}`));
