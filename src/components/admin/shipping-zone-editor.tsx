"use client";

import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Checkbox } from "@/components/ui/field";
import { saveZoneAction } from "@/modules/shipping/admin-actions";

export function ZoneEditor({ initial, isNew }: { initial: { id?: string; name: string; fee: string; freeShippingThreshold: string; estimatedDays: string; isActive: boolean; sortOrder: number }; isNew?: boolean }) {
  return (
    <EditSheet title={isNew ? "New delivery zone" : `Edit ${initial.name}`} trigger={isNew ? "New zone" : "Edit"} variant={isNew ? "primary" : "ghost"}>
      {(close) => (
        <ActionForm action={saveZoneAction} className="space-y-4" onSuccess={close}>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <Input name="name" label="Zone name" defaultValue={initial.name} required placeholder="e.g. Remote areas" />
          <Input name="fee" label="Delivery charge ৳" defaultValue={initial.fee} required inputMode="decimal" />
          <Input name="freeShippingThreshold" label="Free delivery from ৳" defaultValue={initial.freeShippingThreshold} inputMode="decimal" hint="Order subtotal (after discount) at which delivery becomes free. Leave empty for never." />
          <Input name="estimatedDays" label="Delivery estimate shown to customers" defaultValue={initial.estimatedDays} required placeholder="2–3 days" />
          <Input name="sortOrder" type="number" label="Order" defaultValue={initial.sortOrder} />
          <Checkbox name="isActive" label="Active" defaultChecked={initial.isActive} />
          <SubmitButton full>Save zone</SubmitButton>
        </ActionForm>
      )}
    </EditSheet>
  );
}
