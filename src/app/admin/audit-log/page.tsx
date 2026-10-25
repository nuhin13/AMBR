import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { formatDateTime } from "@/lib/utils";
import { dhakaDay } from "@/modules/reports/form-data";
import { PageHeader, Table, Th, Td, EmptyRow, Pagination, FilterBar, FilterInput, FilterSelect } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("audit:view");
  const sp = await searchParams;
  const where: Prisma.AuditLogWhereInput = {
    ...(sp.entity ? { entityType: sp.entity } : {}),
    ...(sp.action ? { action: { contains: sp.action } } : {}),
    ...(sp.actor ? { actorId: sp.actor } : {}),
    ...(sp.from || sp.to ? { createdAt: { gte: dhakaDay(sp.from), lte: dhakaDay(sp.to, true) } } : {}),
  };
  const pageSize = 50;
  const total = await db.auditLog.count({ where });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(sp.page) || 1), pages);
  const [rows, entities, actors] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { actor: { select: { name: true } } } }),
    db.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
    db.user.findMany({ where: { auditLogs: { some: {} } }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="Audit log" description="Every admin change, who made it and when. Entries can't be edited or deleted." />
      <FilterBar basePath="/admin/audit-log">
        <FilterSelect label="Area" name="entity" defaultValue={sp.entity} options={entities.map((e) => ({ value: e.entityType, label: e.entityType }))} />
        <FilterSelect label="Person" name="actor" defaultValue={sp.actor} options={actors.map((a) => ({ value: a.id, label: a.name }))} />
        <FilterInput label="Action contains" name="action" defaultValue={sp.action} placeholder="e.g. status" />
        <FilterInput label="From" name="from" type="date" defaultValue={sp.from} />
        <FilterInput label="To" name="to" type="date" defaultValue={sp.to} />
      </FilterBar>
      <Table>
        <thead><tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Item</Th><Th>Details</Th></tr></thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={5}>No entries.</EmptyRow>}
          {rows.map((r) => (
            <tr key={r.id} className="align-top">
              <Td className="whitespace-nowrap text-[12.5px]">{formatDateTime(r.createdAt)}</Td>
              <Td className="text-[12.5px]">{r.actor?.name ?? "System"}<div className="text-[11px] text-muted">{r.ip ?? ""}</div></Td>
              <Td className="text-[12.5px] font-medium">{r.action}</Td>
              <Td className="text-[12px] text-muted">{r.entityType}{r.entityId ? ` · ${r.entityId.slice(0, 12)}` : ""}</Td>
              <Td>
                {(r.before || r.after) ? (
                  <details className="text-[12px]">
                    <summary className="cursor-pointer text-burgundy">View</summary>
                    {r.before ? <pre className="mt-1 max-h-48 max-w-[420px] overflow-auto whitespace-pre-wrap bg-cream-light p-2 text-[11px]">Before: {JSON.stringify(r.before, null, 1)}</pre> : null}
                    {r.after ? <pre className="mt-1 max-h-48 max-w-[420px] overflow-auto whitespace-pre-wrap bg-cream-light p-2 text-[11px]">After: {JSON.stringify(r.after, null, 1)}</pre> : null}
                  </details>
                ) : "—"}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} pages={pages} total={total} params={sp} basePath="/admin/audit-log" />
    </>
  );
}
