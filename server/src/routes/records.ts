import { Router } from 'express';
import db from '../db.js';

const router = Router();

// 获取所有工作记录
router.get('/', (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM work_records ORDER BY workDate DESC, createdAt DESC').all();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 创建工作记录
router.post('/', (req, res) => {
  try {
    const { id, content, createdAt, updatedAt, workDate, isImportant, tags } = req.body;
    const stmt = db.prepare(`
      INSERT INTO work_records (id, content, createdAt, updatedAt, workDate, isImportant, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      content,
      createdAt,
      updatedAt,
      workDate,
      isImportant ? 1 : 0,
      JSON.stringify(tags || [])
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 更新工作记录
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { content, isImportant, tags } = req.body;
    const updatedAt = Date.now();

    const updates: string[] = ['updatedAt = ?'];
    const values: any[] = [updatedAt];

    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (isImportant !== undefined) {
      updates.push('isImportant = ?');
      values.push(isImportant ? 1 : 0);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }

    values.push(id);
    const stmt = db.prepare(`UPDATE work_records SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 删除工作记录
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM work_records WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
