import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { deleteCouponAction } from "@/modules/promotions/admin-actions";
import { formatBDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { takaInput, dateInput } from "@/modules/reports/form-data";
import { PageHeader, Table, Th, Td, EmptyRow } from "@/components/admin/ui";
import { CouponEditor } from "@/components/admin/coupon-editor";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  await requirePermission("promotions:manage");
  const [coupons, campaigns] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { campaign: { select: { name: true } }, _count: { select: { redemptions: true } } } }),
    db.campaign.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
  ]);
  const now = new Date();
  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes are validated on the server at checkout — limits, dates and minimums are always enforced."
        actions={<CouponEditor isNew campaigns={campaigns} initial={{ code: "", description: "", type: "PERCENT", percent: "10", fixedTaka: "", maxDiscount: "", minSubtotal: "", startsAt: "", endsAt: "", usageLimit: "", perCustomerLimit: "1", isActive: true, campaignId: "" }} />}
      />
      <Table>
        <thead><tr><Th>Code</Th><Th>Discount</Th><Th>Conditions</Th><Th align="right">Used</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>
          {coupons.length === 0 && <EmptyRow colSpan={6}>No coupons yet.</EmptyRow>}
          {coupons.map((c) => {
            const expired = c.endsAt && c.endsAt < now;
            const scheduled = c.startsAt && c.startsAt > now;
            const exhausted = c.usageLimit !== null && c.usedCount >= c.usageLimit;
            return (
              <tr key={c.id} className="hover:bg-cream-light">
                <Td><span className="font-semibold tracking-wider text-burgundy">{c.code}</span><div className="text-[11.5px] text-muted">{c.description}{c.campaign ? ` · ${c.campaign.name}` : ""}</div></Td>
                <Td>{c.type === "PERCENT" ? `${c.value}%${c.maxDiscount ? ` (max ${formatBDT(c.maxDiscount)})` : ""}` : c.type === "FIXED" ? formatBDT(c.value) : "Free delivery"}</Td>
                <Td className="text-[12.5px]">
                  {c.minSubtotal ? `Min ${formatBDT(c.minSubtotal)}` : "No minimum"}
                  <div className="text-muted">{c.startsAt || c.endsAt ? `${c.startsAt ? formatDate(c.startsAt) : "now"} → ${c.endsAt ? formatDate(c.endsAt) : "no end"}` : "No dates"}{c.perCustomerLimit ? ` · ${c.perCustomerLimit}/customer` : ""}</div>
                </Td>
                <Td align="right">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Td>
                <Td><Badge tone={!c.isActive || expired || exhausted ? "outline" : scheduled ? "gold" : "success"}>{!c.isActive ? "Inactive" : expired ? "Expired" : exhausted ? "Used up" : scheduled ? "Scheduled" : "Active"}</Badge></Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <CouponEditor campaigns={campaigns} initial={{ id: c.id, code: c.code, description: c.description ?? "", type: c.type, percent: c.type === "PERCENT" ? String(c.value) : "", fixedTaka: c.type === "FIXED" ? takaInput(c.value) : "", maxDiscount: takaInput(c.maxDiscount), minSubtotal: takaInput(c.minSubtotal), startsAt: dateInput(c.startsAt), endsAt: dateInput(c.endsAt), usageLimit: c.usageLimit ? String(c.usageLimit) : "", perCustomerLimit: c.perCustomerLimit ? String(c.perCustomerLimit) : "", isActive: c.isActive, campaignId: c.campaignId ?? "" }} />
                    <ActionButton action={deleteCouponAction} fields={{ id: c.id }} variant="ghost" className="text-error" confirm={`Delete ${c.code}?`}>Delete</ActionButton>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </>
  );
}
