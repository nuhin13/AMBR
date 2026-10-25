import type { Metadata } from "next";
import { requirePermission, can } from "@/modules/auth/rbac";
import { logoutAction } from "@/modules/auth/actions";
import { AdminShell } from "@/components/admin/shell";
import { ADMIN_NAV } from "@/components/admin/nav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · AMBR Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("dashboard:view");
  const groups = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => can(user.role, i.permission)) })).filter((g) => g.items.length > 0);
  return (
    <AdminShell groups={groups} user={{ name: user.name, role: user.role }} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
