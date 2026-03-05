FROM node:20-slim

WORKDIR /app

# 安装 Python 和构建工具（better-sqlite3 需要）
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 重新构建 better-sqlite3
RUN npm rebuild better-sqlite3

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 创建数据目录
RUN mkdir -p /data

# 暴露端口
EXPOSE 3001

# 启动服务
CMD ["npm", "start"]
