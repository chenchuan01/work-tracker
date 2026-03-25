import Database from 'better-sqlite3';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || join(import.meta.dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'work-tracker.db');

const db = new Database(DB_PATH);

// 删除旧的不可用源
db.prepare("DELETE FROM news_sources WHERE id IN ('wallstreetcn', 'cls-telegraph', 'jiqizhixin', 'qbitai', 'cifnews')").run();

// 插入新的可用源（忽略已存在的）
const insert = db.prepare(
  "INSERT OR IGNORE INTO news_sources (id, name, url, category, type) VALUES (?, ?, ?, ?, ?)"
);

const newSources = [
  ['yicai', '第一财经', 'https://www.yicai.com/feed', 'finance', 'rss'],
  ['sspai', '少数派', 'https://sspai.com/feed', 'tech', 'rss'],
  ['ruanyifeng', '阮一峰', 'https://www.ruanyifeng.com/blog/atom.xml', 'tech', 'rss'],
];

for (const s of newSources) {
  insert.run(...s);
}

// 更新现有源的 URL
db.prepare("UPDATE news_sources SET url = 'https://www.huxiu.com/rss/0.xml' WHERE id = 'huxiu'").run();
db.prepare("UPDATE news_sources SET url = 'https://36kr.com/feed' WHERE id = '36kr'").run();

console.log('更新完成！当前新闻源：');
const sources = db.prepare('SELECT id, name, url, category, enabled FROM news_sources').all();
console.table(sources);

db.close();
