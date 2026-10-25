import { db } from "@/lib/db";
import { requirePermission, STAFF_ROLES } from "@/modules/auth/rbac";
import { setStaffStatusAction } from "@/modules/auth/admin-actions";
import { formatDateTime } from "@/lib/utils";
import { PageHeader, Table, Th, Td, Card } from "@/components/admin/ui";
import { AddStaff, RoleSelect, ROLE_INFO } from "@/components/admin/staff-forms";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requirePermission("staff:manage");
  const staff = await db.user.findMany({ where: { role: { in: STAFF_ROLES } }, orderBy: [{ role: "desc" }, { name: "asc" }] });
  return (
    <>
      <PageHeader title="Staff" description="Give each person their own account with the smallest role they need. Every admin action is recorded in the audit log." actions={<AddStaff />} />
      <Table>
        <thead><tr><Th>Name</Th><Th>Role</Th><Th>Last sign-in</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <Td><span className="font-medium">{s.name}</span>{s.id === me.id && <span className="ml-1 text-[11px] text-muted">(you)</span>}<div className="text-[12px] text-muted">{s.email}</div></Td>
              <Td>{s.id === me.id ? <Badge tone="burgundy">{s.role.replace("_", " ")}</Badge> : <RoleSelect id={s.id} role={s.role} />}</Td>
              <Td className="text-[12.5px]">{s.lastLoginAt ? formatDateTime(s.lastLoginAt) : "Never"}</Td>
              <Td><Badge tone={s.status === "ACTIVE" ? "success" : "error"}>{s.status.toLowerCase()}</Badge></Td>
              <Td align="right">
                {s.id !== me.id && (s.status === "ACTIVE"
                  ? <ActionButton action={setStaffStatusAction} fields={{ id: s.id, status: "DISABLED" }} variant="ghost" className="text-error" confirm={`Disable ${s.name}? They'll be signed out immediately.`}>Disable</ActionButton>
                  : <ActionButton action={setStaffStatusAction} fields={{ id: s.id, status: "ACTIVE" }} variant="ghost">Enable</ActionButton>)}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Card title="What each role can do" className="mt-6">
        <ul className="space-y-1.5 text-[13.5px]">{Object.entries(ROLE_INFO).map(([k, v]) => <li key={k}><span className="font-medium">{k.replace("_", " ").toLowerCase()}</span> — {v.split("— ")[1]}</li>)}</ul>
      </Card>
    </>
  );
}
