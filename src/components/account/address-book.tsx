"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { deleteAddressAction, saveAddressAction } from "@/modules/customers/actions";
import { useI18n } from "@/i18n/client";

type District = { id: number; name: string; upazilas: { id: number; name: string }[] };
type Address = { id: string; label: string; recipientName: string; phone: string; districtId: number; upazilaId: number; line: string; isDefault: boolean; summary: string };

export function AddressBook({ districts, addresses }: { districts: District[]; addresses: Address[] }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="t-h3">{t.account.savedAddresses}</h2>
        <Button size="sm" onClick={() => setEditing({})}>{t.account.addAddress}</Button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState title={t.account.noAddresses} description={t.account.noAddressesText} />
      ) : (
        <ul className="grid gap-x-10 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="border-t border-burgundy/12 py-6 text-[14.5px]">
              <div className="flex items-center gap-2"><span className="font-medium text-burgundy">{a.label}</span>{a.isDefault && <Badge tone="beige">{t.account.default}</Badge>}</div>
              <p className="mt-2">{a.recipientName} · {a.phone}</p>
              <p className="text-muted">{a.summary}</p>
              <div className="mt-4 flex gap-6 text-[11px]">
                <button className="btn-text link-underline text-burgundy" onClick={() => setEditing(a)}>{t.common.edit}</button>
                <button
                  className="btn-text link-underline text-muted hover:text-error"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (!confirm(t.account.deleteConfirm)) return;
                      const r = await deleteAddressAction(a.id);
                      if (r.ok) router.refresh();
                      else toast(r.error, "error");
                    })
                  }
                >
                  {t.common.delete}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing?.id ? t.account.editAddress : t.account.newAddress}>
        {editing && <AddressForm key={editing.id ?? "new"} initial={editing} districts={districts} onDone={() => { setEditing(null); router.refresh(); }} />}
      </Sheet>
    </div>
  );
}

function AddressForm({ initial, districts, onDone }: { initial: Partial<Address>; districts: District[]; onDone: () => void }) {
  const { t } = useI18n();
  const [districtId, setDistrictId] = useState(initial.districtId ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const district = districts.find((d) => d.id === districtId);
  return (
    <form
      className="space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await saveAddressAction({
            id: initial.id,
            label: fd.get("label"),
            recipientName: fd.get("recipientName"),
            phone: fd.get("phone"),
            districtId: fd.get("districtId"),
            upazilaId: fd.get("upazilaId"),
            line: fd.get("line"),
            isDefault: fd.get("isDefault") === "on",
          });
          if (r.ok) {
            toast(r.message ?? t.common.saved);
            onDone();
          } else setErrors(r.fieldErrors ?? { line: r.error });
        });
      }}
    >
      <Input name="label" label={t.account.label} defaultValue={initial.label ?? ""} placeholder={t.account.labelPlaceholder} />
      <Input name="recipientName" label={t.account.recipient} defaultValue={initial.recipientName} required error={errors.recipientName} />
      <Input name="phone" label={t.checkout.mobile} type="tel" prefix="+88" defaultValue={initial.phone} required error={errors.phone} />
      <Select name="districtId" label={t.checkout.district} value={districtId || ""} onChange={(e) => setDistrictId(Number(e.target.value))} required error={errors.districtId}>
        <option value="">{t.checkout.chooseDistrict}</option>
        {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </Select>
      <Select name="upazilaId" label={t.checkout.area} defaultValue={initial.upazilaId || ""} required disabled={!district} error={errors.upazilaId}>
        <option value="">{t.checkout.chooseArea}</option>
        {district?.upazilas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <Textarea name="line" label={t.checkout.fullAddress} rows={2} defaultValue={initial.line} required error={errors.line} />
      <Checkbox name="isDefault" label={t.account.makeDefault} defaultChecked={initial.isDefault} />
      <Button type="submit" full loading={pending}>{t.account.saveAddress}</Button>
    </form>
  );
}
