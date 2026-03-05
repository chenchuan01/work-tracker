import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 获取所有心情记录
router.get('/', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM mood_entries ORDER BY date DESC').all();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 创建心情记录
router.post('/', (req, res) => {
  try {
    const { id, date, mood, content, createdAt } = req.body;
    const stmt = db.prepare(`
      INSERT INTO mood_entries (id, date, mood, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, date, mood, content, createdAt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 删除心情记录
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM mood_entries WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
