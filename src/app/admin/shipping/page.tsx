import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { deleteZoneAction, saveDistrictZonesAction, saveUpazilaZoneAction } from "@/modules/shipping/admin-actions";
import { formatBDT } from "@/lib/money";
import { takaInput } from "@/modules/reports/form-data";
import { PageHeader, Card, Table, Th, Td } from "@/components/admin/ui";
import { ZoneEditor } from "@/components/admin/shipping-zone-editor";
import { ActionForm, ActionButton, SubmitButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Shipping" };

export default async function ShippingPage({ searchParams }: { searchParams: Promise<{ district?: string }> }) {
  await requirePermission("shipping:manage");
  const sp = await searchParams;
  const [zones, divisions] = await Promise.all([
    db.shippingZone.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { districts: true, upazilas: true } } } }),
    db.division.findMany({ orderBy: { name: "asc" }, include: { districts: { orderBy: { name: "asc" } } } }),
  ]);
  const selectedDistrict = sp.district ? await db.district.findUnique({ where: { id: Number(sp.district) }, include: { upazilas: { orderBy: [{ isCityArea: "desc" }, { name: "asc" }] }, shippingZone: true } }) : null;
  return (
    <>
      <PageHeader title="Shipping" description="Delivery charges come from the customer's district (or an area override). Changes apply to new checkouts immediately." actions={<ZoneEditor isNew initial={{ name: "", fee: "", freeShippingThreshold: "", estimatedDays: "2–4 days", isActive: true, sortOrder: zones.length }} />} />
      <Card title="Delivery zones" padded={false} className="mb-6">
        <Table className="border-0">
          <thead><tr><Th>Zone</Th><Th align="right">Charge</Th><Th align="right">Free from</Th><Th>Estimate</Th><Th align="right">Districts / areas</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.id}>
                <Td className="font-medium">{z.name}</Td>
                <Td align="right">{formatBDT(z.fee)}</Td>
                <Td align="right">{z.freeShippingThreshold !== null ? formatBDT(z.freeShippingThreshold) : "—"}</Td>
                <Td>{z.estimatedDays}</Td>
                <Td align="right">{z._count.districts} / {z._count.upazilas}</Td>
                <Td><Badge tone={z.isActive ? "success" : "outline"}>{z.isActive ? "Active" : "Off"}</Badge></Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <ZoneEditor initial={{ id: z.id, name: z.name, fee: takaInput(z.fee), freeShippingThreshold: takaInput(z.freeShippingThreshold), estimatedDays: z.estimatedDays, isActive: z.isActive, sortOrder: z.sortOrder }} />
                    {z._count.districts + z._count.upazilas === 0 && <ActionButton action={deleteZoneAction} fields={{ id: z.id }} variant="ghost" className="text-error" confirm={`Delete ${z.name}?`}>Delete</ActionButton>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card title="District → zone">
          <ActionForm action={saveDistrictZonesAction} className="space-y-6">
            {divisions.map((dv) => (
              <fieldset key={dv.id}>
                <legend className="eyebrow mb-2 text-[10px] text-muted">{dv.name} division</legend>
                <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  {dv.districts.map((d) => (
                    <label key={d.id} className="flex items-center justify-between gap-2 text-[13.5px]">
                      <a href={`/admin/shipping?district=${d.id}#areas`} className="truncate text-burgundy hover:underline">{d.name}</a>
                      <select name={`district_${d.id}`} defaultValue={d.shippingZoneId} className="h-8 w-40 border border-beige bg-white px-1.5 text-[12.5px]">
                        {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <SubmitButton>Save district zones</SubmitButton>
          </ActionForm>
        </Card>
        <Card title={selectedDistrict ? `Areas in ${selectedDistrict.name}` : "Area overrides"}>
          <div id="areas" />
          {!selectedDistrict ? (
            <p className="text-[13px] text-muted">Click a district name to give individual areas a different zone — e.g. Savar or Keraniganj in Dhaka district use “Dhaka Suburbs”.</p>
          ) : (
            <>
              <p className="mb-3 text-[13px] text-muted">District default: <strong className="text-charcoal">{selectedDistrict.shippingZone.name}</strong>. Overrides apply only to the chosen area.</p>
              <ul className="max-h-[640px] divide-y divide-beige overflow-y-auto">
                {selectedDistrict.upazilas.map((u) => (
                  <li key={u.id} className="py-1.5">
                    <ActionForm action={saveUpazilaZoneAction} className="flex items-center justify-between gap-2 text-[13.5px]">
                      <input type="hidden" name="upazilaId" value={u.id} />
                      <span className="truncate">{u.name}{u.isCityArea && <span className="ml-1 text-[11px] text-muted">city</span>}</span>
                      <span className="flex gap-1.5">
                        <select name="zoneId" defaultValue={u.shippingZoneId ?? ""} className="h-8 w-40 border border-beige bg-white px-1.5 text-[12.5px]">
                          <option value="">District default</option>
                          {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                        <button className="h-8 border border-burgundy px-2 text-[11px] uppercase text-burgundy">Save</button>
                      </span>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
