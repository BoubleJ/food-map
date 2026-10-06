# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.4 prune @food-map/admin --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ ./
COPY tsconfig.base.json .env ./
RUN pnpm --filter @food-map/admin build

FROM caddy:2-alpine AS runner
COPY --from=builder /repo/apps/admin/dist /srv
RUN printf ':3001 {\n\troot * /srv\n\ttry_files {path} /index.html\n\tfile_server\n\tencode zstd gzip\n}\n' > /etc/caddy/Caddyfile
EXPOSE 3001
