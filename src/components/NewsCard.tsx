import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { apiClient } from '../api/client';
import { NewsItem, NewsCategory, NewsPreferences } from '../types/index';
import { useNewsSummary } from '../hooks/useNewsSummary';
import { ModelConfig } from '../utils/newsSummary';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface NewsCardProps {
  modelConfig?: ModelConfig;
}

const CATEGORIES: { key: NewsCategory; label: string; color: string }[] = [
  { key: 'all',       label: '全部',   color: 'var(--su7-silver)' },
  { key: 'general',   label: '综合',   color: '#E8A838' },
  { key: 'finance',   label: '财经',   color: '#D4A84B' },
  { key: 'tech',      label: '科技',   color: 'var(--su7-sky)' },
];

function ScoreBadge({ score, recommended }: { score: number; recommended: boolean }) {
  if (score === 0) return null;
  const color = recommended ? 'var(--su7-olive)' : score >= 6 ? 'var(--su7-sky)' : '#aaa';
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: color + '22', color }}
    >
      {recommended && <span>★</span>}
      {score}
    </span>
  );
}

function SkeletonNews() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-3 rounded-lg bg-gray-50 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
        </div>
      ))}
    </div>
  );
}

export const NewsCard: React.FC<NewsCardProps> = ({ modelConfig }) => {
  const [category, setCategory] = useState<NewsCategory>('all');
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState<NewsPreferences>({ keywords: [], excludeKeywords: [] });
  const [keywordInput, setKeywordInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');

  const newsSummary = useNewsSummary();

  const loadNews = useCallback(async (cat: NewsCategory) => {
    setLoading(true);
    try {
      const items = await apiClient.getNews(cat, 20);
      setNewsList(items);
    } catch {
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(category); }, [category, loadNews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiClient.refreshNews();
      setLastRefresh(Date.now());
      await loadNews(category);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenPrefs = async () => {
    const p = await apiClient.getNewsPreferences().catch(() => ({ keywords: [], excludeKeywords: [] }));
    setPrefs(p);
    setShowPrefs(true);
  };

  const savePrefs = async () => {
    await apiClient.saveNewsPreferences(prefs).catch(() => {});
    setShowPrefs(false);
  };

  const addKeyword = (type: 'keywords' | 'excludeKeywords', val: string) => {
    const word = val.trim();
    if (!word || prefs[type].includes(word)) return;
    setPrefs(p => ({ ...p, [type]: [...p[type], word] }));
    if (type === 'keywords') setKeywordInput('');
    else setExcludeInput('');
  };

  const removeKeyword = (type: 'keywords' | 'excludeKeywords', word: string) => {
    setPrefs(p => ({ ...p, [type]: p[type].filter(k => k !== word) }));
  };

  return (
    <div className="card p-0 overflow-hidden animate-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">📰 实时资讯</span>
          {lastRefresh && (
            <span className="text-xs" style={{ color: 'var(--su7-silver)' }}>
              {dayjs(lastRefresh).fromNow()}更新
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenPrefs}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="偏好设置"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="刷新新闻"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Category Tabs */}
          <div className="flex gap-1 px-4 py-2 border-b border-gray-50 overflow-x-auto">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className="shrink-0 px-2.5 py-1 text-xs font-medium rounded-full transition-all"
                style={
                  category === c.key
                    ? { background: c.color + '22', color: c.color, fontWeight: 600 }
                    : { background: '#f5f5f7', color: '#888' }
                }
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* News List */}
          <div className="px-4 py-3 space-y-2 max-h-[420px] overflow-y-auto">
            {loading ? (
              <SkeletonNews />
            ) : newsList.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <div className="text-2xl mb-2">📭</div>
                暂无新闻，点击刷新获取最新资讯
              </div>
            ) : (
              newsList.map(item => (
                <NewsItemRow
                  key={item.id}
                  item={item}
                  onSummarize={(news) => newsSummary.summarize(news, modelConfig)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Preferences Panel */}
      {showPrefs && (
        <PreferencesPanel
          prefs={prefs}
          keywordInput={keywordInput}
          excludeInput={excludeInput}
          onKeywordInputChange={setKeywordInput}
          onExcludeInputChange={setExcludeInput}
          onAddKeyword={addKeyword}
          onRemoveKeyword={removeKeyword}
          onSave={savePrefs}
          onClose={() => setShowPrefs(false)}
        />
      )}

      {/* News Summary Modal */}
      {(newsSummary.generating || newsSummary.summary || newsSummary.error) && (
        <NewsSummaryModal
          generating={newsSummary.generating}
          summary={newsSummary.summary}
          error={newsSummary.error}
          newsTitle={newsSummary.currentNews?.title}
          onClose={newsSummary.clearSummary}
        />
      )}
    </div>
  );
};

// --- News Summary Modal ---
interface NewsSummaryModalProps {
  generating: boolean;
  summary: string | null;
  error: string | null;
  newsTitle?: string;
  onClose: () => void;
}

function NewsSummaryModal({ generating, summary, error, newsTitle, onClose }: NewsSummaryModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">🤖 AI 新闻解读</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {newsTitle && (
          <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b border-gray-100">
            {newsTitle}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mb-3" />
              <p className="text-sm text-gray-500">AI 正在分析新闻...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 text-sm">{error}</div>
          ) : summary ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

interface NewsItemRowProps {
  item: NewsItem;
  onSummarize?: (news: NewsItem) => void;
}

function NewsItemRow({ item, onSummarize }: NewsItemRowProps) {
  const [showReason, setShowReason] = useState(false);
  const catColor = CATEGORIES.find(c => c.key === item.category)?.color ?? '#888';

  return (
    <div
      className="rounded-lg p-3 transition-colors"
      style={{
        background: item.aiRecommended ? '#6B7A3E11' : '#fafafa',
        borderLeft: item.aiRecommended ? '2px solid var(--su7-olive)' : '2px solid transparent',
      }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
          style={{ background: catColor + '22', color: catColor }}
        >
          {item.source}
        </span>
        <span className="text-xs text-gray-400">{dayjs(item.publishedAt).fromNow()}</span>
        <div className="ml-auto">
          <ScoreBadge score={item.aiScore} recommended={item.aiRecommended} />
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-1">
        {item.title}
      </p>

      {/* Summary */}
      {item.summary && (
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-1.5">
          {item.summary}
        </p>
      )}

      {/* AI Reason */}
      {item.aiReason && (
        <button
          onClick={() => setShowReason(r => !r)}
          className="text-xs mb-1.5 flex items-center gap-1"
          style={{ color: 'var(--su7-olive)' }}
        >
          <span>🤖</span>
          {showReason ? item.aiReason : '查看AI推荐理由'}
        </button>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs hover:underline"
          style={{ color: 'var(--su7-sky)' }}
        >
          阅读原文 →
        </a>
        {onSummarize && (
          <button
            onClick={() => onSummarize(item)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            AI解读
          </button>
        )}
      </div>
    </div>
  );
}

interface PrefsPanelProps {
  prefs: NewsPreferences;
  keywordInput: string;
  excludeInput: string;
  onKeywordInputChange: (v: string) => void;
  onExcludeInputChange: (v: string) => void;
  onAddKeyword: (type: 'keywords' | 'excludeKeywords', val: string) => void;
  onRemoveKeyword: (type: 'keywords' | 'excludeKeywords', word: string) => void;
  onSave: () => void;
  onClose: () => void;
}

function PreferencesPanel({
  prefs, keywordInput, excludeInput,
  onKeywordInputChange, onExcludeInputChange,
  onAddKeyword, onRemoveKeyword, onSave, onClose
}: PrefsPanelProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">AI 阅读偏好</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="text-xs text-gray-500">
          设置你感兴趣的关键词，AI刷新时自动评分并标注推荐新闻。
        </div>
        <KeywordSection
          label="感兴趣的主题"
          hint="如：大模型、亚马逊、A股"
          keywords={prefs.keywords}
          input={keywordInput}
          color="var(--su7-olive)"
          onInputChange={onKeywordInputChange}
          onAdd={v => onAddKeyword('keywords', v)}
          onRemove={w => onRemoveKeyword('keywords', w)}
        />
        <KeywordSection
          label="屏蔽的主题"
          hint="如：明星、娱乐"
          keywords={prefs.excludeKeywords}
          input={excludeInput}
          color="#E07B3A"
          onInputChange={onExcludeInputChange}
          onAdd={v => onAddKeyword('excludeKeywords', v)}
          onRemove={w => onRemoveKeyword('excludeKeywords', w)}
        />
        <button onClick={onSave} className="w-full btn-olive py-2 rounded-lg text-sm font-medium">
          保存偏好
        </button>
      </div>
    </div>
  );
}

interface KeywordSectionProps {
  label: string;
  hint: string;
  keywords: string[];
  input: string;
  color: string;
  onInputChange: (v: string) => void;
  onAdd: (v: string) => void;
  onRemove: (w: string) => void;
}

function KeywordSection({ label, hint, keywords, input, color, onInputChange, onAdd, onRemove }: KeywordSectionProps) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-600 mb-1.5">{label}</div>
      <div className="flex gap-1 flex-wrap mb-1.5 min-h-[28px]">
        {keywords.map(w => (
          <span
            key={w}
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full cursor-pointer"
            style={{ background: color + '22', color }}
            onClick={() => onRemove(w)}
          >
            {w} ✕
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd(input)}
          placeholder={hint}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-400"
        />
        <button
          onClick={() => onAdd(input)}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
        >
          添加
        </button>
      </div>
    </div>
  );
}
