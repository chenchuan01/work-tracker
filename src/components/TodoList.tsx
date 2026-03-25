import React from 'react';
import { Todo } from '../types';
import { formatDateTime } from '../utils/date';

interface TodoListProps {
  todos: Todo[];
  onStart: (id: string) => void;
  onDelete: (id: string) => void;
  onConvertToRecord: (todo: Todo) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ todos, onStart, onDelete, onConvertToRecord }) => {
  const pending    = todos.filter(t => t.status === 'pending');
  const inProgress = todos.filter(t => t.status === 'in-progress');
  const completed  = todos.filter(t => t.status === 'completed');

  if (todos.length === 0) return null;

  const DeleteBtn = ({ id }: { id: string }) => (
    <button
      onClick={() => onDelete(id)}
      className="p-1.5 rounded-md btn-ghost flex-shrink-0"
      style={{ color: '#C0C0C8' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--su7-red)')}
      onMouseLeave={e => (e.currentTarget.style.color = '#C0C0C8')}
      title="删除"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );

  return (
    <div className="card px-5 py-4 mb-4 animate-in">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">待办事项</h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(74,143,168,0.12)', color: 'var(--su7-sky)' }}>
          {pending.length + inProgress.length} 条
        </span>
      </div>

      <div className="space-y-2">
        {/* In Progress */}
        {inProgress.map(todo => (
          <div key={todo.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(107,123,74,0.06)', border: '1px solid rgba(107,123,74,0.15)' }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--su7-olive)' }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-800 font-medium">{todo.content}</span>
              {todo.startedAt && <p className="text-xs mt-0.5" style={{ color: 'var(--su7-silver)' }}>开始于 {formatDateTime(todo.startedAt)}</p>}
            </div>
            <button
              onClick={() => onConvertToRecord(todo)}
              className="btn-olive px-3 py-1 rounded-md text-xs font-medium flex-shrink-0"
            >
              完成
            </button>
            <DeleteBtn id={todo.id} />
          </div>
        ))}

        {/* Pending */}
        {pending.map(todo => (
          <div key={todo.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: '#FAFAFA', border: '1px solid var(--border)' }}>
            <div className="w-2 h-2 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#D1D1D6' }} />
            <span className="flex-1 text-sm text-gray-700">{todo.content}</span>
            <button
              onClick={() => onStart(todo.id)}
              className="btn-sky px-3 py-1 rounded-md text-xs font-medium flex-shrink-0"
            >
              开始
            </button>
            <DeleteBtn id={todo.id} />
          </div>
        ))}

        {/* Completed (collapsed) */}
        {completed.length > 0 && (
          <details className="group">
            <summary className="text-xs cursor-pointer select-none px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors list-none flex items-center gap-1.5" style={{ color: 'var(--su7-silver)' }}>
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              已完成 {completed.length} 条
            </summary>
            <div className="mt-1.5 space-y-1.5 pl-3">
              {completed.map(todo => (
                <div key={todo.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#FAFAFA' }}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--su7-olive)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="flex-1 text-xs text-gray-400 line-through">{todo.content}</span>
                  {todo.completedAt && <span className="text-xs" style={{ color: 'var(--su7-silver)' }}>{formatDateTime(todo.completedAt)}</span>}
                  <DeleteBtn id={todo.id} />
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};
