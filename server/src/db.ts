import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const DB_PATH = join(DATA_DIR, 'work-tracker.db');

// 确保数据目录存在
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// 初始化数据库
export const db: Database.Database = new Database(DB_PATH);
// 使用 DELETE 模式代替 WAL，在某些文件系统上更兼容
db.pragma('journal_mode = DELETE');

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

  // news_items 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      summary TEXT DEFAULT '',
      source TEXT NOT NULL,
      category TEXT NOT NULL,
      published_at INTEGER NOT NULL,
      fetched_at INTEGER NOT NULL,
      ai_score INTEGER DEFAULT 0,
      ai_recommended INTEGER DEFAULT 0,
      ai_reason TEXT DEFAULT ''
    )
  `);

  // news_sources 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'rss',
      enabled INTEGER NOT NULL DEFAULT 1
    )
  `);

  // 预置默认数据源
  const existingSources = db.prepare('SELECT COUNT(*) as count FROM news_sources').get() as { count: number };
  if (existingSources.count === 0) {
    const insertSource = db.prepare(
      'INSERT INTO news_sources (id, name, url, category, type) VALUES (?, ?, ?, ?, ?)'
    );
    const sources = [
      ['yicai',          '第一财经',    'https://www.yicai.com/feed',                          'finance',   'rss'],
      ['36kr',           '36氪',        'https://36kr.com/feed',                               'tech',      'rss'],
      ['huxiu',          '虎嗅',        'https://www.huxiu.com/rss/0.xml',                     'tech',      'rss'],
      ['sspai',          '少数派',      'https://sspai.com/feed',                              'tech',      'rss'],
      ['ruanyifeng',     '阮一峰',      'https://www.ruanyifeng.com/blog/atom.xml',            'tech',      'rss'],
      ['hacker-news',    'Hacker News', 'https://hacker-news.firebaseio.com/v0/topstories.json', 'tech',   'hn_api'],
    ];
    for (const s of sources) {
      insertSource.run(...s);
    }
  }

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
    CREATE INDEX IF NOT EXISTS idx_todos_created ON todos(createdAt);
    CREATE INDEX IF NOT EXISTS idx_work_records_date ON work_records(workDate);
    CREATE INDEX IF NOT EXISTS idx_work_records_created ON work_records(createdAt);
    CREATE INDEX IF NOT EXISTS idx_mood_entries_date ON mood_entries(date);
    CREATE INDEX IF NOT EXISTS idx_mood_entries_created ON mood_entries(createdAt);
    CREATE INDEX IF NOT EXISTS idx_work_summaries_dates ON work_summaries(startDate, endDate);
    CREATE INDEX IF NOT EXISTS idx_news_category ON news_items(category);
    CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_news_score ON news_items(ai_score DESC);
  `);

  console.log('数据库初始化完成:', DB_PATH);
};

// 初始化表
initTables();

export default db;
