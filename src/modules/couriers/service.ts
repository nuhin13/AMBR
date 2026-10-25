import "server-only";
import type { Courier, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { UserFacingError } from "@/lib/action-result";
import { logger } from "@/lib/logger";
import { changeOrderStatus } from "@/modules/orders/service";
import { pathaoConfigured, pathaoCreate } from "./pathao";
import { steadfastConfigured, steadfastCreate } from "./steadfast";

export const courierAvailability = () => ({ PATHAO: pathaoConfigured(), STEADFAST: steadfastConfigured(), MANUAL: true });

type DispatchInput =
  | { courier: "MANUAL"; trackingCode?: string; trackingUrl?: string; courierName?: string }
  | { courier: "STEADFAST" }
  | { courier: "PATHAO"; cityId: number; zoneId: number };

/** Books a consignment (or records a manual one) and stores it on the order's Shipment. */
export async function dispatchOrder(orderId: string, input: DispatchInput, actorId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true, shipment: true } });
  if (!order) throw new UserFacingError("Order not found.");
  if (order.shipment?.consignmentId && input.courier !== "MANUAL") throw new UserFacingError("A consignment was already created for this order.");
  if (!["CONFIRMED", "PROCESSING"].includes(order.status)) throw new UserFacingError("Confirm the order before booking a courier.");
  const codAmount = order.paymentStatus === "PAID" ? 0 : order.total;
  const address = [order.addressLine, order.upazilaName, order.districtName].filter(Boolean).join(", ");

  let data: { consignmentId?: string; trackingCode?: string; trackingUrl?: string; status?: string; raw?: unknown };
  if (input.courier === "STEADFAST") {
    if (!steadfastConfigured()) throw new UserFacingError("Steadfast API keys are not configured.");
    data = await steadfastCreate({ invoice: order.orderNumber, name: order.customerName, phone: order.phone, address, codAmount, note: order.deliveryInstructions ?? undefined });
  } else if (input.courier === "PATHAO") {
    if (!pathaoConfigured()) throw new UserFacingError("Pathao API keys are not configured.");
    data = await pathaoCreate({
      orderNumber: order.orderNumber,
      name: order.customerName,
      phone: order.phone,
      address,
      cityId: input.cityId,
      zoneId: input.zoneId,
      codAmount,
      itemCount: order.items.reduce((s, i) => s + i.quantity, 0),
      note: order.deliveryInstructions ?? undefined,
    });
  } else {
    data = { trackingCode: input.trackingCode, trackingUrl: input.trackingUrl, status: input.courierName ? `Booked with ${input.courierName}` : "Booked" };
  }

  const shipment = await db.shipment.upsert({
    where: { orderId },
    create: { orderId, courier: input.courier as Courier, codAmount, ...pickShipment(data) },
    update: { courier: input.courier as Courier, codAmount, ...pickShipment(data) },
  });
  await changeOrderStatus(orderId, "SHIPPED", { actorId, note: `Handed to ${input.courier === "MANUAL" ? "courier" : input.courier}${data.trackingCode ? ` · tracking ${data.trackingCode}` : ""}` });
  return shipment;
}

const pickShipment = (d: { consignmentId?: string; trackingCode?: string; trackingUrl?: string; status?: string; raw?: unknown }) => ({
  consignmentId: d.consignmentId ?? null,
  trackingCode: d.trackingCode ?? null,
  trackingUrl: d.trackingUrl ?? null,
  status: d.status ?? null,
  events: d.raw ? (JSON.parse(JSON.stringify([{ at: new Date().toISOString(), event: "created", data: d.raw }])) as Prisma.InputJsonValue) : undefined,
});

/** Applies a courier status webhook. "delivered" moves the order to DELIVERED automatically. */
export async function applyCourierUpdate(courier: Courier, consignmentId: string, status: string, raw: unknown) {
  const shipment = await db.shipment.findFirst({ where: { courier, consignmentId }, include: { order: true } });
  if (!shipment) {
    logger.warn("courier.unknown_consignment", { courier, consignmentId });
    return;
  }
  const events = Array.isArray(shipment.events) ? shipment.events : [];
  await db.shipment.update({
    where: { id: shipment.id },
    data: { status, events: JSON.parse(JSON.stringify([...events, { at: new Date().toISOString(), event: status, data: raw }])) },
  });
  const s = status.toLowerCase();
  if (s.includes("deliver") && !s.includes("partial") && !s.includes("pending") && shipment.order.status === "SHIPPED") {
    await changeOrderStatus(shipment.orderId, "DELIVERED", { actorId: null, note: `Delivered (reported by ${courier}).` });
  }
}
