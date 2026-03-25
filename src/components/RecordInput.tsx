import React, { useState, KeyboardEvent } from 'react';
import { InputMode } from '../types';

interface RecordInputProps {
  onAdd: (content: string) => Promise<void>;
  onAddTodo: (content: string) => Promise<void>;
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
}

export const RecordInput: React.FC<RecordInputProps> = ({ onAdd, onAddTodo, mode, onModeChange }) => {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const content = input.trim();
    if (!content || submitting) return;
    setSubmitting(true);
    try {
      mode === 'record' ? await onAdd(content) : await onAddTodo(content);
      setInput('');
    } catch (error) {
      console.error('添加失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  return (
    <div className="card p-5 mb-4 animate-in">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">
          {mode === 'record' ? '工作记录' : '待办事项'}
        </span>
        <div className="flex rounded-lg overflow-hidden border text-xs font-medium" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => onModeChange('record')}
            className="px-3 py-1.5 transition-colors"
            style={mode === 'record'
              ? { background: 'var(--su7-black)', color: '#fff' }
              : { background: '#fff', color: '#6B6B76' }}
          >
            记录
          </button>
          <button
            onClick={() => onModeChange('todo')}
            className="px-3 py-1.5 transition-colors"
            style={mode === 'todo'
              ? { background: 'var(--su7-black)', color: '#fff' }
              : { background: '#fff', color: '#6B6B76' }}
          >
            待办
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={mode === 'record' ? '记录今天完成了什么...' : '添加一条待办事项...'}
        className="w-full px-4 py-3 text-sm text-gray-800 border rounded-lg resize-none transition-colors"
        style={{ borderColor: 'var(--border)', background: '#FAFAFA' }}
        rows={3}
      />

      {/* Footer */}
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs" style={{ color: 'var(--su7-silver)' }}>Enter 保存 · Shift+Enter 换行</span>
        <button
          onClick={handleSubmit}
          disabled={submitting || !input.trim()}
          className="btn-olive px-4 py-2 rounded-lg text-xs font-semibold"
        >
          {submitting ? '保存中...' : mode === 'record' ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
};
