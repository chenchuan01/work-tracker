#!/usr/bin/env node
/**
 * 新闻收集系统 CLI 入口
 * 
 * 用法:
 *   npm run news:fetch     - 执行一次新闻抓取
 *   npm run news:schedule  - 启动定时任务调度器
 *   npm run news:stats     - 显示统计信息
 *   npm run news:export    - 导出新闻数据
 *   npm run news:cleanup   - 清理旧数据
 */

import { fileURLToPath } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { NewsCollector } from './collector/news-collector.js';
import { Scheduler, createAndStartScheduler } from './scheduler/scheduler.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
新闻收集系统 - 命令行工具

用法:
  npm run news:<command> [options]

命令:
  fetch       执行一次新闻抓取
  schedule    启动定时任务调度器
  stats       显示统计信息
  export      导出新闻数据
  cleanup     清理旧数据
  help        显示此帮助信息

选项:
  --config=<path>   配置文件路径 (默认：./config/news-sources.json)
  --data=<path>     数据目录路径 (默认：./data)
  --format=<fmt>    导出格式：json 或 csv (默认：json)
  --limit=<n>       导出数量限制 (默认：100)
  --source=<id>     指定新闻源 ID
  --category=<cat>  指定分类

示例:
  npm run news:fetch
  npm run news:schedule
  npm run news:export -- --format=csv --limit=500
  npm run news:stats

环境变量:
  NEWS_CONFIG_PATH    配置文件路径
  NEWS_DATA_DIR       数据目录路径
  NEWS_API_KEY        NewsAPI 密钥（如果使用）
`);
}

/**
 * 解析命令行参数
 */
function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || 'true';
    }
  }
  return result;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const options = parseArgs(args);
  const configPath = options.config || process.env.NEWS_CONFIG_PATH;
  const dataDir = options.data || process.env.NEWS_DATA_DIR;

  switch (command) {
    case 'fetch':
      await runFetch(configPath, dataDir);
      break;

    case 'schedule':
      await runSchedule(configPath, dataDir);
      break;

    case 'stats':
      await runStats(configPath, dataDir);
      break;

    case 'export':
      await runExport(configPath, dataDir, options);
      break;

    case 'cleanup':
      await runCleanup(configPath, dataDir);
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      if (!command) {
        showHelp();
      } else {
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
      }
  }
}

/**
 * 执行新闻抓取
 */
async function runFetch(configPath?: string, dataDir?: string): Promise<void> {
  console.log('Starting news fetch...\n');
  
  const collector = new NewsCollector(configPath, dataDir);
  const results = await collector.fetchAll();

  console.log('\n--- Fetch Results ---');
  for (const result of results) {
    const status = result.success ? '✓' : '✗';
    console.log(`${status} ${result.sourceName}: ${result.itemsCount} items (${result.newItemsCount} new)`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }

  const stats = collector.getStats();
  console.log('\n--- Summary ---');
  console.log(`Total items in storage: ${stats.totalItems}`);
  console.log(`New items today: ${stats.newItemsToday}`);
  console.log(`Errors: ${stats.errors.length}`);

  process.exit(results.every((r) => r.success) ? 0 : 1);
}

/**
 * 启动定时任务调度器
 */
async function runSchedule(configPath?: string, dataDir?: string): Promise<void> {
  console.log('Starting news scheduler...\n');

  // 加载调度配置
  const scheduleConfigPath = path.join(__dirname, '../config/schedule.json');
  let scheduleConfig;
  
  if (fs.existsSync(scheduleConfigPath)) {
    scheduleConfig = JSON.parse(fs.readFileSync(scheduleConfigPath, 'utf-8'));
  } else {
    scheduleConfig = {
      cron: '0 */6 * * *',
      runOnStart: true,
      cleanupAtMidnight: true,
    };
  }

  const scheduler = await createAndStartScheduler(configPath, dataDir, scheduleConfig);

  // 处理退出信号
  const shutdown = async () => {
    console.log('\nShutting down...');
    scheduler.stop();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // 定期显示状态
  setInterval(() => {
    const stats = scheduler.getStats();
    console.log(`\n[Status] Running: ${stats.isRunning}, Runs: ${stats.runCount}, Errors: ${stats.errorCount}`);
    if (stats.nextRun) {
      console.log(`[Next Run] ${stats.nextRun.toISOString()}`);
    }
  }, 60000); // 每分钟

  console.log('Scheduler is running. Press Ctrl+C to stop.\n');
}

/**
 * 显示统计信息
 */
async function runStats(configPath?: string, dataDir?: string): Promise<void> {
  const collector = new NewsCollector(configPath, dataDir);
  const stats = collector.getStats();

  console.log('--- News Collector Statistics ---\n');
  console.log(`Total Sources: ${stats.totalSources}`);
  console.log(`Enabled Sources: ${stats.enabledSources}`);
  console.log(`Total Items: ${stats.totalItems}`);
  console.log(`New Items Today: ${stats.newItemsToday}`);
  
  if (stats.lastFetchTime) {
    console.log(`Last Fetch: ${stats.lastFetchTime.toISOString()}`);
  }

  if (stats.errors.length > 0) {
    console.log(`\nRecent Errors (${stats.errors.length}):`);
    for (const error of stats.errors.slice(-5)) {
      console.log(`  - ${error.sourceId}: ${error.error}`);
    }
  }
}

/**
 * 导出新闻数据
 */
async function runExport(configPath?: string, dataDir?: string, options: Record<string, string> = {}): Promise<void> {
  const collector = new NewsCollector(configPath, dataDir);
  
  const format = options.format || 'json';
  const limit = parseInt(options.limit || '100', 10);
  const sourceId = options.source;
  const category = options.category;

  const data = collector.export(format as 'json' | 'csv', {
    limit,
    sourceId,
    category,
  });

  // 输出到 stdout 或文件
  const outputPath = options.output;
  if (outputPath) {
    fs.writeFileSync(outputPath, data);
    console.log(`Exported to ${outputPath}`);
  } else {
    console.log(data);
  }
}

/**
 * 清理旧数据
 */
async function runCleanup(configPath?: string, dataDir?: string): Promise<void> {
  const collector = new NewsCollector(configPath, dataDir);
  const deleted = collector.cleanup();
  console.log(`Cleaned up ${deleted} old items`);
}

// 运行主函数
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
