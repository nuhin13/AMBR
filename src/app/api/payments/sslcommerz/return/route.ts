import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sslcommerzConfigured, sslcommerzValidate } from "@/modules/payments/providers/sslcommerz";
import { applyVerification } from "@/modules/payments/service";
import { redirectForOrder } from "@/modules/payments/routes";

/**
 * The customer's browser is POSTed here by SSLCommerz (success / fail / cancel).
 * The posted status is never trusted: success is confirmed via the validation API.
 */
export async function POST(req: NextRequest) {
  const outcome = req.nextUrl.searchParams.get("outcome");
  const form = await req.formData();
  const tranId = String(form.get("tran_id") ?? "");
  const valId = String(form.get("val_id") ?? "");
  const payment = tranId ? await db.payment.findFirst({ where: { provider: "SSLCOMMERZ", providerPaymentId: tranId }, include: { order: true } }) : null;
  if (!payment || !sslcommerzConfigured()) return redirectForOrder(payment?.order ?? null);
  try {
    if (outcome === "success" && valId) {
      return redirectForOrder(await applyVerification("SSLCOMMERZ", await sslcommerzValidate(valId, tranId)));
    }
    const order = await applyVerification("SSLCOMMERZ", {
      status: outcome === "cancel" ? "CANCELLED" : "FAILED",
      providerPaymentId: tranId,
      reason: `Customer returned with outcome=${outcome}`,
      raw: { outcome, status: form.get("status") },
    });
    return redirectForOrder(order);
  } catch (e) {
    logger.error("sslcommerz.return_error", { tranId, error: e });
    return redirectForOrder(payment.order);
  }
}
