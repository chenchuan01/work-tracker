#!/bin/bash

# 工作记录追踪系统 - 安全部署脚本
# 此脚本确保在重新部署时不会丢失数据

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "工作记录追踪系统 - 安全部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  deploy          完整部署（默认）"
    echo "  update          更新发布（拉取代码并重新部署）"
    echo "  update-frontend 仅更新前端"
    echo "  update-backend  仅更新后端"
    echo "  backup          仅备份数据"
    echo "  status          查看服务状态"
    echo "  logs            查看服务日志"
    echo "  help            显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy          # 完整部署"
    echo "  $0 update          # 更新发布"
    echo "  $0 update-frontend # 仅更新前端"
    echo ""
}

# 备份数据函数
backup_data() {
    BACKUP_DIR=~/backups/work-tracker
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="work-tracker-$(date +%Y%m%d-%H%M%S).db"

    echo -e "${BLUE}📥 正在备份数据...${NC}"
    docker run --rm \
        -v work-tracker_work-tracker-data:/data \
        -v $BACKUP_DIR:/backup \
        alpine \
        cp /data/work-tracker.db /backup/$BACKUP_FILE

    echo -e "${GREEN}✅ 备份完成: $BACKUP_DIR/$BACKUP_FILE${NC}"
    echo ""
}

# 检查 Git 状态
check_git_status() {
    if [ -d .git ]; then
        echo -e "${BLUE}📊 检查 Git 状态...${NC}"

        # 检查是否有未提交的更改
        if ! git diff-index --quiet HEAD --; then
            echo -e "${YELLOW}⚠️  警告: 有未提交的更改${NC}"
            git status --short
            echo ""
            read -p "是否继续部署？(y/n) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo "部署已取消"
                exit 1
            fi
        fi

        # 显示当前分支和最新提交
        CURRENT_BRANCH=$(git branch --show-current)
        LATEST_COMMIT=$(git log -1 --oneline)
        echo -e "${GREEN}✅ 当前分支: $CURRENT_BRANCH${NC}"
        echo -e "${GREEN}✅ 最新提交: $LATEST_COMMIT${NC}"
        echo ""
    fi
}

# 拉取最新代码
pull_latest_code() {
    if [ -d .git ]; then
        echo -e "${BLUE}🔄 检查远程仓库...${NC}"

        # 检查是否配置了远程仓库
        if ! git remote get-url origin > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  未配置远程仓库，跳过代码拉取${NC}"
            echo ""
            return
        fi

        CURRENT_BRANCH=$(git branch --show-current)

        # 保存当前提交哈希
        OLD_COMMIT=$(git rev-parse HEAD)

        # 拉取最新代码
        echo -e "${BLUE}🔄 拉取最新代码...${NC}"
        git pull origin $CURRENT_BRANCH

        # 获取新的提交哈希
        NEW_COMMIT=$(git rev-parse HEAD)

        if [ "$OLD_COMMIT" = "$NEW_COMMIT" ]; then
            echo -e "${GREEN}✅ 代码已是最新版本${NC}"
        else
            echo -e "${GREEN}✅ 代码已更新${NC}"
            echo ""
            echo "更新的提交:"
            git log --oneline $OLD_COMMIT..$NEW_COMMIT
        fi
        echo ""
    else
        echo -e "${YELLOW}⚠️  不是 Git 仓库，跳过代码拉取${NC}"
        echo ""
    fi
}

# 检查环境
check_environment() {
    echo "=========================================="
    echo "工作记录追踪系统 - 安全部署"
    echo "=========================================="
    echo ""

    # 检查 Docker 是否运行
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ 错误: Docker 未运行，请先启动 Docker${NC}"
        exit 1
    fi

    # 检查 docker-compose 是否安装
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ 错误: docker-compose 未安装${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Docker 环境检查通过${NC}"
    echo ""
}

# 检查数据卷
check_data_volume() {
    if docker volume inspect work-tracker_work-tracker-data > /dev/null 2>&1; then
        echo -e "${BLUE}📦 检测到现有数据卷: work-tracker_work-tracker-data${NC}"
        echo -e "${GREEN}⚠️  数据将被保留，不会丢失${NC}"
        echo ""
        return 0
    else
        echo -e "${BLUE}📦 未检测到现有数据卷，将创建新的数据卷${NC}"
        echo ""
        return 1
    fi
}

# 完整部署
full_deploy() {
    check_environment
    check_git_status

    # 检查数据卷并询问是否备份
    if check_data_volume; then
        read -p "是否在部署前备份数据？(y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            backup_data
        fi
    fi

    # 停止现有服务
    echo -e "${BLUE}🛑 停止现有服务...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ 服务已停止${NC}"
    echo ""

    # 重新构建镜像
    echo -e "${BLUE}🔨 重新构建镜像...${NC}"
    docker-compose build --no-cache
    echo -e "${GREEN}✅ 镜像构建完成${NC}"
    echo ""

    # 启动服务
    start_services
}

# 更新发布
update_deploy() {
    check_environment
    check_git_status

    # 备份数据
    if check_data_volume; then
        echo -e "${YELLOW}⚠️  更新前自动备份数据${NC}"
        backup_data
    fi

    # 拉取最新代码
    pull_latest_code

    # 停止现有服务
    echo -e "${BLUE}🛑 停止现有服务...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ 服务已停止${NC}"
    echo ""

    # 重新构建镜像（使用缓存加速）
    echo -e "${BLUE}🔨 重新构建镜像...${NC}"
    docker-compose build
    echo -e "${GREEN}✅ 镜像构建完成${NC}"
    echo ""

    # 启动服务
    start_services
}

# 仅更新前端
update_frontend() {
    check_environment
    check_git_status
    pull_latest_code

    echo -e "${BLUE}🔨 重新构建前端镜像...${NC}"
    docker-compose build frontend
    echo -e "${GREEN}✅ 前端镜像构建完成${NC}"
    echo ""

    echo -e "${BLUE}🔄 重启前端服务...${NC}"
    docker-compose up -d --no-deps frontend
    echo -e "${GREEN}✅ 前端服务已更新${NC}"
    echo ""

    check_services_health
}

# 仅更新后端
update_backend() {
    check_environment
    check_git_status

    # 备份数据
    if check_data_volume; then
        echo -e "${YELLOW}⚠️  更新后端前自动备份数据${NC}"
        backup_data
    fi

    pull_latest_code

    echo -e "${BLUE}🔨 重新构建后端镜像...${NC}"
    docker-compose build backend
    echo -e "${GREEN}✅ 后端镜像构建完成${NC}"
    echo ""

    echo -e "${BLUE}🔄 重启后端服务...${NC}"
    docker-compose up -d --no-deps backend
    echo -e "${GREEN}✅ 后端服务已更新${NC}"
    echo ""

    check_services_health
}

# 启动服务
start_services() {
    echo -e "${BLUE}🚀 启动服务...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ 服务已启动${NC}"
    echo ""

    # 等待服务启动
    echo -e "${BLUE}⏳ 等待服务启动...${NC}"
    sleep 5

    check_services_health
}

# 检查服务健康状态
check_services_health() {
    # 检查服务状态
    echo ""
    echo "=========================================="
    echo "服务状态"
    echo "=========================================="
    docker-compose ps
    echo ""

    # 检查后端健康状态
    echo -e "${BLUE}🔍 检查后端健康状态...${NC}"
    for i in {1..10}; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ 后端服务健康${NC}"
            break
        fi
        if [ $i -eq 10 ]; then
            echo -e "${YELLOW}⚠️  后端服务可能未完全启动，请检查日志${NC}"
        else
            sleep 2
        fi
    done
    echo ""

    # 显示访问信息
    show_access_info
}

# 显示访问信息
show_access_info() {
    echo "=========================================="
    echo "部署完成！"
    echo "=========================================="
    echo ""
    echo -e "${GREEN}📱 前端访问地址: http://localhost:3000${NC}"
    echo -e "${GREEN}🔌 后端 API 地址: http://localhost:3001/api${NC}"
    echo -e "${GREEN}💚 健康检查地址: http://localhost:3001/health${NC}"
    echo ""
    echo "📋 查看日志: docker-compose logs -f"
    echo "🔄 重启服务: docker-compose restart"
    echo "🛑 停止服务: docker-compose down"
    echo ""
    echo -e "${YELLOW}⚠️  注意: 数据存储在 Docker 卷中，使用 'docker-compose down' 不会删除数据${NC}"
    echo -e "${RED}⚠️  只有使用 'docker-compose down -v' 才会删除数据（请勿使用！）${NC}"
    echo ""
}

# 查看服务状态
show_status() {
    check_environment
    echo "=========================================="
    echo "服务状态"
    echo "=========================================="
    docker-compose ps
    echo ""

    # 显示数据卷信息
    if docker volume inspect work-tracker_work-tracker-data > /dev/null 2>&1; then
        echo "=========================================="
        echo "数据卷信息"
        echo "=========================================="
        docker volume inspect work-tracker_work-tracker-data | grep -E "Name|Mountpoint"
        echo ""
    fi
}

# 查看日志
show_logs() {
    check_environment
    echo "查看服务日志 (Ctrl+C 退出)..."
    echo ""
    docker-compose logs -f
}

# 主函数
main() {
    case "${1:-deploy}" in
        deploy)
            full_deploy
            ;;
        update)
            update_deploy
            ;;
        update-frontend)
            update_frontend
            ;;
        update-backend)
            update_backend
            ;;
        backup)
            check_environment
            if check_data_volume; then
                backup_data
            else
                echo -e "${RED}❌ 未找到数据卷${NC}"
                exit 1
            fi
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ 未知选项: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
