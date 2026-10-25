import "server-only";
import { constants, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt, randomBytes, sign } from "node:crypto";
import { env, siteUrl } from "@/lib/env";
import { GatewayError, fromTakaString, takaString, type InitiateInput, type InitiateResult, type VerifyResult } from "./types";

/**
 * Nagad Payment Gateway (merchant API v-0.2.0).
 * Sensitive data is RSA-encrypted with Nagad's public key and signed (SHA256withRSA)
 * with the merchant private key. Responses are decrypted with the merchant private key.
 * Integration-ready: confirm endpoint paths and key formats with Nagad during merchant onboarding.
 */
const BASE = () =>
  env.PAYMENT_MODE === "live" ? "https://api.mynagad.com/api/dfs" : "http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs";

export const nagadConfigured = () => Boolean(env.NAGAD_MERCHANT_ID && env.NAGAD_MERCHANT_PRIVATE_KEY && env.NAGAD_PG_PUBLIC_KEY);

const pem = (key: string, type: "PRIVATE KEY" | "PUBLIC KEY") =>
  key.includes("BEGIN") ? key.replace(/\\n/g, "\n") : `-----BEGIN ${type}-----\n${key.replace(/\s+/g, "").match(/.{1,64}/g)!.join("\n")}\n-----END ${type}-----`;

const privateKey = () => createPrivateKey(pem(env.NAGAD_MERCHANT_PRIVATE_KEY!, "PRIVATE KEY"));
const pgPublicKey = () => createPublicKey(pem(env.NAGAD_PG_PUBLIC_KEY!, "PUBLIC KEY"));

const encrypt = (data: object) => publicEncrypt({ key: pgPublicKey(), padding: constants.RSA_PKCS1_PADDING }, Buffer.from(JSON.stringify(data))).toString("base64");
const signData = (data: object) => sign("sha256", Buffer.from(JSON.stringify(data)), privateKey()).toString("base64");

/** PKCS#1 v1.5 decryption done manually so it works on Node versions that disable PKCS1 private decryption. */
function decrypt(b64: string): Record<string, string> {
  const raw = privateDecrypt({ key: privateKey(), padding: constants.RSA_NO_PADDING }, Buffer.from(b64, "base64"));
  if (raw[0] !== 0x00 || raw[1] !== 0x02) throw new GatewayError("Nagad response decryption failed");
  const sep = raw.indexOf(0x00, 2);
  return JSON.parse(raw.subarray(sep + 1).toString("utf8"));
}

function nagadDateTime(d = new Date()) {
  const bd = new Date(d.getTime() + 6 * 3600_000); // Asia/Dhaka (UTC+6, no DST)
  const p = (n: number) => String(n).padStart(2, "0");
  return `${bd.getUTCFullYear()}${p(bd.getUTCMonth() + 1)}${p(bd.getUTCDate())}${p(bd.getUTCHours())}${p(bd.getUTCMinutes())}${p(bd.getUTCSeconds())}`;
}

function headers(ip: string) {
  return { "Content-Type": "application/json", Accept: "application/json", "X-KM-Api-Version": "v-0.2.0", "X-KM-IP-V4": ip, "X-KM-Client-Type": "PC_WEB" };
}

export async function nagadInitiate(input: InitiateInput): Promise<InitiateResult> {
  const merchantId = env.NAGAD_MERCHANT_ID!;
  // Nagad order ids must be unique per attempt and alphanumeric.
  const orderId = `${input.orderNumber.replace(/[^A-Z0-9]/gi, "")}${input.paymentId.slice(-6)}`.slice(0, 20);
  const datetime = nagadDateTime();
  const challenge = randomBytes(20).toString("hex");
  const sensitive = { merchantId, datetime, orderId, challenge };
  const ip = input.clientIp === "unknown" ? "127.0.0.1" : input.clientIp;

  const initRes = await fetch(`${BASE()}/check-out/initialize/${merchantId}/${orderId}`, {
    method: "POST",
    headers: headers(ip),
    body: JSON.stringify({ dateTime: datetime, sensitiveData: encrypt(sensitive), signature: signData(sensitive) }),
    cache: "no-store",
  });
  const init = (await initRes.json().catch(() => ({}))) as { sensitiveData?: string; message?: string };
  if (!init.sensitiveData) throw new GatewayError(`Nagad initialize failed: ${init.message ?? initRes.status}`);
  const decoded = decrypt(init.sensitiveData);

  const order = { merchantId, orderId, currencyCode: "050", amount: takaString(input.amount), challenge: decoded.challenge };
  const completeRes = await fetch(`${BASE()}/check-out/complete/${decoded.paymentReferenceId}`, {
    method: "POST",
    headers: headers(ip),
    body: JSON.stringify({
      sensitiveData: encrypt(order),
      signature: signData(order),
      merchantCallbackURL: `${siteUrl}/api/payments/nagad/callback`,
      additionalMerchantInfo: { orderNumber: input.orderNumber },
    }),
    cache: "no-store",
  });
  const complete = (await completeRes.json().catch(() => ({}))) as { status?: string; callBackUrl?: string; message?: string };
  if (complete.status !== "Success" || !complete.callBackUrl) throw new GatewayError(`Nagad checkout failed: ${complete.message ?? completeRes.status}`);
  return { redirectUrl: complete.callBackUrl, providerPaymentId: decoded.paymentReferenceId, raw: { orderId } };
}

export async function nagadVerify(paymentRefId: string): Promise<VerifyResult> {
  const res = await fetch(`${BASE()}/verify/payment/${encodeURIComponent(paymentRefId)}`, { headers: headers("127.0.0.1"), cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { status?: string; amount?: string; issuerPaymentRefNo?: string; message?: string };
  if (data.status === "Success" && data.amount) {
    return { status: "PAID", providerPaymentId: paymentRefId, trxId: data.issuerPaymentRefNo ?? null, amount: fromTakaString(data.amount), raw: data };
  }
  const cancelled = data.status === "Aborted" || data.status === "Cancelled";
  return { status: cancelled ? "CANCELLED" : "FAILED", providerPaymentId: paymentRefId, reason: data.message ?? `Nagad status: ${data.status ?? "unknown"}`, raw: data };
}
