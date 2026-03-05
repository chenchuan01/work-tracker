import express from 'express';
import cors from 'cors';
import todosRouter from './routes/todos.js';
import recordsRouter from './routes/records.js';
import moodRouter from './routes/mood.js';
import configRouter from './routes/config.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API 路由
app.use('/api/todos', todosRouter);
app.use('/api/records', recordsRouter);
app.use('/api/mood', moodRouter);
app.use('/api/config', configRouter);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});
