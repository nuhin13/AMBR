"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { formObject, revalidateStore, zBool, zInt, zOptTaka, zOptText, zTaka, zText } from "@/modules/reports/form-data";

const zoneSchema = z.object({
  id: z.string().optional(),
  name: zText(60).min(2),
  fee: zTaka,
  freeShippingThreshold: zOptTaka,
  estimatedDays: zText(40).min(2),
  nameBn: zOptText(60),
  estimatedDaysBn: zOptText(40),
  isActive: zBool,
  sortOrder: zInt(0, 999),
});

export async function saveZoneAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("shipping:manage");
    const input = zoneSchema.parse(formObject(fd));
    const data = { name: input.name, fee: input.fee, freeShippingThreshold: input.freeShippingThreshold ?? null, estimatedDays: input.estimatedDays, nameBn: input.nameBn ?? null, estimatedDaysBn: input.estimatedDaysBn ?? null, isActive: input.isActive, sortOrder: input.sortOrder };
    const before = input.id ? await db.shippingZone.findUnique({ where: { id: input.id } }) : null;
    if (input.id && !input.isActive) {
      const used = await db.district.count({ where: { shippingZoneId: input.id } });
      if (used > 0) throw new UserFacingError(`${used} district(s) use this zone. Move them to another zone before deactivating, or customers there can't check out.`);
    }
    let slug = slugify(input.name);
    if (!input.id && (await db.shippingZone.findUnique({ where: { slug } }))) slug = `${slug}-${Date.now().toString(36)}`;
    const z1 = input.id ? await db.shippingZone.update({ where: { id: input.id }, data }) : await db.shippingZone.create({ data: { ...data, slug } });
    await audit({ actorId: user.id, action: input.id ? "shipping.zone.update" : "shipping.zone.create", entityType: "ShippingZone", entityId: z1.id, before, after: data });
    revalidateStore();
    return { ok: true, message: `${z1.name} saved.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteZoneAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("shipping:manage");
    const id = z.string().parse(fd.get("id"));
    const [d, u] = await Promise.all([db.district.count({ where: { shippingZoneId: id } }), db.upazila.count({ where: { shippingZoneId: id } })]);
    if (d + u > 0) throw new UserFacingError("This zone is still assigned to districts or areas. Reassign them first.");
    await db.shippingZone.delete({ where: { id } });
    await audit({ actorId: user.id, action: "shipping.zone.delete", entityType: "ShippingZone", entityId: id });
    return { ok: true, message: "Zone deleted." };
  } catch (e) {
    return toActionError(e);
  }
}

/** Bulk district → zone mapping. Field names: district_<id> = zoneId. */
export async function saveDistrictZonesAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("shipping:manage");
    const zones = new Set((await db.shippingZone.findMany({ select: { id: true } })).map((z) => z.id));
    const updates: { id: number; zone: string }[] = [];
    for (const [k, v] of fd.entries()) {
      if (!k.startsWith("district_") || typeof v !== "string") continue;
      if (!zones.has(v)) throw new UserFacingError("Unknown zone selected.");
      updates.push({ id: Number(k.slice(9)), zone: v });
    }
    const current = await db.district.findMany({ select: { id: true, shippingZoneId: true, name: true } });
    const changed = updates.filter((u) => current.find((c) => c.id === u.id)?.shippingZoneId !== u.zone);
    await db.$transaction(changed.map((u) => db.district.update({ where: { id: u.id }, data: { shippingZoneId: u.zone } })));
    await audit({ actorId: user.id, action: "shipping.districts", entityType: "District", after: changed.map((c) => ({ district: current.find((x) => x.id === c.id)?.name, zone: c.zone })) });
    return { ok: true, message: changed.length ? `${changed.length} district(s) updated.` : "No changes." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function saveUpazilaZoneAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("shipping:manage");
    const { upazilaId, zoneId } = z.object({ upazilaId: z.coerce.number().int(), zoneId: z.string() }).parse(formObject(fd));
    await db.upazila.update({ where: { id: upazilaId }, data: { shippingZoneId: zoneId || null } });
    await audit({ actorId: user.id, action: "shipping.upazila", entityType: "Upazila", entityId: String(upazilaId), after: { zoneId: zoneId || null } });
    return { ok: true, message: zoneId ? "Area override saved." : "Area now follows its district's zone." };
  } catch (e) {
    return toActionError(e);
  }
}
