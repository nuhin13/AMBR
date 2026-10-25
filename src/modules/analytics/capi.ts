import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { env, siteUrl } from "@/lib/env";
import { logger } from "@/lib/logger";

const hash = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

/**
 * Meta Conversions API — server-side Purchase event (deduplicated with the browser
 * Pixel via event_id = order number). No-op until META_CAPI_TOKEN and the Pixel ID are set.
 */
export async function trackServerPurchase(orderId: string) {
  if (!env.META_CAPI_TOKEN || !env.NEXT_PUBLIC_META_PIXEL_ID) return;
  const o = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!o || o.isDemo) return;
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(o.placedAt.getTime() / 1000),
        event_id: o.orderNumber,
        action_source: "website",
        event_source_url: `${siteUrl}/checkout`,
        user_data: { ph: [hash(o.phone.replace(/^\+/, ""))], ...(o.email ? { em: [hash(o.email)] } : {}), country: [hash("bd")] },
        custom_data: {
          currency: "BDT",
          value: o.total / 100,
          order_id: o.orderNumber,
          contents: o.items.map((i) => ({ id: i.sku, quantity: i.quantity, item_price: i.unitPrice / 100 })),
          content_type: "product",
        },
      },
    ],
  };
  const res = await fetch(`https://graph.facebook.com/v21.0/${env.NEXT_PUBLIC_META_PIXEL_ID}/events?access_token=${env.META_CAPI_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) logger.warn("capi.purchase_rejected", { status: res.status, body: await res.text() });
}
