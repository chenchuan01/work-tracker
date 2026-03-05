# 项目结构说明

## 目录树

```
work-tracker/
├── server/                          # 后端服务
│   ├── src/
│   │   ├── index.ts                # 服务器入口
│   │   ├── db.ts                   # 数据库初始化
│   │   └── routes/                 # API 路由
│   │       ├── todos.ts           # 待办事项 API
│   │       ├── records.ts         # 工作记录 API
│   │       ├── mood.ts            # 心情记录 API
│   │       └── config.ts          # 配置 API
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile                  # 后端容器配置
│
├── src/                            # 前端源码
│   ├── api/
│   │   └── client.ts              # API 客户端
│   ├── components/                # React 组件
│   │   ├── RecordInput.tsx
│   │   ├── RecordList.tsx
│   │   ├── TodoList.tsx
│   │   ├── CalendarCard.tsx
│   │   ├── NewsCard.tsx
│   │   ├── MoodJournal.tsx
│   │   ├── SummaryModal.tsx
│   │   └── ViewSwitcher.tsx
│   ├── hooks/                     # React Hooks
│   │   ├── useRecords.ts         # 工作记录管理
│   │   ├── useTodos.ts           # 待办事项管理
│   │   └── useSummary.ts         # AI 总结
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── utils/
│   │   ├── date.ts               # 日期工具
│   │   └── prompt.ts             # AI Prompt 模板
│   ├── data/
│   │   └── news.ts               # 新闻数据
│   ├── App.tsx                    # 主应用组件
│   └── main.tsx                   # 应用入口
│
├── scripts/
│   └── docker-deploy.sh           # 部署脚本
│
├── public/                         # 静态资源
├── dist/                          # 构建输出
│
├── docker-compose.yml             # Docker Compose 配置
├── Dockerfile                     # 前端容器配置
├── nginx.conf                     # Nginx 配置
│
├── package.json                   # 前端依赖
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 配置
├── tailwind.config.js             # Tailwind CSS 配置
│
├── .env.example                   # 环境变量示例
├── .dockerignore                  # Docker 忽略文件
├── .gitignore                     # Git 忽略文件
│
├── README.md                      # 项目说明
├── DOCKER.md                      # Docker 部署文档
├── DOCKER-QUICK-REF.md           # Docker 快速参考
├── MIGRATION.md                   # 改造说明
├── CHANGELOG.md                   # 改造总结
└── PROJECT-STRUCTURE.md          # 本文件
```

## 核心文件说明

### 后端服务 (server/)

#### index.ts
- Express 服务器入口
- 配置中间件（CORS、JSON 解析）
- 注册 API 路由
- 启动服务器

#### db.ts
- 初始化 SQLite 数据库
- 创建表结构（todos, work_records, mood_entries, work_summaries, config）
- 创建索引
- 导出数据库实例

#### routes/
- **todos.ts**: 待办事项 CRUD API
- **records.ts**: 工作记录 CRUD API
- **mood.ts**: 心情记录 CRUD API
- **config.ts**: 配置读写 API

### 前端代码 (src/)

#### api/client.ts
- API 客户端封装
- 统一的请求处理
- 错误处理
- 类型安全的 API 调用

#### hooks/
- **useRecords.ts**: 工作记录状态管理，调用 API
- **useTodos.ts**: 待办事项状态管理，调用 API
- **useSummary.ts**: AI 总结功能

#### components/
- **RecordInput.tsx**: 工作记录输入框
- **RecordList.tsx**: 工作记录列表
- **TodoList.tsx**: 待办事项列表
- **CalendarCard.tsx**: 日历卡片
- **NewsCard.tsx**: 新闻卡片
- **MoodJournal.tsx**: 心情日记
- **SummaryModal.tsx**: AI 总结弹窗
- **ViewSwitcher.tsx**: 视图切换器

### Docker 配置

#### docker-compose.yml
- 定义前后端两个服务
- 配置端口映射（3000, 3001）
- 配置数据卷映射
- 配置服务间网络

#### Dockerfile (前端)
- 多阶段构建
- 构建阶段：Node.js 编译
- 生产阶段：Nginx 服务

#### server/Dockerfile (后端)
- Node.js 运行环境
- 安装构建工具（better-sqlite3 需要）
- 编译 TypeScript
- 启动 Express 服务

#### nginx.conf
- SPA 路由支持
- Gzip 压缩
- 静态资源缓存
- WASM 文件支持

### 部署脚本

#### scripts/docker-deploy.sh
- 一键部署
- 服务管理（启动/停止/重启）
- 日志查看
- 数据备份/恢复
- 清理功能

### 配置文件

#### .env.example
- API URL 配置
- OpenAI API 配置
- 环境变量模板

#### package.json
- 前端依赖管理
- 构建脚本
- 开发脚本

#### server/package.json
- 后端依赖管理
- 构建脚本
- 开发脚本

## 数据流

### 前端 → 后端
```
用户操作
  ↓
React 组件
  ↓
Hooks (useRecords, useTodos)
  ↓
API Client
  ↓
HTTP 请求
  ↓
Express 路由
  ↓
SQLite 数据库
```

### 后端 → 前端
```
SQLite 数据库
  ↓
Express 路由
  ↓
JSON 响应
  ↓
API Client
  ↓
Hooks 更新状态
  ↓
React 组件重新渲染
```

## 端口分配

- **3000**: 前端 Nginx 服务
- **3001**: 后端 Express API

## 数据存储

- **开发环境**: `server/data/work-tracker.db`
- **Docker 环境**: `~/docker/data/work-tracker/work-tracker.db`

## 网络架构

```
用户浏览器
    ↓
http://localhost:3000 (前端)
    ↓
http://localhost:3001/api (后端 API)
    ↓
SQLite 数据库文件
```

## 开发流程

1. 修改代码
2. 本地测试（npm run dev）
3. 构建镜像（docker-compose build）
4. 启动服务（docker-compose up -d）
5. 验证功能
6. 提交代码

## 部署流程

1. 拉取代码（git pull）
2. 运行部署脚本（./scripts/docker-deploy.sh deploy）
3. 验证服务（curl http://localhost:3001/health）
4. 访问应用（http://localhost:3000）
