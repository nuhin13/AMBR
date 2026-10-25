import "server-only";
import { env, siteUrl } from "@/lib/env";
import { logger } from "@/lib/logger";
import { GatewayError, fromTakaString, takaString, type InitiateInput, type InitiateResult, type VerifyResult } from "./types";

/**
 * bKash Tokenized Checkout (PGW) — https://developer.bka.sh
 * Flow: grant token → create payment → customer approves on bKash → callback → execute → (query as fallback).
 */
const BASE = () =>
  env.PAYMENT_MODE === "live" ? "https://tokenized.pay.bka.sh/v1.2.0-beta" : "https://tokenized.sandbox.bka.sh/v1.2.0-beta";

export const bkashConfigured = () => Boolean(env.BKASH_APP_KEY && env.BKASH_APP_SECRET && env.BKASH_USERNAME && env.BKASH_PASSWORD);

let cachedToken: { value: string; expiresAt: number } | null = null;

async function grantToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const res = await fetch(`${BASE()}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", username: env.BKASH_USERNAME!, password: env.BKASH_PASSWORD! },
    body: JSON.stringify({ app_key: env.BKASH_APP_KEY, app_secret: env.BKASH_APP_SECRET }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { id_token?: string; expires_in?: number; statusMessage?: string };
  if (!res.ok || !data.id_token) throw new GatewayError(`bKash token grant failed: ${data.statusMessage ?? res.status}`);
  cachedToken = { value: data.id_token, expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 300) * 1000 };
  return data.id_token;
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const token = await grantToken();
  const res = await fetch(`${BASE()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: token, "X-App-Key": env.BKASH_APP_KEY! },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T;
  if (!res.ok) throw new GatewayError(`bKash ${path} HTTP ${res.status}`);
  return data;
}

export async function bkashInitiate(input: InitiateInput): Promise<InitiateResult> {
  const data = await call<{ paymentID?: string; bkashURL?: string; statusCode?: string; statusMessage?: string }>("/tokenized/checkout/create", {
    mode: "0011",
    payerReference: input.customer.phone.replace(/^\+88/, ""),
    callbackURL: `${siteUrl}/api/payments/bkash/callback`,
    amount: takaString(input.amount),
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: input.orderNumber,
  });
  if (data.statusCode !== "0000" || !data.paymentID || !data.bkashURL) {
    throw new GatewayError(`bKash create failed: ${data.statusMessage ?? data.statusCode}`);
  }
  return { redirectUrl: data.bkashURL, providerPaymentId: data.paymentID, raw: data };
}

type ExecResponse = { statusCode?: string; statusMessage?: string; transactionStatus?: string; trxID?: string; amount?: string; paymentID?: string };

/** Called from the callback with status=success. Executes, and falls back to a status query if execute fails. */
export async function bkashVerify(paymentID: string, callbackStatus: string): Promise<VerifyResult> {
  if (callbackStatus === "cancel") return { status: "CANCELLED", providerPaymentId: paymentID, reason: "Payment cancelled on bKash.", raw: { callbackStatus } };
  if (callbackStatus !== "success") return { status: "FAILED", providerPaymentId: paymentID, reason: "bKash reported the payment as failed.", raw: { callbackStatus } };

  let data: ExecResponse;
  try {
    data = await call<ExecResponse>("/tokenized/checkout/execute", { paymentID });
  } catch (e) {
    logger.warn("bkash.execute_error_querying", { paymentID, error: e });
    data = await call<ExecResponse>("/tokenized/checkout/payment/status", { paymentID });
  }
  if (data.transactionStatus !== "Completed") {
    // Execute may have already run (e.g. a refreshed callback) — confirm with a status query.
    const q = await call<ExecResponse>("/tokenized/checkout/payment/status", { paymentID });
    if (q.transactionStatus === "Completed") data = q;
  }
  if (data.transactionStatus === "Completed" && data.amount) {
    return { status: "PAID", providerPaymentId: paymentID, trxId: data.trxID ?? null, amount: fromTakaString(data.amount), raw: data };
  }
  return { status: "FAILED", providerPaymentId: paymentID, reason: data.statusMessage ?? "bKash payment was not completed.", raw: data };
}
