import "server-only";
import { env } from "@/lib/env";
import { GatewayError } from "@/modules/payments/providers/types";

/** Pathao Courier merchant API (Aladdin). Sandbox in PAYMENT_MODE=sandbox. */
const BASE = () => (env.PAYMENT_MODE === "live" ? "https://api-hermes.pathao.com" : "https://courier-api-sandbox.pathao.com");

export const pathaoConfigured = () => Boolean(env.PATHAO_CLIENT_ID && env.PATHAO_CLIENT_SECRET && env.PATHAO_USERNAME && env.PATHAO_PASSWORD && env.PATHAO_STORE_ID);

let token: { value: string; expiresAt: number } | null = null;

async function accessToken() {
  if (token && token.expiresAt > Date.now()) return token.value;
  const res = await fetch(`${BASE()}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ client_id: env.PATHAO_CLIENT_ID, client_secret: env.PATHAO_CLIENT_SECRET, grant_type: "password", username: env.PATHAO_USERNAME, password: env.PATHAO_PASSWORD }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; message?: string };
  if (!data.access_token) throw new GatewayError(`Pathao auth failed: ${data.message ?? res.status}`);
  token = { value: data.access_token, expiresAt: Date.now() + Math.max(300, (data.expires_in ?? 3600) - 600) * 1000 };
  return data.access_token;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${await accessToken()}`, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) throw new GatewayError(`Pathao ${path}: ${data.message ?? res.status}`);
  return data;
}

export async function pathaoCities() {
  const r = await api<{ data: { data: { city_id: number; city_name: string }[] } }>("/aladdin/api/v1/city-list");
  return r.data.data;
}

export async function pathaoZones(cityId: number) {
  const r = await api<{ data: { data: { zone_id: number; zone_name: string }[] } }>(`/aladdin/api/v1/cities/${cityId}/zone-list`);
  return r.data.data;
}

export async function pathaoCreate(o: { orderNumber: string; name: string; phone: string; address: string; cityId: number; zoneId: number; codAmount: number; itemCount: number; note?: string }) {
  const r = await api<{ data?: { consignment_id: string; order_status: string; delivery_fee: number } }>("/aladdin/api/v1/orders", {
    method: "POST",
    body: JSON.stringify({
      store_id: Number(env.PATHAO_STORE_ID),
      merchant_order_id: o.orderNumber,
      recipient_name: o.name,
      recipient_phone: o.phone.replace(/^\+88/, ""),
      recipient_address: o.address.slice(0, 220),
      recipient_city: o.cityId,
      recipient_zone: o.zoneId,
      delivery_type: 48,
      item_type: 2,
      special_instruction: o.note ?? "",
      item_quantity: o.itemCount,
      item_weight: 0.5,
      amount_to_collect: Math.round(o.codAmount / 100),
      item_description: "Fragrance — fragile, handle with care",
    }),
  });
  if (!r.data) throw new GatewayError("Pathao did not return a consignment.");
  return {
    consignmentId: r.data.consignment_id,
    trackingCode: r.data.consignment_id,
    trackingUrl: `https://merchant.pathao.com/tracking?consignment_id=${r.data.consignment_id}`,
    status: r.data.order_status,
    raw: r,
  };
}
