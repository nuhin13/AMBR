"use client";

import { useState, useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import { ActionForm, SubmitButton } from "./action-form";
import { Select, Textarea, Input, Checkbox } from "@/components/ui/field";
import { changeOrderStatusAction, dispatchOrderAction, pathaoZonesAction } from "@/modules/orders/admin-actions";
import { cn } from "@/lib/utils";

const LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", PROCESSING: "Processing", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled", RETURNED: "Returned",
};

export function StatusControl({ orderId, options, blockers, hasEmail }: { orderId: string; options: OrderStatus[]; blockers: Partial<Record<OrderStatus, string>>; hasEmail: boolean }) {
  const [to, setTo] = useState<OrderStatus | "">(options[0] ?? "");
  if (options.length === 0) return <p className="text-[13px] text-muted">This order is closed — no further status changes are possible.</p>;
  const blocker = to ? blockers[to] : undefined;
  return (
    <ActionForm action={changeOrderStatusAction} className="space-y-3" success="Status updated" confirm={to === "CANCELLED" ? "Cancel this order? Reserved stock will be released." : undefined}>
      <input type="hidden" name="orderId" value={orderId} />
      <Select label="Move order to" name="to" value={to} onChange={(e) => setTo(e.target.value as OrderStatus)}>
        {options.map((s) => <option key={s} value={s}>{LABEL[s]}{blockers[s] ? " (blocked)" : ""}</option>)}
      </Select>
      {blocker && <p className="text-[13px] text-error">{blocker}</p>}
      {to === "SHIPPED" && <p className="text-[12.5px] text-muted">Tip: use “Book courier” below to record tracking and ship in one step. Shipping deducts stock from the shelf.</p>}
      {to === "RETURNED" && <Checkbox name="restock" defaultChecked label="Put the returned items back into sellable stock" />}
      <Textarea name="note" label="Note (optional)" rows={2} placeholder="e.g. Confirmed by phone with customer" />
      <Checkbox name="notify" defaultChecked={hasEmail} disabled={!hasEmail} label={hasEmail ? "Email the customer about this change" : "No email on this order — customer won't be emailed"} />
      <SubmitButton size="sm" disabled={Boolean(blocker)}>Update status</SubmitButton>
    </ActionForm>
  );
}

type Courier = "MANUAL" | "STEADFAST" | "PATHAO";

export function DispatchForm({ orderId, available, pathaoCities }: { orderId: string; available: Record<Courier, boolean>; pathaoCities: { city_id: number; city_name: string }[] }) {
  const [courier, setCourier] = useState<Courier>(available.STEADFAST ? "STEADFAST" : available.PATHAO ? "PATHAO" : "MANUAL");
  const [zones, setZones] = useState<{ zone_id: number; zone_name: string }[]>([]);
  const [loading, start] = useTransition();
  return (
    <ActionForm action={dispatchOrderAction} className="space-y-3" success="Shipment booked">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="courier" value={courier} />
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Courier">
        {(["STEADFAST", "PATHAO", "MANUAL"] as Courier[]).map((c) => (
          <button
            type="button"
            key={c}
            role="radio"
            aria-checked={courier === c}
            disabled={!available[c]}
            onClick={() => setCourier(c)}
            className={cn("border px-2 py-2 text-[12px] font-medium", courier === c ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white text-charcoal", !available[c] && "cursor-not-allowed opacity-40")}
            title={!available[c] ? "API keys not configured on the server" : undefined}
          >
            {c === "MANUAL" ? "Other / manual" : c === "STEADFAST" ? "Steadfast" : "Pathao"}
          </button>
        ))}
      </div>
      {(!available.STEADFAST || !available.PATHAO) && (
        <p className="text-[12px] text-muted">Greyed-out couriers need their API keys in the server environment (see doc/07-integrations).</p>
      )}
      {courier === "MANUAL" && (
        <>
          <Input name="courierName" label="Courier name" placeholder="e.g. RedX, Sundarban, own rider" />
          <Input name="trackingCode" label="Tracking / consignment number" />
          <Input name="trackingUrl" label="Tracking link (optional)" placeholder="https://…" />
        </>
      )}
      {courier === "STEADFAST" && <p className="text-[13px] text-muted">A Steadfast consignment will be created with the order’s address and cash-to-collect amount.</p>}
      {courier === "PATHAO" && (
        <>
          <Select
            name="cityId"
            label="Pathao city"
            defaultValue=""
            onChange={(e) => {
              const id = Number(e.target.value);
              setZones([]);
              if (id) start(async () => setZones(await pathaoZonesAction(id)));
            }}
          >
            <option value="">Choose city</option>
            {pathaoCities.map((c) => <option key={c.city_id} value={c.city_id}>{c.city_name}</option>)}
          </Select>
          <Select name="zoneId" label="Pathao zone" defaultValue="" disabled={loading || zones.length === 0}>
            <option value="">{loading ? "Loading zones…" : "Choose zone"}</option>
            {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
          </Select>
        </>
      )}
      <SubmitButton size="sm">Book courier & mark shipped</SubmitButton>
    </ActionForm>
  );
}
