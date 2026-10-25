# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────────────
# AMBR production image (multi-stage, Next.js standalone output).
#
#   docker build -t ambr-app .                       # app image (target: runner)
#   docker build --target migrator -t ambr-migrator .  # migrations + seed job
#
# The image is built WITHOUT a database: catalogue pages render on the first request
# and are then cached (ISR), so no DATABASE_URL is needed at build time.
# Only NEXT_PUBLIC_* values are baked in at build time — everything else is runtime env.
# ──────────────────────────────────────────────────────────────────────────────
ARG NODE_VERSION=22

# ── base: shared OS layer (Alpine; Prisma needs OpenSSL) ──────────────────────
FROM node:${NODE_VERSION}-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ── deps: install once, cached until package-lock.json or the schema changes ──
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── builder: compile the Next.js app into .next/standalone ────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SITE_URL=https://ambrbd.com
ARG NEXT_PUBLIC_GA4_ID=""
ARG NEXT_PUBLIC_META_PIXEL_ID=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID \
    NEXT_PUBLIC_META_PIXEL_ID=$NEXT_PUBLIC_META_PIXEL_ID \
    BUILD_STANDALONE=1 \
    SKIP_BUILD_PRERENDER=1 \
    NODE_ENV=production \
    # Placeholders that only satisfy env validation during the build; never used at runtime.
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build \
    AUTH_SECRET=build-only-placeholder-secret-not-used-at-runtime
RUN --mount=type=cache,target=/app/.next/cache \
    npx prisma generate && npx next build \
 # Prune Prisma's WebAssembly engines for other databases/edge runtimes (~45 MB).
 # This app uses the native PostgreSQL library engine (libquery_engine-*.so.node).
 && find .next/standalone/node_modules/@prisma/client/runtime -name '*.wasm*' -delete \
 && rm -f .next/standalone/node_modules/.prisma/client/query_engine_bg.wasm

# ── migrator: one-off job — `prisma migrate deploy` (+ optional seed) ─────────
# Has its own tiny dependency set (Prisma CLI/client, tsx, argon2) instead of the full dev tree.
FROM base AS migrator
ENV NODE_ENV=production
COPY docker/migrator.package.json ./package.json
RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY --chmod=755 docker/migrate.sh ./migrate.sh
# Files stay root-owned and read-only for the job; no recursive chown (it would duplicate a layer).
USER node
CMD ["./migrate.sh"]

# ── runner: minimal runtime (≈ standalone server + static assets only) ────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
