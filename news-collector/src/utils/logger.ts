/**
 * 日志记录模块
 * 提供统一的日志记录功能，支持控制台输出和文件存储
 */

import * as fs from 'fs';
import * as path from 'path';
import type { LogEntry } from '../types/index.js';

export class Logger {
  private logFile: string;
  private logLevel: 'debug' | 'info' | 'warn' | 'error';
  private maxFileSize: number;

  constructor(logDir: string = './logs', logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    
    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const dateStr = new Date().toISOString().split('T')[0];
    this.logFile = path.join(logDir, `news-collector-${dateStr}.log`);
    
    // 检查文件大小，如果过大则轮转
    this.rotateLogIfNeeded();
  }

  private rotateLogIfNeeded(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.maxFileSize) {
          const backupFile = `${this.logFile}.${Date.now()}.bak`;
          fs.renameSync(this.logFile, backupFile);
        }
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private formatEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const source = entry.source ? `[${entry.source}] ` : '';
    const message = typeof entry.data !== 'undefined' 
      ? `${entry.message} ${JSON.stringify(entry.data)}`
      : entry.message;
    return `[${timestamp}] [${entry.level.toUpperCase()}] ${source}${message}\n`;
  }

  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const line = this.formatEntry(entry);
    
    // 控制台输出
    const consoleMethod = entry.level === 'error' ? 'error' : 
                        entry.level === 'warn' ? 'warn' : 'log';
    console[consoleMethod](line.trim());

    // 文件写入
    try {
      fs.appendFileSync(this.logFile, line);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  debug(message: string, source?: string, data?: unknown): void {
    this.write({ level: 'debug', message, timestamp: new Date(), source, data });
  }

  info(message: string, source?: string, data?: unknown): void {
    this.write({ level: 'info', message, timestamp: new Date(), source, data });
  }

  warn(message: string, source?: string, data?: unknown): void {
    this.write({ level: 'warn', message, timestamp: new Date(), source, data });
  }

  error(message: string, source?: string, data?: unknown): void {
    this.write({ level: 'error', message, timestamp: new Date(), source, data });
  }

  /**
   * 记录新闻抓取结果
   */
  logFetchResult(sourceId: string, sourceName: string, itemsCount: number, duration: number): void {
    this.info(
      `Fetched ${itemsCount} items from ${sourceName}`,
      sourceId,
      { duration: `${duration}ms` }
    );
  }

  /**
   * 记录错误
   */
  logError(sourceId: string, error: Error): void {
    this.error(
      `Error fetching news: ${error.message}`,
      sourceId,
      { stack: error.stack }
    );
  }
}

// 导出单例实例
export const logger = new Logger();
