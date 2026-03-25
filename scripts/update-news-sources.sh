#!/bin/bash
# 更新新闻源配置（适用于已存在的数据库）

DATA_DIR="${DATA_DIR:-./server/data}"
DB_PATH="$DATA_DIR/work-tracker.db"

if [ ! -f "$DB_PATH" ]; then
  echo "数据库不存在: $DB_PATH"
  exit 1
fi

echo "更新新闻源配置..."

# 删除旧的不可用源
sqlite3 "$DB_PATH" "DELETE FROM news_sources WHERE id IN ('wallstreetcn', 'cls-telegraph', 'jiqizhixin', 'qbitai', 'cifnews');"

# 插入新的可用源（忽略已存在的）
sqlite3 "$DB_PATH" "
INSERT OR IGNORE INTO news_sources (id, name, url, category, type) VALUES
  ('yicai', '第一财经', 'https://www.yicai.com/feed', 'finance', 'rss'),
  ('sspai', '少数派', 'https://sspai.com/feed', 'tech', 'rss'),
  ('ruanyifeng', '阮一峰', 'https://www.ruanyifeng.com/blog/atom.xml', 'tech', 'rss');
"

# 更新虎嗅的 URL
sqlite3 "$DB_PATH" "UPDATE news_sources SET url = 'https://www.huxiu.com/rss/0.xml' WHERE id = 'huxiu';"

# 更新36氪的 URL
sqlite3 "$DB_PATH" "UPDATE news_sources SET url = 'https://36kr.com/feed' WHERE id = '36kr';"

echo "完成！当前新闻源："
sqlite3 "$DB_PATH" "SELECT id, name, url, category, enabled FROM news_sources;"
