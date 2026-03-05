# 工作记录工具 (Work Tracker)

一款轻量级工作内容记录工具，快速记录、自动聚合、AI 生成简报。

## 功能特性

- ✅ 快速输入框，随时记录工作
- ✅ 日/周/月视图自动聚合
- ✅ 增删改查完整功能
- ✅ 一键 AI 总结，生成 100 字以内简报
- ✅ 本地存储，离线可用
- ✅ 数据导出

## 技术栈

- React 18 + TypeScript
- Vite (构建工具)
- TailwindCSS (样式)
- Dexie.js (IndexedDB 封装)
- OpenAI API (AI 总结)

## 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 使用部署脚本（推荐）
./scripts/docker-deploy.sh deploy

# 或手动执行
docker-compose up -d

# 访问应用
# http://localhost:3000
```

详细的 Docker 部署说明请查看 [DOCKER.md](./DOCKER.md)

### 方式二：本地开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 预览
npm run preview
```

## 项目结构

```
work-tracker/
├── src/
│   ├── components/
│   │   ├── RecordInput.tsx      # 输入框组件
│   │   ├── RecordList.tsx       # 记录列表组件
│   │   ├── ViewSwitcher.tsx     # 视图切换组件
│   │   └── SummaryModal.tsx     # 简报弹窗组件
│   ├── hooks/
│   │   ├── useRecords.ts        # 记录管理 Hook
│   │   └── useSummary.ts        # AI 总结 Hook
│   ├── db/
│   │   └── database.ts          # IndexedDB 配置
│   ├── types/
│   │   └── index.ts             # TypeScript 类型
│   ├── utils/
│   │   ├── date.ts              # 日期处理
│   │   └── prompt.ts            # Prompt 模板
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── package.json
```

## API 配置

在 `.env` 文件中配置 AI API：

```env
VITE_OPENAI_API_KEY=your_api_key_here
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

## 使用说明

1. 打开应用，在输入框中输入工作内容
2. 按 Enter 或点击"保存"按钮
3. 切换日/周/月视图查看不同范围的记录
4. 点击"AI 总结"生成工作简报
5. 复制/导出简报用于汇报

## License

MIT
