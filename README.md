# AMBR — E-commerce Platform

**AMBR — Above Ordinary.** · Inspired perfumes & attars for Bangladesh · `ambrbd.com`

This is the production code for the AMBR online store: a customer-facing website, customer accounts, and a secure admin dashboard. The owner can run the business from the dashboard without changing code.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, PostgreSQL 16, Prisma 6 and Zod.

> 📁 Planning, design, architecture and operations documents live in **[`/doc`](doc/README.md)**.

---

## Quick start (local development)

**Requirements:** Node.js 20.9+ (22 LTS recommended), Docker Desktop, npm.

```bash
npm install                      # also generates the Prisma client
cp .env.example .env             # then set AUTH_SECRET (openssl rand -base64 48)
npm run db:up                    # start PostgreSQL in Docker (port 5433)
npm run db:deploy                # apply migrations
npm run db:seed:demo             # reference data + owner account + DEMO catalogue
npm run dev                      # http://localhost:3000
```

| What | URL | Login |
|------|-----|-------|
| Storefront | http://localhost:3000 | — (guest checkout) |
| Admin dashboard | http://localhost:3000/admin | `owner@ambr.local` / `ChangeMe!2026` (local only; **change it**) |
| Database browser | `npm run db:studio` | — |

The demo catalogue is clearly flagged: products carry a **Demo** badge and coupon `DEMO10` is marked demo. Remove all of it before launch with **Admin → Settings → Remove demo data**, or with `npm run db:remove-demo`.

## Docker

| File | Purpose |
|------|---------|
| `docker-compose.yml` | **Development:** PostgreSQL on port 5433. The `ambr_test` database is created automatically. Run the app with `npm run dev`. |
| `docker-compose.prod.yml` | **Production stack:** Postgres, migrate job, app, Caddy (HTTPS), scheduler, nightly backups |
| `Dockerfile` | Multi-stage, Alpine, Next.js standalone, non-root, healthcheck. Targets: `runner` (app, ~380 MB) and `migrator` |

```bash
# full production-like stack (needs .env.production — see doc/09-deployment/deployment-guide.md)
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve (the build needs a reachable database, because it prerenders catalogue pages) |
| `npm run typecheck` · `npm run lint` | Static checks |
| `npm test` | Unit and integration tests (Vitest; uses the `ambr_test` database) |
| `npm run test:e2e` | End-to-end tests (Playwright; mobile and desktop; needs the demo seed) |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply migrations (production/CI) |
| `npm run db:seed` / `db:seed:demo` | Seed reference data (+ demo catalogue) — idempotent |
| `npm run db:remove-demo` | Delete demo products, orders and coupon |
| `npm run db:backup` | `pg_dump` backup (see `doc/09-deployment/backup-and-recovery.md`) |

The test database `ambr_test` is created automatically the first time the development database starts. For an older volume: `docker compose exec db psql -U ambr -c "CREATE DATABASE ambr_test;"`

## Project structure

```
src/
  app/
    (store)/          Storefront: home, shop, product, cart, checkout, account, content pages
    admin/            Admin dashboard (role-protected)
    api/              Payment callbacks, courier webhooks, cron, health
    sitemap.ts robots.ts manifest.ts icon.png
  modules/            Business logic — auth, catalog, cart, checkout, orders, inventory,
                      payments (bKash / Nagad / SSLCommerz), couriers (Pathao / Steadfast),
                      pricing, promotions, shipping, content, reviews, reports, audit…
  components/         UI — ui/ primitives, layout/, product/, cart/, checkout/, home/, admin/…
  lib/                db, env validation, money, phone, logger, rate limiting, sanitising
prisma/               schema.prisma, migrations/, seed.ts, data/bd-geo.json, remove-demo.ts
tests/                unit/, integration/, e2e/
brand/original/       The untouched brand kit supplied by the owner
public/brand/         Web-ready logo files (background removed only; artwork unchanged)
doc/                  Planning, design, database, API, integrations, testing, deployment
```

## Key guarantees

- **Prices, stock and totals are computed on the server.** Client totals are display-only.
- **Overselling is impossible.** Stock is reserved with guarded SQL updates inside the order transaction, and database CHECK constraints are a second line of defence. A concurrency test proves it.
- **No fake payments.** A payment method only appears at checkout when it is enabled in the admin *and* its gateway credentials are configured. An order is marked paid only after server-side verification with the gateway, and only when the amounts match.
- **No fake reviews.** Reviews can only be written for delivered order items, and they are moderated before they appear.
- **No invented performance data.** Longevity and projection appear only when tested values *with a test-method note* are entered.
- **Future categories stay hidden** (Body Mist, Car, Home, Pet, Mini, Gift) until activated in Admin → Categories.
- **Orders snapshot** product name, size, SKU, price and delivery address.

## Deployment

See **[doc/09-deployment/deployment-guide.md](doc/09-deployment/deployment-guide.md)** (Vercel + managed Postgres, or the Docker Compose stack on a VPS) and the **[launch checklist](doc/09-deployment/launch-checklist.md)**.
