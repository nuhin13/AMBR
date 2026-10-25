import type { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { nagadConfigured, nagadVerify } from "@/modules/payments/providers/nagad";
import { applyVerification } from "@/modules/payments/service";
import { redirectForOrder } from "@/modules/payments/routes";

/** Nagad redirects here with ?payment_ref_id=…&status=…; we always verify with Nagad's API. */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("payment_ref_id") ?? "";
  if (!ref || !nagadConfigured()) return redirectForOrder(null);
  try {
    const order = await applyVerification("NAGAD", await nagadVerify(ref));
    return redirectForOrder(order);
  } catch (e) {
    logger.error("nagad.callback_error", { ref, error: e });
    const p = await db.payment.findFirst({ where: { provider: "NAGAD", providerPaymentId: ref }, include: { order: true } });
    return redirectForOrder(p?.order ?? null);
  }
}
