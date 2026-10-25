import "server-only";
import { env, siteUrl } from "@/lib/env";
import { GatewayError, fromTakaString, takaString, type InitiateInput, type InitiateResult, type VerifyResult } from "./types";

/**
 * SSLCommerz (cards) — https://developer.sslcommerz.com
 * Flow: create session → customer pays on hosted page → browser POST to success/fail/cancel
 * + server IPN → every outcome is confirmed via the Order Validation API before marking paid.
 */
const BASE = () => (env.PAYMENT_MODE === "live" ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com");

export const sslcommerzConfigured = () => Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD);

export async function sslcommerzInitiate(input: InitiateInput): Promise<InitiateResult> {
  const tranId = input.paymentId;
  const cb = `${siteUrl}/api/payments/sslcommerz`;
  const form = new URLSearchParams({
    store_id: env.SSLCOMMERZ_STORE_ID!,
    store_passwd: env.SSLCOMMERZ_STORE_PASSWORD!,
    total_amount: takaString(input.amount),
    currency: "BDT",
    tran_id: tranId,
    success_url: `${cb}/return?outcome=success`,
    fail_url: `${cb}/return?outcome=fail`,
    cancel_url: `${cb}/return?outcome=cancel`,
    ipn_url: `${cb}/ipn`,
    cus_name: input.customer.name,
    cus_email: input.customer.email ?? "customer@ambrbd.com",
    cus_add1: input.customer.address.slice(0, 100),
    cus_city: input.customer.city,
    cus_country: "Bangladesh",
    cus_phone: input.customer.phone.replace(/^\+88/, ""),
    shipping_method: "Courier",
    ship_name: input.customer.name,
    ship_add1: input.customer.address.slice(0, 100),
    ship_city: input.customer.city,
    ship_postcode: "1000",
    ship_country: "Bangladesh",
    num_of_item: "1",
    product_name: `AMBR order ${input.orderNumber}`,
    product_category: "Fragrance",
    product_profile: "physical-goods",
    value_a: input.orderNumber,
  });
  const res = await fetch(`${BASE()}/gwprocess/v4/api.php`, { method: "POST", body: form, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { status?: string; GatewayPageURL?: string; failedreason?: string; sessionkey?: string };
  if (data.status !== "SUCCESS" || !data.GatewayPageURL) throw new GatewayError(`SSLCommerz session failed: ${data.failedreason ?? res.status}`);
  return { redirectUrl: data.GatewayPageURL, providerPaymentId: tranId, raw: { sessionkey: data.sessionkey } };
}

/** Validates a val_id with SSLCommerz. Never trust POSTed status fields on their own. */
export async function sslcommerzValidate(valId: string, expectedTranId: string): Promise<VerifyResult> {
  const url = new URL(`${BASE()}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({ val_id: valId, store_id: env.SSLCOMMERZ_STORE_ID!, store_passwd: env.SSLCOMMERZ_STORE_PASSWORD!, v: "1", format: "json" }).toString();
  const res = await fetch(url, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { status?: string; tran_id?: string; amount?: string; currency?: string; bank_tran_id?: string; risk_level?: string };
  if ((data.status === "VALID" || data.status === "VALIDATED") && data.tran_id === expectedTranId && data.currency === "BDT" && data.amount) {
    if (data.risk_level === "1") return { status: "PENDING", providerPaymentId: expectedTranId, reason: "Payment flagged for review by the gateway.", raw: data };
    return { status: "PAID", providerPaymentId: expectedTranId, trxId: data.bank_tran_id ?? null, amount: fromTakaString(data.amount), raw: data };
  }
  return { status: "FAILED", providerPaymentId: expectedTranId, reason: "Card payment could not be validated.", raw: data };
}
