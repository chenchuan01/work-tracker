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
import { RecordBackfillModal } from './components/RecordBackfillModal';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DataMigration } from './components/DataMigration';
import { ViewType, InputMode, Todo } from './types';
import { getDateRange } from './utils/date';
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear';
dayjs.extend(dayOfYear);
import { ModelConfig } from './utils/prompt';
import { NewsItem } from './data/news';
import { apiClient } from './api/client';

const MODEL_CONFIG_KEY = 'model_config';
const DAILY_QUOTE_PREFIX = 'daily_quote_';

// 生成每日金句（使用 AI）
const generateDailyQuote = async (modelConfig?: ModelConfig): Promise<string> => {
  const today = dayjs().format('YYYY-MM-DD');
  const prompt = `今天是 ${today}，请为正在努力工作的人写一段温暖的鼓励语。`;

  try {
    const {
      apiKey,
      baseURL = 'https://api.openai.com/v1',
      modelName = 'gpt-3.5-turbo',
    } = modelConfig || {};

    // 如果没有配置 API Key，返回默认金句
    if (!apiKey) {
      throw new Error('No API key');
    }

    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: `你是一位温暖治愈的文字工作者，擅长写有情绪价值的励志语录。
请写一段简短有力的鼓励语，要求：
- 字数 30-50 字，像朋友般的温暖问候
- 真诚走心，避免空洞的鸡汤
- 传递积极能量，让人感受到被理解和支持
- 可以结合当下时节、生活场景
- 语言自然流畅，有画面感
- 直接输出内容，不要引号和其他说明`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 80,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error('AI 请求失败');
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content || '生成失败';
    // 清理结果，去除引号和多余内容
    return result.trim().replace(/^["']|["']$/g, '').substring(0, 80);
  } catch (error) {
    // AI 生成失败时返回默认金句
    const fallbackQuotes = [
      "越努力，越幸运。",
      "今天的你，比昨天更优秀。",
      "坚持，是最强大的超能力。",
      "行动，是治愈恐惧的良药。",
      "生活不会辜负每一个努力的人。",
    ];
    const dayIndex = dayjs().dayOfYear() % fallbackQuotes.length;
    return fallbackQuotes[dayIndex];
  }
};

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('day');
  const [currentDate, setCurrentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [showSummary, setShowSummary] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>(() => {
    return {
      baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
      modelName: import.meta.env.VITE_MODEL_NAME || 'gpt-3.5-turbo',
      systemPrompt: '',
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<string>('越努力，越幸运。');
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [backfillDate, setBackfillDate] = useState<string>('');

  const { toast, confirm, showToast, hideToast, showConfirm, hideConfirm } = useDialog();

  // 加载模型配置
  useEffect(() => {
    const loadConfig = async () => {
      const saved = await apiClient.getConfig<ModelConfig>(MODEL_CONFIG_KEY);
      if (saved) {
        setModelConfig(saved);
      }
    };
    loadConfig();
  }, []);

  // 加载每日金句
  useEffect(() => {
    const loadQuote = async () => {
      const today = dayjs().format('YYYY-MM-DD');
      const savedQuote = await apiClient.getConfig<string>(DAILY_QUOTE_PREFIX + today);
      if (savedQuote) {
        setDailyQuote(savedQuote);
        return;
      }

      // 生成新金句
      const quote = await generateDailyQuote(modelConfig);
      setDailyQuote(quote);
      await apiClient.setConfig(DAILY_QUOTE_PREFIX + today, quote);
    };

    loadQuote();
  }, [modelConfig]);

  const {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDateRange,
  } = useRecords();

  const {
    todos,
    addTodo,
    startTodo,
    deleteTodo,
  } = useTodos();

  const {
    generating,
    summary,
    error,
    generateWorkSummary,
    generateCustomSummary,
    clearSummary,
  } = useSummary();

  const dateRange = getDateRange(currentView, currentDate);
  const filteredRecords = getRecordsByDateRange(dateRange.start, dateRange.end);

  const handleAddRecord = async (content: string) => {
    await addRecord(content, currentDate);
  };

  const handleAddTodo = async (content: string) => {
    await addTodo(content);
    // 添加待办后自动切换回记录模式
    setInputMode('record');
  };

  const handleEditRecord = async (id: string, content: string) => {
    await updateRecord(id, { content });
  };

  const handleDeleteRecord = async (id: string) => {
    showConfirm(
      '确定要删除这条记录吗？',
      async () => {
        await deleteRecord(id);
        showToast('删除成功', 'success');
      },
      { type: 'danger', title: '删除记录' }
    );
  };

  const handleToggleImportant = async (id: string, isImportant: boolean) => {
    await updateRecord(id, { isImportant });
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id);
  };

  const handleStartTodo = async (id: string) => {
    await startTodo(id);
  };

  const handleConvertTodoToRecord = async (todo: Todo) => {
    // 将待办转为工作记录
    await addRecord(todo.content, currentDate);
    // 删除待办
    await deleteTodo(todo.id);
  };

  const handleSummarizeNews = async (news: NewsItem) => {
    // 直接生成新闻总结，不添加到工作记录
    const newsContent = `新闻标题：${news.title}\n新闻来源：${news.source}\n发布时间：${news.publishedAt}\n新闻摘要：${news.summary}`;
    await generateCustomSummary(newsContent, `${news.source} - ${news.title}`, modelConfig);
    setShowSummary(true);
  };

  const handleGenerateSummary = async () => {
    await generateWorkSummary(records, currentView, currentDate, modelConfig);
    setShowSummary(true);
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
    clearSummary();
  };

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      showToast('已复制到剪贴板', 'success');
    }
  };

  const handleSaveApiKey = async () => {
    await apiClient.setConfig(MODEL_CONFIG_KEY, modelConfig);
    setShowSettings(false);
    showToast('配置已保存', 'success');
  };

  const handleDateClick = (date: string) => {
    setBackfillDate(date);
    setShowBackfillModal(true);
  };

  const handleBackfillSave = async (content: string, date: string) => {
    await addRecord(content, date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#629DF2] rounded-lg flex items-center justify-center">
              <span className="text-lg">📝</span>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <h1 className="text-lg font-semibold text-gray-800">工作记录</h1>
                <p className="text-xs text-gray-500">{dailyQuote}</p>
              </div>
              <button
                onClick={async () => {
                  const quote = await generateDailyQuote(modelConfig);
                  setDailyQuote(quote);
                  await apiClient.setConfig(DAILY_QUOTE_PREFIX + dayjs().format('YYYY-MM-DD'), quote);
                }}
                className="p-1 text-gray-400 hover:text-[#629DF2] transition-colors"
                title="换一句"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="设置"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - News */}
          <div className="w-80 flex-shrink-0">
            <NewsCard onSummarize={handleSummarizeNews} />
          </div>

          {/* Center Content */}
          <div className="flex-1 min-w-0">
            {/* View Switcher */}
            <ViewSwitcher
              currentView={currentView}
              currentDate={currentDate}
              onViewChange={setCurrentView}
              onDateChange={setCurrentDate}
            />

            {/* Record Input */}
            <RecordInput
              onAdd={handleAddRecord}
              onAddTodo={handleAddTodo}
              mode={inputMode}
              onModeChange={setInputMode}
            />

            {/* Todo List */}
            <TodoList
              todos={todos}
              onStart={handleStartTodo}
              onDelete={handleDeleteTodo}
              onConvertToRecord={handleConvertTodoToRecord}
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {currentView === 'day' && '今日工作'}
                {currentView === 'week' && '本周工作'}
                {currentView === 'month' && '本月工作'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  共 {filteredRecords.length} 条记录
                </span>
                <button
                  onClick={handleGenerateSummary}
                  disabled={filteredRecords.length === 0}
                  className="px-4 py-2 bg-[#629DF2] text-white rounded-md text-sm font-medium hover:bg-[#4A85E8] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <span>✨</span>
                  AI 总结
                </button>
              </div>
            </div>

            {/* Record List */}
            <RecordList
              records={filteredRecords}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecord}
              onToggleImportant={handleToggleImportant}
            />
          </div>

          {/* Right Sidebar - Calendar */}
          <div className="w-80 flex-shrink-0">
            <CalendarCard
              records={records}
              currentDate={currentDate}
              onDateSelect={handleDateClick}
            />
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

      {/* Record Backfill Modal */}
      <RecordBackfillModal
        isOpen={showBackfillModal}
        selectedDate={backfillDate}
        onClose={() => setShowBackfillModal(false)}
        onSave={handleBackfillSave}
        onError={(msg) => showToast(msg, 'error')}
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">⚙️ 设置</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={modelConfig.apiKey || ''}
                  onChange={(e) => setModelConfig({ ...modelConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  API Key 仅存储在本地，用于 AI 总结功能。不配置将使用模拟数据。
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL
                </label>
                <input
                  type="text"
                  value={modelConfig.baseURL || ''}
                  onChange={(e) => setModelConfig({ ...modelConfig, baseURL: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  大模型 API 地址，例如：https://api.openai.com/v1
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称
                </label>
                <input
                  type="text"
                  value={modelConfig.modelName || ''}
                  onChange={(e) => setModelConfig({ ...modelConfig, modelName: e.target.value })}
                  placeholder="gpt-3.5-turbo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  例如：gpt-3.5-turbo, gpt-4, claude-3 等
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  系统提示词
                </label>
                <textarea
                  value={modelConfig.systemPrompt || ''}
                  onChange={(e) => setModelConfig({ ...modelConfig, systemPrompt: e.target.value })}
                  placeholder="你是一位专业的工作助理，请根据用户提供的工作记录，生成一份精炼的工作简报..."
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  自定义 AI 助手的角色和总结要求，留空则使用默认提示词
                </p>
              </div>
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-500">
                  数据现存储在服务器端，自动持久化保存
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Data Migration */}
      <DataMigration />
    </div>
  );
}

export default App;
