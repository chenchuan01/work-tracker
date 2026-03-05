import { useState } from 'react';
import { WorkRecord } from '../types';
import { generateSummary, ModelConfig } from '../utils/prompt';
import { getDateRange, formatDisplayDate } from '../utils/date';

export const useSummary = () => {
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateWorkSummary = async (
    records: WorkRecord[],
    viewType: 'day' | 'week' | 'month',
    currentDate: string,
    config?: ModelConfig
  ) => {
    setGenerating(true);
    setError(null);

    try {
      const dateRange = getDateRange(viewType, currentDate);
      const filteredRecords = records.filter(
        r => r.workDate >= dateRange.start && r.workDate <= dateRange.end
      );

      if (filteredRecords.length === 0) {
        setSummary('暂无工作记录');
        return;
      }

      const dateRangeText = `${formatDisplayDate(dateRange.start)} - ${formatDisplayDate(dateRange.end)}`;
      const result = await generateSummary(filteredRecords, dateRangeText, config);
      setSummary(result);
    } catch (err) {
      setError('生成失败，请重试');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const generateCustomSummary = async (
    content: string,
    title?: string,
    config?: ModelConfig
  ) => {
    setGenerating(true);
    setError(null);

    try {
      const result = await generateSummary(
        [{ content }],
        title || '自定义内容',
        config
      );
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
  };

  return {
    generating,
    summary,
    error,
    generateWorkSummary,
    generateCustomSummary,
    clearSummary,
    setSummary,
    setGenerating,
    setError,
  };
};
