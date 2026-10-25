# Technical Architecture

## 1. Approach

The platform will be **one Next.js application (a modular monolith)** containing the storefront, customer accounts and the admin dashboard, backed by PostgreSQL.

For a business at AMBR's stage, a single deployable app is cheaper, simpler to run and easier to keep consistent than separate services. Separation comes from strict module boundaries inside the codebase. The admin can be split out later without rewriting the business logic.

## 2. Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js (App Router), latest stable** + React Server Components | SSR/ISR for SEO and fast mobile loads; server actions for forms |
| Language | **TypeScript** (strict) | Type safety from the database to the UI |
| Styling | **Tailwind CSS v4** with AMBR design tokens | Tokens enforce the brand palette |
| UI primitives | **shadcn/ui** (Radix), restyled to AMBR | Accessible dialogs, drawers, selects; we own the code |
| Database | **PostgreSQL 16** | Relational integrity, transactions, row locks for inventory |
| ORM | **Prisma** | Typed queries and migrations |
| Auth | **Auth.js v5** — email + password (argon2id), DB sessions; phone OTP is optional later | Secure, self-hosted; staff and customers in one user table with roles |
| Validation | **Zod** (shared client/server) + **React Hook Form** | One schema validates in both places; the server is authoritative |
| Images | **Cloudinary** (signed uploads from the admin) | Automatic WebP/AVIF, responsive sizes, CDN |
| Email | **Resend** (or any SMTP) + React Email templates | Order confirmation, password reset |
| SMS (optional) | BD SMS gateway (e.g. SSL Wireless / BulkSMSBD) behind an interface | Order updates by SMS, which matter in BD |
| Rate limiting / cache | **Upstash Redis** (or a Postgres fallback) | Throttling login, checkout, OTP and coupon checks |
| i18n | **next-intl**, `en` default, `bn` ready | Locale-prefixed routes later without a refactor |
| Charts (admin) | Recharts | Sales and order trends |
| Testing | **Vitest** (unit/integration with a test DB) + **Playwright** (E2E, mobile viewports) | |
| Monitoring | **Sentry** (errors) + structured logs (pino) + uptime check | |

## 3. Module boundaries

```
src/
  app/                    # Routes only — thin; call into modules
    (store)/              # Public storefront
    (account)/            # Logged-in customer area
    admin/                # Admin dashboard (RBAC-guarded layout)
    api/                  # Webhooks & callbacks only (payments, couriers)
  modules/                # Business logic — framework-light, unit-testable
    catalog/              # products, variants, categories, collections, notes, families
    inventory/            # stock, reservations, movements
    pricing/              # price + discount + coupon + shipping calculation
    cart/
    checkout/             # orchestrates cart → order in one transaction
    orders/               # status machine, history, invoices
    payments/             # provider interface + bkash / nagad / sslcommerz / cod adapters
    shipping/             # zones, rates, courier interface + pathao / steadfast adapters
    customers/            # profiles, addresses, wishlist
    reviews/              # verified-purchase reviews + moderation
    promotions/           # coupons, campaigns
    content/              # banners, pages, FAQ, policies, settings
    reports/              # aggregates + CSV export
    auth/                 # session helpers, RBAC policies
    audit/                # audit log writer
    notifications/        # email/SMS interfaces
  lib/                    # db client, env (zod-validated), logger, money, phone utils
  components/             # UI (see 03-design/component-architecture.md)
prisma/                   # schema, migrations, seed (demo data clearly flagged)
tests/                    # unit, integration, e2e
```

**Rule:** UI code never talks to Prisma directly. Routes and server actions call module services. Each module service validates its input (Zod), checks permissions, and owns its own transactions.

## 4. Rendering and caching

| Page | Strategy |
|------|----------|
| Home, category, collection, product | Static/ISR with **on-demand revalidation** when the admin edits something (`revalidateTag`) |
| Shop with filters | Server-rendered from URL search params (shareable, SEO-friendly) |
| Stock & price on the product page | Read fresh on the server at add-to-cart and checkout. The cached page only displays them. |
| Cart, checkout, account, admin | Dynamic, never cached |

Minimal client JS: interactive "islands" only (size selector, cart drawer, filters, gallery).

## 5. Key business flows

### 5.1 Pricing (server-authoritative)
`subtotal = Σ(variant.price × qty)` → minus product sale price / campaign → minus coupon → plus delivery (zone rate, or free above the threshold, or a free-shipping coupon) → **payable**.

All amounts are stored as **integers in poisha** (1 ৳ = 100 poisha) so there are no floating-point errors. The client total is display only; the server recalculates everything at order placement.

### 5.2 Order placement — one database transaction
1. Re-validate the cart, prices, coupon and delivery rate.
2. For each item, decrement stock with an atomic conditional update: `UPDATE inventory SET available = available - :q WHERE variant_id = :v AND available >= :q`. If no row updates, the item is out of stock: roll back and tell the customer which item.
3. Write `InventoryMovement` rows (type `ORDER_RESERVE`).
4. Create `Order` and `OrderItem` (snapshots of name, size and price) and the first `OrderStatusHistory` row.
5. Increment coupon usage (guarded by the usage limit in the same transaction).
6. Commit, then send the confirmation (email/SMS) *after* commit.

An idempotency key on checkout submission stops double-click duplicates.

### 5.3 Payments
A provider interface: `initiate(order) → redirectUrl`, `verify(callbackPayload) → PaymentResult`, `refund()`.

- **COD:** the order is created as `PENDING` and payment as `UNPAID`. The admin confirms the order (often by phone). Payment is marked `PAID` when delivered, or when the courier reconciles the cash.
- **bKash (Tokenized Checkout), Nagad (Merchant PGW), SSLCommerz (cards + MFS):** the order is created with payment `PENDING`, and the stock reservation has a **30-minute expiry**. The customer is redirected to the gateway. On callback/IPN the server **calls the gateway's execute/query API** to confirm the amount and status before marking it `PAID`. The redirect alone is never trusted. A scheduled job releases expired reservations and cancels unpaid online orders.
- Credentials live only in server env vars. Sandbox and live are selected by `PAYMENT_MODE`. While credentials are missing, the method is **hidden at checkout** — never faked.

### 5.4 Shipping
- `ShippingZone` (Inside Dhaka, Dhaka Suburbs, Outside Dhaka, plus custom zones) ← each `District` is mapped to a zone. Admin-editable rates, free threshold and special rules.
- The 64 districts and roughly 490 upazilas are seeded from public Bangladesh geo-code data.
- A courier interface: `createConsignment(order)`, `getStatus(trackingId)`, with webhook receivers. Pathao and Steadfast adapters are built in Phase 6. Until then the admin enters tracking numbers manually.

### 5.5 Order status machine
`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`, with `CANCELLED` (from Pending/Confirmed/Processing → stock is restored) and `RETURNED` (from Delivered/Shipped → restock is optional).

Illegal transitions are rejected on the server. Every change writes `OrderStatusHistory` (who, when, note) and an `AuditLog` entry.

## 6. Security

- **Passwords:** argon2id. **Sessions:** httpOnly, Secure, SameSite=Lax cookies; DB-backed and revocable.
- **RBAC:** roles `CUSTOMER`, `STAFF_ORDERS`, `STAFF_CATALOG`, `ADMIN`, `OWNER`. Permissions are checked in every admin service function, not only in the layout. Optional TOTP 2FA for staff.
- **CSRF:** server actions have built-in origin checks. Webhooks are verified by signature or by gateway query.
- **Rate limits:** login, register, password reset, checkout, coupon validation, newsletter, review submission.
- Input validated with Zod on the server. Prisma uses parameterised queries. React escapes output, and rich CMS text is sanitised (an allow-list of HTML).
- Security headers: CSP, HSTS, X-Frame-Options and others, set in middleware.
- Secrets only in env vars, with schema validation at boot. Nothing secret uses the `NEXT_PUBLIC_` prefix.
- An audit log for every admin create, update, delete and status change.

## 7. SEO & marketing

- Per-page `generateMetadata` (title, description, canonical, Open Graph). JSON-LD for `Product` (with `Offer` per variant; `AggregateRating` **only when real reviews exist**), `Organization`, `BreadcrumbList`.
- `sitemap.xml` and `robots.txt` generated from published content only. Hidden categories and products are excluded.
- GA4, Meta Pixel and CAPI behind a consent-aware `analytics` module. Events: view_item, add_to_cart, begin_checkout, purchase (purchase is fired server-side after payment confirmation, for CAPI dedup).
- Architecture ready for: abandoned-cart records (carts with contact info but no order), referral codes (`ReferralCode` table, reserved), campaigns.

## 8. Hosting options

| Option | Monthly cost (approx.) | Pros | Cons |
|--------|------------------------|------|------|
| **A. Vercel (Singapore region) + Neon/Supabase Postgres (Singapore) + Cloudinary free tier** *(recommended to start)* | ~$0–45 | Zero server maintenance, preview deploys, automatic HTTPS, Neon point-in-time restore | Costs rise with traffic; vendor lock-in is mild |
| B. One VPS (DigitalOcean/Hetzner, Singapore) with Docker Compose (app + Postgres + Caddy) | ~$12–25 | Cheap and predictable | You own patching, backups and uptime |

Both serve Bangladesh with low latency from Singapore. Deployment docs will cover the chosen option fully.

## 9. Backups

- Managed Postgres point-in-time recovery (7+ days), **plus** a nightly `pg_dump` to separate object storage (Cloudflare R2/S3), kept 30 days, with a documented and tested restore procedure.
- Cloudinary keeps the originals of all images.

## 10. Environment variables (preview)

`DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, `CLOUDINARY_*`, `RESEND_API_KEY`, `UPSTASH_REDIS_*`, `PAYMENT_MODE`, `BKASH_*`, `NAGAD_*`, `SSLCOMMERZ_*`, `PATHAO_*`, `STEADFAST_*`, `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN`, `SENTRY_DSN`. The full `.env.example` will be delivered in Phase 4.

---

## 11. As built (2026-10-25): decisions made during implementation

| Planned | Built | Why |
|---------|-------|-----|
| Auth.js v5 | **Own session auth** (`src/modules/auth`): argon2id hashes, random 256-bit tokens, only SHA-256 hashes stored in `Session`, httpOnly/SameSite cookies, revoke-all on password change | Auth.js v5 was still in beta. A small, audited implementation following the post-Lucia "roll your own sessions" guidance has fewer moving parts and gives us DB-revocable sessions. |
| `revalidateTag` / Cache Components | **ISR (`revalidate = 300`) + `revalidatePath('/', 'layout')`** after admin edits | Next.js 16's `cacheComponents` is new. The documented previous caching model is stable and easy to reason about; storefront pages are static and refreshed on every admin change. |
| Upstash Redis rate limiting | **Postgres fixed-window limiter** (`RateLimit` table, one atomic upsert) | No extra service to run or pay for. Upstash can replace it behind the same `rateLimit()` function if traffic grows. |
| shadcn/ui CLI | **shadcn-style components owned in `src/components/ui`**, built on Radix (Dialog, Accordion) | Same approach (we own the code, Radix for accessibility) without generator churn. |
| Cream header (wireframe) | **Burgundy header with the cream logo** | The light-background logo in the kit has a leaf-shadow photo baked in, which can't be removed cleanly without altering the artwork. The dark-background version separated cleanly, and a burgundy header is on-brand (see brand-asset-audit). Revisit when vector logos arrive. |
| Price sorting in SQL | In-memory sort over the filtered set | Exact "from price" semantics (cheapest active size); fine for hundreds of products. Move to a SQL `MIN()` subquery if the catalogue grows past a few thousand. |
| Upstash cron / queue | Vercel Cron + opportunistic cleanup at checkout and dashboard load | No stuck stock even on the Hobby plan. |

**Stack versions:** Next.js 16.4, React 19.3, Prisma 6.19, Tailwind CSS 4, Zod 4, Vitest 5, Playwright 1.64.
