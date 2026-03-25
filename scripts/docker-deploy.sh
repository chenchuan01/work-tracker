#!/bin/bash

# Work Tracker Docker 部署脚本（前后端分离版本）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="work-tracker"
DATA_DIR="$HOME/docker/data/work-tracker"

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi

    print_info "Docker 环境检查通过"
}

# 创建数据目录
create_data_dir() {
    if [ ! -d "$DATA_DIR" ]; then
        print_info "创建数据目录: $DATA_DIR"
        mkdir -p "$DATA_DIR"
    else
        print_info "数据目录已存在: $DATA_DIR"
    fi
}

# 构建镜像
build() {
    print_info "开始构建 Docker 镜像..."
    docker-compose build
    print_info "镜像构建完成"
}

# 启动服务
start() {
    print_info "启动服务..."
    docker-compose up -d

    # 等待服务启动
    print_info "等待服务启动..."
    sleep 5

    # 检查服务状态
    if curl -s http://localhost:9090/health > /dev/null 2>&1; then
        print_info "后端服务启动成功"
    else
        print_warn "后端服务可能未正常启动，请检查日志"
    fi

    print_info "服务已启动"
    print_info "前端地址: http://localhost:9000"
    print_info "后端 API: http://localhost:9090/api"
    print_info "健康检查: http://localhost:9090/health"
}

# 停止服务
stop() {
    print_info "停止服务..."
    docker-compose down
    print_info "服务已停止"
}

# 重启服务
restart() {
    print_info "重启服务..."
    stop
    start
}

# 查看日志
logs() {
    if [ -n "$1" ]; then
        docker-compose logs -f "$1"
    else
        docker-compose logs -f
    fi
}

# 查看状态
status() {
    docker-compose ps
    echo ""
    print_info "检查后端健康状态..."
    curl -s http://localhost:9090/health | jq . || echo "后端服务未响应"
}

# 备份数据
backup() {
    local backup_file="$HOME/backups/work-tracker-$(date +%Y%m%d-%H%M%S).tar.gz"
    mkdir -p "$HOME/backups"

    print_info "备份数据到: $backup_file"
    tar -czf "$backup_file" -C "$HOME/docker/data" work-tracker
    print_info "备份完成"
}

# 恢复数据
restore() {
    if [ -z "$1" ]; then
        print_error "请指定备份文件路径"
        echo "用法: $0 restore <backup-file>"
        exit 1
    fi

    if [ ! -f "$1" ]; then
        print_error "备份文件不存在: $1"
        exit 1
    fi

    print_warn "这将覆盖现有数据，确认继续？(y/N)"
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "取消恢复"
        exit 0
    fi

    print_info "停止服务..."
    docker-compose down

    print_info "恢复数据..."
    tar -xzf "$1" -C "$HOME/docker/data"

    print_info "启动服务..."
    docker-compose up -d
    print_info "恢复完成"
}

# 完整部署
deploy() {
    check_docker
    create_data_dir
    build
    start
    print_info "部署完成！"
    print_info "前端地址: http://localhost:9000"
    print_info "后端 API: http://localhost:9090/api"
    print_info "数据目录: $DATA_DIR"
}

# 清理
clean() {
    print_warn "这将删除容器和镜像，但保留数据目录"
    read -p "确认继续？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "停止并删除容器..."
        docker-compose down
        print_info "删除镜像..."
        docker rmi ${PROJECT_NAME}-frontend ${PROJECT_NAME}-backend 2>/dev/null || true
        print_info "清理完成"
    else
        print_info "取消清理"
    fi
}

# 显示帮助
show_help() {
    cat << EOF
Work Tracker Docker 部署脚本（前后端分离版本）

用法: $0 [命令] [参数]

命令:
  deploy      完整部署（检查环境、创建目录、构建、启动）
  build       构建 Docker 镜像
  start       启动服务
  stop        停止服务
  restart     重启服务
  logs        查看日志（可选参数：backend/frontend）
  status      查看状态
  backup      备份数据库
  restore     恢复数据库（需要指定备份文件）
  clean       清理容器和镜像
  help        显示帮助信息

示例:
  $0 deploy              # 首次部署
  $0 restart             # 重启服务
  $0 logs backend        # 查看后端日志
  $0 backup              # 备份数据
  $0 restore backup.tar.gz  # 恢复数据

EOF
}

# 主函数
main() {
    case "${1:-help}" in
        deploy)
            deploy
            ;;
        build)
            build
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs "$2"
            ;;
        status)
            status
            ;;
        backup)
            backup
            ;;
        restore)
            restore "$2"
            ;;
        clean)
            clean
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
