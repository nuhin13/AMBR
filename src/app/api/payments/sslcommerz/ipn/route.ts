import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { sslcommerzConfigured, sslcommerzValidate } from "@/modules/payments/providers/sslcommerz";
import { applyVerification } from "@/modules/payments/service";

/** Server-to-server IPN — catches payments where the customer closed the browser before returning. */
export async function POST(req: NextRequest) {
  if (!sslcommerzConfigured()) return NextResponse.json({ ok: false }, { status: 404 });
  const form = await req.formData();
  const tranId = String(form.get("tran_id") ?? "");
  const valId = String(form.get("val_id") ?? "");
  const status = String(form.get("status") ?? "");
  try {
    if (tranId && valId && (status === "VALID" || status === "VALIDATED")) await applyVerification("SSLCOMMERZ", await sslcommerzValidate(valId, tranId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    logger.error("sslcommerz.ipn_error", { tranId, error: e });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
