"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isValidBDPhone, normalizeBDPhone } from "@/lib/phone";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/modules/auth/session";

async function me() {
  const user = await getCurrentUser();
  if (!user) throw new UserFacingError("Please sign in to continue.");
  return user;
}

const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(30).default("Home"),
  recipientName: z.string().trim().min(2, "Enter the recipient's name").max(80),
  phone: z.string().trim().refine(isValidBDPhone, "Enter a valid Bangladeshi mobile number"),
  districtId: z.coerce.number().int().positive("Choose a district"),
  upazilaId: z.coerce.number().int().positive("Choose an area / upazila"),
  line: z.string().trim().min(8, "Add house, road and area").max(300),
  isDefault: z.boolean().optional(),
});

export async function saveAddressAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await me();
    const input = addressSchema.parse(raw);
    const up = await db.upazila.findFirst({ where: { id: input.upazilaId, districtId: input.districtId } });
    if (!up) throw new UserFacingError("Choose a valid district and area.");
    await db.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId: user.id } });
      const makeDefault = input.isDefault || count === 0;
      if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
      const data = {
        label: input.label,
        recipientName: input.recipientName,
        phone: normalizeBDPhone(input.phone)!,
        districtId: input.districtId,
        upazilaId: input.upazilaId,
        line: input.line,
        isDefault: makeDefault,
      };
      if (input.id) {
        const owned = await tx.address.findFirst({ where: { id: input.id, userId: user.id } });
        if (!owned) throw new UserFacingError("Address not found.");
        await tx.address.update({ where: { id: input.id }, data });
      } else {
        await tx.address.create({ data: { ...data, userId: user.id } });
      }
    });
    revalidatePath("/account/addresses");
    return { ok: true, message: "Address saved." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function deleteAddressAction(id: string): Promise<ActionResult> {
  try {
    const user = await me();
    await db.address.deleteMany({ where: { id, userId: user.id } });
    revalidatePath("/account/addresses");
    return { ok: true };
  } catch (e) {
    return toActionError(e);
  }
}

export async function toggleWishlistAction(productId: string): Promise<ActionResult<{ saved: boolean }>> {
  try {
    const user = await me();
    const existing = await db.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
    } else {
      const p = await db.product.findFirst({ where: { id: productId, status: "PUBLISHED" } });
      if (!p) throw new UserFacingError("This product isn't available.");
      await db.wishlistItem.create({ data: { userId: user.id, productId } });
    }
    revalidatePath("/account/wishlist");
    return { ok: true, data: { saved: !existing } };
  } catch (e) {
    return toActionError(e);
  }
}

export async function getWishlistIdsAction(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } });
  return rows.map((r) => r.productId);
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.union([z.literal(""), z.string().trim().refine(isValidBDPhone, "Enter a valid Bangladeshi mobile number")]),
  marketingOptIn: z.boolean().optional(),
});

export async function updateProfileAction(raw: unknown): Promise<ActionResult> {
  try {
    const user = await me();
    const input = profileSchema.parse(raw);
    const phone = input.phone ? normalizeBDPhone(input.phone) : null;
    if (phone) {
      const clash = await db.user.findFirst({ where: { phone, id: { not: user.id } } });
      if (clash) throw new UserFacingError("Another account already uses this phone number.");
    }
    await db.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        phone,
        profile: { upsert: { create: { marketingOptIn: input.marketingOptIn ?? false }, update: { marketingOptIn: input.marketingOptIn ?? false } } },
      },
    });
    revalidatePath("/account", "layout");
    return { ok: true, message: "Profile updated." };
  } catch (e) {
    return toActionError(e);
  }
}
