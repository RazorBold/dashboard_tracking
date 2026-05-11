# ── Stage 1: install all deps ──────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/ packages/
COPY apps/api/package.json apps/api/
COPY apps/admin-web/package.json apps/admin-web/
COPY apps/tenant-web/package.json apps/tenant-web/

RUN pnpm install --frozen-lockfile

# ── Stage 2: build ─────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY apps/tenant-web/ apps/tenant-web/

RUN pnpm --filter @iot-platform/shared build
RUN pnpm --filter @iot-platform/tenant-web build

# ── Stage 3: serve with nginx ──────────────────────────
FROM nginx:1.25-alpine AS runner

COPY --from=builder /app/apps/tenant-web/dist /usr/share/nginx/html
COPY docker/tenant-web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
