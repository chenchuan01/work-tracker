/**
 * 定时任务调度器
 * 支持 cron 表达式和固定间隔调度
 */

import { NewsCollector } from '../collector/news-collector.js';
import { logger } from '../utils/logger.js';

export interface ScheduleConfig {
  /** cron 表达式 (格式：分 时 日 月 周) */
  cron?: string;
  /** 固定间隔（毫秒），与 cron 互斥 */
  interval?: number;
  /** 是否在启动时立即执行一次 */
  runOnStart?: boolean;
  /** 是否在每天午夜清理旧数据 */
  cleanupAtMidnight?: boolean;
}

export interface SchedulerStats {
  isRunning: boolean;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  errorCount: number;
}

/**
 * 解析 cron 表达式（简化版本）
 * 支持格式：分 时 日 月 周
 */
class SimpleCronParser {
  private expression: string;
  private parts: number[][];

  constructor(expression: string) {
    this.expression = expression;
    this.parts = this.parse(expression);
  }

  private parse(expression: string): number[][] {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression: expected 5 parts');
    }

    return parts.map((part, index) => {
      const ranges = this.getRange(index);
      return this.parsePart(part, ranges);
    });
  }

  private getRange(index: number): [number, number] {
    // 分 (0-59), 时 (0-23), 日 (1-31), 月 (1-12), 周 (0-6)
    const ranges: [number, number][] = [
      [0, 59],  // 分钟
      [0, 23],  // 小时
      [1, 31],  // 日期
      [1, 12],  // 月份
      [0, 6],   // 星期
    ];
    return ranges[index];
  }

  private parsePart(part: string, [min, max]: [number, number]): number[] {
    if (part === '*') {
      return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }

    if (part.includes('/')) {
      const [base, step] = part.split('/');
      const stepNum = parseInt(step, 10);
      const start = base === '*' ? min : parseInt(base, 10);
      const values: number[] = [];
      for (let i = start; i <= max; i += stepNum) {
        values.push(i);
      }
      return values;
    }

    if (part.includes(',')) {
      return part.split(',').map((s) => parseInt(s.trim(), 10));
    }

    if (part.includes('-')) {
      const [start, end] = part.split('-').map((s) => parseInt(s, 10));
      return Array.from({ length: end - start + 1 }, (_, i) => i + start);
    }

    return [parseInt(part, 10)];
  }

  /**
   * 计算下一次执行时间
   */
  getNextRun(from: Date = new Date()): Date {
    const date = new Date(from);
    date.setSeconds(0, 0);
    date.setMinutes(date.getMinutes() + 1);

    // 最多查找一年
    const maxIterations = 365 * 24 * 60;
    
    for (let i = 0; i < maxIterations; i++) {
      if (this.matches(date)) {
        return date;
      }
      date.setMinutes(date.getMinutes() + 1);
    }

    throw new Error('Could not find next run time within a year');
  }

  private matches(date: Date): boolean {
    const [minutes, hours, days, months, weekdays] = this.parts;
    
    const minute = date.getMinutes();
    const hour = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const weekday = date.getDay();

    return (
      minutes.includes(minute) &&
      hours.includes(hour) &&
      (days.includes(day) || days[0] === 1 && days[days.length - 1] === 31) && // 如果包含所有日期则忽略
      months.includes(month) &&
      (weekdays.includes(weekday) || weekdays[0] === 0 && weekdays[weekdays.length - 1] === 6) // 如果包含所有星期则忽略
    );
  }
}

export class Scheduler {
  private collector: NewsCollector;
  private config: ScheduleConfig;
  private isRunning: boolean = false;
  private timer?: NodeJS.Timeout;
  private cronParser?: SimpleCronParser;
  private nextRunTime?: Date;
  private lastRunTime?: Date;
  private runCount: number = 0;
  private errorCount: number = 0;

  constructor(collector: NewsCollector, config: ScheduleConfig) {
    this.collector = collector;
    this.config = config;

    if (config.cron) {
      this.cronParser = new SimpleCronParser(config.cron);
    }
  }

  /**
   * 启动调度器
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running', 'scheduler');
      return;
    }

    this.isRunning = true;
    logger.info('Scheduler started', 'scheduler', { 
      cron: this.config.cron,
      interval: this.config.interval,
    });

    // 启动时立即执行
    if (this.config.runOnStart) {
      this.run().catch((error) => {
        logger.error('Failed to run on start', 'scheduler', error);
      });
    }

    // 设置下一次执行
    this.scheduleNext();

    // 午夜清理
    if (this.config.cleanupAtMidnight) {
      this.scheduleCleanup();
    }
  }

  /**
   * 停止调度器
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    logger.info('Scheduler stopped', 'scheduler');
  }

  /**
   * 调度下一次执行
   */
  private scheduleNext(): void {
    if (!this.isRunning) return;

    let delay: number;

    if (this.cronParser) {
      // cron 模式
      try {
        this.nextRunTime = this.cronParser.getNextRun();
        delay = this.nextRunTime.getTime() - Date.now();
      } catch (error) {
        logger.error('Failed to calculate next cron run', 'scheduler', error);
        delay = 60000; // 默认 1 分钟后重试
        this.nextRunTime = new Date(Date.now() + delay);
      }
    } else if (this.config.interval) {
      // 固定间隔模式
      delay = this.config.interval;
      this.nextRunTime = new Date(Date.now() + delay);
    } else {
      logger.error('No schedule configured', 'scheduler');
      return;
    }

    if (delay < 0) delay = 0;

    logger.info('Next run scheduled', 'scheduler', { 
      nextRun: this.nextRunTime.toISOString(),
      delay: `${delay}ms`,
    });

    this.timer = setTimeout(() => {
      if (this.isRunning) {
        this.run().finally(() => this.scheduleNext());
      }
    }, delay);
  }

  /**
   * 执行抓取任务
   */
  private async run(): Promise<void> {
    logger.info('Starting scheduled fetch', 'scheduler');
    this.lastRunTime = new Date();

    try {
      const results = await this.collector.fetchAll();
      this.runCount++;

      const successCount = results.filter((r) => r.success).length;
      const totalItems = results.reduce((sum, r) => sum + r.itemsCount, 0);
      const newItems = results.reduce((sum, r) => sum + r.newItemsCount, 0);

      logger.info('Scheduled fetch completed', 'scheduler', {
        success: `${successCount}/${results.length}`,
        totalItems,
        newItems,
      });
    } catch (error) {
      this.errorCount++;
      logger.error('Scheduled fetch failed', 'scheduler', error);
    }
  }

  /**
   * 调度午夜清理任务
   */
  private scheduleCleanup(): void {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    const delay = midnight.getTime() - now.getTime();

    logger.info('Cleanup scheduled', 'scheduler', { 
      nextCleanup: midnight.toISOString(),
      delay: `${delay}ms`,
    });

    setTimeout(() => {
      if (this.isRunning) {
        const deleted = this.collector.cleanup();
        logger.info('Cleanup completed', 'scheduler', { deleted });
        this.scheduleCleanup();
      }
    }, delay);
  }

  /**
   * 获取调度器状态
   */
  getStats(): SchedulerStats {
    return {
      isRunning: this.isRunning,
      nextRun: this.nextRunTime,
      lastRun: this.lastRunTime,
      runCount: this.runCount,
      errorCount: this.errorCount,
    };
  }

  /**
   * 立即执行一次
   */
  async runNow(): Promise<void> {
    await this.run();
  }
}

/**
 * 创建并启动调度器
 */
export async function createAndStartScheduler(
  configPath?: string,
  dataDir?: string,
  scheduleConfig?: ScheduleConfig
): Promise<Scheduler> {
  const collector = new NewsCollector(configPath, dataDir);
  
  const defaultSchedule: ScheduleConfig = {
    cron: '0 */6 * * *', // 每 6 小时
    runOnStart: true,
    cleanupAtMidnight: true,
  };

  const scheduler = new Scheduler(collector, scheduleConfig || defaultSchedule);
  scheduler.start();

  return scheduler;
}
