import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Locale } from "@/i18n/config";

export type ZoneInfo = { id: string; name: string; fee: number; freeShippingThreshold: number | null; estimatedDays: string };

type ZoneRow = { id: string; name: string; nameBn: string | null; fee: number; freeShippingThreshold: number | null; estimatedDays: string; estimatedDaysBn: string | null };

const pick = (z: ZoneRow, locale: Locale = "en"): ZoneInfo => ({
  id: z.id,
  name: locale === "bn" && z.nameBn ? z.nameBn : z.name,
  fee: z.fee,
  freeShippingThreshold: z.freeShippingThreshold,
  estimatedDays: locale === "bn" && z.estimatedDaysBn ? z.estimatedDaysBn : z.estimatedDays,
});

/** The zone for an address: upazila override first, then the district's zone. Names in English (order snapshots). */
export async function resolveZone(districtId: number, upazilaId?: number | null): Promise<ZoneInfo | null> {
  if (upazilaId) {
    const u = await db.upazila.findFirst({ where: { id: upazilaId, districtId }, include: { shippingZone: true } });
    if (u?.shippingZone?.isActive) return pick(u.shippingZone);
  }
  const d = await db.district.findUnique({ where: { id: districtId }, include: { shippingZone: true } });
  return d?.shippingZone?.isActive ? pick(d.shippingZone) : null;
}

/** Compact geography + zone map sent to the checkout form so delivery fees preview instantly. */
export const getCheckoutGeography = cache(async (locale: Locale = "en") => {
  const [districts, zones] = await Promise.all([
    db.district.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, nameBn: true, shippingZoneId: true, upazilas: { orderBy: [{ isCityArea: "desc" }, { name: "asc" }], select: { id: true, name: true, nameBn: true, shippingZoneId: true, isCityArea: true } } },
    }),
    db.shippingZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { districts, zones: zones.map((z) => pick(z, locale)) };
});

export const getActiveZones = cache(async (locale: Locale = "en") => {
  const rows = await db.shippingZone.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((z) => pick(z, locale));
});
