# 使用 Node.js 官方镜像
FROM node:20.18.0

# 设置工作目录
WORKDIR /app

# 复制依赖文件（Yarn 项目）
COPY package.json yarn.lock ./

# 安装依赖（使用镜像内置的 yarn）
RUN yarn install --frozen-lockfile
# ... existing code ...
# 复制项目代码
COPY . .

# 构建项目
RUN yarn build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["yarn", "start"]
