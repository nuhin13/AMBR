import { vi } from "vitest";

// Integration tests use a dedicated database so they can truncate freely.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://ambr:ambr_dev_password@localhost:5433/ambr_test?schema=public";
process.env.AUTH_SECRET ??= "test-secret-test-secret-test-secret-1234";
process.env.NEXT_PUBLIC_SITE_URL ??= "http://localhost:3000";
process.env.LOG_LEVEL = "error";

// Request-scoped Next.js APIs aren't available outside a request.
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1", "user-agent": "vitest" }),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

// Root params only exist inside the Next.js compiler; tests run as the English storefront.
vi.mock("next/root-params", () => ({ locale: async () => "en" }));
