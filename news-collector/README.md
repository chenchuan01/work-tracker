# 新闻收集系统 (News Collector)

一个自动化的新闻收集系统，支持 RSS 和 API 两种数据源，具备定时任务、数据存储、速率限制等功能。

## 功能特性

- ✅ **多源支持**: RSS 2.0/Atom 1.0 和 REST API
- ✅ **定时任务**: 内置调度器或系统 cron
- ✅ **数据存储**: JSON 文件存储，支持查询和导出
- ✅ **速率限制**: 自动限制请求频率，避免被封禁
- ✅ **错误处理**: 自动重试、错误日志
- ✅ **去重机制**: 基于内容 hash 避免重复
- ✅ **数据清理**: 自动清理过期数据

## 项目结构

```
news-collector/
├── config/
│   ├── news-sources.json    # 新闻源配置
│   ├── schedule.json        # 调度器配置
│   ├── crontab.example      # 系统 cron 配置示例
│   └── news-collector.service # systemd 服务配置
├── src/
│   ├── cli.ts               # CLI 入口
│   ├── collector/
│   │   └── news-collector.ts # 核心收集器
│   ├── parsers/
│   │   ├── rss-parser.ts    # RSS 解析器
│   │   └── api-parser.ts    # API 解析器
│   ├── scheduler/
│   │   └── scheduler.ts     # 定时任务调度器
│   ├── storage/
│   │   └── storage.ts       # 数据存储模块
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   └── utils/
│       ├── logger.ts        # 日志模块
│       └── http-client.ts   # HTTP 客户端
├── data/                    # 数据存储目录（运行时生成）
├── logs/                    # 日志目录（运行时生成）
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd news-collector
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入 API 密钥等配置
```

### 3. 配置新闻源

编辑 `config/news-sources.json`，添加或修改新闻源：

```json
{
  "sources": [
    {
      "id": "techcrunch",
      "name": "TechCrunch",
      "type": "rss",
      "url": "https://techcrunch.com/feed/",
      "category": "technology",
      "language": "en",
      "enabled": true
    }
  ]
}
```

### 4. 运行

```bash
# 执行一次新闻抓取
npm run news:fetch

# 启动定时任务调度器
npm run news:schedule

# 查看统计信息
npm run news:stats

# 导出新闻数据
npm run news:export -- --format=json --limit=100

# 清理旧数据
npm run news:cleanup
```

## 配置说明

### 新闻源配置 (news-sources.json)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一标识符 |
| `name` | string | 显示名称 |
| `type` | string | `rss` 或 `api` |
| `url` | string | RSS 地址或 API 端点 |
| `category` | string | 分类标签 |
| `language` | string | 语言代码 |
| `enabled` | boolean | 是否启用 |
| `fetchInterval` | number | 抓取间隔（毫秒） |
| `headers` | object | 请求头（API 源） |
| `params` | object | 查询参数（API 源） |
| `responsePath` | string | API 响应数据路径 |

### 调度器配置 (schedule.json)

```json
{
  "cron": "0 */6 * * *",      // cron 表达式
  "runOnStart": true,         // 启动时立即执行
  "cleanupAtMidnight": true   // 午夜清理旧数据
}
```

### Cron 表达式格式

```
分 时 日 月 周
```

常用示例：
- `0 */6 * * *` - 每 6 小时
- `0 0 * * *` - 每天午夜
- `0 9 * * 1-5` - 工作日每天 9 点
- `*/30 * * * *` - 每 30 分钟

## 部署方案

### 方案一：系统 Cron

```bash
# 编辑 crontab
crontab -e

# 添加以下内容（修改路径）
0 */6 * * * cd /path/to/news-collector && npm run news:fetch >> /var/log/news-collector.log 2>&1
```

### 方案二：systemd 服务

```bash
# 复制服务文件
sudo cp config/news-collector.service /etc/systemd/system/

# 编辑服务文件，修改路径和用户
sudo nano /etc/systemd/system/news-collector.service

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable news-collector
sudo systemctl start news-collector

# 查看状态
sudo systemctl status news-collector
```

### 方案三：Docker（可选）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "news:schedule"]
```

## API 使用示例

### 添加 NewsAPI 源

```json
{
  "id": "newsapi-top",
  "name": "NewsAPI Top Headlines",
  "type": "api",
  "url": "https://newsapi.org/v2/top-headlines",
  "category": "general",
  "language": "en",
  "enabled": true,
  "params": {
    "country": "us",
    "pageSize": "20"
  },
  "headers": {
    "X-Api-Key": "${NEWS_API_KEY}"
  },
  "responsePath": "articles"
}
```

### 添加自定义 API 源

```json
{
  "id": "custom-api",
  "name": "Custom API",
  "type": "api",
  "url": "https://api.example.com/news",
  "category": "technology",
  "language": "en",
  "enabled": true,
  "headers": {
    "Authorization": "Bearer ${API_TOKEN}"
  },
  "responsePath": "data.items"
}
```

## 数据导出

### JSON 格式

```bash
npm run news:export -- --format=json --limit=500 > news.json
```

### CSV 格式

```bash
npm run news:export -- --format=csv --limit=500 > news.csv
```

### 按条件筛选

```bash
# 按来源
npm run news:export -- --source=techcrunch

# 按分类
npm run news:export -- --category=technology

# 输出到文件
npm run news:export -- --output=/path/to/output.json
```

## 日志

日志文件位于 `logs/` 目录，按日期分割：

```
logs/
├── news-collector-2026-03-03.log
├── news-collector-2026-03-04.log
└── ...
```

日志级别可通过环境变量控制：

```bash
export NEWS_LOG_LEVEL=debug  # debug, info, warn, error
```

## 注意事项

### 反爬虫措施

1. **速率限制**: 默认限制为 30 次/分钟，500 次/小时
2. **User-Agent**: 使用自定义 User-Agent 标识
3. **请求间隔**: 源之间自动添加延迟
4. **重试机制**: 失败后指数退避重试

### 合规性

- 遵守目标网站的 robots.txt
- 尊重版权和使用条款
- 不要用于商业用途除非获得授权
- 建议仅抓取提供 RSS/API 的公开源

### 性能优化

- 数据按 hash 前缀分目录存储
- 使用索引缓存加速查询
- 支持并行抓取（`fetchAllParallel`）
- 定期清理旧数据

### 安全建议

- 不要将 API 密钥提交到版本控制
- 使用 `.env` 文件管理敏感配置
- 限制数据目录的访问权限
- 定期更新依赖

## 故障排除

### 常见问题

**Q: 抓取失败，显示 timeout 错误**
A: 增加 `requestTimeout` 配置，或检查网络连接。

**Q: 解析失败，显示 XML/JSON 解析错误**
A: 检查源 URL 是否正确，或源是否改变了格式。

**Q: 数据量过大**
A: 减少 `maxItemsPerSource` 或缩短 `retentionDays`。

**Q: 触发速率限制**
A: 降低 `rateLimit` 配置或增加 `fetchInterval`。

### 查看日志

```bash
# 查看最新日志
tail -f logs/news-collector-$(date +%Y-%m-%d).log

# 查看错误日志
grep ERROR logs/news-collector-*.log
```

## License

MIT
