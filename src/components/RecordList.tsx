import React from 'react';
import { WorkRecord } from '../types';
import { formatDateTime } from '../utils/date';

interface RecordListProps {
  records: WorkRecord[];
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onToggleImportant: (id: string, isImportant: boolean) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, onEdit, onDelete, onToggleImportant }) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editContent, setEditContent] = React.useState('');

  const handleEdit   = (record: WorkRecord) => { setEditingId(record.id); setEditContent(record.content); };
  const handleSave   = (id: string)          => { if (editContent.trim()) onEdit(id, editContent.trim()); setEditingId(null); setEditContent(''); };
  const handleCancel = ()                    => { setEditingId(null); setEditContent(''); };

  if (records.length === 0) {
    return (
      <div className="card p-12 text-center animate-in">
        <svg className="mx-auto h-10 w-10 mb-3" style={{ color: '#D1D1D6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm text-gray-400">暂无工作记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {records.map((record, index) => (
        <div
          key={record.id}
          className={`card px-5 py-4 transition-shadow hover:shadow-md animate-in ${record.isImportant ? 'border-l-2' : ''}`}
          style={record.isImportant ? { borderLeftColor: 'var(--su7-olive)', animationDelay: `${index * 0.04}s` } : { animationDelay: `${index * 0.04}s` }}
        >
          {editingId === record.id ? (
            <div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border rounded-lg resize-none transition-colors"
                style={{ borderColor: 'var(--su7-olive)', background: '#FAFAFA' }}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2 mt-2.5">
                <button onClick={() => handleSave(record.id)} className="btn-olive px-3 py-1.5 rounded-md text-xs font-medium">保存</button>
                <button onClick={handleCancel}                className="btn-ghost px-3 py-1.5 rounded-md text-xs font-medium border" style={{ borderColor: 'var(--border)' }}>取消</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{record.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs" style={{ color: 'var(--su7-silver)' }}>{formatDateTime(record.createdAt)}</span>
                  {record.isImportant && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'rgba(107,123,74,0.1)', color: 'var(--su7-olive)' }}>重点</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => onToggleImportant(record.id, !record.isImportant)}
                  className="p-1.5 rounded-md transition-colors btn-ghost"
                  style={record.isImportant ? { color: 'var(--su7-olive)' } : {}}
                  title="标记重点"
                >
                  <svg className="w-4 h-4" fill={record.isImportant ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button onClick={() => handleEdit(record)} className="p-1.5 rounded-md btn-ghost" title="编辑">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(record.id)} className="p-1.5 rounded-md btn-ghost" style={{ color: '#B0B0B8' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--su7-red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#B0B0B8')}
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
