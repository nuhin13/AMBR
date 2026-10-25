import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { logger } from "@/lib/logger";
import { applyCourierUpdate } from "@/modules/couriers/service";

/** Steadfast delivery-status webhook. Authenticated with the Bearer token configured in the Steadfast portal. */
export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!env.STEADFAST_WEBHOOK_TOKEN || !token || !safeEqual(token, env.STEADFAST_WEBHOOK_TOKEN)) {
    return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { consignment_id?: number | string; status?: string; delivery_status?: string; notification_type?: string };
  const id = body.consignment_id ? String(body.consignment_id) : "";
  const status = body.delivery_status ?? body.status ?? body.notification_type ?? "";
  if (id && status) {
    try {
      await applyCourierUpdate("STEADFAST", id, status, body);
    } catch (e) {
      logger.error("steadfast.webhook_error", { id, error: e });
    }
  }
  return NextResponse.json({ status: "success", message: "Webhook received" });
}
