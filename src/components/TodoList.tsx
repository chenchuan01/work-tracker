import React from 'react';
import { Todo } from '../types';
import { formatDateTime } from '../utils/date';

interface TodoListProps {
  todos: Todo[];
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  onConvertToRecord: (todo: Todo) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onStart,
  onDelete,
  onConvertToRecord,
}) => {
  const pendingTodos = todos.filter(t => t.status === 'pending');
  const inProgressTodos = todos.filter(t => t.status === 'in-progress');
  const completedTodos = todos.filter(t => t.status === 'completed');

  if (todos.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <span>✅</span> 待办事项
        <span className="text-xs font-normal text-gray-500">
          {pendingTodos.length} 待办 · {inProgressTodos.length} 进行中
        </span>
      </h3>

      {/* 进行中列表 */}
      {inProgressTodos.length > 0 && (
        <div className="space-y-2 mb-4">
          {inProgressTodos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white rounded-lg border border-yellow-200 p-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-yellow-500 animate-pulse">🔄</span>
              </div>
              <div className="flex-1">
                <span className="text-gray-800 block">{todo.content}</span>
                {todo.startedAt && (
                  <span className="text-xs text-yellow-600">
                    已开始于 {formatDateTime(todo.startedAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onConvertToRecord(todo)}
                  className="px-2 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                >
                  ✓ 完成
                </button>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 待办列表 */}
      {pendingTodos.length > 0 && (
        <div className="space-y-2 mb-4">
          {pendingTodos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white rounded-lg border border-green-200 p-3 flex items-center gap-3 hover:shadow-sm transition-shadow"
            >
              <input
                type="checkbox"
                checked={false}
                onChange={() => {}}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
              />
              <span className="flex-1 text-gray-800">{todo.content}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onStart(todo.id)}
                  className="px-2 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  ▶ 开始
                </button>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 已完成列表（折叠） */}
      {completedTodos.length > 0 && (
        <details className="bg-gray-50 rounded-lg border border-gray-200">
          <summary className="px-3 py-2 cursor-pointer text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            已完成 ({completedTodos.length})
          </summary>
          <div className="p-3 space-y-2">
            {completedTodos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center gap-3 text-gray-500 line-through"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => {}}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                />
                <span className="flex-1">{todo.content}</span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(todo.completedAt!)}
                </span>
                <button
                  onClick={() => onDelete(todo.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
