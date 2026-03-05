import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { WorkRecord } from '../types';
import { generateId } from '../utils/date';

export const useRecords = () => {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    try {
      const data = await apiClient.getRecords();
      const recordsData: WorkRecord[] = data.map((row: any) => ({
        id: row.id,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        workDate: row.workDate,
        isImportant: row.isImportant === 1,
        tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || [],
      }));
      setRecords(recordsData);
    } catch (error) {
      console.error('加载记录失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const addRecord = async (content: string, workDate?: string) => {
    const record: WorkRecord = {
      id: generateId(),
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      workDate: workDate || new Date().toISOString().split('T')[0],
      isImportant: false,
      tags: [],
    };

    await apiClient.createRecord(record);
    await loadRecords();
    return record;
  };

  const updateRecord = async (id: string, updates: Partial<WorkRecord>) => {
    await apiClient.updateRecord(id, updates);
    await loadRecords();
  };

  const deleteRecord = async (id: string) => {
    await apiClient.deleteRecord(id);
    await loadRecords();
  };

  const getRecordsByDateRange = (startDate: string, endDate: string) => {
    return records.filter(r => r.workDate >= startDate && r.workDate <= endDate);
  };

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDateRange,
    refresh: loadRecords,
  };
};
