"use client";

import { useState } from "react";
import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { saveCouponAction } from "@/modules/promotions/admin-actions";

export type CouponInitial = {
  id?: string; code: string; description: string; type: "PERCENT" | "FIXED" | "FREE_SHIPPING"; percent: string; fixedTaka: string; maxDiscount: string; minSubtotal: string;
  startsAt: string; endsAt: string; usageLimit: string; perCustomerLimit: string; isActive: boolean; campaignId: string;
};

export function CouponEditor({ initial, campaigns, isNew }: { initial: CouponInitial; campaigns: { id: string; name: string }[]; isNew?: boolean }) {
  const [type, setType] = useState(initial.type);
  return (
    <EditSheet title={isNew ? "New coupon" : `Edit ${initial.code}`} trigger={isNew ? "New coupon" : "Edit"} variant={isNew ? "primary" : "ghost"}>
      {(close) => (
        <ActionForm action={saveCouponAction} className="space-y-4" onSuccess={close}>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <Input name="code" label="Code" defaultValue={initial.code} required className="uppercase" hint="Customers type this at checkout. Letters, numbers, - and _." />
          <Textarea name="description" label="Internal description" rows={2} defaultValue={initial.description} />
          <Select name="type" label="Discount type" value={type} onChange={(e) => setType(e.target.value as CouponInitial["type"])}>
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
            <option value="FREE_SHIPPING">Free delivery</option>
          </Select>
          {type === "PERCENT" && (
            <div className="grid grid-cols-2 gap-3">
              <Input name="percent" type="number" min={1} max={100} label="Percent" defaultValue={initial.percent} required />
              <Input name="maxDiscount" label="Max discount ৳" defaultValue={initial.maxDiscount} hint="Optional cap" />
            </div>
          )}
          {type === "FIXED" && <Input name="fixedTaka" label="Amount off ৳" defaultValue={initial.fixedTaka} required />}
          <Input name="minSubtotal" label="Minimum order ৳" defaultValue={initial.minSubtotal} hint="Optional — before delivery" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="startsAt" type="date" label="Starts" defaultValue={initial.startsAt} />
            <Input name="endsAt" type="date" label="Ends (inclusive)" defaultValue={initial.endsAt} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="usageLimit" type="number" min={1} label="Total uses" defaultValue={initial.usageLimit} hint="Empty = unlimited" />
            <Input name="perCustomerLimit" type="number" min={1} label="Per customer" defaultValue={initial.perCustomerLimit} hint="By phone / account" />
          </div>
          <Select name="campaignId" label="Campaign" defaultValue={initial.campaignId}>
            <option value="">None</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Checkbox name="isActive" label="Active" defaultChecked={initial.isActive} />
          <SubmitButton full>Save coupon</SubmitButton>
        </ActionForm>
      )}
    </EditSheet>
  );
}
