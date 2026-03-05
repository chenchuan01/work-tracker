/**
 * 新闻收集系统类型定义
 */

export interface NewsSource {
  id: string;
  name: string;
  type: 'rss' | 'api';
  url: string;
  category: string;
  language: string;
  enabled: boolean;
  fetchInterval?: number;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  responsePath?: string;
}

export interface SourceSettings {
  defaultFetchInterval: number;
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
  userAgent: string;
  respectRobotsTxt: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface NewsConfig {
  sources: NewsSource[];
  settings: SourceSettings;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  content?: string;
  pubDate: Date;
  author?: string;
  source: string;
  sourceId: string;
  category: string;
  language: string;
  imageUrl?: string;
  tags?: string[];
  fetchedAt: Date;
  hash: string;
}

export interface FetchResult {
  success: boolean;
  sourceId: string;
  sourceName: string;
  itemsCount: number;
  newItemsCount: number;
  error?: string;
  duration: number;
  timestamp: Date;
}

export interface CollectorStats {
  totalSources: number;
  enabledSources: number;
  totalItems: number;
  newItemsToday: number;
  lastFetchTime?: Date;
  errors: Array<{
    sourceId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  source?: string;
  data?: unknown;
}

export interface StorageOptions {
  dataDir: string;
  maxItemsPerSource: number;
  retentionDays: number;
}
