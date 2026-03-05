import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { apiClient } from '../api/client';
import { useDialog } from '../hooks/useDialog';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

interface MoodEntry {
  id: string;
  date: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'tired' | 'anxious';
  content: string;
  createdAt: number;
}

const MOOD_OPTIONS = [
  { value: 'happy', label: '开心', emoji: '😊', color: 'bg-green-100 border-green-300 text-green-700' },
  { value: 'excited', label: '兴奋', emoji: '🤩', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
  { value: 'neutral', label: '平静', emoji: '😐', color: 'bg-gray-100 border-gray-300 text-gray-700' },
  { value: 'tired', label: '疲惫', emoji: '😴', color: 'bg-blue-100 border-blue-300 text-blue-700' },
  { value: 'anxious', label: '焦虑', emoji: '😰', color: 'bg-purple-100 border-purple-300 text-purple-700' },
  { value: 'sad', label: '难过', emoji: '😢', color: 'bg-gray-200 border-gray-400 text-gray-600' },
] as const;

export const MoodJournal = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodEntry['mood']>('neutral');
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState(true);

  const { toast, confirm, showToast, hideToast, showConfirm, hideConfirm } = useDialog();

  // 加载心情记录
  useEffect(() => {
    const loadEntries = async () => {
      try {
        const data = await apiClient.getMoodEntries();
        setEntries(data);
      } catch (error) {
        console.error('加载心情记录失败:', error);
      }
    };
    loadEntries();
  }, []);

  // 添加新记录
  const handleSubmit = async () => {
    if (!content.trim()) {
      showToast('请输入心情内容', 'warning');
      return;
    }

    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      mood: selectedMood,
      content: content.trim(),
      createdAt: Date.now(),
    };

    try {
      await apiClient.createMoodEntry(newEntry);
      const newEntries = [newEntry, ...entries];
      setEntries(newEntries);
      setContent('');
      setSelectedMood('neutral');
      showToast('心情记录已保存', 'success');
    } catch (error) {
      console.error('添加心情记录失败:', error);
      showToast('保存失败，请重试', 'error');
    }
  };

  // 删除记录
  const handleDelete = async (id: string) => {
    showConfirm(
      '确定要删除这条心情记录吗？',
      async () => {
        try {
          await apiClient.deleteMoodEntry(id);
          const newEntries = entries.filter(e => e.id !== id);
          setEntries(newEntries);
          showToast('删除成功', 'success');
        } catch (error) {
          console.error('删除心情记录失败:', error);
          showToast('删除失败，请重试', 'error');
        }
      },
      { type: 'danger', title: '删除心情记录' }
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-4 mt-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>💭</span> 心情随笔
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {expanded ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          )}
        </button>
      </div>

      {expanded && (
        <>
          {/* 心情选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              此刻心情
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`
                    p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1
                    ${selectedMood === mood.value 
                      ? mood.color + ' border-opacity-100 shadow-md' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}
                  `}
                >
                  <span className="text-xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容输入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              想说什么...
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录当下的心情、想法或感悟..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-2 bg-[#629DF2] text-white rounded-md font-medium hover:bg-[#4A85E8] transition-all flex items-center justify-center gap-2"
          >
            <span>📝</span>
            记录心情
          </button>

          {/* 历史记录 */}
          {entries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-600 mb-3">
                最近记录 ({entries.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entries.slice(0, 10).map((entry) => {
                  const moodConfig = MOOD_OPTIONS.find(m => m.value === entry.mood) || MOOD_OPTIONS[2];
                  return (
                    <div
                      key={entry.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{moodConfig.emoji}</span>
                          <span className="text-xs text-gray-500">{entry.date}</span>
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="删除"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{entry.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* 收起状态 */}
      {!expanded && entries.length > 0 && (
        <div className="text-sm text-gray-500 text-center py-2">
          最近：{entries[0].date} - {MOOD_OPTIONS.find(m => m.value === entries[0].mood)?.label}
        </div>
      )}
    </div>

    {/* Toast */}
    {toast.show && (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    )}

    {/* Confirm Dialog */}
    <ConfirmDialog
      isOpen={confirm.show}
      title={confirm.title}
      message={confirm.message}
      type={confirm.type}
      onConfirm={() => {
        confirm.onConfirm?.();
      }}
      onCancel={hideConfirm}
    />
  </>
  );
};
