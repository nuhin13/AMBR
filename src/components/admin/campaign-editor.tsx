"use client";

import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Textarea, Checkbox } from "@/components/ui/field";
import { saveCampaignAction } from "@/modules/promotions/admin-actions";

export function CampaignEditor({ initial, isNew }: { initial: { id?: string; name: string; description: string; startsAt: string; endsAt: string; isActive: boolean }; isNew?: boolean }) {
  return (
    <EditSheet title={isNew ? "New campaign" : `Edit ${initial.name}`} trigger={isNew ? "New campaign" : "Edit"} variant={isNew ? "primary" : "ghost"}>
      {(close) => (
        <ActionForm action={saveCampaignAction} className="space-y-4" onSuccess={close}>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <Input name="name" label="Name" defaultValue={initial.name} required placeholder="e.g. Eid Collection 2026" />
          <Textarea name="description" label="Notes" rows={3} defaultValue={initial.description} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="startsAt" type="date" label="Starts" defaultValue={initial.startsAt} />
            <Input name="endsAt" type="date" label="Ends" defaultValue={initial.endsAt} />
          </div>
          <Checkbox name="isActive" label="Active" defaultChecked={initial.isActive} />
          <p className="text-[12.5px] text-muted">Link coupons and banners to this campaign from their own editors.</p>
          <SubmitButton full>Save campaign</SubmitButton>
        </ActionForm>
      )}
    </EditSheet>
  );
}
