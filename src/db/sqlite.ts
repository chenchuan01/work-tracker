/**
 * SQLite 数据库工具类 (已废弃)
 *
 * 注意：此文件已废弃，现在使用服务器端 API
 * 保留此文件仅为了兼容旧代码
 */

type Database = any;

let dbInstance: Database | null = null;

/**
 * 初始化数据库（空实现）
 */
export async function initDB(): Promise<Database> {
  console.warn('sqlite.ts 已废弃，请使用服务器端 API');
  return dbInstance || {};
}

/**
 * 获取数据库实例（空实现）
 */
export async function getDB(): Promise<Database> {
  console.warn('sqlite.ts 已废弃，请使用服务器端 API');
  return dbInstance || {};
}

/**
 * 重置数据库（空实现）
 */
export async function resetDB(): Promise<void> {
  console.warn('sqlite.ts 已废弃，请使用服务器端 API');
}

/**
 * 导出数据库为文件（空实现）
 */
export async function exportDB(_filename = 'work-tracker-backup.db'): Promise<void> {
  console.warn('sqlite.ts 已废弃，请使用服务器端 API');
}

/**
 * 从文件导入数据库（空实现）
 */
export async function importDB(_file: File): Promise<void> {
  console.warn('sqlite.ts 已废弃，请使用服务器端 API');
}

/**
 * 配置存储辅助函数（空实现）
 */
export async function setConfig(_key: string, _value: unknown): Promise<void> {
  console.warn('sqlite.ts 已废弃，请使用服务器端 API');
}

export async function getConfig<T>(_key: string): Promise<T | null> {
  console.warn('sqlite.ts 已废弃，请使用服务器端 API');
  return null;
}
