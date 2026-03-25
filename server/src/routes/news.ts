import { Router } from 'express';
import { db } from '../db.js';
import { runFetchAndScore } from '../services/newsScheduler.js';
import { NewsPreferences } from '../services/newsScorer.js';

const router = Router();

// GET /api/news?category=&limit=&minScore=
router.get('/', (req, res) => {
  const category = req.query.category as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  const minScore = parseInt(req.query.minScore as string) || 0;

  let sql = 'SELECT * FROM news_items WHERE ai_score >= ?';
  const params: unknown[] = [minScore];

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY ai_recommended DESC, ai_score DESC, published_at DESC LIMIT ?';
  params.push(limit);

  const items = db.prepare(sql).all(...params);
  res.json(items.map(row => toNewsItem(row as any)));
});

// POST /api/news/refresh
router.post('/refresh', async (_req, res) => {
  try {
    const count = await runFetchAndScore();
    res.json({ success: true, count });
  } catch (err) {
    console.error('[news/refresh]', err);
    res.status(500).json({ error: '刷新失败' });
  }
});

// GET /api/news/preferences
router.get('/preferences', (req, res) => {
  const row = db.prepare("SELECT value FROM config WHERE key = 'news_preferences'").get() as
    | { value: string }
    | undefined;
  if (!row) {
    return res.json({ keywords: [], excludeKeywords: [] });
  }
  try {
    res.json(JSON.parse(row.value));
  } catch {
    res.json({ keywords: [], excludeKeywords: [] });
  }
});

// POST /api/news/preferences
router.post('/preferences', (req, res) => {
  const prefs: NewsPreferences = req.body;
  const now = Date.now();
  db.prepare(`
    INSERT INTO config (key, value, updatedAt) VALUES ('news_preferences', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt
  `).run(JSON.stringify(prefs), now);
  res.json({ success: true });
});

// GET /api/news/sources
router.get('/sources', (_req, res) => {
  const sources = db.prepare('SELECT * FROM news_sources').all();
  res.json(sources);
});

// PUT /api/news/sources/:id
router.put('/sources/:id', (req, res) => {
  const { enabled } = req.body as { enabled: boolean };
  db.prepare('UPDATE news_sources SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, req.params.id);
  res.json({ success: true });
});

function toNewsItem(row: {
  id: string; title: string; url: string; summary: string;
  source: string; category: string; published_at: number;
  ai_score: number; ai_recommended: number; ai_reason: string;
}) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    summary: row.summary,
    source: row.source,
    category: row.category,
    publishedAt: new Date(row.published_at).toISOString(),
    aiScore: row.ai_score,
    aiRecommended: row.ai_recommended === 1,
    aiReason: row.ai_reason,
  };
}

export default router;
