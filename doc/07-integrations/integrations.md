# Integrations

Every integration follows the same rules:

- Credentials live only in server environment variables (`.env.example` lists them all).
- **`PAYMENT_MODE=sandbox|live`** switches payment and courier endpoints together.
- A missing credential **disables** the feature visibly. Nothing is ever simulated.
- The owner turns payment methods on in **Admin → Payments**. A method appears at checkout only when it is both *enabled* and *configured*.

## Payments

### Flow (all online gateways)
1. `placeOrderAction` creates the order (status `PENDING`, payment `PENDING`) and **reserves stock for 30 minutes**.
2. `startOnlinePayment` creates a `Payment` row and asks the gateway for a checkout URL. The customer is redirected there.
3. The gateway sends the customer back to `/api/payments/<gateway>/…`. The server **verifies with the gateway's own API**, then `applyVerification` marks the order paid. This happens only if the verified amount equals the amount requested.
4. On failure or cancel, the customer lands on `/checkout/payment/<order>`, where they can **retry** or **switch to cash on delivery**.
5. If nothing happens within 30 minutes, `releaseExpiredReservations` (run by cron, and also at every checkout and dashboard load) cancels the order and releases the stock.

### bKash — Tokenized Checkout
- **Needed from bKash:** merchant PGW account → `app_key`, `app_secret`, `username`, `password`.
- **Code:** `src/modules/payments/providers/bkash.ts`. Grant token (cached) → Create → Execute → Query fallback.
- **Sandbox:** set the bKash sandbox credentials with `PAYMENT_MODE=sandbox`, enable bKash in Admin → Payments, and run bKash's test cases: success, insufficient balance, wrong PIN, cancel, timeout. bKash requires these to be demonstrated before issuing live keys.
- **Callback URL** (configured automatically): `https://ambrbd.com/api/payments/bkash/callback`

### Nagad — Merchant Payment Gateway
- **Needed from Nagad:** merchant ID, merchant RSA private key, Nagad PG public key.
- **Code:** `src/modules/payments/providers/nagad.ts`. Initialize (RSA-encrypted sensitive data + SHA256withRSA signature) → Complete → Verify. Responses are decrypted with a manual PKCS#1 v1.5 unpad, so it works on current Node versions.
- ⚠️ **Integration-ready, not yet tested against Nagad's sandbox** (it needs merchant keys). Nagad sends merchants its current API document during onboarding. Check the endpoint paths and key format against it before going live.
- **Callback URL:** `https://ambrbd.com/api/payments/nagad/callback`

### SSLCommerz — cards
- **Needed:** store ID and store password (sandbox store from developer.sslcommerz.com; live store after merchant approval).
- **Code:** `src/modules/payments/providers/sslcommerz.ts`. Session API → hosted page → return POST + IPN → **Validation API** (`val_id`). Risky payments (`risk_level=1`) are left pending for manual review.
- **IPN URL** (set it in the SSLCommerz merchant panel too): `https://ambrbd.com/api/payments/sslcommerz/ipn`

### Cash on delivery
Always available unless disabled in the admin. The payment is marked **PAID** automatically when the order is marked **DELIVERED**.

### Refunds
Refunds are done in the gateway's merchant portal. Then record them in the admin by marking the order **Returned/Cancelled** and noting the refund. Automated refund APIs can be added later; the provider interface has room for a `refund()` method.

## Couriers

| | Steadfast | Pathao |
|---|-----------|--------|
| Credentials | API key + secret key | client id/secret, merchant username/password, store id |
| Booking | Admin → Order → *Dispatch → Steadfast* | Admin → Order → *Dispatch → Pathao* (pick the city/zone, loaded live from Pathao) |
| Webhook | `POST /api/couriers/steadfast/webhook`, Bearer `STEADFAST_WEBHOOK_TOKEN` | `POST /api/couriers/pathao/webhook`, secret `PATHAO_WEBHOOK_SECRET` |
| Auto-update | "delivered" → order DELIVERED | same |

**Manual dispatch** (any courier, with a tracking number and link) always works, so the business can start before any courier API is approved. Code: `src/modules/couriers/`.

> Confirm the webhook payload field names and Pathao's required response header against the courier's current documentation when you register the webhook. The handlers accept the documented fields and log anything unrecognised.

## Delivery charges
Admin → Shipping. Zones (Inside Dhaka, Dhaka Suburbs, Outside Dhaka, plus any custom "special" zones) each have a fee, an optional free-delivery threshold and a delivery estimate. Every district maps to a zone. Individual upazilas can override their district (e.g. Savar → Dhaka Suburbs). **The seeded fees (৳70 / ৳100 / ৳130) are placeholders. Set your real rates before launch.**

## Email
Resend (`RESEND_API_KEY`) sends order confirmations, status updates (confirmed/shipped/delivered/cancelled) and password resets. Without a key, emails are written to the server log instead of being dropped. Before sending, verify the `ambrbd.com` domain in Resend (SPF/DKIM).

## Images
Cloudinary (`CLOUDINARY_*`) is used for signed server-side uploads from the admin, and Next.js serves optimised AVIF/WebP. In local development without Cloudinary, uploads are saved to `public/uploads/`. **In production, Cloudinary is required** (serverless disks are wiped between deploys).

## Analytics & marketing
- **GA4** (`NEXT_PUBLIC_GA4_ID`): page views plus `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `search`.
- **Meta Pixel** (`NEXT_PUBLIC_META_PIXEL_ID`): ViewContent, AddToCart, InitiateCheckout, Purchase, Search.
- **Meta Conversions API** (`META_CAPI_TOKEN`): a server-side Purchase event, deduplicated with the Pixel through `event_id = order number`. Phone and email are SHA-256 hashed. Demo orders are never sent.
- **Search Console:** add the domain property via DNS TXT, then submit `https://ambrbd.com/sitemap.xml`.

## Prepared for later
- **Abandoned carts:** `Cart.contactPhone/contactEmail/lastActivityAt` are recorded. A reminder job can query carts idle for more than 2 hours with contact details.
- **Referrals:** the `ReferralCode` table is reserved.
- **Bangla:** a `ProductTranslation` table, `nameBn` on geography, and font choices for Bangla are already in place.
- **SMS:** the notification module is the place to add an SSL Wireless or BulkSMSBD provider.
