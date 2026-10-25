import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getCurrentUser, type SessionUser } from "./session";

export const STAFF_ROLES: Role[] = ["STAFF_ORDERS", "STAFF_CATALOG", "ADMIN", "OWNER"];

const PERMISSIONS = {
  "dashboard:view": STAFF_ROLES,
  "orders:manage": ["STAFF_ORDERS", "ADMIN", "OWNER"],
  "customers:view": ["STAFF_ORDERS", "ADMIN", "OWNER"],
  "customers:manage": ["ADMIN", "OWNER"],
  "catalog:manage": ["STAFF_CATALOG", "ADMIN", "OWNER"],
  "inventory:manage": ["STAFF_CATALOG", "ADMIN", "OWNER"],
  "reviews:moderate": ["STAFF_CATALOG", "ADMIN", "OWNER"],
  "promotions:manage": ["ADMIN", "OWNER"],
  "content:manage": ["ADMIN", "OWNER"],
  "shipping:manage": ["ADMIN", "OWNER"],
  "settings:manage": ["ADMIN", "OWNER"],
  "reports:view": ["ADMIN", "OWNER"],
  "audit:view": ["ADMIN", "OWNER"],
  "staff:manage": ["OWNER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const isStaff = (role: Role) => STAFF_ROLES.includes(role);
export const can = (role: Role, permission: Permission) => (PERMISSIONS[permission] as readonly Role[]).includes(role);

/**
 * Guards admin pages and admin server actions. Must be called in every admin
 * action — layouts alone are not a security boundary.
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/en/login?next=/admin");
  if (!isStaff(user.role)) redirect("/en");
  if (!can(user.role, permission)) redirect("/admin/forbidden");
  return user;
}
