import * as fs from 'fs/promises';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { INPUT_DIR, OUTPUT_DIR, todayStr } from './lib/paths.js';

export interface TrendKeyword {
  keyword: string;
  score: number;
  source: string;
}

async function loadSeedKeywords(): Promise<string[]> {
  const data = JSON.parse(await fs.readFile(`${INPUT_DIR}/keywords-seed.json`, 'utf-8'));
  return data.keywords as string[];
}

async function crawlBaiduHot(): Promise<TrendKeyword[]> {
  try {
    const response = await axios.get('https://top.baidu.com/board?tab=realtime', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);
    const keywords: TrendKeyword[] = [];
    $('[class*="title"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && text.length < 30) {
        keywords.push({ keyword: text, score: 100 - i * 2, source: 'baidu' });
      }
    });
    return keywords.slice(0, 20);
  } catch {
    return [];
  }
}

async function crawlZhihuHot(): Promise<TrendKeyword[]> {
  try {
    const response = await axios.get('https://www.zhihu.com/hot', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);
    const keywords: TrendKeyword[] = [];
    $('[class*="HotItem-title"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text) keywords.push({ keyword: text, score: 100 - i * 3, source: 'zhihu' });
    });
    return keywords.slice(0, 20);
  } catch {
    return [];
  }
}

function filterJobRelated(keywords: TrendKeyword[], seedKeywords: string[]): TrendKeyword[] {
  const jobRelatedTerms = [
    '简历', '面试', '求职', '招聘', '职场', 'offer', '薪资', '跳槽',
    '程序员', '开发', '产品', '设计', '运营', '前端', '后端', '算法',
    '秋招', '春招', '实习', '应届', '转行', '培训', '八股',
  ];
  const filtered = keywords.filter((k) =>
    jobRelatedTerms.some((term) => k.keyword.toLowerCase().includes(term))
  );
  if (filtered.length < 10) {
    filtered.push(...seedKeywords.map((keyword) => ({ keyword, score: 50, source: 'seed' })));
  }
  const seen = new Set<string>();
  return filtered.filter((k) => {
    if (seen.has(k.keyword)) return false;
    seen.add(k.keyword);
    return true;
  });
}

export async function runCrawlTrends(): Promise<TrendKeyword[]> {
  const seedKeywords = await loadSeedKeywords();
  const [baiduResults, zhihuResults] = await Promise.all([crawlBaiduHot(), crawlZhihuHot()]);
  const topKeywords = filterJobRelated([...baiduResults, ...zhihuResults], seedKeywords)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outputFile = `${OUTPUT_DIR}/trends-${todayStr()}.json`;
  await fs.writeFile(outputFile, JSON.stringify(topKeywords, null, 2));
  return topKeywords;
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  runCrawlTrends()
    .then((k) => console.log(`Saved ${k.length} keywords`))
    .catch(console.error);
}
