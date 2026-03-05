import { useState, useEffect, useCallback } from 'react';
import { NewsItem, getNewsList, getNextNewsFromQueue, initializeOrRefillQueue, refreshNewsFromCollector } from '../data/news';
import dayjs from 'dayjs';

interface NewsCardProps {
  onSummarize?: (news: NewsItem) => void;
}

export const NewsCard = ({ onSummarize }: NewsCardProps) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'ai' | 'xiaomi' | 'technology' | 'general'>('all');
  const [expanded, setExpanded] = useState(true);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  const loadNews = useCallback(async () => {
    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    const news = await getNewsList(category, 6, 20);
    setNewsList(news);
    return news;
  }, [selectedCategory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 从 news-collector 重新加载数据
      await refreshNewsFromCollector();
      // 重置队列
      await initializeOrRefillQueue(20);
      await loadNews();

      const now = Date.now();
      setLastRefreshTime(now);
    } catch (error) {
      console.error('刷新新闻失败:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadNews]);

  // 处理"看过"按钮点击
  const handleWatched = useCallback(async (newsId: string) => {
    const category = selectedCategory === 'all' ? undefined : selectedCategory;
    const nextNews = await getNextNewsFromQueue(newsId, category);
    if (nextNews) {
      // 替换当前新闻为下一条
      setNewsList(prev => {
        const index = prev.findIndex(n => n.id === newsId);
        if (index === -1) return prev;
        const newList = [...prev];
        newList[index] = nextNews;
        return newList;
      });
    } else {
      // 没有更多新闻，从列表中移除
      setNewsList(prev => prev.filter(n => n.id !== newsId));
    }
  }, [selectedCategory]);

  // 初始加载
  useEffect(() => {
    const now = Date.now();
    setLastRefreshTime(now);
    loadNews();
  }, [loadNews]);

  // 分类切换时重新加载
  useEffect(() => {
    loadNews();
  }, [selectedCategory, loadNews]);

  const displayNews = newsList.slice(0, 6); // 最多显示 6 条

  const handleSummarize = (news: NewsItem) => {
    if (onSummarize) {
      onSummarize(news);
    }
  };

  const formatRefreshTime = (timestamp: number) => {
    return dayjs(timestamp).format('MM-DD HH:mm');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span>📰</span> 最新资讯
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            title="刷新新闻"
          >
            <svg 
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
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
      </div>

      {/* 分类切换 */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setSelectedCategory('general')}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            selectedCategory === 'general'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📰 新浪新闻
        </button>
        <button
          onClick={() => setSelectedCategory('xiaomi')}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            selectedCategory === 'xiaomi'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💬 雷军微博
        </button>
        <button
          onClick={() => setSelectedCategory('technology')}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            selectedCategory === 'technology'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          💻 科技
        </button>
      </div>

      {/* 刷新时间提示 */}
      <div className="mb-3 text-xs text-gray-500 flex items-center justify-between">
        <span>近 3 天资讯</span>
        <span>更新于：{formatRefreshTime(lastRefreshTime)}</span>
      </div>

      {/* 新闻列表 */}
      {expanded && (
        <div className="space-y-3">
          {displayNews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              暂无新资讯，点击刷新按钮获取更多内容
            </div>
          ) : (
            displayNews.map((news) => (
              <div
                key={news.id}
                className={`border rounded-lg p-3 hover:shadow-sm transition-shadow ${
                  news.category === 'general'
                    ? 'border-red-200 bg-red-50'
                    : news.category === 'xiaomi'
                    ? 'border-orange-200 bg-orange-50'
                    : news.category === 'technology'
                    ? 'border-green-200 bg-green-50'
                    : 'border-purple-200 bg-purple-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    {news.source} · {news.publishedAt}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white text-gray-600">
                    {news.category === 'general' ? '📰' :
                     news.category === 'xiaomi' ? '💬' :
                     news.category === 'technology' ? '💻' : '🤖'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                  {news.title}
                </h4>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
                  >
                    🔗 阅读原文
                  </a>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSummarize(news)}
                      className="px-2 py-1 text-xs bg-[#629DF2] text-white rounded hover:bg-[#4A85E8] transition-colors flex items-center gap-1"
                    >
                      ✨ 总结
                    </button>
                    <button
                      onClick={() => handleWatched(news.id)}
                      className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                      title="看过"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 收起状态提示 */}
      {!expanded && (
        <p className="text-sm text-gray-500 text-center py-4">
          共 {newsList.length} 条新闻，点击展开查看
        </p>
      )}
    </div>
  );
};
