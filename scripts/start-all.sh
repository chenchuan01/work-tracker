#!/bin/bash

# 同时启动前后端服务
echo "正在启动前后端服务..."

cd "$(dirname "$0")/.."

# 检查是否安装了 tmux 或 screen
if command -v tmux &> /dev/null; then
    echo "使用 tmux 启动服务..."

    # 创建新的 tmux 会话
    tmux new-session -d -s work-tracker

    # 启动后端
    tmux send-keys -t work-tracker "cd $(pwd)/server && npm run dev" C-m

    # 创建新窗口启动前端
    tmux new-window -t work-tracker
    tmux send-keys -t work-tracker "cd $(pwd) && npm run dev" C-m

    # 附加到会话
    echo "服务已启动！使用 'tmux attach -t work-tracker' 查看"
    echo "使用 Ctrl+B 然后按 D 可以分离会话"
    echo "使用 'tmux kill-session -t work-tracker' 停止所有服务"

    tmux attach -t work-tracker
else
    echo "未找到 tmux，将依次启动服务..."
    echo "建议安装 tmux: sudo apt install tmux"
    echo ""
    echo "请在两个终端窗口中分别运行："
    echo "  终端1: ./scripts/start-backend.sh"
    echo "  终端2: ./scripts/start-frontend.sh"
fi
