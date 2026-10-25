"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { audit } from "@/modules/audit/log";
import { formObject, revalidateStore } from "@/modules/reports/form-data";

export async function moderateReviewAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("reviews:moderate");
    const { id, status } = z.object({ id: z.string(), status: z.enum(["APPROVED", "REJECTED", "PENDING"]) }).parse(formObject(fd));
    const before = await db.review.findUniqueOrThrow({ where: { id } });
    await db.review.update({ where: { id }, data: { status, approvedAt: status === "APPROVED" ? new Date() : null } });
    await audit({ actorId: user.id, action: "review.moderate", entityType: "Review", entityId: id, before: { status: before.status }, after: { status } });
    revalidateStore();
    return { ok: true, message: status === "APPROVED" ? "Review published." : status === "REJECTED" ? "Review rejected." : "Moved back to pending." };
  } catch (e) {
    return toActionError(e);
  }
}
