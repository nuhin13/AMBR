"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { formObject, revalidateStore, zBool, zOptDate, zOptInt, zOptTaka, zOptText, zText } from "@/modules/reports/form-data";
import { normaliseCode } from "./coupons";

const couponSchema = z
  .object({
    id: z.string().optional(),
    code: zText(40).min(3, "Code must be at least 3 characters"),
    description: zOptText(200),
    type: z.enum(["PERCENT", "FIXED", "FREE_SHIPPING"]),
    percent: zOptInt(1, 100),
    fixedTaka: zOptTaka,
    maxDiscount: zOptTaka,
    minSubtotal: zOptTaka,
    startsAt: zOptDate,
    endsAt: zOptDate,
    usageLimit: zOptInt(1, 1_000_000),
    perCustomerLimit: zOptInt(1, 1000),
    isActive: zBool,
    campaignId: zOptText(40),
  })
  .superRefine((v, ctx) => {
    if (v.type === "PERCENT" && !v.percent) ctx.addIssue({ code: "custom", path: ["percent"], message: "Enter a percentage (1–100)" });
    if (v.type === "FIXED" && !v.fixedTaka) ctx.addIssue({ code: "custom", path: ["fixedTaka"], message: "Enter the discount amount in ৳" });
    if (v.startsAt && v.endsAt && v.endsAt < v.startsAt) ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date must be after the start date" });
  });

export async function saveCouponAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("promotions:manage");
    const input = couponSchema.parse(formObject(fd));
    const code = normaliseCode(input.code);
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) throw new UserFacingError("Codes may use letters, numbers, dash and underscore only.");
    const clash = await db.coupon.findFirst({ where: { code, id: input.id ? { not: input.id } : undefined } });
    if (clash) throw new UserFacingError(`Code ${code} already exists.`);
    const endOfDay = input.endsAt ? new Date(new Date(input.endsAt).getTime() + (24 * 3600_000 - 1) - 6 * 3600_000) : null;
    const startOfDay = input.startsAt ? new Date(new Date(input.startsAt).getTime() - 6 * 3600_000) : null;
    const data = {
      code,
      description: input.description ?? null,
      type: input.type,
      value: input.type === "PERCENT" ? input.percent! : input.type === "FIXED" ? input.fixedTaka! : 0,
      maxDiscount: input.type === "PERCENT" ? input.maxDiscount ?? null : null,
      minSubtotal: input.minSubtotal ?? null,
      startsAt: startOfDay,
      endsAt: endOfDay,
      usageLimit: input.usageLimit ?? null,
      perCustomerLimit: input.perCustomerLimit ?? null,
      isActive: input.isActive,
      campaignId: input.campaignId || null,
    };
    const before = input.id ? await db.coupon.findUnique({ where: { id: input.id } }) : null;
    const c = input.id ? await db.coupon.update({ where: { id: input.id }, data }) : await db.coupon.create({ data });
    await audit({ actorId: user.id, action: input.id ? "coupon.update" : "coupon.create", entityType: "Coupon", entityId: c.id, before, after: data });
    return { ok: true, message: `Coupon ${code} saved.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteCouponAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("promotions:manage");
    const id = z.string().parse(fd.get("id"));
    const c = await db.coupon.findUnique({ where: { id }, include: { _count: { select: { redemptions: true } } } });
    if (!c) throw new UserFacingError("Coupon not found.");
    if (c._count.redemptions > 0) {
      await db.coupon.update({ where: { id }, data: { isActive: false } });
      await audit({ actorId: user.id, action: "coupon.deactivate", entityType: "Coupon", entityId: id });
      return { ok: true, message: `${c.code} has been used on orders, so it was deactivated instead of deleted.` };
    }
    await db.coupon.delete({ where: { id } });
    await audit({ actorId: user.id, action: "coupon.delete", entityType: "Coupon", entityId: id, before: { code: c.code } });
    return { ok: true, message: `${c.code} deleted.` };
  } catch (e) {
    return toActionError(e);
  }
}

const campaignSchema = z.object({ id: z.string().optional(), name: zText(80).min(2), description: zOptText(400), startsAt: zOptDate, endsAt: zOptDate, isActive: zBool });

export async function saveCampaignAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("promotions:manage");
    const input = campaignSchema.parse(formObject(fd));
    const data = { name: input.name, description: input.description ?? null, startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null, isActive: input.isActive };
    const c = input.id ? await db.campaign.update({ where: { id: input.id }, data }) : await db.campaign.create({ data });
    await audit({ actorId: user.id, action: input.id ? "campaign.update" : "campaign.create", entityType: "Campaign", entityId: c.id, after: data });
    revalidateStore();
    return { ok: true, message: "Campaign saved." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteCampaignAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("promotions:manage");
    const id = z.string().parse(fd.get("id"));
    await db.campaign.delete({ where: { id } });
    await audit({ actorId: user.id, action: "campaign.delete", entityType: "Campaign", entityId: id });
    revalidateStore();
    return { ok: true, message: "Campaign deleted. Its coupons and banners were kept." };
  } catch (e) {
    return toActionError(e);
  }
}
