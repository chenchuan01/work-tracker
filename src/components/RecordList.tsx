import React from 'react';
import { WorkRecord } from '../types';
import { formatDateTime } from '../utils/date';

interface RecordListProps {
  records: WorkRecord[];
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggleImportant: (id: string, isImportant: boolean) => void;
}

export const RecordList: React.FC<RecordListProps> = ({
  records,
  onEdit,
  onDelete,
  onToggleImportant,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState('');

  const handleEdit = (record: WorkRecord) => {
    setEditingId(record.id);
    setEditContent(record.content);
  };

  const handleSave = (id: string) => {
    if (editContent.trim()) {
      onEdit(id, editContent.trim());
    }
    setEditingId(null);
    setEditContent('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="mt-2">暂无工作记录</p>
        <p className="text-sm">在上方输入框中添加第一条记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.id}
          className={`bg-white rounded-lg border p-4 transition-all hover:shadow-sm ${
            record.isImportant ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
          }`}
        >
          {editingId === record.id ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleSave(record.id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-800 whitespace-pre-wrap">{record.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">{formatDateTime(record.createdAt)}</span>
                  {record.isImportant && (
                    <span className="text-xs text-yellow-600 font-medium">⭐ 重点</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => onToggleImportant(record.id, !record.isImportant)}
                  className={`p-1.5 rounded transition-colors ${
                    record.isImportant
                      ? 'text-yellow-600 hover:bg-yellow-100'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title="标记重点"
                >
                  ⭐
                </button>
                <button
                  onClick={() => handleEdit(record)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                  title="编辑"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(record.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="删除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
