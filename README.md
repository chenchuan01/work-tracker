# Work Tracker

一款轻量级个人效率工具，集工作记录、待办管理、心情日记、资讯聚合于一体，支持 AI 智能总结。

## ✨ 功能特性

| 模块 | 功能 |
|------|------|
| 📝 工作记录 | 快速输入、日/周/月视图聚合、增删改查 |
| ✅ 待办事项 | 任务管理、状态切换 |
| 📅 日历视图 | 日期维度查看记录分布 |
| 😊 心情日记 | 每日心情记录与回顾 |
| 📰 新闻资讯 | RSS 聚合、智能评分、定时抓取 |
| 🤖 AI 总结 | 一键生成工作简报、每日金句 |

## 🛠 技术栈

**前端**
- React 18 + TypeScript
- Vite 5 + TailwindCSS 3
- react-markdown（Markdown 渲染）

**后端**
- Express + TypeScript
- better-sqlite3（本地数据库）
- fast-xml-parser（RSS 解析）

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install && cd server && npm install && cd ..

# 启动前端
./scripts/start-frontend.sh

# 启动后端
./scripts/start-backend.sh

# 或一键启动
./scripts/start-all.sh
```

### Docker 部署

```bash
# 部署
./scripts/docker-deploy.sh deploy

# 访问
# 前端: http://localhost:9000
# 后端: http://localhost:9090
```

详细部署说明请查看 [DOCKER.md](./DOCKER.md)

## ⚙️ 配置

### AI 接口配置

在应用内设置中配置：

```
API Key: 你的 OpenAI 兼容 API 密钥
Base URL: https://api.openai.com/v1（或其他兼容接口）
Model: gpt-3.5-turbo / gpt-4 / 其他模型
```

## 📁 项目结构

```
work-tracker/
├── src/                    # 前端源码
│   ├── components/         # UI 组件
│   │   ├── RecordInput     # 记录输入
│   │   ├── RecordList      # 记录列表
│   │   ├── TodoList        # 待办列表
│   │   ├── CalendarCard    # 日历卡片
│   │   ├── MoodJournal     # 心情日记
│   │   ├── NewsCard        # 新闻卡片
│   │   └── SummaryModal    # AI 总结弹窗
│   ├── hooks/              # 自定义 Hooks
│   ├── api/                # API 客户端
│   ├── types/              # 类型定义
│   └── utils/              # 工具函数
├── server/                 # 后端源码
│   └── src/
│       ├── routes/         # 路由
│       ├── services/       # 业务逻辑
│       └── db.ts           # 数据库
├── news-collector/         # 新闻采集服务
├── scripts/                # 部署脚本
└── docker-compose.yml      # Docker 编排
```

## 📄 License

MIT
