# 构建 Vite 前端产物。
FROM oven/bun:1.3.13 AS web-build

WORKDIR /app/web
COPY web/package.json web/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --cache-dir=/root/.bun/install/cache
COPY VERSION /app/VERSION
COPY CHANGELOG.md /app/CHANGELOG.md
COPY web ./
RUN bun run build

# 运行镜像：只启动静态前端，AI 请求由浏览器前台直连用户自己的接口。
FROM node:22-bookworm-slim

WORKDIR /app
COPY --from=web-build /app/web/dist /app/web/dist
ENV NODE_ENV=production
ENV PORT=3000
RUN npm install -g serve@14.2.5

EXPOSE 3000
CMD ["serve", "-s", "/app/web/dist", "-l", "3000"]
