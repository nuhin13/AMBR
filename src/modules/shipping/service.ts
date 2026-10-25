import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export type ZoneInfo = { id: string; name: string; fee: number; freeShippingThreshold: number | null; estimatedDays: string };

/** The zone for an address: upazila override first, then the district's zone. */
export async function resolveZone(districtId: number, upazilaId?: number | null): Promise<ZoneInfo | null> {
  if (upazilaId) {
    const u = await db.upazila.findFirst({ where: { id: upazilaId, districtId }, include: { shippingZone: true } });
    if (u?.shippingZone?.isActive) return pick(u.shippingZone);
  }
  const d = await db.district.findUnique({ where: { id: districtId }, include: { shippingZone: true } });
  return d?.shippingZone?.isActive ? pick(d.shippingZone) : null;
}

const pick = (z: ZoneInfo & Record<string, unknown>): ZoneInfo => ({
  id: z.id,
  name: z.name,
  fee: z.fee,
  freeShippingThreshold: z.freeShippingThreshold,
  estimatedDays: z.estimatedDays,
});

/** Compact geography + zone map sent to the checkout form so delivery fees preview instantly. */
export const getCheckoutGeography = cache(async () => {
  const [districts, zones] = await Promise.all([
    db.district.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, nameBn: true, shippingZoneId: true, upazilas: { orderBy: [{ isCityArea: "desc" }, { name: "asc" }], select: { id: true, name: true, shippingZoneId: true, isCityArea: true } } },
    }),
    db.shippingZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { districts, zones: zones.map(pick) };
});

export const getActiveZones = cache(() => db.shippingZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }));
