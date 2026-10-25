# Deployment Guide

## Option A (recommended): Vercel + Neon Postgres (Singapore)

1. **Database:** create a Neon project in **AWS ap-southeast-1 (Singapore)**. Copy the *pooled* connection string as `DATABASE_URL`, adding `?sslmode=require&pgbouncer=true&connection_limit=1`. Also copy the *direct* string, which is used for migrations.
2. **Media:** create a Cloudinary account and note the cloud name, API key and secret.
3. **Email:** create a Resend account and verify `ambrbd.com` (add the DNS records it shows).
4. **Vercel project:** import the repository. Framework: Next.js. Region: `sin1` (already set in `vercel.json`).
5. **Environment variables** (Project → Settings → Environment Variables), from `.env.example`:
   - Required: `DATABASE_URL`, `AUTH_SECRET` (`openssl rand -base64 48`), `NEXT_PUBLIC_SITE_URL=https://ambrbd.com`, `PAYMENT_MODE=sandbox` (switch to `live` after the gateways approve), `CRON_SECRET`, `CLOUDINARY_*`, `RESEND_API_KEY`, `EMAIL_FROM`.
   - Add payment, courier and analytics keys as they arrive.
6. **First deploy:** before the first build, run migrations and the seed against the production database from your machine:
   ```bash
   DATABASE_URL="<direct url>" npx prisma migrate deploy
   DATABASE_URL="<direct url>" SEED_OWNER_EMAIL=you@ambrbd.com SEED_OWNER_PASSWORD='<strong password>' npm run db:seed
   ```
   (Do **not** use `db:seed:demo` in production.) Then deploy. The build prerenders catalogue pages, so the database must be reachable from the build.
7. **Cron:** `vercel.json` schedules `/api/cron/release-reservations` every 15 minutes. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when `CRON_SECRET` is set. *(The Hobby plan limits crons to once a day. The app also releases expired reservations during every checkout and dashboard visit, so stock is never stuck for long.)*
8. **Later migrations:** add `npx prisma migrate deploy` before `next build`, by setting the Vercel build command to `npx prisma migrate deploy && npm run build`. Set `DATABASE_URL` to the direct URL for builds.

## Domain: ambrbd.com
1. Vercel → Project → Domains → add `ambrbd.com` and `www.ambrbd.com` (redirect www → apex).
2. At your registrar, set the records Vercel shows (typically `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`).
3. HTTPS certificates are issued automatically. The app sends HSTS; once everything works over HTTPS, you can submit the domain to the HSTS preload list.
4. Register gateway callback URLs and courier webhooks using `https://ambrbd.com/...` (see `07-integrations`).

## Option B: VPS with Docker Compose (DigitalOcean/Hetzner, Singapore)

Everything runs from `docker-compose.prod.yml`:

| Service | Image | Role |
|---------|-------|------|
| `db` | postgres:16-alpine | Database (internal network only, not exposed) |
| `migrate` | `ambr-migrator` (Dockerfile target `migrator`, ~0.6 GB) | One-off job: `prisma migrate deploy` (+ seed when `RUN_SEED=true`). The app waits for it to finish. |
| `app` | `ambr-app` (Dockerfile target `runner`, **~380 MB**) | Next.js standalone server, non-root user, healthcheck on `/api/health` |
| `caddy` | caddy:2-alpine | Automatic HTTPS (Let's Encrypt) for `$DOMAIN`, www → apex redirect, gzip/zstd |
| `scheduler` | curlimages/curl | Calls the reservation-release job every 10 minutes |
| `backup` | postgres:16-alpine | Nightly `pg_dump` into `./backups`, keeps 30 days |

**How the images are optimised:** multi-stage build; BuildKit caches for npm and `.next/cache`; Next.js `output: "standalone"` (only traced files are shipped); Alpine base; Prisma's unused WebAssembly engines pruned (~45 MB); the migrator has its own minimal dependency set; the app runs as a non-root user. **No database is needed at build time.** Catalogue pages render on their first request and are then cached (ISR).

**Steps**
1. Create an Ubuntu VM (2 GB RAM minimum), install Docker Engine with the Compose plugin, and point the DNS `A` records for `ambrbd.com` and `www` at the server.
2. Copy the project to the server, then `cp .env.example .env.production` and fill in the values: `POSTGRES_PASSWORD`, `AUTH_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL=https://ambrbd.com`, `DOMAIN=ambrbd.com`, `SEED_OWNER_*`, Cloudinary, Resend, and the gateway and courier keys.
3. First start (creates the reference data and the owner account):
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production build
   RUN_SEED=true docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   ```
4. Updates: `git pull && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`. Migrations run automatically before the new app starts.
5. Check with `docker compose -f docker-compose.prod.yml ps`. All services should be `Up` and `app` should be `(healthy)`.
6. Copy `./backups` off the server regularly, e.g. `rclone sync ./backups r2:ambr-backups` from cron.

**Build for a different CPU:** if you build on an Apple Silicon Mac for an x86 server, add `--platform linux/amd64`, or simply build on the server.

**Verified locally (2026-10-25):** the full stack built and started; migrate and seed completed; the app passed its healthcheck; all 16 Playwright end-to-end tests passed against the container; staff login (native argon2 on Alpine) and the admin dashboard worked; security headers were present.

## Monitoring
- **Uptime:** point UptimeRobot or Better Stack at `https://ambrbd.com/api/health` (it returns 503 if the database is down).
- **Logs:** the app writes structured JSON logs (`order.placed`, `payment.amount_mismatch`, `bkash.callback_error`, …). Vercel → Logs, or `docker logs`. A log drain such as Better Stack or Axiom is recommended.
- **Errors:** add Sentry (`@sentry/nextjs`) when ready. The logger and error boundaries are already in place.
- **Watch for:** `payment.amount_mismatch` and `*.callback_error` in the logs, plus the dashboard's low-stock list.

## Security checklist
- [ ] `AUTH_SECRET` is unique and random; no secrets in `NEXT_PUBLIC_*`
- [ ] The owner password has been changed from the seed value; each staff member has their own account with the least role needed
- [ ] `PAYMENT_MODE=live` only after the sandbox test cases pass
- [ ] Gateway callback URLs and courier webhook secrets are registered
- [ ] Backups run, and one restore has been tested (see backup-and-recovery.md)
