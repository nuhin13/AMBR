import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { deleteCampaignAction } from "@/modules/promotions/admin-actions";
import { formatDate } from "@/lib/utils";
import { dateInput } from "@/modules/reports/form-data";
import { PageHeader, Table, Th, Td, EmptyRow } from "@/components/admin/ui";
import { CampaignEditor } from "@/components/admin/campaign-editor";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Campaigns" };

export default async function CampaignsPage() {
  await requirePermission("promotions:manage");
  const rows = await db.campaign.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { coupons: true, banners: true } } } });
  return (
    <>
      <PageHeader title="Campaigns" description="Group coupons and banners for a promotion (e.g. Eid, Pohela Boishakh) so you can track and switch them together." actions={<CampaignEditor isNew initial={{ name: "", description: "", startsAt: "", endsAt: "", isActive: true }} />} />
      <Table>
        <thead><tr><Th>Campaign</Th><Th>Dates</Th><Th align="right">Coupons</Th><Th align="right">Banners</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={6}>No campaigns yet.</EmptyRow>}
          {rows.map((c) => (
            <tr key={c.id}>
              <Td><span className="font-medium text-burgundy">{c.name}</span><div className="text-[11.5px] text-muted">{c.description}</div></Td>
              <Td className="text-[12.5px]">{c.startsAt ? formatDate(c.startsAt) : "—"} → {c.endsAt ? formatDate(c.endsAt) : "—"}</Td>
              <Td align="right">{c._count.coupons}</Td>
              <Td align="right">{c._count.banners}</Td>
              <Td><Badge tone={c.isActive ? "success" : "outline"}>{c.isActive ? "Active" : "Inactive"}</Badge></Td>
              <Td align="right">
                <div className="flex justify-end gap-1">
                  <CampaignEditor initial={{ id: c.id, name: c.name, description: c.description ?? "", startsAt: dateInput(c.startsAt), endsAt: dateInput(c.endsAt), isActive: c.isActive }} />
                  <ActionButton action={deleteCampaignAction} fields={{ id: c.id }} variant="ghost" className="text-error" confirm={`Delete ${c.name}?`}>Delete</ActionButton>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
