/**
 * 新闻收集器核心模块
 * 负责协调 RSS 和 API 源的新闻抓取
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { NewsSource, NewsConfig, NewsItem, FetchResult, CollectorStats } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { rssParser } from '../parsers/rss-parser.js';
import { apiParser } from '../parsers/api-parser.js';
import { HttpClient } from '../utils/http-client.js';
import { NewsStorage } from '../storage/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NewsCollector {
  private config: NewsConfig;
  private httpClient: HttpClient;
  private storage: NewsStorage;
  private lastFetchTimes: Map<string, number> = new Map();
  private errors: Array<{ sourceId: string; error: string; timestamp: Date }> = [];

  constructor(configPath?: string, dataDir?: string) {
    // 加载配置
    const defaultConfigPath = path.join(__dirname, '../../config/news-sources.json');
    const actualConfigPath = configPath || process.env.NEWS_CONFIG_PATH || defaultConfigPath;
    this.config = this.loadConfig(actualConfigPath);

    // 初始化 HTTP 客户端
    const { rateLimit, userAgent, requestTimeout, maxRetries, retryDelay } = this.config.settings;
    this.httpClient = new HttpClient(rateLimit, userAgent, requestTimeout, maxRetries, retryDelay);

    // 初始化存储
    this.storage = new NewsStorage({
      dataDir: dataDir || process.env.NEWS_DATA_DIR || './data',
      maxItemsPerSource: 1000,
      retentionDays: 30,
    });
  }

  /**
   * 加载配置文件
   */
  private loadConfig(configPath: string): NewsConfig {
    try {
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configData) as NewsConfig;
      
      // 处理环境变量替换
      this.processEnvVariables(config);
      
      logger.info('Configuration loaded', 'collector', { path: configPath });
      return config;
    } catch (error) {
      logger.error(`Failed to load config: ${error instanceof Error ? error.message : 'Unknown error'}`, 'collector');
      // 返回默认配置
      return {
        sources: [],
        settings: {
          defaultFetchInterval: 3600000,
          maxRetries: 3,
          retryDelay: 5000,
          requestTimeout: 30000,
          userAgent: 'NewsCollector/1.0',
          respectRobotsTxt: true,
          rateLimit: {
            requestsPerMinute: 30,
            requestsPerHour: 500,
          },
        },
      };
    }
  }

  /**
   * 处理配置文件中的环境变量替换
   */
  private processEnvVariables(config: NewsConfig): void {
    const envPattern = /\$\{(\w+)\}/g;
    
    for (const source of config.sources) {
      if (source.headers) {
        for (const [key, value] of Object.entries(source.headers)) {
          source.headers[key] = value.replace(envPattern, (_, envVar) => {
            return process.env[envVar] || value;
          });
        }
      }
    }
  }

  /**
   * 获取所有启用的源
   */
  getEnabledSources(): NewsSource[] {
    return this.config.sources.filter((source) => source.enabled);
  }

  /**
   * 抓取单个源的新闻
   */
  async fetchSource(source: NewsSource): Promise<FetchResult> {
    const startTime = Date.now();
    logger.info(`Starting fetch for ${source.name}`, source.id);

    try {
      // 检查是否距离上次抓取时间太短
      const lastFetch = this.lastFetchTimes.get(source.id) || 0;
      const minInterval = source.fetchInterval || this.config.settings.defaultFetchInterval;
      if (Date.now() - lastFetch < minInterval) {
        logger.debug('Skipping source (too soon)', source.id);
        return {
          success: false,
          sourceId: source.id,
          sourceName: source.name,
          itemsCount: 0,
          newItemsCount: 0,
          error: 'Too soon since last fetch',
          duration: 0,
          timestamp: new Date(),
        };
      }

      // 发送请求
      const response = await this.httpClient.get(source.url, {
        headers: source.headers,
        params: source.params,
      });

      // 解析响应
      let items: NewsItem[] = [];
      if (source.type === 'rss') {
        items = rssParser.parse(response.data, source.id, source.name, source.category, source.language);
      } else if (source.type === 'api') {
        const data = JSON.parse(response.data);
        items = apiParser.parse(data, source.id, source.name, source.category, source.language, source.responsePath);
      }

      // 保存到存储
      const { saved, skipped } = this.storage.saveBatch(items);

      // 更新最后抓取时间
      this.lastFetchTimes.set(source.id, Date.now());

      const duration = Date.now() - startTime;
      logger.logFetchResult(source.id, source.name, items.length, duration);

      return {
        success: true,
        sourceId: source.id,
        sourceName: source.name,
        itemsCount: items.length,
        newItemsCount: saved,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.logError(source.id, error instanceof Error ? error : new Error(errorMessage));
      
      // 记录错误
      this.errors.push({
        sourceId: source.id,
        error: errorMessage,
        timestamp: new Date(),
      });

      // 保留最近 100 条错误
      if (this.errors.length > 100) {
        this.errors = this.errors.slice(-100);
      }

      return {
        success: false,
        sourceId: source.id,
        sourceName: source.name,
        itemsCount: 0,
        newItemsCount: 0,
        error: errorMessage,
        duration,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 抓取所有启用的源
   */
  async fetchAll(): Promise<FetchResult[]> {
    const sources = this.getEnabledSources();
    logger.info(`Starting batch fetch for ${sources.length} sources`, 'collector');

    const results: FetchResult[] = [];
    
    for (const source of sources) {
      const result = await this.fetchSource(source);
      results.push(result);
      
      // 源之间添加小延迟，避免同时请求
      if (sources.indexOf(source) < sources.length - 1) {
        await this.sleep(1000);
      }
    }

    // 汇总统计
    const totalItems = results.reduce((sum, r) => sum + r.itemsCount, 0);
    const totalNewItems = results.reduce((sum, r) => sum + r.newItemsCount, 0);
    const failedCount = results.filter((r) => !r.success).length;

    logger.info('Batch fetch completed', 'collector', {
      totalSources: sources.length,
      totalItems,
      newItems: totalNewItems,
      failed: failedCount,
    });

    return results;
  }

  /**
   * 并行抓取所有源（更快但可能触发速率限制）
   */
  async fetchAllParallel(concurrency: number = 5): Promise<FetchResult[]> {
    const sources = this.getEnabledSources();
    logger.info(`Starting parallel fetch for ${sources.length} sources (concurrency: ${concurrency})`, 'collector');

    const results: FetchResult[] = [];
    const queue = [...sources];
    const inProgress = new Set<Promise<FetchResult>>();

    while (queue.length > 0 || inProgress.size > 0) {
      // 填充并发任务
      while (inProgress.size < concurrency && queue.length > 0) {
        const source = queue.shift()!;
        const promise = this.fetchSource(source);
        inProgress.add(promise);
        
        promise.then((result) => {
          results.push(result);
          inProgress.delete(promise);
        });
      }

      // 等待至少一个任务完成
      if (inProgress.size > 0) {
        await Promise.race(inProgress);
      }
    }

    return results;
  }

  /**
   * 获取统计信息
   */
  getStats(): CollectorStats {
    const storageStats = this.storage.getStats();
    const enabledSources = this.getEnabledSources();

    return {
      totalSources: this.config.sources.length,
      enabledSources: enabledSources.length,
      totalItems: storageStats.total,
      newItemsToday: this.storage.getTodayCount(),
      lastFetchTime: this.getLastFetchTime(),
      errors: [...this.errors],
    };
  }

  /**
   * 获取最后抓取时间
   */
  private getLastFetchTime(): Date | undefined {
    let latest: number | undefined;
    for (const time of this.lastFetchTimes.values()) {
      if (latest === undefined || time > latest) {
        latest = time;
      }
    }
    return latest ? new Date(latest) : undefined;
  }

  /**
   * 清理旧数据
   */
  cleanup(): number {
    return this.storage.cleanup();
  }

  /**
   * 导出新闻
   */
  export(format: 'json' | 'csv' = 'json', options?: Record<string, unknown>): string {
    if (format === 'json') {
      return this.storage.export(options);
    } else {
      return this.storage.exportCSV(options);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 导出单例工厂函数
export function createCollector(configPath?: string, dataDir?: string): NewsCollector {
  return new NewsCollector(configPath, dataDir);
}
