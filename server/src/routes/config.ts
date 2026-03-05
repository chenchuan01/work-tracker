import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 获取配置
router.get('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const result = db.prepare('SELECT value FROM config WHERE key = ?').get(key) as { value: string } | undefined;
    if (result) {
      res.json({ value: JSON.parse(result.value) });
    } else {
      res.json({ value: null });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 设置配置
router.post('/:key', (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updatedAt = Date.now();

    const stmt = db.prepare(`
      INSERT INTO config (key, value, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = ?
    `);
    stmt.run(key, JSON.stringify(value), updatedAt, JSON.stringify(value), updatedAt);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
