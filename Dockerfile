# 1. 基础镜像
FROM node:18-alpine AS base

# 2. 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
# 如果用到 prisma，需要复制 prisma 目录
COPY prisma ./prisma

RUN npm ci

# 3. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js (Standalone 模式)
# 确保在 next.config.ts 中开启 output: 'standalone'
RUN npm run build

# 4. 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# 开启 WAL 模式提高 SQLite 并发性能
ENV DATABASE_URL="file:/app/data/prod.db?connection_limit=1&socket_timeout=10"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# 复制 Prisma 迁移文件以便在启动时运行迁移
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# 复制 content 目录（如果需要在运行时动态添加内容）
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动脚本：先运行迁移，再启动服务
CMD npx prisma migrate deploy && node server.js

