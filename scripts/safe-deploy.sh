#!/bin/bash

# 工作记录追踪系统 - 安全部署脚本
# 此脚本确保在重新部署时不会丢失数据

set -e  # 遇到错误立即退出

echo "=========================================="
echo "工作记录追踪系统 - 安全部署"
echo "=========================================="
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ 错误: Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: docker-compose 未安装"
    exit 1
fi

echo "✅ Docker 环境检查通过"
echo ""

# 检查数据卷是否存在
if docker volume inspect work-tracker_work-tracker-data > /dev/null 2>&1; then
    echo "📦 检测到现有数据卷: work-tracker_work-tracker-data"
    echo "⚠️  数据将被保留，不会丢失"
    echo ""

    # 询问是否需要备份
    read -p "是否在部署前备份数据？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        BACKUP_DIR=~/backups/work-tracker
        mkdir -p $BACKUP_DIR
        BACKUP_FILE="work-tracker-$(date +%Y%m%d-%H%M%S).db"

        echo "📥 正在备份数据..."
        docker run --rm \
            -v work-tracker_work-tracker-data:/data \
            -v $BACKUP_DIR:/backup \
            alpine \
            cp /data/work-tracker.db /backup/$BACKUP_FILE

        echo "✅ 备份完成: $BACKUP_DIR/$BACKUP_FILE"
        echo ""
    fi
else
    echo "📦 未检测到现有数据卷，将创建新的数据卷"
    echo ""
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose down
echo "✅ 服务已停止"
echo ""

# 重新构建镜像
echo "🔨 重新构建镜像..."
docker-compose build --no-cache
echo "✅ 镜像构建完成"
echo ""

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d
echo "✅ 服务已启动"
echo ""

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "=========================================="
echo "服务状态"
echo "=========================================="
docker-compose ps
echo ""

# 检查后端健康状态
echo "🔍 检查后端健康状态..."
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ 后端服务健康"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "⚠️  后端服务可能未完全启动，请检查日志"
    else
        sleep 2
    fi
done
echo ""

# 显示访问信息
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "📱 前端访问地址: http://localhost:3000"
echo "🔌 后端 API 地址: http://localhost:3001/api"
echo "💚 健康检查地址: http://localhost:3001/health"
echo ""
echo "📋 查看日志: docker-compose logs -f"
echo "🔄 重启服务: docker-compose restart"
echo "🛑 停止服务: docker-compose down"
echo ""
echo "⚠️  注意: 数据存储在 Docker 卷中，使用 'docker-compose down' 不会删除数据"
echo "⚠️  只有使用 'docker-compose down -v' 才会删除数据（请勿使用！）"
echo ""
