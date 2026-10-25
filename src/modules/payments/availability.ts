import "server-only";
import type { PaymentMethod } from "@prisma/client";
import { getSettings } from "@/modules/content/settings";
import { bkashConfigured } from "./providers/bkash";
import { nagadConfigured } from "./providers/nagad";
import { sslcommerzConfigured } from "./providers/sslcommerz";

export type MethodAvailability = { method: PaymentMethod; enabled: boolean; configured: boolean; available: boolean };

/**
 * A method is offered at checkout only when the owner enabled it in Admin → Settings
 * AND its gateway credentials are configured on the server. Nothing is ever faked.
 */
export async function paymentMethods(): Promise<MethodAvailability[]> {
  const { payments } = await getSettings();
  const rows: [PaymentMethod, boolean, boolean][] = [
    ["COD", payments.cod, true],
    ["BKASH", payments.bkash, bkashConfigured()],
    ["NAGAD", payments.nagad, nagadConfigured()],
    ["CARD", payments.card, sslcommerzConfigured()],
  ];
  return rows.map(([method, enabled, configured]) => ({ method, enabled, configured, available: enabled && configured }));
}

export async function availableMethods(): Promise<PaymentMethod[]> {
  return (await paymentMethods()).filter((m) => m.available).map((m) => m.method);
}
