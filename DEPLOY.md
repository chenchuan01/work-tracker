# 部署指南

## 安全部署原则

⚠️ **重要提示**：数据存储在 Docker 命名卷中，只要不删除卷，数据就不会丢失。

## 快速开始

### 使用自动化脚本（推荐）

```bash
# 查看帮助
./scripts/safe-deploy.sh help

# 完整部署
./scripts/safe-deploy.sh deploy

# 更新发布（拉取最新代码并重新部署）
./scripts/safe-deploy.sh update

# 仅更新前端
./scripts/safe-deploy.sh update-frontend

# 仅更新后端
./scripts/safe-deploy.sh update-backend

# 备份数据
./scripts/safe-deploy.sh backup

# 查看服务状态
./scripts/safe-deploy.sh status

# 查看日志
./scripts/safe-deploy.sh logs
```

## 数据持久化说明

应用使用 Docker 命名卷 `work-tracker_work-tracker-data` 存储所有数据：
- 工作记录
- 待办事项
- 心情日志
- 配置信息

## 安全的重新部署步骤

### 方式一：使用自动化脚本（推荐）

#### 1. 更新发布（最常用）

```bash
# 自动拉取最新代码、备份数据、重新构建并部署
./scripts/safe-deploy.sh update
```

这个命令会：
- ✅ 检查 Git 状态和未提交的更改
- ✅ 自动备份数据
- ✅ 拉取最新代码
- ✅ 重新构建镜像（使用缓存加速）
- ✅ 重启服务
- ✅ 检查服务健康状态

#### 2. 仅更新前端

```bash
# 只更新前端，不影响后端和数据
./scripts/safe-deploy.sh update-frontend
```

#### 3. 仅更新后端

```bash
# 只更新后端，自动备份数据
./scripts/safe-deploy.sh update-backend
```

#### 4. 完整部署

```bash
# 完整重新部署（不使用缓存）
./scripts/safe-deploy.sh deploy
```

### 方式二：手动部署

#### 1. 更新代码后重新部署（推荐）

```bash
# 拉取最新代码
git pull

# 重新构建并启动服务（数据不会丢失）
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

**说明**：这个命令会重新构建镜像并重启容器，但**不会删除数据卷**，所以数据是安全的。

### 2. 完全停止后重新启动

```bash
# 停止并移除容器（但保留卷）
docker-compose down

# 重新启动
docker-compose up -d

# 查看服务状态
docker-compose ps
```

**说明**：`docker-compose down` 默认**不会删除卷**，数据是安全的。

#### 3. 快速重启（不重新构建）

```bash
# 只重启服务，不重新构建
docker-compose restart
```

**说明**：适用于配置更改或服务异常时的快速重启。

### 方式三：分步更新（高级）

```bash
# 1. 拉取最新代码
git pull

# 2. 备份数据
./scripts/safe-deploy.sh backup

# 3. 只重新构建前端
docker-compose build frontend
docker-compose up -d --no-deps frontend

# 4. 只重新构建后端
docker-compose build backend
docker-compose up -d --no-deps backend
```

### 3. ⚠️ 危险操作（会删除数据）

```bash
# ❌ 不要使用这个命令！会删除所有数据！
docker-compose down -v

# ❌ 不要手动删除卷！
docker volume rm work-tracker_work-tracker-data
```

## 数据备份

### 备份数据库

```bash
# 创建备份目录
mkdir -p ~/backups/work-tracker

# 备份数据库（从 Docker 卷复制到本地）
docker run --rm \
  -v work-tracker_work-tracker-data:/data \
  -v ~/backups/work-tracker:/backup \
  alpine \
  cp /data/work-tracker.db /backup/work-tracker-$(date +%Y%m%d-%H%M%S).db

# 查看备份文件
ls -lh ~/backups/work-tracker/
```

### 恢复数据库

```bash
# 停止服务
docker-compose down

# 恢复数据库（从本地复制到 Docker 卷）
docker run --rm \
  -v work-tracker_work-tracker-data:/data \
  -v ~/backups/work-tracker:/backup \
  alpine \
  cp /backup/work-tracker-20260305-120000.db /data/work-tracker.db

# 重新启动服务
docker-compose up -d
```

## 数据迁移

### 导出数据到新服务器

```bash
# 在旧服务器上
docker run --rm \
  -v work-tracker_work-tracker-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/work-tracker-data.tar.gz -C /data .

# 将 work-tracker-data.tar.gz 复制到新服务器
```

### 在新服务器上导入数据

```bash
# 在新服务器上
# 1. 先启动一次服务，创建卷
docker-compose up -d
docker-compose down

# 2. 导入数据
docker run --rm \
  -v work-tracker_work-tracker-data:/data \
  -v $(pwd):/backup \
  alpine \
  tar xzf /backup/work-tracker-data.tar.gz -C /data

# 3. 重新启动服务
docker-compose up -d
```

## 查看数据卷信息

```bash
# 查看卷详情
docker volume inspect work-tracker_work-tracker-data

# 查看卷占用空间
docker system df -v | grep work-tracker

# 列出所有卷
docker volume ls
```

## 日常维护

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 只查看后端日志
docker-compose logs -f backend

# 只查看前端日志
docker-compose logs -f frontend
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 只重启后端
docker-compose restart backend

# 只重启前端
docker-compose restart frontend
```

### 更新单个服务

```bash
# 只重新构建并更新后端
docker-compose up -d --build backend

# 只重新构建并更新前端
docker-compose up -d --build frontend
```

## 自动备份脚本

创建定时备份任务：

```bash
# 创建备份脚本
cat > ~/backup-work-tracker.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups/work-tracker
mkdir -p $BACKUP_DIR

# 备份数据库
docker run --rm \
  -v work-tracker_work-tracker-data:/data \
  -v $BACKUP_DIR:/backup \
  alpine \
  cp /data/work-tracker.db /backup/work-tracker-$(date +%Y%m%d-%H%M%S).db

# 只保留最近 30 天的备份
find $BACKUP_DIR -name "work-tracker-*.db" -mtime +30 -delete

echo "备份完成: $(date)"
EOF

# 添加执行权限
chmod +x ~/backup-work-tracker.sh

# 添加到 crontab（每天凌晨 2 点备份）
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup-work-tracker.sh >> ~/backup-work-tracker.log 2>&1") | crontab -
```

## 故障排查

### 服务无法启动

```bash
# 查看详细日志
docker-compose logs backend
docker-compose logs frontend

# 检查容器状态
docker-compose ps

# 检查端口占用
netstat -tlnp | grep -E '3000|3001'
```

### 数据丢失恢复

如果不小心删除了数据卷：

1. 从备份恢复（见上面的"恢复数据库"部分）
2. 如果没有备份，数据无法恢复

### 磁盘空间不足

```bash
# 清理未使用的 Docker 资源（不会删除命名卷）
docker system prune -f

# 清理未使用的镜像
docker image prune -a -f

# 查看磁盘使用情况
docker system df
```

## 生产环境建议

1. **定期备份**：设置自动备份任务，每天备份数据库
2. **监控日志**：定期查看日志，及时发现问题
3. **资源监控**：监控容器的 CPU、内存使用情况
4. **更新策略**：在低峰期进行更新部署
5. **测试环境**：先在测试环境验证更新，再部署到生产环境

## 快速参考

| 操作 | 命令 | 数据安全 |
|------|------|----------|
| 重新部署 | `docker-compose up -d --build` | ✅ 安全 |
| 停止服务 | `docker-compose down` | ✅ 安全 |
| 重启服务 | `docker-compose restart` | ✅ 安全 |
| 查看日志 | `docker-compose logs -f` | ✅ 安全 |
| 备份数据 | 见"备份数据库"部分 | ✅ 安全 |
| 删除卷 | `docker-compose down -v` | ❌ 危险 |
