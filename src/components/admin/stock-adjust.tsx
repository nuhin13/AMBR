"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ActionForm, SubmitButton } from "./action-form";
import { adjustStockAction } from "@/modules/inventory/admin-actions";

export function StockAdjustButton({ variantId, label, onHand, reserved }: { variantId: string; label: string; onHand: number; reserved: number }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("PURCHASE_IN");
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Adjust</Button>
      <Sheet open={open} onOpenChange={setOpen} side="right" title="Adjust stock" description={label}>
        <div className="p-5">
          <p className="mb-4 text-[13.5px] text-muted">On hand <strong className="text-charcoal">{onHand}</strong> · reserved for open orders <strong className="text-charcoal">{reserved}</strong> · sellable <strong className="text-charcoal">{Math.max(0, onHand - reserved)}</strong></p>
          <ActionForm action={adjustStockAction} className="space-y-4" onSuccess={() => setOpen(false)}>
            <input type="hidden" name="variantId" value={variantId} />
            <Select name="type" label="Type of change" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="PURCHASE_IN">Stock received (add)</option>
              <option value="ADJUSTMENT">Count correction</option>
              <option value="DAMAGE">Damaged / lost (remove)</option>
            </Select>
            {type === "ADJUSTMENT" ? (
              <Select name="mode" label="How" defaultValue="set">
                <option value="set">Set on-hand to exactly…</option>
                <option value="add">Add</option>
                <option value="remove">Remove</option>
              </Select>
            ) : (
              <input type="hidden" name="mode" value={type === "DAMAGE" ? "remove" : "add"} />
            )}
            <Input name="quantity" type="number" min={0} label="Quantity" required />
            <Input name="reason" label="Reason" required placeholder={type === "PURCHASE_IN" ? "e.g. Batch #12 from supplier" : type === "DAMAGE" ? "e.g. Broken in transit" : "e.g. Monthly stock count"} />
            <p className="text-[12px] text-muted">On-hand can&apos;t go below the quantity reserved for open orders.</p>
            <SubmitButton full>Save change</SubmitButton>
          </ActionForm>
        </div>
      </Sheet>
    </>
  );
}
