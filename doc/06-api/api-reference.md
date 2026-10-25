# API Reference

AMBR uses **Next.js Server Actions** for everything the website itself does (forms, cart, checkout), and **Route Handlers** (`/api/*`) only for external systems: payment gateways, couriers, schedulers and uptime monitors.

Server Actions are POST endpoints that Next.js generates with built-in origin checks (CSRF protection). Each one validates its input with Zod on the server and returns a uniform result:

```ts
type ActionResult<T> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
```

Unexpected errors are logged and returned as a generic message, so internal details never reach the browser.

## Storefront actions

| Module · action | Input | Notes |
|-----------------|-------|-------|
| `cart/actions` · `getCartAction` | — | Current cart (user cart or guest-cookie cart) |
| `addToCartAction` | `variantId, quantity` | Rate-limited (120/min/IP). Rejects hidden, archived or sold-out items. Quantity is capped at the available stock and the admin max-per-item setting. |
| `updateCartItemAction` / `removeCartItemAction` | `itemId, quantity` | Ownership is checked |
| `changeCartVariantAction` | `itemId, variantId` | Must be a size of the same product; merges duplicates |
| `applyCouponAction` / `removeCouponAction` | `code` | Rate-limited (15/10 min/IP) |
| `checkout/actions` · `placeOrderAction` | `CheckoutInput` (see `modules/checkout/schema.ts`) | Rate-limited (8/10 min/IP). Idempotent via `idempotencyKey`. Returns `redirectUrl`: the gateway URL for online payments, otherwise the confirmation page. |
| `retryPaymentAction` | `orderNumber, token` | Starts a new gateway attempt while the 30-minute reservation is open |
| `switchToCodAction` | `orderNumber, token` | Converts an unpaid online order to cash on delivery |
| `orders/actions` · `trackOrderAction` | `orderNumber, phone` | Returns a tokenised tracking link if the phone matches |
| `catalog/actions` · `discoverProductsAction` | `kind (family/occasion), slug` | Fragrance-finder results |
| `auth/actions` · `registerAction`, `loginAction`, `logoutAction`, `forgotPasswordAction`, `resetPasswordAction`, `changePasswordAction` | — | Rate-limited per IP and per identifier. argon2id password hashes. DB sessions in httpOnly cookies. A password reset revokes all sessions. |
| `customers/actions` · `saveAddressAction`, `deleteAddressAction`, `toggleWishlistAction`, `updateProfileAction` | — | Signed-in only |
| `reviews/actions` · `submitReviewAction` | `orderItemId, rating, title?, body` | Only for the customer's own **delivered** items; held for moderation |
| `content/actions` · `subscribeNewsletterAction`, `contactAction` | — | Rate-limited; the contact form has a honeypot field |

## Admin actions

Admin actions live in `src/modules/*/admin-actions.ts`. **Every** admin action calls `requirePermission(<permission>)` itself; the layout is not relied on for security. Every mutation writes an `AuditLog` row and revalidates the storefront cache.

| Permission | Roles |
|------------|-------|
| `dashboard:view` | all staff |
| `orders:manage`, `customers:view` | STAFF_ORDERS, ADMIN, OWNER |
| `catalog:manage`, `inventory:manage`, `reviews:moderate` | STAFF_CATALOG, ADMIN, OWNER |
| `promotions:manage`, `content:manage`, `shipping:manage`, `settings:manage`, `reports:view`, `audit:view`, `customers:manage` | ADMIN, OWNER |
| `staff:manage` | OWNER |

## Route handlers

| Method · path | Caller | Auth / verification | Behaviour |
|---------------|--------|---------------------|-----------|
| `GET /api/payments/bkash/callback?paymentID&status` | Customer browser (redirected by bKash) | Server calls bKash **Execute**, then **Query** to confirm | Marks the order PAID only if bKash reports `Completed` with the expected amount; then redirects to the confirmation or payment-retry page |
| `GET /api/payments/nagad/callback?payment_ref_id` | Customer browser (Nagad) | Server calls Nagad **Verify** | Same as above |
| `POST /api/payments/sslcommerz/return?outcome=success\|fail\|cancel` | Customer browser (SSLCommerz form post) | Success is confirmed via the SSLCommerz **Validation API** (`val_id`) | Same as above |
| `POST /api/payments/sslcommerz/ipn` | SSLCommerz server | Validation API | Catches payments where the customer closed the tab |
| `POST /api/couriers/steadfast/webhook` | Steadfast | `Authorization: Bearer $STEADFAST_WEBHOOK_TOKEN` (timing-safe compare) | Appends to the shipment event log; "delivered" moves the order to DELIVERED |
| `POST /api/couriers/pathao/webhook` | Pathao | `X-PATHAO-Signature` = `$PATHAO_WEBHOOK_SECRET` | Same as above |
| `GET /api/cron/release-reservations` | Vercel Cron / system cron | `Authorization: Bearer $CRON_SECRET` | Cancels unpaid online orders older than 30 minutes and releases their stock |
| `GET /api/health` | Uptime monitor | public | `{ ok, db }`; 503 if the database is down |
| `GET /sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` | crawlers | public | Published content only |

All callbacks are **idempotent**. A unique `(provider, providerPaymentId)` constraint and a "PAID is final" check mean duplicate callbacks change nothing.
