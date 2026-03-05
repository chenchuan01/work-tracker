# Docker 快速参考（前后端分离版本）

## 架构

- **前端**：React + Nginx (端口 3000)
- **后端**：Node.js + Express + SQLite (端口 3001)
- **数据**：存储在 `~/docker/data/work-tracker/work-tracker.db`

## 一键部署

```bash
./scripts/docker-deploy.sh deploy
```

## 常用命令

```bash
# 启动服务
./scripts/docker-deploy.sh start
# 或
docker-compose up -d

# 停止服务
./scripts/docker-deploy.sh stop
# 或
docker-compose down

# 重启服务
./scripts/docker-deploy.sh restart

# 查看所有日志
./scripts/docker-deploy.sh logs

# 查看后端日志
./scripts/docker-deploy.sh logs backend

# 查看前端日志
./scripts/docker-deploy.sh logs frontend

# 查看状态
./scripts/docker-deploy.sh status
# 或
docker-compose ps

# 重新构建
docker-compose up -d --build

# 清理
./scripts/docker-deploy.sh clean
```

## 访问地址

- 前端应用：http://localhost:3000
- 后端 API：http://localhost:3001/api
- 健康检查：http://localhost:3001/health

## 数据管理

### 数据位置

```bash
~/docker/data/work-tracker/work-tracker.db
```

### 备份数据

```bash
# 使用脚本备份
./scripts/docker-deploy.sh backup

# 手动备份
cp ~/docker/data/work-tracker/work-tracker.db ~/backups/work-tracker-$(date +%Y%m%d).db
```

### 恢复数据

```bash
# 使用脚本恢复
./scripts/docker-deploy.sh restore ~/backups/work-tracker-20240305.tar.gz

# 手动恢复
docker-compose down
cp ~/backups/work-tracker-20240305.db ~/docker/data/work-tracker/work-tracker.db
docker-compose up -d
```

## 端口修改

编辑 `docker-compose.yml`：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改为 8080 端口

  backend:
    ports:
      - "8081:3001"  # 改为 8081 端口
```

**注意**：修改后端端口后，需要同步修改前端的 API URL：

```yaml
frontend:
  build:
    args:
      - VITE_API_URL=http://localhost:8081/api
```

## API 测试

```bash
# 健康检查
curl http://localhost:3001/health

# 获取所有待办
curl http://localhost:3001/api/todos

# 获取所有工作记录
curl http://localhost:3001/api/records

# 获取配置
curl http://localhost:3001/api/config/model_config
```

## 故障排查

### 后端无法启动

```bash
# 查看后端日志
docker-compose logs backend

# 检查数据目录权限
ls -la ~/docker/data/work-tracker

# 修改权限
sudo chown -R 1000:1000 ~/docker/data/work-tracker
```

### 前端无法连接后端

```bash
# 检查后端是否运行
curl http://localhost:3001/health

# 检查网络
docker network inspect work-tracker_work-tracker-network

# 查看前端日志
docker-compose logs frontend
```

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 停止占用端口的服务或修改 docker-compose.yml 中的端口
```

### 数据库锁定

```bash
# 停止所有服务
docker-compose down

# 检查数据库文件
sqlite3 ~/docker/data/work-tracker/work-tracker.db "PRAGMA integrity_check;"

# 重启服务
docker-compose up -d
```

## 开发模式

```bash
# 后端开发
cd server
npm install
npm run dev  # 运行在 3001 端口

# 前端开发
npm install
npm run dev  # 运行在 5173 端口
```

## 生产环境

### 使用 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:3001/api;
    }
}
```

### 启用 HTTPS

```bash
sudo certbot --nginx -d your-domain.com
```

## 维护

### 定期备份

```bash
# 添加到 crontab
0 2 * * * /path/to/scripts/docker-deploy.sh backup
```

### 清理旧备份

```bash
find ~/backups -name "work-tracker-*.tar.gz" -mtime +30 -delete
```

### 更新服务

```bash
git pull
docker-compose up -d --build
```
