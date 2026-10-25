import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { bkashConfigured, bkashVerify } from "@/modules/payments/providers/bkash";
import { applyVerification } from "@/modules/payments/service";
import { redirectForOrder } from "@/modules/payments/routes";
import { db } from "@/lib/db";

/** bKash redirects the customer here with ?paymentID=…&status=success|failure|cancel. */
export async function GET(req: NextRequest) {
  const paymentID = req.nextUrl.searchParams.get("paymentID") ?? "";
  const status = req.nextUrl.searchParams.get("status") ?? "failure";
  if (!paymentID || !bkashConfigured()) return redirectForOrder(null);
  try {
    const result = await bkashVerify(paymentID, status);
    const order = await applyVerification("BKASH", result);
    return redirectForOrder(order);
  } catch (e) {
    logger.error("bkash.callback_error", { paymentID, error: e });
    const p = await db.payment.findFirst({ where: { provider: "BKASH", providerPaymentId: paymentID }, include: { order: true } });
    return redirectForOrder(p?.order ?? null);
  }
}
