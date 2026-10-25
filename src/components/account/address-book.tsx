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

type District = { id: number; name: string; upazilas: { id: number; name: string }[] };
type Address = { id: string; label: string; recipientName: string; phone: string; districtId: number; upazilaId: number; line: string; isDefault: boolean; summary: string };

export function AddressBook({ districts, addresses }: { districts: District[]; addresses: Address[] }) {
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[24px]">Saved addresses</h2>
        <Button size="sm" onClick={() => setEditing({})}>Add address</Button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState title="No saved addresses" description="Save an address to check out faster." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="border border-beige bg-cream-light p-5 text-[14.5px]">
              <div className="flex items-center gap-2"><span className="font-medium text-burgundy">{a.label}</span>{a.isDefault && <Badge tone="burgundy">Default</Badge>}</div>
              <p className="mt-2">{a.recipientName} · {a.phone}</p>
              <p className="text-muted">{a.summary}</p>
              <div className="mt-4 flex gap-4 text-[12px] font-semibold uppercase tracking-[0.14em]">
                <button className="text-burgundy underline underline-offset-4" onClick={() => setEditing(a)}>Edit</button>
                <button
                  className="text-muted underline underline-offset-4 hover:text-error"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (!confirm("Delete this address?")) return;
                      const r = await deleteAddressAction(a.id);
                      if (r.ok) router.refresh();
                      else toast(r.error, "error");
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing?.id ? "Edit address" : "New address"}>
        {editing && <AddressForm key={editing.id ?? "new"} initial={editing} districts={districts} onDone={() => { setEditing(null); router.refresh(); }} />}
      </Sheet>
    </div>
  );
}

function AddressForm({ initial, districts, onDone }: { initial: Partial<Address>; districts: District[]; onDone: () => void }) {
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
            toast(r.message ?? "Saved");
            onDone();
          } else setErrors(r.fieldErrors ?? { line: r.error });
        });
      }}
    >
      <Input name="label" label="Label" defaultValue={initial.label ?? "Home"} placeholder="Home, Office…" />
      <Input name="recipientName" label="Recipient name" defaultValue={initial.recipientName} required error={errors.recipientName} />
      <Input name="phone" label="Mobile number" type="tel" prefix="+88" defaultValue={initial.phone} required error={errors.phone} />
      <Select name="districtId" label="District" value={districtId || ""} onChange={(e) => setDistrictId(Number(e.target.value))} required error={errors.districtId}>
        <option value="">Choose district</option>
        {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </Select>
      <Select name="upazilaId" label="Area / Upazila" defaultValue={initial.upazilaId || ""} required disabled={!district} error={errors.upazilaId}>
        <option value="">Choose area</option>
        {district?.upazilas.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <Textarea name="line" label="Full address" rows={2} defaultValue={initial.line} required error={errors.line} />
      <Checkbox name="isDefault" label="Make this my default address" defaultChecked={initial.isDefault} />
      <Button type="submit" full loading={pending}>Save address</Button>
    </form>
  );
}
