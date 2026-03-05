import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 获取所有待办
router.get('/', (req, res) => {
  try {
    const todos = db.prepare('SELECT * FROM todos ORDER BY createdAt DESC').all();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 创建待办
router.post('/', (req, res) => {
  try {
    const { id, content, status, createdAt } = req.body;
    const stmt = db.prepare(`
      INSERT INTO todos (id, content, status, createdAt)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, content, status || 'pending', createdAt);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 更新待办
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, startedAt, completedAt } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (startedAt !== undefined) {
      updates.push('startedAt = ?');
      values.push(startedAt);
    }
    if (completedAt !== undefined) {
      updates.push('completedAt = ?');
      values.push(completedAt);
    }

    if (updates.length > 0) {
      values.push(id);
      const stmt = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 删除待办
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM todos WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
