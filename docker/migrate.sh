#!/bin/sh
# Runs before the app starts (docker-compose.prod.yml → service "migrate").
set -e
echo "→ Applying database migrations…"
npx prisma migrate deploy
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "→ Seeding reference data (idempotent)…"
  npx tsx prisma/seed.ts
fi
echo "✓ Database ready"
