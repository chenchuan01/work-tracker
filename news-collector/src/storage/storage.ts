/**
 * 数据存储模块
 * 使用 SQLite 数据库存储（通过 better-sqlite3）
 */

export { NewsStorage, storage } from './sqlite-storage.js';
export type { QueryOptions } from './sqlite-storage.js';
