import "server-only";
import { env } from "@/lib/env";
import { GatewayError } from "@/modules/payments/providers/types";

/** Steadfast Courier merchant API — https://portal.packzy.com/api/v1 */
const BASE = "https://portal.packzy.com/api/v1";

export const steadfastConfigured = () => Boolean(env.STEADFAST_API_KEY && env.STEADFAST_SECRET_KEY);

const headers = () => ({ "Api-Key": env.STEADFAST_API_KEY!, "Secret-Key": env.STEADFAST_SECRET_KEY!, "Content-Type": "application/json" });

export async function steadfastCreate(o: { invoice: string; name: string; phone: string; address: string; codAmount: number; note?: string }) {
  const res = await fetch(`${BASE}/create_order`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      invoice: o.invoice,
      recipient_name: o.name,
      recipient_phone: o.phone.replace(/^\+88/, ""),
      recipient_address: o.address.slice(0, 250),
      cod_amount: o.codAmount / 100,
      note: o.note ?? "",
    }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { status?: number; message?: string; consignment?: { consignment_id: number; tracking_code: string; status: string } };
  if (data.status !== 200 || !data.consignment) throw new GatewayError(`Steadfast: ${data.message ?? res.status}`);
  return {
    consignmentId: String(data.consignment.consignment_id),
    trackingCode: data.consignment.tracking_code,
    trackingUrl: `https://steadfast.com.bd/t/${data.consignment.tracking_code}`,
    status: data.consignment.status,
    raw: data,
  };
}

export async function steadfastStatus(consignmentId: string) {
  const res = await fetch(`${BASE}/status_by_cid/${encodeURIComponent(consignmentId)}`, { headers: headers(), cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { delivery_status?: string };
  return data.delivery_status ?? null;
}
