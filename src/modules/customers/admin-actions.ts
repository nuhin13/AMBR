"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/modules/auth/rbac";
import { revokeAllSessions } from "@/modules/auth/session";
import { audit } from "@/modules/audit/log";
import { formObject } from "@/modules/reports/form-data";

export async function saveCustomerNotesAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("customers:view");
    const { userId, adminNotes } = z.object({ userId: z.string(), adminNotes: z.string().max(2000) }).parse(formObject(fd));
    await db.customerProfile.upsert({ where: { userId }, create: { userId, adminNotes: adminNotes || null }, update: { adminNotes: adminNotes || null } });
    await audit({ actorId: user.id, action: "customer.notes", entityType: "User", entityId: userId, after: { adminNotes } });
    return { ok: true, message: "Notes saved." };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setCustomerStatusAction(fd: FormData): Promise<ActionResult> {
  try {
    const user = await requirePermission("customers:manage");
    const { userId, status } = z.object({ userId: z.string(), status: z.enum(["ACTIVE", "DISABLED"]) }).parse(formObject(fd));
    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target || target.role !== "CUSTOMER") throw new UserFacingError("Customer not found.");
    await db.user.update({ where: { id: userId }, data: { status } });
    if (status === "DISABLED") await revokeAllSessions(userId);
    await audit({ actorId: user.id, action: "customer.status", entityType: "User", entityId: userId, before: { status: target.status }, after: { status } });
    return { ok: true, message: status === "DISABLED" ? "Account disabled and signed out." : "Account re-enabled." };
  } catch (e) {
    return toActionError(e);
  }
}
