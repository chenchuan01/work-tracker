import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { WorkRecord, Todo } from '../types';

interface MigrationStats {
  recordsCount: number;
  todosCount: number;
  recordsImported: number;
  todosImported: number;
  errors: string[];
}

export const DataMigration: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [stats, setStats] = useState<MigrationStats | null>(null);

  const openIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WorkTrackerDB', 1);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('无法打开 IndexedDB'));
      };
    });
  };

  const getDataFromStore = (db: IDBDatabase, storeName: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          reject(new Error(`无法读取 ${storeName} 数据`));
        };
      } catch (error) {
        // 如果 store 不存在，返回空数组
        resolve([]);
      }
    });
  };

  const handleMigration = async () => {
    setMigrating(true);
    const errors: string[] = [];
    let recordsImported = 0;
    let todosImported = 0;

    try {
      // 打开 IndexedDB
      const db = await openIndexedDB();

      // 读取 records
      const records = await getDataFromStore(db, 'records');
      console.log('从 IndexedDB 读取到的 records:', records);

      // 读取 todos
      const todos = await getDataFromStore(db, 'todos');
      console.log('从 IndexedDB 读取到的 todos:', todos);

      // 导入 records
      for (const record of records) {
        try {
          const workRecord: WorkRecord = {
            id: record.id,
            content: record.content,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            workDate: record.workDate,
            isImportant: record.isImportant || false,
            tags: record.tags || [],
          };
          await apiClient.createRecord(workRecord);
          recordsImported++;
        } catch (error: any) {
          errors.push(`导入记录失败 (${record.id}): ${error.message}`);
        }
      }

      // 导入 todos
      for (const todo of todos) {
        try {
          const todoItem: Todo = {
            id: todo.id,
            content: todo.content,
            createdAt: todo.createdAt,
            startedAt: todo.startedAt,
            completedAt: todo.completedAt,
            status: todo.status || 'pending',
          };
          await apiClient.createTodo(todoItem);
          todosImported++;
        } catch (error: any) {
          errors.push(`导入待办失败 (${todo.id}): ${error.message}`);
        }
      }

      db.close();

      setStats({
        recordsCount: records.length,
        todosCount: todos.length,
        recordsImported,
        todosImported,
        errors,
      });
    } catch (error: any) {
      errors.push(`迁移失败: ${error.message}`);
      setStats({
        recordsCount: 0,
        todosCount: 0,
        recordsImported,
        todosImported,
        errors,
      });
    } finally {
      setMigrating(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-purple-500 text-white rounded-lg shadow-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        数据迁移
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            数据迁移工具
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">📋 说明</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 此工具将从 IndexedDB (WorkTrackerDB) 中读取数据</li>
                <li>• 包括工作记录 (records) 和待办事项 (todos)</li>
                <li>• 数据将导入到当前的服务器数据库中</li>
                <li>• 如果数据已存在，可能会导致重复</li>
              </ul>
            </div>

            {!stats && (
              <button
                onClick={handleMigration}
                disabled={migrating}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {migrating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在迁移数据...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    开始迁移
                  </>
                )}
              </button>
            )}
          </div>

          {stats && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">✅ 迁移完成</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">工作记录</p>
                    <p className="text-lg font-semibold text-green-700">
                      {stats.recordsImported} / {stats.recordsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">待办事项</p>
                    <p className="text-lg font-semibold text-green-700">
                      {stats.todosImported} / {stats.todosCount}
                    </p>
                  </div>
                </div>
              </div>

              {stats.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">⚠️ 错误信息</h4>
                  <div className="max-h-40 overflow-y-auto">
                    <ul className="text-sm text-red-800 space-y-1">
                      {stats.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setStats(null);
                    setIsOpen(false);
                    window.location.reload();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  刷新页面查看数据
                </button>
                <button
                  onClick={() => setStats(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  再次迁移
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
