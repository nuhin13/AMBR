"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { toActionError, UserFacingError, type ActionResult } from "@/lib/action-result";
import { formObject } from "@/modules/reports/form-data";
import { audit } from "@/modules/audit/log";
import { requirePermission } from "./rbac";
import { hashPassword } from "./password";
import { revokeAllSessions } from "./session";

const staffRole = z.enum(["STAFF_ORDERS", "STAFF_CATALOG", "ADMIN", "OWNER"]);

export async function createStaffAction(fd: FormData): Promise<ActionResult> {
  try {
    const me = await requirePermission("staff:manage");
    const input = z
      .object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(), role: staffRole, password: z.string().min(10, "Temporary password must be at least 10 characters").max(128) })
      .parse(formObject(fd));
    const existing = await db.user.findUnique({ where: { email: input.email } });
    if (existing) {
      if (existing.role !== "CUSTOMER") throw new UserFacingError("This person is already a staff member.");
      // Promote an existing customer account; their password stays the same.
      await db.user.update({ where: { id: existing.id }, data: { role: input.role, status: "ACTIVE" } });
      await audit({ actorId: me.id, action: "staff.promote", entityType: "User", entityId: existing.id, before: { role: existing.role }, after: { role: input.role } });
      return { ok: true, message: `${existing.name} already had a customer account and is now ${input.role.toLowerCase().replace("_", " ")}. Their existing password still applies.` };
    }
    const u = await db.user.create({ data: { name: input.name, email: input.email, role: input.role, passwordHash: await hashPassword(input.password) } });
    await audit({ actorId: me.id, action: "staff.create", entityType: "User", entityId: u.id, after: { email: u.email, role: u.role } });
    return { ok: true, message: `${u.name} added. Share the temporary password privately and ask them to change it after signing in.` };
  } catch (e) {
    return toActionError(e);
  }
}

async function guardOwners(targetId: string, nextRole: string | null, nextStatus: string | null, meId: string) {
  const target = await db.user.findUnique({ where: { id: targetId } });
  if (!target) throw new UserFacingError("User not found.");
  if (target.id === meId) throw new UserFacingError("You can't change your own role or status.");
  const losingOwner = target.role === "OWNER" && ((nextRole && nextRole !== "OWNER") || nextStatus === "DISABLED");
  if (losingOwner) {
    const owners = await db.user.count({ where: { role: "OWNER", status: "ACTIVE" } });
    if (owners <= 1) throw new UserFacingError("There must always be at least one active owner.");
  }
  return target;
}

export async function changeStaffRoleAction(fd: FormData): Promise<ActionResult> {
  try {
    const me = await requirePermission("staff:manage");
    const { id, role } = z.object({ id: z.string(), role: z.enum(["CUSTOMER", "STAFF_ORDERS", "STAFF_CATALOG", "ADMIN", "OWNER"]) }).parse(formObject(fd));
    const target = await guardOwners(id, role, null, me.id);
    await db.user.update({ where: { id }, data: { role } });
    await revokeAllSessions(id);
    await audit({ actorId: me.id, action: "staff.role", entityType: "User", entityId: id, before: { role: target.role }, after: { role } });
    return { ok: true, message: role === "CUSTOMER" ? `${target.name} no longer has admin access.` : `${target.name}'s role updated. They'll need to sign in again.` };
  } catch (e) {
    return toActionError(e);
  }
}

export async function setStaffStatusAction(fd: FormData): Promise<ActionResult> {
  try {
    const me = await requirePermission("staff:manage");
    const { id, status } = z.object({ id: z.string(), status: z.enum(["ACTIVE", "DISABLED"]) }).parse(formObject(fd));
    const target = await guardOwners(id, null, status, me.id);
    await db.user.update({ where: { id }, data: { status } });
    if (status === "DISABLED") await revokeAllSessions(id);
    await audit({ actorId: me.id, action: "staff.status", entityType: "User", entityId: id, before: { status: target.status }, after: { status } });
    return { ok: true, message: status === "DISABLED" ? `${target.name} disabled and signed out.` : `${target.name} re-enabled.` };
  } catch (e) {
    return toActionError(e);
  }
}
