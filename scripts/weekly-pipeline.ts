import { runCrawlTrends } from '../scripts/crawl-trends.js';
import { runGenerateDrafts } from '../scripts/generate-drafts.js';
import { runToImage } from '../scripts/to-image.js';

async function main() {
  console.log('[weekly] Starting pipeline...');
  const trends = await runCrawlTrends();
  console.log(`[weekly] Trends: ${trends.length}`);
  const drafts = await runGenerateDrafts();
  console.log(`[weekly] Drafts: ${drafts.generated}`);
  const images = await runToImage();
  console.log(`[weekly] Images: ${images.generated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
