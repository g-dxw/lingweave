# 将 docs/ 编译为静态文档站。
FROM oven/bun:1.3.13 AS docs-build

WORKDIR /app/docs
COPY docs/package.json docs/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --ignore-scripts --cache-dir=/root/.bun/install/cache
COPY CHANGELOG.md /app/CHANGELOG.md
COPY docs ./
RUN bun run postinstall
RUN bun run build

# 构建 Vite 前端产物，并把静态文档映射到 /docs。
FROM oven/bun:1.3.13 AS web-build

WORKDIR /app/web
ARG VITE_NIFFLER_ORIGIN
ENV VITE_NIFFLER_ORIGIN=$VITE_NIFFLER_ORIGIN
COPY web/package.json web/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --cache-dir=/root/.bun/install/cache
COPY VERSION /app/VERSION
COPY CHANGELOG.md /app/CHANGELOG.md
COPY --from=docs-build /app/docs/out /app/docs/out
COPY web ./
RUN bun run build

# 运行镜像：只启动静态前端，AI 请求由浏览器前台直连用户自己的接口。
FROM nginx:1.27-alpine

COPY --from=web-build /app/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
