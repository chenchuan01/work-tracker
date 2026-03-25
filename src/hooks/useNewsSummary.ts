import { useState } from 'react';
import { generateNewsSummary, ModelConfig, NewsItem } from '../utils/newsSummary';

export const useNewsSummary = () => {
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentNews, setCurrentNews] = useState<NewsItem | null>(null);

  const summarize = async (news: NewsItem, config?: ModelConfig) => {
    setGenerating(true);
    setError(null);
    setCurrentNews(news);
    setSummary(null);

    try {
      const result = await generateNewsSummary(news, config);
      setSummary(result);
    } catch (err) {
      setError('生成失败，请重试');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const clearSummary = () => {
    setSummary(null);
    setError(null);
    setCurrentNews(null);
  };

  return {
    generating,
    summary,
    error,
    currentNews,
    summarize,
    clearSummary,
  };
};
