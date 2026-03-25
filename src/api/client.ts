import { NewsItem, NewsCategory, NewsPreferences } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Todos API
  async getTodos() {
    return this.request<any[]>('/todos');
  }

  async createTodo(todo: any) {
    return this.request('/todos', {
      method: 'POST',
      body: JSON.stringify(todo),
    });
  }

  async updateTodo(id: string, updates: any) {
    return this.request(`/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTodo(id: string) {
    return this.request(`/todos/${id}`, {
      method: 'DELETE',
    });
  }

  // Records API
  async getRecords() {
    return this.request<any[]>('/records');
  }

  async createRecord(record: any) {
    return this.request('/records', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async updateRecord(id: string, updates: any) {
    return this.request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRecord(id: string) {
    return this.request(`/records/${id}`, {
      method: 'DELETE',
    });
  }

  // Mood API
  async getMoodEntries() {
    return this.request<any[]>('/mood');
  }

  async createMoodEntry(entry: any) {
    return this.request('/mood', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async deleteMoodEntry(id: string) {
    return this.request(`/mood/${id}`, {
      method: 'DELETE',
    });
  }

  // Config API
  async getConfig<T>(key: string): Promise<T | null> {
    const result = await this.request<{ value: T | null }>(`/config/${key}`);
    return result.value;
  }

  async setConfig(key: string, value: any) {
    return this.request(`/config/${key}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    });
  }

  // News API
  async getNews(category?: NewsCategory, limit = 30): Promise<NewsItem[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    params.set('limit', String(limit));
    return this.request<NewsItem[]>(`/news?${params.toString()}`);
  }

  async refreshNews(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/news/refresh', { method: 'POST' });
  }

  async getNewsPreferences(): Promise<NewsPreferences> {
    return this.request<NewsPreferences>('/news/preferences');
  }

  async saveNewsPreferences(prefs: NewsPreferences): Promise<void> {
    await this.request('/news/preferences', {
      method: 'POST',
      body: JSON.stringify(prefs),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
