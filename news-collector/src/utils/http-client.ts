/**
 * HTTP 请求模块
 * 支持速率限制、重试、超时等功能
 */

import { logger } from '../utils/logger.js';

export interface RequestConfig {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface Response {
  status: number;
  headers: Record<string, string>;
  data: string;
}

/**
 * 速率限制器
 */
class RateLimiter {
  private requests: number[] = [];
  private requestsPerMinute: number;
  private requestsPerHour: number;

  constructor(requestsPerMinute: number = 30, requestsPerHour: number = 500) {
    this.requestsPerMinute = requestsPerMinute;
    this.requestsPerHour = requestsPerHour;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // 清理旧请求记录
    this.requests = this.requests.filter((t) => t > oneHourAgo);

    // 检查小时限制
    const hourRequests = this.requests.filter((t) => t > oneHourAgo).length;
    if (hourRequests >= this.requestsPerHour) {
      const oldestHourRequest = Math.min(...this.requests.filter((t) => t > oneHourAgo));
      const waitTime = oldestHourRequest + 60 * 60 * 1000 - now;
      if (waitTime > 0) {
        logger.info('Rate limit (hourly) reached, waiting', 'http', { waitTime: `${waitTime}ms` });
        await this.sleep(waitTime);
        return this.wait();
      }
    }

    // 检查分钟限制
    const minuteRequests = this.requests.filter((t) => t > oneMinuteAgo).length;
    if (minuteRequests >= this.requestsPerMinute) {
      const oldestMinuteRequest = Math.min(...this.requests.filter((t) => t > oneMinuteAgo));
      const waitTime = oldestMinuteRequest + 60 * 1000 - now;
      if (waitTime > 0) {
        logger.info('Rate limit (per minute) reached, waiting', 'http', { waitTime: `${waitTime}ms` });
        await this.sleep(waitTime);
        return this.wait();
      }
    }

    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * HTTP 请求客户端
 */
export class HttpClient {
  private rateLimiter: RateLimiter;
  private userAgent: string;
  private defaultTimeout: number;
  private defaultMaxRetries: number;
  private defaultRetryDelay: number;

  constructor(
    rateLimit: { requestsPerMinute: number; requestsPerHour: number } = { requestsPerMinute: 30, requestsPerHour: 500 },
    userAgent: string = 'NewsCollector/1.0',
    timeout: number = 30000,
    maxRetries: number = 3,
    retryDelay: number = 5000
  ) {
    this.rateLimiter = new RateLimiter(rateLimit.requestsPerMinute, rateLimit.requestsPerHour);
    this.userAgent = userAgent;
    this.defaultTimeout = timeout;
    this.defaultMaxRetries = maxRetries;
    this.defaultRetryDelay = retryDelay;
  }

  /**
   * 发送 HTTP 请求
   */
  async request(config: RequestConfig): Promise<Response> {
    const {
      url,
      method = 'GET',
      headers = {},
      params = {},
      timeout = this.defaultTimeout,
      maxRetries = this.defaultMaxRetries,
      retryDelay = this.defaultRetryDelay,
    } = config;

    // 构建完整 URL
    const fullUrl = this.buildUrl(url, params);

    // 合并默认 headers
    const allHeaders = {
      'User-Agent': this.userAgent,
      'Accept': 'application/xml,application/rss+xml,application/json,text/html,*/*',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      ...headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 等待速率限制
        await this.rateLimiter.wait();

        logger.debug(`HTTP Request: ${method} ${fullUrl}`, 'http', { attempt });

        const response = await fetch(fullUrl, {
          method,
          headers: allHeaders,
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.text();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        logger.debug(`HTTP Response: ${response.status}`, 'http', { url: fullUrl });

        return {
          status: response.status,
          headers: responseHeaders,
          data,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 检查是否是可重试的错误
        const isRetryable = this.isRetryableError(lastError);
        
        if (attempt < maxRetries && isRetryable) {
          const delay = retryDelay * attempt; // 指数退避
          logger.warn(`Request failed, retrying in ${delay}ms`, 'http', { 
            url: fullUrl, 
            error: lastError.message,
            attempt: `${attempt}/${maxRetries}`
          });
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    throw lastError || new Error('Request failed');
  }

  /**
   * GET 请求
   */
  async get(url: string, config: Omit<RequestConfig, 'url' | 'method'> = {}): Promise<Response> {
    return this.request({ ...config, url, method: 'GET' });
  }

  /**
   * 构建带参数的 URL
   */
  private buildUrl(url: string, params: Record<string, string>): string {
    if (Object.keys(params).length === 0) {
      return url;
    }

    const urlObj = new URL(url);
    for (const [key, value] of Object.entries(params)) {
      urlObj.searchParams.append(key, value);
    }
    return urlObj.toString();
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    // 可重试的错误：网络错误、超时、5xx 服务器错误
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('http 5') ||
      message.includes('fetch failed')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const httpClient = new HttpClient();
