import "server-only";
import type { MovementType } from "@prisma/client";
import type { Tx } from "@/lib/db";
import { UserFacingError } from "@/lib/action-result";
import { LocalizedError } from "@/lib/i18n-errors";

/**
 * All stock changes go through these functions. Each one is a single guarded SQL
 * UPDATE (so concurrent checkouts cannot oversell) followed by a ledger row.
 * They must be called inside a transaction (`tx`).
 */

type Row = { onHand: number; reserved: number };

async function record(tx: Tx, variantId: string, type: MovementType, quantity: number, row: Row, extra: { orderId?: string; userId?: string; reason?: string }) {
  await tx.inventoryMovement.create({
    data: { variantId, type, quantity, onHandAfter: row.onHand, reservedAfter: row.reserved, orderId: extra.orderId, userId: extra.userId, reason: extra.reason },
  });
}

export class OutOfStockError extends LocalizedError {}

/** Reserve stock for an order. Throws OutOfStockError when not enough sellable stock exists. */
export async function reserveStock(tx: Tx, variantId: string, qty: number, orderId: string, label: string) {
  const rows = await tx.$queryRaw<Row[]>`
    UPDATE "Inventory" SET "reserved" = "reserved" + ${qty}, "updatedAt" = now()
    WHERE "variantId" = ${variantId} AND "onHand" - "reserved" >= ${qty}
    RETURNING "onHand", "reserved"`;
  if (rows.length === 0) throw new OutOfStockError("errors.outOfStock", { name: label });
  await record(tx, variantId, "ORDER_RESERVE", qty, rows[0], { orderId });
}

/** Release a reservation (cancelled / unpaid order). */
export async function releaseStock(tx: Tx, variantId: string, qty: number, orderId: string, reason: string, userId?: string) {
  const rows = await tx.$queryRaw<Row[]>`
    UPDATE "Inventory" SET "reserved" = GREATEST("reserved" - ${qty}, 0), "updatedAt" = now()
    WHERE "variantId" = ${variantId} RETURNING "onHand", "reserved"`;
  if (rows[0]) await record(tx, variantId, "RESERVE_RELEASE", -qty, rows[0], { orderId, reason, userId });
}

/** Stock physically leaves the shelf (order shipped): reduce both on-hand and reserved. */
export async function fulfilStock(tx: Tx, variantId: string, qty: number, orderId: string, userId?: string) {
  const rows = await tx.$queryRaw<Row[]>`
    UPDATE "Inventory" SET "onHand" = "onHand" - ${qty}, "reserved" = GREATEST("reserved" - ${qty}, 0), "updatedAt" = now()
    WHERE "variantId" = ${variantId} AND "onHand" >= ${qty} RETURNING "onHand", "reserved"`;
  if (rows.length === 0) throw new UserFacingError("Stock records don't match this shipment. Check inventory before shipping.");
  await record(tx, variantId, "ORDER_FULFIL", -qty, rows[0], { orderId, userId });
}

/** Returned goods put back into sellable stock. */
export async function returnStock(tx: Tx, variantId: string, qty: number, orderId: string, userId?: string) {
  const rows = await tx.$queryRaw<Row[]>`
    UPDATE "Inventory" SET "onHand" = "onHand" + ${qty}, "updatedAt" = now()
    WHERE "variantId" = ${variantId} RETURNING "onHand", "reserved"`;
  if (rows[0]) await record(tx, variantId, "RETURN_IN", qty, rows[0], { orderId, userId, reason: "Order returned" });
}

/** Manual adjustment by staff (purchase received, count correction, damage). */
export async function adjustStock(tx: Tx, variantId: string, delta: number, type: Extract<MovementType, "PURCHASE_IN" | "ADJUSTMENT" | "DAMAGE">, userId: string, reason: string) {
  await tx.inventory.upsert({ where: { variantId }, create: { variantId }, update: {} });
  const rows = await tx.$queryRaw<Row[]>`
    UPDATE "Inventory" SET "onHand" = "onHand" + ${delta}, "updatedAt" = now()
    WHERE "variantId" = ${variantId} AND "onHand" + ${delta} >= "reserved"
    RETURNING "onHand", "reserved"`;
  if (rows.length === 0) throw new UserFacingError("Stock can't go below the quantity already reserved for open orders.");
  await record(tx, variantId, type, delta, rows[0], { userId, reason });
}

export const sellable = (inv: { onHand: number; reserved: number } | null | undefined) => (inv ? Math.max(0, inv.onHand - inv.reserved) : 0);
