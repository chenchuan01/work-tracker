# 项目改造说明

## 改造概述

项目已从浏览器端数据存储（sql.js + IndexedDB）改造为前后端分离架构，数据存储在服务器端。

## 架构变化

### 改造前
- 前端：React + sql.js（浏览器端 SQLite）
- 数据存储：浏览器 IndexedDB
- 问题：数据仅存在浏览器本地，清除缓存会丢失数据

### 改造后
- 前端：React + TypeScript + Vite
- 后端：Node.js + Express + better-sqlite3
- 数据存储：服务器端 SQLite 数据库
- 优势：数据持久化在服务器，支持多设备访问

## 目录结构

```
work-tracker/
├── server/                    # 后端服务
│   ├── src/
│   │   ├── db.ts             # 数据库初始化
│   │   ├── index.ts          # 服务器入口
│   │   └── routes/           # API 路由
│   │       ├── todos.ts      # 待办事项 API
│   │       ├── records.ts    # 工作记录 API
│   │       ├── mood.ts       # 心情记录 API
│   │       └── config.ts     # 配置 API
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── src/                       # 前端代码
│   ├── api/
│   │   └── client.ts         # API 客户端
│   ├── hooks/                # 更新为使用 API
│   │   ├── useRecords.ts
│   │   └── useTodos.ts
│   └── ...
├── docker-compose.yml         # Docker Compose 配置
├── Dockerfile                 # 前端 Dockerfile
└── scripts/
    └── docker-deploy.sh       # 部署脚本
```

## API 接口

### 待办事项 (Todos)
- `GET /api/todos` - 获取所有待办
- `POST /api/todos` - 创建待办
- `PUT /api/todos/:id` - 更新待办
- `DELETE /api/todos/:id` - 删除待办

### 工作记录 (Records)
- `GET /api/records` - 获取所有记录
- `POST /api/records` - 创建记录
- `PUT /api/records/:id` - 更新记录
- `DELETE /api/records/:id` - 删除记录

### 心情记录 (Mood)
- `GET /api/mood` - 获取所有心情记录
- `POST /api/mood` - 创建心情记录
- `DELETE /api/mood/:id` - 删除心情记录

### 配置 (Config)
- `GET /api/config/:key` - 获取配置
- `POST /api/config/:key` - 设置配置

## 数据存储

### 数据库位置
- Docker 部署：`~/docker/data/work-tracker/work-tracker.db`
- 本地开发：`server/data/work-tracker.db`

### 数据库表结构
- `todos` - 待办事项
- `work_records` - 工作记录
- `mood_entries` - 心情记录
- `work_summaries` - 工作总结
- `config` - 系统配置

## 部署方式

### Docker 部署（推荐）

```bash
# 一键部署
./scripts/docker-deploy.sh deploy

# 访问
# 前端：http://localhost:3000
# 后端：http://localhost:3001/api
```

### 本地开发

```bash
# 后端
cd server
npm install
npm run dev  # 端口 3001

# 前端
npm install
npm run dev  # 端口 5173
```

## 环境变量

### 前端 (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
VITE_MODEL_NAME=gpt-3.5-turbo
```

### 后端 (docker-compose.yml)
```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - DATA_DIR=/data
  - TZ=Asia/Shanghai
```

## 数据迁移

如果你有旧版本的数据（存储在浏览器中），需要手动导出后重新录入，因为数据结构已经改变。

## 主要改动文件

### 新增文件
- `server/` - 整个后端服务目录
- `src/api/client.ts` - API 客户端

### 修改文件
- `src/hooks/useRecords.ts` - 改用 API 调用
- `src/hooks/useTodos.ts` - 改用 API 调用
- `src/App.tsx` - 移除数据库直接操作，改用 API
- `package.json` - 移除 sql.js 依赖
- `docker-compose.yml` - 添加后端服务
- `Dockerfile` - 更新构建配置

### 删除文件
- `src/db/sqlite.ts` - 不再需要前端数据库操作
- `src/utils/jsonStorage.ts` - 不再需要 JSON 存储

## 注意事项

1. **数据备份**：定期备份 `~/docker/data/work-tracker/work-tracker.db`
2. **端口配置**：确保 3000 和 3001 端口未被占用
3. **API URL**：生产环境需要配置正确的 API 地址
4. **CORS**：后端已配置 CORS，允许跨域访问

## 后续优化建议

1. 添加用户认证和授权
2. 实现数据库自动备份
3. 添加 API 访问日志
4. 实现数据导出/导入功能
5. 添加 API 限流保护
6. 使用 Redis 缓存热点数据
7. 实现 WebSocket 实时同步

## 文档

- [Docker 部署文档](./DOCKER.md)
- [Docker 快速参考](./DOCKER-QUICK-REF.md)
- [项目 README](./README.md)
