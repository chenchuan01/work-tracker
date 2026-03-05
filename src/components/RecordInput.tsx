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
      if (mode === 'record') {
        await onAdd(content);
      } else {
        await onAddTodo(content);
      }
      setInput('');
    } catch (error) {
      console.error('添加失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">
          {mode === 'record' ? '今天做了什么？' : '有什么待办事项？'}
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onModeChange('record')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'record'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 记录工作
          </button>
          <button
            onClick={() => onModeChange('todo')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              mode === 'todo'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✅ 加入待办
          </button>
        </div>
      </div>
      <div className="mb-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'record'
              ? '输入已完成的工作内容，按 Enter 保存...'
              : '输入待办事项，按 Enter 加入待办列表...'
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500">
          按 Enter 保存，Shift+Enter 换行
        </p>
        <button
          onClick={handleSubmit}
          disabled={submitting || !input.trim()}
          className={`px-4 py-2 text-white rounded-md text-sm font-medium transition-colors ${
            mode === 'record'
              ? 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'
              : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300'
          } disabled:cursor-not-allowed`}
        >
          {submitting ? '保存中...' : mode === 'record' ? '保存' : '加入待办'}
        </button>
      </div>
    </div>
  );
};
