# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.4 prune @food-map/web --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ ./
COPY tsconfig.base.json .env ./
RUN pnpm --filter @food-map/web build
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S web -G nodejs
COPY --from=builder --chown=web:nodejs /repo/node_modules ./node_modules
COPY --from=builder --chown=web:nodejs /repo/packages/shared ./packages/shared
COPY --from=builder --chown=web:nodejs /repo/apps/web/package.json ./apps/web/
COPY --from=builder --chown=web:nodejs /repo/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=web:nodejs /repo/apps/web/build ./apps/web/build
USER web
EXPOSE 3000
WORKDIR /app/apps/web
CMD ["node", "node_modules/@react-router/serve/bin.cjs", "./build/server/index.js"]
