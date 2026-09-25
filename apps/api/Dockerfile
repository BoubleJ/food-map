# syntax=docker/dockerfile:1
# 모노레포 루트를 빌드 컨텍스트로 두고 실행한다: docker build -f apps/api/Dockerfile .
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @food-map/api...

FROM base AS builder
COPY --from=deps /repo ./
COPY tsconfig.base.json turbo.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @food-map/api build \
 && pnpm install --prod --frozen-lockfile --filter @food-map/api...

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nestjs -G nodejs
COPY --from=builder --chown=nestjs:nodejs /repo/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/package.json ./apps/api/
COPY --from=builder --chown=nestjs:nodejs /repo/packages/shared ./packages/shared
USER nestjs
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
