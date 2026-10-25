export type InitiateInput = {
  paymentId: string; // our Payment.id
  orderNumber: string;
  amount: number; // poisha
  customer: { name: string; phone: string; email: string | null; address: string; city: string };
  clientIp: string;
};

export type InitiateResult = { redirectUrl: string; providerPaymentId: string; raw?: unknown };

export type VerifyResult =
  | { status: "PAID"; providerPaymentId: string; trxId: string | null; amount: number; raw: unknown }
  | { status: "FAILED" | "CANCELLED" | "PENDING"; providerPaymentId: string; reason: string; raw: unknown };

export class GatewayError extends Error {
  name = "GatewayError";
}

/** "350.00" from poisha 35000 — gateways expect taka with two decimals. */
export const takaString = (poisha: number) => (poisha / 100).toFixed(2);
export const fromTakaString = (taka: string | number) => Math.round(Number(taka) * 100);
