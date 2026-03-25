import Database from 'better-sqlite3';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || join(import.meta.dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'work-tracker.db');

const db = new Database(DB_PATH);

// 清空旧的新闻源
db.prepare('DELETE FROM news_sources').run();

// 插入新的新闻源（使用网站首页）
const insert = db.prepare(
  'INSERT INTO news_sources (id, name, url, category, type) VALUES (?, ?, ?, ?, ?)'
);

const sources = [
  ['36kr',        '36氪快讯',     'https://36kr.com/newsflashes',                              'tech',      'html'],
  ['sina-news',   '新浪新闻',     'https://news.sina.com.cn/',                                  'general',   'html'],
  ['163-news',    '网易新闻',     'https://news.163.com/',                                      'general',   'html'],
  ['qq-news',     '腾讯新闻',     'https://news.qq.com/',                                       'general',   'html'],
  ['sina-finance','新浪财经',     'https://finance.sina.com.cn/',                               'finance',   'html'],
  ['hacker-news', 'Hacker News',  'https://hacker-news.firebaseio.com/v0/topstories.json',      'tech',      'hn_api'],
];

for (const s of sources) {
  insert.run(...s);
}

console.log('更新完成！当前新闻源：');
const all = db.prepare('SELECT id, name, url, category, type, enabled FROM news_sources').all();
console.table(all);

db.close();
