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
  { value: 'happy',   label: '开心', emoji: '😊', color: 'var(--su7-olive)' },
  { value: 'excited', label: '兴奋', emoji: '🤩', color: '#E07B3A' },
  { value: 'neutral', label: '平静', emoji: '😐', color: 'var(--su7-silver)' },
  { value: 'tired',   label: '疲惫', emoji: '😴', color: 'var(--su7-sky)' },
  { value: 'anxious', label: '焦虑', emoji: '😰', color: '#A07ABF' },
  { value: 'sad',     label: '难过', emoji: '😢', color: '#8E8E98' },
] as const;

export const MoodJournal = () => {
  const [entries, setEntries]         = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodEntry['mood']>('neutral');
  const [content, setContent]         = useState('');
  const [expanded, setExpanded]       = useState(true);

  const { toast, confirm, showToast, hideToast, showConfirm, hideConfirm } = useDialog();

  useEffect(() => {
    apiClient.getMoodEntries()
      .then(data => setEntries(data))
      .catch(e => console.error('加载心情记录失败:', e));
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) { showToast('请输入内容', 'warning'); return; }
    const entry: MoodEntry = {
      id: `mood-${Date.now()}`,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      mood: selectedMood,
      content: content.trim(),
      createdAt: Date.now(),
    };
    try {
      await apiClient.createMoodEntry(entry);
      setEntries(prev => [entry, ...prev]);
      setContent('');
      setSelectedMood('neutral');
      showToast('心情记录已保存', 'success');
    } catch { showToast('保存失败，请重试', 'error'); }
  };

  const handleDelete = (id: string) => {
    showConfirm('确定要删除这条心情记录吗？', async () => {
      try {
        await apiClient.deleteMoodEntry(id);
        setEntries(prev => prev.filter(e => e.id !== id));
        showToast('删除成功', 'success');
      } catch { showToast('删除失败，请重试', 'error'); }
    }, { type: 'danger', title: '删除心情记录' });
  };

  return (
    <>
      <div className="card p-5 mt-4 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">心情随笔</h3>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-md btn-ghost">
            <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {expanded && (
          <>
            {/* Mood picker */}
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors text-center"
                  style={selectedMood === mood.value
                    ? { background: `${mood.color}18`, border: `1.5px solid ${mood.color}` }
                    : { background: '#FAFAFA', border: '1.5px solid var(--border)' }}
                  title={mood.label}
                >
                  <span className="text-lg leading-none">{mood.emoji}</span>
                  <span className="text-xs" style={{ color: selectedMood === mood.value ? mood.color : 'var(--su7-silver)' }}>{mood.label}</span>
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="记录当下的心情和想法..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border rounded-lg resize-none transition-colors mb-3"
              style={{ borderColor: 'var(--border)', background: '#FAFAFA' }}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              className="w-full btn-olive py-2 rounded-lg text-sm font-medium"
            >
              保存心情
            </button>

            {/* History */}
            {entries.length > 0 && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-medium text-gray-500 mb-3">最近记录</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {entries.slice(0, 10).map(entry => {
                    const moodCfg = MOOD_OPTIONS.find(m => m.value === entry.mood) || MOOD_OPTIONS[2];
                    return (
                      <div key={entry.id} className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: '#FAFAFA', border: '1px solid var(--border)' }}>
                        <span className="text-base flex-shrink-0 mt-0.5">{moodCfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">{entry.content}</p>
                          <p className="text-xs mt-1" style={{ color: 'var(--su7-silver)' }}>{entry.date}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1 rounded btn-ghost flex-shrink-0"
                          style={{ color: '#C0C0C8' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--su7-red)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#C0C0C8'; }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Collapsed summary */}
        {!expanded && entries.length > 0 && (
          <p className="text-xs text-gray-400">
            {MOOD_OPTIONS.find(m => m.value === entries[0].mood)?.emoji} {entries[0].date}
          </p>
        )}
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmDialog
        isOpen={confirm.show}
        title={confirm.title}
        message={confirm.message}
        type={confirm.type}
        onConfirm={() => { confirm.onConfirm?.(); }}
        onCancel={hideConfirm}
      />
    </>
  );
};
