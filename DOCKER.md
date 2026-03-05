# Work Tracker Docker 部署说明

## 架构说明

Work Tracker 采用前后端分离架构：

- **前端**：React + TypeScript + Vite，运行在 Nginx 容器中
- **后端**：Node.js + Express + SQLite，提供 RESTful API
- **数据库**：SQLite，数据文件存储在宿主机 `~/docker/data/work-tracker`

## 快速开始

### 1. 构建并启动容器

```bash
docker-compose up -d
```

### 2. 访问应用

- 前端地址：http://localhost:3000
- 后端 API：http://localhost:3001/api
- 健康检查：http://localhost:3001/health

### 3. 停止容器

```bash
docker-compose down
```

## 数据持久化

### 数据存储位置

数据库文件存储在：`~/docker/data/work-tracker/work-tracker.db`

### 数据备份

```bash
# 备份数据库文件
cp ~/docker/data/work-tracker/work-tracker.db ~/backups/work-tracker-$(date +%Y%m%d).db

# 或使用 tar 打包
tar -czf ~/backups/work-tracker-$(date +%Y%m%d).tar.gz ~/docker/data/work-tracker/
```

### 数据恢复

```bash
# 停止服务
docker-compose down

# 恢复数据库文件
cp ~/backups/work-tracker-20240305.db ~/docker/data/work-tracker/work-tracker.db

# 启动服务
docker-compose up -d
```

## 环境变量配置

### 前端环境变量

在构建时通过 `docker-compose.yml` 配置：

```yaml
frontend:
  build:
    args:
      - VITE_API_URL=http://localhost:3001/api
```

### 后端环境变量

在 `docker-compose.yml` 中配置：

```yaml
backend:
  environment:
    - NODE_ENV=production
    - PORT=3001
    - DATA_DIR=/data
    - TZ=Asia/Shanghai
```

## 端口配置

默认端口：
- 前端：3000
- 后端：3001

修改端口（编辑 `docker-compose.yml`）：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改为 8080
  backend:
    ports:
      - "8081:3001"  # 改为 8081
```

**注意**：修改后端端口后，需要同步修改前端的 API URL。

## 生产环境部署

### 使用反向代理

推荐使用 Nginx 或 Traefik 作为反向代理：

```nginx
# Nginx 配置示例
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 启用 HTTPS

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

## 故障排查

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

### 检查服务状态

```bash
# 查看容器状态
docker-compose ps

# 检查后端健康状态
curl http://localhost:3001/health
```

### 重新构建

```bash
# 停止并删除容器
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

### 常见问题

#### 1. 前端无法连接后端

检查 API URL 配置：
- 确认 `VITE_API_URL` 环境变量正确
- 检查后端服务是否正常运行
- 查看浏览器控制台的网络请求

#### 2. 数据库文件权限问题

```bash
# 修改数据目录权限
sudo chown -R 1000:1000 ~/docker/data/work-tracker
```

#### 3. 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 停止占用端口的服务或修改 docker-compose.yml 中的端口
```

## 维护操作

### 定期备份

创建定时任务自动备份：

```bash
# 编辑 crontab
crontab -e

# 添加每天凌晨 2 点备份
0 2 * * * tar -czf ~/backups/work-tracker-$(date +\%Y\%m\%d).tar.gz ~/docker/data/work-tracker/
```

### 清理旧备份

```bash
# 删除 30 天前的备份
find ~/backups -name "work-tracker-*.tar.gz" -mtime +30 -delete
```

### 更新服务

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 卸载

```bash
# 停止并删除容器
docker-compose down

# 删除镜像
docker rmi work-tracker-frontend work-tracker-backend

# 删除数据（可选，会删除所有数据）
rm -rf ~/docker/data/work-tracker
```

## 开发模式

如需在开发模式下运行：

```bash
# 后端开发模式
cd server
npm install
npm run dev

# 前端开发模式
npm install
npm run dev
```

开发模式下：
- 前端：http://localhost:5173
- 后端：http://localhost:3001
