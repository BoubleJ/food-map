# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.4 prune @food-map/api --docker

FROM base AS builder
COPY --from=pruner /repo/out/json/ ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ ./
COPY tsconfig.base.json ./
RUN pnpm --filter @food-map/api build
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nestjs -G nodejs
COPY --from=builder --chown=nestjs:nodejs /repo/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /repo/packages/shared ./packages/shared
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/package.json ./apps/api/
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/dist ./apps/api/dist
USER nestjs
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
