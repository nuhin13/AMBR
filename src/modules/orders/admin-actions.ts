"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { changeOrderStatus } from "./service";
import { dispatchOrder } from "@/modules/couriers/service";
import { formObject, zBool, zOptText } from "@/modules/reports/form-data";

const statusSchema = z.object({
  orderId: z.string().min(1),
  to: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"]),
  note: zOptText(500),
  restock: zBool.optional(),
  notify: zBool.optional(),
});

export async function changeOrderStatusAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("orders:manage");
    const input = statusSchema.parse(formObject(fd));
    const before = await db.order.findUnique({ where: { id: input.orderId }, select: { status: true, orderNumber: true } });
    if (!before) throw new UserFacingError("Order not found.");
    await changeOrderStatus(input.orderId, input.to, { actorId: user.id, note: input.note, restock: input.restock, notifyCustomer: input.notify ?? false });
    await audit({ actorId: user.id, action: "order.status", entityType: "Order", entityId: input.orderId, before: { status: before.status }, after: { status: input.to, note: input.note } });
    return { ok: true, message: `Order ${before.orderNumber} marked ${input.to.toLowerCase()}.` };
  } catch (e) {
    return toActionError(e);
  }
}

const dispatchSchema = z.discriminatedUnion("courier", [
  z.object({ orderId: z.string(), courier: z.literal("MANUAL"), courierName: zOptText(60), trackingCode: zOptText(80), trackingUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url("Tracking link must be a full URL").optional()) }),
  z.object({ orderId: z.string(), courier: z.literal("STEADFAST") }),
  z.object({ orderId: z.string(), courier: z.literal("PATHAO"), cityId: z.coerce.number().int().positive("Choose a Pathao city"), zoneId: z.coerce.number().int().positive("Choose a Pathao zone") }),
]);

export async function dispatchOrderAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("orders:manage");
    const input = dispatchSchema.parse(formObject(fd));
    const { orderId, ...rest } = input;
    const shipment = await dispatchOrder(orderId, rest, user.id);
    await audit({ actorId: user.id, action: "order.dispatch", entityType: "Order", entityId: orderId, after: { courier: shipment.courier, trackingCode: shipment.trackingCode } });
    return { ok: true, message: "Shipment recorded and order marked shipped." };
  } catch (e) {
    if (e instanceof Error && e.name === "GatewayError") return { ok: false, error: e.message };
    return toActionError(e);
  }
}

export async function updateTrackingAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("orders:manage");
    const input = z.object({ orderId: z.string(), trackingCode: zOptText(80), trackingUrl: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional()) }).parse(formObject(fd));
    const s = await db.shipment.findUnique({ where: { orderId: input.orderId } });
    if (!s) throw new UserFacingError("No shipment for this order yet.");
    await db.shipment.update({ where: { orderId: input.orderId }, data: { trackingCode: input.trackingCode ?? null, trackingUrl: input.trackingUrl ?? null } });
    await audit({ actorId: user.id, action: "order.tracking", entityType: "Order", entityId: input.orderId, before: { trackingCode: s.trackingCode }, after: input });
    return { ok: true, message: "Tracking updated." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function saveOrderNotesAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("orders:manage");
    const input = z.object({ orderId: z.string(), adminNotes: z.string().max(2000) }).parse(formObject(fd));
    await db.order.update({ where: { id: input.orderId }, data: { adminNotes: input.adminNotes || null } });
    await audit({ actorId: user.id, action: "order.notes", entityType: "Order", entityId: input.orderId, after: { adminNotes: input.adminNotes } });
    return { ok: true, message: "Notes saved." };
  } catch (e) {
    return toActionError(e);
  }
}

/** Records an offline refund decision on a paid order (the refund itself is made in the gateway dashboard). */
export async function markRefundedAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("orders:manage");
    const input = z.object({ orderId: z.string(), partial: zBool.optional(), note: zOptText(300) }).parse(formObject(fd));
    const order = await db.order.findUnique({ where: { id: input.orderId } });
    if (!order) throw new UserFacingError("Order not found.");
    if (order.paymentStatus !== "PAID") throw new UserFacingError("Only paid orders can be marked refunded.");
    const status = input.partial ? "PARTIALLY_REFUNDED" : "REFUNDED";
    await db.$transaction([
      db.order.update({ where: { id: order.id }, data: { paymentStatus: status } }),
      db.orderStatusHistory.create({ data: { orderId: order.id, fromStatus: order.status, toStatus: order.status, changedById: user.id, note: `Payment marked ${status.toLowerCase().replace("_", " ")}${input.note ? ` — ${input.note}` : ""}` } }),
    ]);
    await audit({ actorId: user.id, action: "order.refund", entityType: "Order", entityId: order.id, before: { paymentStatus: order.paymentStatus }, after: { paymentStatus: status } });
    return { ok: true, message: "Refund recorded." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function pathaoZonesAction(cityId: number): Promise<{ zone_id: number; zone_name: string }[]> {
  await requirePermission("orders:manage");
  try {
    const { pathaoZones, pathaoConfigured } = await import("@/modules/couriers/pathao");
    if (!pathaoConfigured()) return [];
    return await pathaoZones(cityId);
  } catch {
    return [];
  }
}
