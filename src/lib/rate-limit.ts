import "server-only";
import { db } from "./db";

/**
 * Fixed-window rate limiter stored in Postgres (works on serverless without Redis).
 * Returns { ok: false, retryAfter } when the limit is exceeded.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const row = rows[0];
  const ok = row.count <= limit;
  return { ok, retryAfter: ok ? 0 : Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000) };
}

export class RateLimitError extends Error {
  name = "RateLimitError";
  constructor(public retryAfter: number) {
    super(`Too many attempts. Please try again in ${Math.max(1, Math.ceil(retryAfter / 60))} minute(s).`);
  }
}

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  const r = await rateLimit(key, limit, windowSeconds);
  if (!r.ok) throw new RateLimitError(r.retryAfter);
}
