# ── Stage 1: install all deps ──────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/api/package.json apps/api/
COPY apps/admin-web/package.json apps/admin-web/
COPY apps/tenant-web/package.json apps/tenant-web/

# Install all workspace deps (needed so shared devDeps like typescript are available)
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ─────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY apps/api/ apps/api/

# Build shared then API
RUN pnpm --filter @iot-platform/shared build
RUN pnpm --filter @iot-platform/api build

# ── Stage 3: lean production runtime ───────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/admin-web/package.json apps/admin-web/
COPY apps/tenant-web/package.json apps/tenant-web/

RUN pnpm install --frozen-lockfile --prod --filter @iot-platform/api...

COPY --from=builder /app/packages/shared/dist packages/shared/dist/
COPY --from=builder /app/apps/api/dist apps/api/dist/

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
