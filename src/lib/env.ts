import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once at boot. Nothing here is exposed to the
 * browser — only variables prefixed NEXT_PUBLIC_ reach client bundles.
 */
// Empty values (e.g. KEY="" copied from .env.example) count as "not configured".
const blankToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optional = z.preprocess(blankToUndefined, z.string().trim().min(1).optional());

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  PAYMENT_MODE: z.enum(["sandbox", "live"]).default("sandbox"),

  // Payments
  BKASH_APP_KEY: optional,
  BKASH_APP_SECRET: optional,
  BKASH_USERNAME: optional,
  BKASH_PASSWORD: optional,
  NAGAD_MERCHANT_ID: optional,
  NAGAD_MERCHANT_PRIVATE_KEY: optional,
  NAGAD_PG_PUBLIC_KEY: optional,
  SSLCOMMERZ_STORE_ID: optional,
  SSLCOMMERZ_STORE_PASSWORD: optional,

  // Couriers
  STEADFAST_API_KEY: optional,
  STEADFAST_SECRET_KEY: optional,
  STEADFAST_WEBHOOK_TOKEN: optional,
  PATHAO_CLIENT_ID: optional,
  PATHAO_CLIENT_SECRET: optional,
  PATHAO_USERNAME: optional,
  PATHAO_PASSWORD: optional,
  PATHAO_STORE_ID: optional,
  PATHAO_WEBHOOK_SECRET: optional,

  // Media, email, marketing
  CLOUDINARY_CLOUD_NAME: optional,
  CLOUDINARY_API_KEY: optional,
  CLOUDINARY_API_SECRET: optional,
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.preprocess(blankToUndefined, z.string().default("AMBR <orders@ambrbd.com>")),
  META_CAPI_TOKEN: optional,
  NEXT_PUBLIC_META_PIXEL_ID: optional,
  NEXT_PUBLIC_GA4_ID: optional,
  CRON_SECRET: optional,
});

function load() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env = load();
export const isProd = env.NODE_ENV === "production";
export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
