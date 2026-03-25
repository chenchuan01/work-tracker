import { useState, useEffect } from 'react';
import { useRecords } from './hooks/useRecords';
import { useTodos } from './hooks/useTodos';
import { useSummary } from './hooks/useSummary';
import { useDialog } from './hooks/useDialog';
import { RecordInput } from './components/RecordInput';
import { RecordList } from './components/RecordList';
import { TodoList } from './components/TodoList';
import { ViewSwitcher } from './components/ViewSwitcher';
import { SummaryModal } from './components/SummaryModal';
import { CalendarCard } from './components/CalendarCard';
import { NewsCard } from './components/NewsCard';
import { MoodJournal } from './components/MoodJournal';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DataMigration } from './components/DataMigration';
import { ViewType, InputMode, Todo, NewsItem } from './types';
import { getDateRange } from './utils/date';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
dayjs.extend(dayOfYear);
import { ModelConfig } from './utils/prompt';
import { apiClient } from './api/client';

const MODEL_CONFIG_KEY = 'model_config';
const DAILY_QUOTE_PREFIX = 'daily_quote_';

const generateDailyQuote = async (modelConfig?: ModelConfig): Promise<string> => {
  const today = dayjs().format('YYYY-MM-DD');
  const prompt = `今天是 ${today}，请为正在努力工作的人写一段温暖的鼓励语。`;
  try {
    const { apiKey, baseURL = 'https://api.openai.com/v1', modelName = 'gpt-3.5-turbo' } = modelConfig || {};
    if (!apiKey) throw new Error('No API key');
    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: `你是一位温暖治愈的文字工作者。请写一段简短有力的鼓励语，字数 30-50 字，真诚走心，直接输出内容，不要引号。` },
          { role: 'user', content: prompt },
        ],
        max_tokens: 80, temperature: 0.9,
      }),
    });
    if (!response.ok) throw new Error('AI 请求失败');
    const data = await response.json();
    return (data.choices[0]?.message?.content || '生成失败').trim().replace(/^["']|["']$/g, '').substring(0, 80);
  } catch {
    const fallbackQuotes = [
      "越努力，越幸运。",
      "今天的你，比昨天更优秀。",
      "坚持，是最强大的超能力。",
      "行动，是治愈恐惧的良药。",
      "生活不会辜负每一个努力的人。",
    ];
    return fallbackQuotes[dayjs().dayOfYear() % fallbackQuotes.length];
  }
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('day');
  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [showSummary, setShowSummary] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => ({
    baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    modelName: import.meta.env.VITE_MODEL_NAME || 'gpt-3.5-turbo',
    systemPrompt: '',
  }));
  const [showSettings, setShowSettings] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<string>('越努力，越幸运。');

  const { toast, confirm, showToast, hideToast, showConfirm, hideConfirm } = useDialog();

  useEffect(() => {
    apiClient.getConfig<ModelConfig>(MODEL_CONFIG_KEY).then(saved => { if (saved) setModelConfig(saved); });
  }, []);

  useEffect(() => {
    const loadQuote = async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const saved = await apiClient.getConfig<string>(DAILY_QUOTE_PREFIX + today);
      if (saved) { setDailyQuote(saved); return; }
      const quote = await generateDailyQuote(modelConfig);
      setDailyQuote(quote);
      await apiClient.setConfig(DAILY_QUOTE_PREFIX + today, quote);
    };
    loadQuote();
  }, [modelConfig]);

  const { records, addRecord, updateRecord, deleteRecord, getRecordsByDateRange } = useRecords();
  const { todos, addTodo, startTodo, deleteTodo } = useTodos();
  const { generating, summary, error, generateWorkSummary, generateCustomSummary, clearSummary } = useSummary();

  const dateRange = getDateRange(currentView, currentDate);
  const filteredRecords = getRecordsByDateRange(dateRange.start, dateRange.end);

  const handleAddRecord    = async (content: string) => { await addRecord(content, currentDate); };
  const handleAddTodo      = async (content: string) => { await addTodo(content); setInputMode('record'); };
  const handleEditRecord   = async (id: string, content: string) => { await updateRecord(id, { content }); };
  const handleDeleteRecord = async (id: string) => {
    showConfirm('确定要删除这条记录吗？', async () => { await deleteRecord(id); showToast('删除成功', 'success'); }, { type: 'danger', title: '删除记录' });
  };
  const handleToggleImportant   = async (id: string, isImportant: boolean) => { await updateRecord(id, { isImportant }); };
  const handleDeleteTodo        = async (id: string) => { await deleteTodo(id); };
  const handleStartTodo         = async (id: string) => { await startTodo(id); };
  const handleConvertTodoToRecord = async (todo: Todo) => { await addRecord(todo.content, currentDate); await deleteTodo(todo.id); };

  const handleSummarizeNews = async (news: NewsItem) => {
    const newsContent = `新闻标题：${news.title}\n新闻来源：${news.source}\n发布时间：${news.publishedAt}\n新闻摘要：${news.summary}`;
    await generateCustomSummary(newsContent, `${news.source} - ${news.title}`, modelConfig);
    setShowSummary(true);
  };
  const handleGenerateSummary = async () => { await generateWorkSummary(records, currentView, currentDate, modelConfig); setShowSummary(true); };
  const handleCloseSummary    = () => { setShowSummary(false); clearSummary(); };
  const handleCopySummary     = () => { if (summary) { navigator.clipboard.writeText(summary); showToast('已复制到剪贴板', 'success'); } };
  const handleSaveApiKey      = async () => { await apiClient.setConfig(MODEL_CONFIG_KEY, modelConfig); setShowSettings(false); showToast('配置已保存', 'success'); };

  const viewLabel = currentView === 'day' ? '今日工作' : currentView === 'week' ? '本周工作' : '本月工作';

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      {/* Header */}
      <header style={{ background: 'var(--su7-black)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--su7-olive)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <span className="text-white font-semibold text-sm tracking-wide">工作记录</span>
              <p className="text-xs leading-none mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{dailyQuote}</p>
            </div>
            <button
              onClick={async () => {
                const quote = await generateDailyQuote(modelConfig);
                setDailyQuote(quote);
                await apiClient.setConfig(DAILY_QUOTE_PREFIX + dayjs().format('YYYY-MM-DD'), quote);
              }}
              className="p-1.5 rounded-md transition-colors btn-ghost ml-1"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              title="换一句"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
            title="设置"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex gap-5">
          {/* Left Sidebar — News */}
          <div className="w-72 flex-shrink-0">
            <NewsCard onSummarize={handleSummarizeNews} />
          </div>

          {/* Center Content */}
          <div className="flex-1 min-w-0">
            <ViewSwitcher
              currentView={currentView}
              currentDate={currentDate}
              onViewChange={setCurrentView}
              onDateChange={setCurrentDate}
            />
            <RecordInput
              onAdd={handleAddRecord}
              onAddTodo={handleAddTodo}
              mode={inputMode}
              onModeChange={setInputMode}
            />
            <TodoList
              todos={todos}
              onStart={handleStartTodo}
              onDelete={handleDeleteTodo}
              onConvertToRecord={handleConvertTodoToRecord}
            />

            {/* Action Bar */}
            <div className="card px-5 py-3.5 mb-4 flex items-center justify-between animate-in">
              <h3 className="text-sm font-semibold text-gray-700">{viewLabel}
                <span className="ml-2 text-xs font-normal" style={{ color: 'var(--su7-silver)' }}>{filteredRecords.length} 条</span>
              </h3>
              <button
                onClick={handleGenerateSummary}
                disabled={filteredRecords.length === 0 || generating}
                className="btn-olive px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
              >
                {generating ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {generating ? '生成中...' : 'AI 总结'}
              </button>
            </div>

            <RecordList
              records={filteredRecords}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecord}
              onToggleImportant={handleToggleImportant}
            />
          </div>

          {/* Right Sidebar — Calendar + Mood */}
          <div className="w-72 flex-shrink-0">
            <CalendarCard records={records} currentDate={currentDate} onDateSelect={setCurrentDate} />
            <MoodJournal />
          </div>
        </div>
      </main>

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showSummary}
        summary={summary}
        generating={generating}
        error={error}
        onClose={handleCloseSummary}
        onCopy={handleCopySummary}
        onRegenerate={handleGenerateSummary}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-in">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="font-semibold text-gray-800">设置</h3>
              <button onClick={() => setShowSettings(false)} className="btn-ghost p-1.5 rounded-md">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'API Key', key: 'apiKey' as const, type: 'password', placeholder: 'sk-...', hint: 'API Key 仅存储在本地，用于 AI 总结功能' },
                { label: 'Base URL', key: 'baseURL' as const, type: 'text', placeholder: 'https://api.openai.com/v1', hint: '大模型 API 地址' },
                { label: '模型名称', key: 'modelName' as const, type: 'text', placeholder: 'gpt-3.5-turbo', hint: '例如：gpt-4、claude-3 等' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={(modelConfig[field.key] as string) || ''}
                    onChange={e => setModelConfig({ ...modelConfig, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm border rounded-lg transition-colors"
                    style={{ borderColor: 'var(--border)', background: '#FAFAFA' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--su7-silver)' }}>{field.hint}</p>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">系统提示词</label>
                <textarea
                  value={modelConfig.systemPrompt || ''}
                  onChange={e => setModelConfig({ ...modelConfig, systemPrompt: e.target.value })}
                  placeholder="自定义 AI 助手的角色和总结要求，留空则使用默认提示词..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border rounded-lg resize-none transition-colors"
                  style={{ borderColor: 'var(--border)', background: '#FAFAFA' }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--su7-silver)' }}>数据存储在服务器端，自动持久化保存</p>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowSettings(false)} className="btn-ghost px-4 py-2 rounded-lg text-sm">取消</button>
                <button onClick={handleSaveApiKey} className="btn-olive px-4 py-2 rounded-lg text-sm font-medium">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <ConfirmDialog
        isOpen={confirm.show}
        title={confirm.title}
        message={confirm.message}
        type={confirm.type}
        onConfirm={() => { confirm.onConfirm?.(); }}
        onCancel={hideConfirm}
      />
      <DataMigration />
    </div>
  );
}

export default App;
