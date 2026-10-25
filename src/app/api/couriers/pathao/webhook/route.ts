import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { applyCourierUpdate } from "@/modules/couriers/service";

/** Pathao webhook. Pathao signs requests with the secret set in the merchant panel (X-PATHAO-Signature). */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("x-pathao-signature") ?? "";
  if (!env.PATHAO_WEBHOOK_SECRET || !sig || !safeEqual(sig, env.PATHAO_WEBHOOK_SECRET)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { consignment_id?: string; event?: string; order_status?: string };
  const id = body.consignment_id ?? "";
  const status = body.order_status ?? body.event ?? "";
  if (id && status) {
    try {
      await applyCourierUpdate("PATHAO", id, status, body);
    } catch (e) {
      logger.error("pathao.webhook_error", { id, error: e });
    }
  }
  // Pathao expects this header echoed back to confirm the integration.
  return NextResponse.json({ ok: true }, { status: 202, headers: { "X-Pathao-Merchant-Webhook-Integration-Secret": env.PATHAO_WEBHOOK_SECRET } });
}
