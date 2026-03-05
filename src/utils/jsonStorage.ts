/**
 * JSON 文件存储工具
 * 
 * 由于浏览器安全限制，此模块设计用于以下场景：
 * 1. 在 Node.js 环境中运行（如 Electron、Tauri 等桌面应用）
 * 2. 配合 Vite 插件使用
 * 3. 使用 IndexedDB 作为浏览器环境的替代方案
 * 
 * 当前实现：使用 IndexedDB 存储 JSON 数据，保持与 localStorage 相同的 API
 */

// IndexedDB 数据库
const DB_NAME = 'WorkTrackerJSONStorage';
const DB_VERSION = 1;
const STORE_NAME = 'jsonData';

// 缓存已加载的数据
const cache: Record<string, unknown> = {};
let dbPromise: Promise<IDBDatabase> | null = null;

// 打开数据库连接
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

// 从 IndexedDB 加载数据到缓存
async function loadFromDB(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = async () => {
      const keys = request.result as string[];
      if (Array.isArray(keys)) {
        // 获取所有键值对
        for (const key of keys) {
          const value = await new Promise((res, rej) => {
            const getReq = store.get(key);
            getReq.onsuccess = () => res(getReq.result);
            getReq.onerror = () => rej(getReq.error);
          });
          cache[key] = value;
        }
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// 保存单个数据到 IndexedDB
async function saveToDB(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 从 IndexedDB 删除数据
async function deleteFromDB(key: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 清空所有数据
async function clearDB(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 初始化加载所有数据
let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    await loadFromDB();
    initialized = true;
  }
}

/**
 * JSON 存储类 - 提供与 localStorage 兼容的 API
 */
export class JSONStorage {
  /**
   * 获取数据
   */
  async getItem<T>(key: string): Promise<T | null> {
    await ensureInitialized();
    const value = cache[key];
    return value !== undefined ? (value as T) : null;
  }

  /**
   * 设置数据
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    await ensureInitialized();
    cache[key] = value;
    await saveToDB(key, value);
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    await ensureInitialized();
    delete cache[key];
    await deleteFromDB(key);
  }

  /**
   * 清空所有数据
   */
  async clear(): Promise<void> {
    Object.keys(cache).forEach(key => delete cache[key]);
    await clearDB();
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    await ensureInitialized();
    return Object.keys(cache);
  }

  /**
   * 导出所有数据为 JSON 对象
   */
  async exportAll(): Promise<Record<string, unknown>> {
    await ensureInitialized();
    return { ...cache };
  }

  /**
   * 从 JSON 对象导入数据
   */
  async importAll(data: Record<string, unknown>): Promise<void> {
    await ensureInitialized();
    for (const [key, value] of Object.entries(data)) {
      cache[key] = value;
      await saveToDB(key, value);
    }
  }

  /**
   * 导出所有数据为 JSON 字符串（用于下载）
   */
  async exportJSON(): Promise<string> {
    const data = await this.exportAll();
    return JSON.stringify(data, null, 2);
  }

  /**
   * 从 JSON 字符串导入数据
   */
  async importJSON(jsonString: string): Promise<void> {
    try {
      const data = JSON.parse(jsonString) as Record<string, unknown>;
      await this.importAll(data);
    } catch (error) {
      throw new Error('无效的 JSON 格式');
    }
  }

  /**
   * 下载数据到文件（浏览器环境）
   */
  async download(filename = 'work-tracker-data.json'): Promise<void> {
    const json = await this.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 从文件上传导入数据（浏览器环境）
   */
  async upload(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const json = e.target?.result as string;
          await this.importJSON(json);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// 创建单例实例
export const jsonStorage = new JSONStorage();

/**
 * 迁移 localStorage 数据到 JSON 存储
 */
export async function migrateFromLocalStorage(): Promise<{
  migrated: number;
  keys: string[];
}> {
  const keys = Object.keys(localStorage);
  const migrated: string[] = [];

  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        // 尝试解析为 JSON
        try {
          const parsed = JSON.parse(value);
          await jsonStorage.setItem(key, parsed);
          migrated.push(key);
        } catch {
          // 非 JSON 数据，直接存储
          await jsonStorage.setItem(key, value);
          migrated.push(key);
        }
      }
    } catch (error) {
      console.error(`迁移失败 ${key}:`, error);
    }
  }

  return {
    migrated: migrated.length,
    keys: migrated,
  };
}

/**
 * 从旧版本 IndexedDB 迁移数据
 * 旧版本使用单独的 DB 名称和不同的存储结构
 */
export async function migrateFromOldIndexedDB(): Promise<{
  migrated: number;
  keys: string[];
}> {
  const OLD_DB_NAME = 'WorkTrackerStorage';
  const OLD_STORE_NAME = 'jsonStorage';
  const migrated: string[] = [];

  return new Promise((resolve) => {
    const request = indexedDB.open(OLD_DB_NAME);

    request.onerror = () => {
      console.log('旧版 IndexedDB 不存在或无法打开');
      resolve({ migrated: 0, keys: [] });
    };

    request.onsuccess = async () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(OLD_STORE_NAME)) {
        db.close();
        resolve({ migrated: 0, keys: [] });
        return;
      }

      const transaction = db.transaction(OLD_STORE_NAME, 'readonly');
      const store = transaction.objectStore(OLD_STORE_NAME);
      const keyRequest = store.getAllKeys();

      keyRequest.onsuccess = async () => {
        const keys = keyRequest.result as string[];

        for (const key of keys) {
          try {
            const valueRequest = store.get(key);
            await new Promise<void>((res, rej) => {
              valueRequest.onsuccess = () => res();
              valueRequest.onerror = () => rej(valueRequest.error);
            });
            const value = valueRequest.result;
            await jsonStorage.setItem(key, value);
            migrated.push(key);
          } catch (error) {
            console.error(`迁移失败 ${key}:`, error);
          }
        }

        db.close();
        resolve({ migrated: migrated.length, keys: migrated });
      };

      keyRequest.onerror = () => {
        db.close();
        resolve({ migrated: 0, keys: [] });
      };
    };
  });
}
