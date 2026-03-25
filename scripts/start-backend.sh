#!/bin/bash

# 启动后端开发服务器
echo "正在启动后端开发服务器..."

cd "$(dirname "$0")/../server"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    npm install
fi

# 检查是否需要构建
if [ ! -d "dist" ]; then
    echo "正在构建后端..."
    npm run build
fi

npm run dev
