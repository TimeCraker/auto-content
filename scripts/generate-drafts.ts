import * as fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { OUTPUT_DIR, TEMPLATES_DIR, todayStr } from './lib/paths.js';
import type { TrendKeyword } from './crawl-trends.js';

interface DraftMeta {
  title: string;
  platform: string;
  keyword: string;
  generatedAt: string;
  status: string;
}

async function loadTemplate(platform: string): Promise<string> {
  return fs.readFile(path.join(TEMPLATES_DIR, `${platform}-prompt.md`), 'utf-8');
}

async function loadTrends(): Promise<TrendKeyword[]> {
  const file = path.join(OUTPUT_DIR, `trends-${todayStr()}.json`);
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8'));
  } catch {
    const seedFile = path.join(path.dirname(TEMPLATES_DIR), 'input', 'keywords-seed.json');
    const data = JSON.parse(await fs.readFile(seedFile, 'utf-8'));
    return data.keywords.map((k: string) => ({ keyword: k, score: 50, source: 'seed' }));
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

async function generateDraft(openai: OpenAI, keyword: string, platform: string) {
  const template = await loadTemplate(platform);
  const prompt = template.replace('{keyword}', keyword);
  const response = await openai.chat.completions.create({
    model: process.env.AI_MODEL || 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2048,
    temperature: 0.7,
  });
  const content = response.choices[0]?.message?.content || '';
  const lines = content.split('\n').filter((l) => l.trim());
  const title = lines[0]?.replace(/^[#\s]*/, '').slice(0, 50) || keyword;
  return {
    content,
    meta: { title, platform, keyword, generatedAt: new Date().toISOString(), status: 'draft' },
  };
}

export async function runGenerateDrafts(): Promise<{ generated: number; outputDir: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY or OPENAI_API_KEY required');

  const openai = new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  });

  const trends = await loadTrends();
  const platforms = ['xiaohongshu', 'zhihu', 'xianyu'];
  const outputDir = path.join(OUTPUT_DIR, `drafts-${todayStr()}`);
  await fs.mkdir(outputDir, { recursive: true });

  let generated = 0;
  for (const trend of trends.slice(0, 5)) {
    for (const platform of platforms) {
      const { content, meta } = await generateDraft(openai, trend.keyword, platform);
      const frontmatter = `---
title: "${meta.title.replace(/"/g, '\\"')}"
platform: ${meta.platform}
keyword: "${meta.keyword.replace(/"/g, '\\"')}"
generatedAt: ${meta.generatedAt}
status: ${meta.status}
---

${content}`;
      await fs.writeFile(path.join(outputDir, `${platform}-${slugify(trend.keyword)}.md`), frontmatter);
      generated++;
    }
  }
  return { generated, outputDir };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  runGenerateDrafts().then((r) => console.log(`Generated ${r.generated} drafts`)).catch(console.error);
}
