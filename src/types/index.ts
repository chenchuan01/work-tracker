export interface WorkRecord {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  workDate: string;
  isImportant?: boolean;
  tags?: string[];
}

export type TodoStatus = 'pending' | 'in-progress' | 'completed';

export interface Todo {
  id: string;
  content: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  status: TodoStatus;
}

export interface WorkSummary {
  id: string;
  content: string;
  summaryType: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  createdAt: number;
  sourceRecordIds: string[];
}

export type ViewType = 'day' | 'week' | 'month';
export type InputMode = 'record' | 'todo';

// News types
export type NewsCategory = 'all' | 'finance' | 'ai' | 'ecommerce' | 'tech';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  summary: string;
  source: string;
  category: Exclude<NewsCategory, 'all'>;
  publishedAt: string;
  aiScore: number;
  aiRecommended: boolean;
  aiReason?: string;
}

export interface NewsPreferences {
  keywords: string[];
  excludeKeywords: string[];
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  type: string;
  enabled: number;
}

