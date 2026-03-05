/**
 * SQLite 新闻存储模块
 * 使用 better-sqlite3 替代原有的 JSON 文件存储
 */

import DatabaseConstructor, { Database } from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import type { NewsItem, StorageOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface QueryOptions {
  sourceId?: string;
  category?: string;
  language?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  search?: string;
}

export class NewsStorage {
  private db!: Database;
  private dataDir!: string;
  private maxItemsPerSource: number;
  private retentionDays: number;

  constructor(options: Partial<StorageOptions> = {}) {
    this.dataDir = options.dataDir || './data';
    this.maxItemsPerSource = options.maxItemsPerSource || 1000;
    this.retentionDays = options.retentionDays || 30;

    this.ensureDataDir();
    this.initDB();
  }

  /**
   * 确保数据目录存在
   */
  private ensureDataDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 初始化数据库
   */
  private initDB(): void {
    const dbPath = path.join(this.dataDir, 'news.db');
    this.db = new DatabaseConstructor(dbPath);

    // 启用 WAL 模式以提高并发性能
    this.db.pragma('journal_mode = WAL');

    // 创建表结构
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS news_items (
        hash TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        description TEXT,
        pubDate INTEGER NOT NULL,
        author TEXT,
        source TEXT,
        sourceId TEXT NOT NULL,
        category TEXT,
        language TEXT DEFAULT 'zh',
        imageUrl TEXT,
        fetchedAt INTEGER NOT NULL
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_news_source ON news_items(sourceId);
      CREATE INDEX IF NOT EXISTS idx_news_category ON news_items(category);
      CREATE INDEX IF NOT EXISTS idx_news_pubDate ON news_items(pubDate DESC);
      CREATE INDEX IF NOT EXISTS idx_news_fetchedAt ON news_items(fetchedAt DESC);
    `);

    logger.info('SQLite database initialized', 'storage');
  }

  /**
   * 检查新闻是否已存在
   */
  exists(hash: string): boolean {
    const stmt = this.db.prepare('SELECT 1 FROM news_items WHERE hash = ?');
    const result = stmt.get(hash);
    return !!result;
  }

  /**
   * 保存单条新闻
   */
  save(item: NewsItem): boolean {
    if (this.exists(item.hash)) {
      return false;
    }

    try {
      const stmt = this.db.prepare(`
        INSERT INTO news_items (
          hash, title, link, description, pubDate, author, source, sourceId,
          category, language, imageUrl, fetchedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        item.hash,
        item.title,
        item.link,
        item.description || null,
        item.pubDate.getTime(),
        item.author || null,
        item.source,
        item.sourceId,
        item.category || null,
        item.language || 'zh',
        item.imageUrl || null,
        item.fetchedAt.getTime()
      );

      return true;
    } catch (error) {
      logger.error('Failed to save news item', 'storage', { hash: item.hash, error });
      return false;
    }
  }

  /**
   * 批量保存新闻
   */
  saveBatch(items: NewsItem[]): { saved: number; skipped: number } {
    let saved = 0;
    let skipped = 0;

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO news_items (
        hash, title, link, description, pubDate, author, source, sourceId,
        category, language, imageUrl, fetchedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((newsItems: NewsItem[]) => {
      for (const item of newsItems) {
        const result = stmt.run(
          item.hash,
          item.title,
          item.link,
          item.description || null,
          item.pubDate.getTime(),
          item.author || null,
          item.source,
          item.sourceId,
          item.category || null,
          item.language || 'zh',
          item.imageUrl || null,
          item.fetchedAt.getTime()
        );
        if (result.changes > 0) {
          saved++;
        } else {
          skipped++;
        }
      }
    });

    insertMany(items);

    return { saved, skipped };
  }

  /**
   * 获取单条新闻
   */
  get(hash: string): NewsItem | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM news_items WHERE hash = ?');
      const row = stmt.get(hash);

      if (!row) return null;

      return this.rowToNewsItem(row as Record<string, unknown>);
    } catch (error) {
      logger.error('Failed to get news item', 'storage', { hash, error });
      return null;
    }
  }

  /**
   * 查询新闻
   */
  query(options: QueryOptions = {}): NewsItem[] {
    const {
      sourceId,
      category,
      language,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      search,
    } = options;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (sourceId) {
      conditions.push('sourceId = ?');
      params.push(sourceId);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (language) {
      conditions.push('language = ?');
      params.push(language);
    }
    if (startDate) {
      conditions.push('pubDate >= ?');
      params.push(startDate.getTime());
    }
    if (endDate) {
      conditions.push('pubDate <= ?');
      params.push(endDate.getTime());
    }
    if (search) {
      conditions.push('title LIKE ?');
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const stmt = this.db.prepare(`
      SELECT * FROM news_items
      ${whereClause}
      ORDER BY pubDate DESC
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(...params, limit, offset) as unknown[];

    return rows.map(row => this.rowToNewsItem(row as Record<string, unknown>));
  }

  /**
   * 获取按来源分组的统计信息
   */
  getStats(): { total: number; bySource: Record<string, number>; byCategory: Record<string, number> } {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM news_items');
    const totalResult = totalStmt.get() as { count: number };

    const bySourceStmt = this.db.prepare(`
      SELECT sourceId, COUNT(*) as count
      FROM news_items
      GROUP BY sourceId
    `);
    const bySourceRows = bySourceStmt.all() as { sourceId: string; count: number }[];

    const byCategoryStmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM news_items
      WHERE category IS NOT NULL
      GROUP BY category
    `);
    const byCategoryRows = byCategoryStmt.all() as { category: string; count: number }[];

    const bySource: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const row of bySourceRows) {
      bySource[row.sourceId] = row.count;
    }

    for (const row of byCategoryRows) {
      byCategory[row.category] = row.count;
    }

    return {
      total: totalResult.count,
      bySource,
      byCategory,
    };
  }

  /**
   * 获取今日新增数量
   */
  getTodayCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM news_items WHERE fetchedAt >= ?');
    const result = stmt.get(todayStart) as { count: number };
    return result.count;
  }

  /**
   * 清理旧数据
   */
  cleanup(): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    const cutoffTime = cutoff.getTime();

    const stmt = this.db.prepare('DELETE FROM news_items WHERE fetchedAt < ?');
    const result = stmt.run(cutoffTime);

    if (result.changes > 0) {
      logger.info('Cleanup completed', 'storage', { deleted: result.changes });
    }

    return result.changes;
  }

  /**
   * 导出新闻为 JSON
   */
  export(options: QueryOptions = {}): string {
    const items = this.query(options);
    return JSON.stringify(items, null, 2);
  }

  /**
   * 导出为 CSV
   */
  exportCSV(options: QueryOptions = {}): string {
    const items = this.query(options);

    const headers = ['hash', 'title', 'link', 'description', 'pubDate', 'author', 'source', 'category', 'language'];
    const lines = [headers.join(',')];

    for (const item of items) {
      const row = headers.map((h) => {
        const value = (item as unknown as Record<string, unknown>)[h];
        const str = value instanceof Date ? value.toISOString() : String(value || '');
        // CSV 转义
        return `"${str.replace(/"/g, '""')}"`;
      });
      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.db.close();
  }

  /**
   * 将数据库行转换为 NewsItem
   */
  private rowToNewsItem(row: Record<string, unknown>): NewsItem {
    return {
      hash: row.hash as string,
      title: row.title as string,
      link: row.link as string,
      description: (row.description as string) || '',
      pubDate: new Date(row.pubDate as number),
      author: row.author as string | undefined,
      source: row.source as string,
      sourceId: row.sourceId as string,
      category: (row.category as string) || '',
      language: (row.language as string) || 'zh',
      imageUrl: row.imageUrl as string | undefined,
      fetchedAt: new Date(row.fetchedAt as number),
      id: row.hash as string,
      content: undefined,
      tags: undefined,
    };
  }

  /**
   * 从旧版 JSON 存储迁移数据
   */
  migrateFromJSONStorage(): { migrated: number } {
    const itemsDir = path.join(this.dataDir, 'items');
    const indexPath = path.join(this.dataDir, 'index', 'items.json');

    if (!fs.existsSync(indexPath)) {
      logger.info('No old JSON storage found', 'storage');
      return { migrated: 0 };
    }

    try {
      const indexData = fs.readFileSync(indexPath, 'utf-8');
      const hashes = JSON.parse(indexData) as string[];

      let migrated = 0;

      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO news_items (
          hash, title, link, description, pubDate, author, source, sourceId,
          category, language, imageUrl, fetchedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = this.db.transaction((items: NewsItem[]) => {
        for (const item of items) {
          const result = stmt.run(
            item.hash,
            item.title,
            item.link,
            item.description || null,
            item.pubDate.getTime(),
            item.author || null,
            item.source,
            item.sourceId,
            item.category || null,
            item.language || 'zh',
            item.imageUrl || null,
            item.fetchedAt.getTime()
          );
          if (result.changes > 0) {
            migrated++;
          }
        }
      });

      const itemsToMigrate: NewsItem[] = [];

      for (const hash of hashes) {
        const itemPath = this.getItemPath(hash, itemsDir);
        if (fs.existsSync(itemPath)) {
          const data = fs.readFileSync(itemPath, 'utf-8');
          const item = JSON.parse(data) as NewsItem;
          itemsToMigrate.push(item);
        }
      }

      if (itemsToMigrate.length > 0) {
        insertMany(itemsToMigrate);
      }

      logger.info('Migration completed', 'storage', { migrated });

      return { migrated };
    } catch (error) {
      logger.error('Migration failed', 'storage', error);
      return { migrated: 0 };
    }
  }

  /**
   * 获取新闻项的文件路径（用于迁移）
   */
  private getItemPath(hash: string, itemsDir: string): string {
    const subdir = hash.substring(0, 2);
    return path.join(itemsDir, subdir, `${hash}.json`);
  }
}

export const storage = new NewsStorage();
