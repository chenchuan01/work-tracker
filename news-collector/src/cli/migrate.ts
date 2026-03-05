#!/usr/bin/env node
/**
 * 数据迁移脚本
 * 从旧版 JSON 文件存储迁移到 SQLite
 */

import { NewsStorage } from '../storage/sqlite-storage.js';
import { logger } from '../utils/logger.js';

async function main() {
  console.log('🚀 开始迁移新闻数据到 SQLite...\n');

  const storage = new NewsStorage({
    dataDir: './data',
  });

  try {
    const result = storage.migrateFromJSONStorage();

    console.log('\n✅ 迁移完成！');
    console.log(`   迁移新闻数量：${result.migrated}`);

    // 显示统计信息
    const stats = storage.getStats();
    console.log('\n📊 当前数据库统计：');
    console.log(`   总新闻数：${stats.total}`);
    console.log(`   今日新增：${storage.getTodayCount()}`);

    if (Object.keys(stats.bySource).length > 0) {
      console.log('\n   按来源分布:');
      for (const [source, count] of Object.entries(stats.bySource)) {
        console.log(`     ${source}: ${count}`);
      }
    }

    if (Object.keys(stats.byCategory).length > 0) {
      console.log('\n   按分类分布:');
      for (const [category, count] of Object.entries(stats.byCategory)) {
        console.log(`     ${category}: ${count}`);
      }
    }

    storage.close();

    console.log('\n✨ 迁移成功完成\n');
    process.exit(0);
  } catch (error) {
    logger.error('迁移失败', 'migrate', error);
    console.error('\n❌ 迁移失败:', error);
    storage.close();
    process.exit(1);
  }
}

main();
