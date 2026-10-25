"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { formObject, revalidateStore, zText } from "@/modules/reports/form-data";
import { adjustStock } from "./service";

const schema = z.object({
  variantId: z.string().min(1),
  type: z.enum(["PURCHASE_IN", "ADJUSTMENT", "DAMAGE"]),
  mode: z.enum(["add", "remove", "set"]).default("add"),
  quantity: z.coerce.number().int().min(0, "Quantity can't be negative").max(100000),
  reason: zText(200).min(3, "Add a short reason (it's kept in the stock log)"),
});

/** Every stock change is a guarded update + ledger row + audit entry, in one transaction. */
export async function adjustStockAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("inventory:manage");
    const input = schema.parse(formObject(fd));
    const inv = await db.inventory.findUnique({ where: { variantId: input.variantId }, include: { variant: { include: { product: { select: { name: true } } } } } });
    const onHand = inv?.onHand ?? 0;
    let delta = input.mode === "set" ? input.quantity - onHand : input.mode === "remove" ? -input.quantity : input.quantity;
    if (input.type === "PURCHASE_IN" && delta < 0) throw new UserFacingError("“Stock received” can only add stock. Use Adjustment or Damage to reduce it.");
    if (input.type === "DAMAGE" && delta > 0) delta = -delta;
    if (delta === 0) throw new UserFacingError("Nothing to change.");
    await db.$transaction(async (tx) => {
      await adjustStock(tx, input.variantId, delta, input.type, user.id, input.reason);
      await audit({ actorId: user.id, action: "inventory.adjust", entityType: "ProductVariant", entityId: input.variantId, before: { onHand }, after: { onHand: onHand + delta, type: input.type, reason: input.reason } }, tx);
    });
    revalidateStore();
    const name = inv ? `${inv.variant.product.name} ${inv.variant.label}` : "Stock";
    return { ok: true, message: `${name}: ${delta > 0 ? "+" : ""}${delta} → ${onHand + delta} on hand.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setThresholdAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("inventory:manage");
    const { variantId, threshold } = z.object({ variantId: z.string(), threshold: z.coerce.number().int().min(0).max(10000) }).parse(formObject(fd));
    await db.inventory.upsert({ where: { variantId }, create: { variantId, lowStockThreshold: threshold }, update: { lowStockThreshold: threshold } });
    await audit({ actorId: user.id, action: "inventory.threshold", entityType: "ProductVariant", entityId: variantId, after: { threshold } });
    return { ok: true, message: "Low-stock alert updated." };
  } catch (e) {
    return toActionError(e);
  }
}
