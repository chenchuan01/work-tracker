#!/bin/bash

# 启动前端开发服务器
echo "正在启动前端开发服务器..."

cd "$(dirname "$0")/.."

npm run dev
