import * as fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';
import { OUTPUT_DIR, todayStr } from './lib/paths.js';

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: { title: '' }, body: content };
  const metaStr = match[1];
  const body = match[2];
  return {
    meta: { title: metaStr.match(/title:\s*"(.+?)"/)?.[1] || '' },
    body,
  };
}

function generateCoverHTML(title: string, body: string): string {
  const shortBody = body.slice(0, 200).replace(/\n/g, '<br>');
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1440px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    color: white; display: flex; flex-direction: column;
    justify-content: center; align-items: center; padding: 80px;
  }
  .title { font-size: 48px; font-weight: bold; text-align: center; margin-bottom: 40px; line-height: 1.4; }
  .body { font-size: 24px; text-align: center; opacity: 0.9; line-height: 1.6; }
  .footer { position: absolute; bottom: 60px; font-size: 18px; opacity: 0.7; }
</style></head><body>
  <div class="title">${title}</div>
  <div class="body">${shortBody}...</div>
  <div class="footer">ResumeAIX · AI 简历优化平台</div>
</body></html>`;
}

export async function runToImage(): Promise<{ generated: number; imagesDir: string }> {
  const draftsDir = path.join(OUTPUT_DIR, `drafts-${todayStr()}`);
  const imagesDir = path.join(OUTPUT_DIR, `images-${todayStr()}`);
  await fs.access(draftsDir);
  await fs.mkdir(imagesDir, { recursive: true });

  const files = await fs.readdir(draftsDir);
  const xhsFiles = files.filter((f) => f.startsWith('xiaohongshu-') && f.endsWith('.md'));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let generated = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1440 });

    for (const file of xhsFiles) {
      const content = await fs.readFile(path.join(draftsDir, file), 'utf-8');
      const { meta, body } = parseFrontmatter(content);
      const html = generateCoverHTML(meta.title, body);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pngPath = path.join(imagesDir, file.replace('.md', '.png'));
      await page.screenshot({ path: pngPath, fullPage: false });
      generated++;
    }
  } finally {
    await browser.close();
  }

  return { generated, imagesDir };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  runToImage().then((r) => console.log(`Generated ${r.generated} PNGs`)).catch(console.error);
}
