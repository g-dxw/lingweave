FROM oven/bun:1.3.13 AS docs-build

WORKDIR /app
COPY docs/package.json docs/bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --ignore-scripts --cache-dir=/root/.bun/install/cache
COPY docs ./
COPY CHANGELOG.md /CHANGELOG.md
RUN bun run postinstall
RUN bun run build

FROM nginx:1.27-alpine

COPY --from=docs-build /app/out /usr/share/nginx/html
COPY docs/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
