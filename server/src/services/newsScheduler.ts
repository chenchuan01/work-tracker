import { db } from '../db.js';
import { fetchAllSources, NewsSource } from './newsParser.js';
import { scoreNewsBatch, AiConfig, NewsPreferences } from './newsScorer.js';

const INTERVAL_MS = 30 * 60 * 1000; // 30分钟

function getSources(): NewsSource[] {
  return db.prepare('SELECT * FROM news_sources').all() as NewsSource[];
}

function getAiConfig(): AiConfig {
  const row = db.prepare("SELECT value FROM config WHERE key = 'model_config'").get() as
    | { value: string }
    | undefined;
  if (!row) return {};
  try {
    return JSON.parse(row.value) as AiConfig;
  } catch {
    return {};
  }
}

function getPreferences(): NewsPreferences {
  const row = db.prepare("SELECT value FROM config WHERE key = 'news_preferences'").get() as
    | { value: string }
    | undefined;
  if (!row) return { keywords: [], excludeKeywords: [] };
  try {
    return JSON.parse(row.value) as NewsPreferences;
  } catch {
    return { keywords: [], excludeKeywords: [] };
  }
}

const upsertItem = db.prepare(`
  INSERT INTO news_items (id, title, url, summary, source, category, published_at, fetched_at, ai_score, ai_recommended, ai_reason)
  VALUES (@id, @title, @url, @summary, @source, @category, @publishedAt, @fetchedAt, 0, 0, '')
  ON CONFLICT(id) DO NOTHING
`);

const updateScore = db.prepare(`
  UPDATE news_items SET ai_score = @score, ai_recommended = @recommended, ai_reason = @reason
  WHERE id = @id
`);

export async function runFetchAndScore(): Promise<number> {
  const sources = getSources();
  const items = await fetchAllSources(sources);
  if (items.length === 0) {
    console.log('[newsScheduler] 未抓取到新闻');
    return 0;
  }

  const now = Date.now();
  const insertMany = db.transaction(() => {
    for (const n of items) {
      upsertItem.run({ ...n, fetchedAt: now });
    }
  });
  insertMany();
  console.log(`[newsScheduler] 存入 ${items.length} 条新闻`);

  // AI打分：只对未打分的新闻打分
  const unscored = items.filter(n => {
    const row = db.prepare('SELECT ai_score FROM news_items WHERE id = ?').get(n.id) as
      | { ai_score: number }
      | undefined;
    return !row || row.ai_score === 0;
  });

  if (unscored.length > 0) {
    const config = getAiConfig();
    const prefs = getPreferences();
    const scores = await scoreNewsBatch(unscored, prefs, config);
    const updateMany = db.transaction(() => {
      for (const s of scores) {
        updateScore.run({ id: s.id, score: s.score, recommended: s.recommended ? 1 : 0, reason: s.reason });
      }
    });
    updateMany();
    console.log(`[newsScheduler] AI打分完成 ${scores.length} 条`);
  }

  // 清理30天前的旧数据
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  db.prepare('DELETE FROM news_items WHERE fetched_at < ?').run(cutoff);

  return items.length;
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startNewsScheduler(): void {
  console.log('[newsScheduler] 启动，立即执行首次抓取...');
  runFetchAndScore().catch(err => console.error('[newsScheduler] 首次抓取失败:', err));
  timer = setInterval(() => {
    runFetchAndScore().catch(err => console.error('[newsScheduler] 定时抓取失败:', err));
  }, INTERVAL_MS);
}

export function stopNewsScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
