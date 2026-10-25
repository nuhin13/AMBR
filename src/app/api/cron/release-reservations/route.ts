import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { releaseExpiredReservations } from "@/modules/orders/service";

/** Called by a scheduler (Vercel Cron / system cron) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!env.CRON_SECRET || !safeEqual(token, env.CRON_SECRET)) return NextResponse.json({ ok: false }, { status: 401 });
  const released = await releaseExpiredReservations(200);
  return NextResponse.json({ ok: true, released });
}
