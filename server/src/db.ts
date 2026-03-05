import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const DATA_DIR = process.env.DATA_DIR || '/data';
const DB_PATH = join(DATA_DIR, 'work-tracker.db');

// 确保数据目录存在
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据库
export const db: Database.Database = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// 创建表结构
const initTables = () => {
  // todos 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt INTEGER NOT NULL,
      startedAt INTEGER,
      completedAt INTEGER
    )
  `);

  // work_records 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_records (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      workDate TEXT NOT NULL,
      isImportant INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]'
    )
  `);

  // mood_entries 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      mood TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    )
  `);

  // work_summaries 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS work_summaries (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      summaryType TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      sourceRecordIds TEXT DEFAULT '[]'
    )
  `);

  // config 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
    CREATE INDEX IF NOT EXISTS idx_todos_created ON todos(createdAt);
    CREATE INDEX IF NOT EXISTS idx_work_records_date ON work_records(workDate);
    CREATE INDEX IF NOT EXISTS idx_work_records_created ON work_records(createdAt);
    CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries(date);
    CREATE INDEX IF NOT EXISTS idx_mood_entries_created ON mood_entries(createdAt);
    CREATE INDEX IF NOT EXISTS idx_work_summaries_dates ON work_summaries(startDate, endDate);
  `);

  console.log('数据库初始化完成:', DB_PATH);
};

// 初始化表
initTables();

export default db;
