import Image from "next/image";
import { notFound } from "next/navigation";
import { requirePermission } from "@/modules/auth/rbac";
import { getOrderForAdmin } from "@/modules/orders/admin-queries";
import { getSettings } from "@/modules/content/settings";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/modules/orders/status";
import { formatBDT } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { formatBDPhone } from "@/lib/phone";
import { PrintButton } from "@/components/admin/print-button";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("orders:manage");
  const { id } = await params;
  const [o, { store }] = await Promise.all([getOrderForAdmin(id), getSettings()]);
  if (!o) notFound();
  const due = o.paymentStatus === "PAID" ? 0 : o.total;
  return (
    <div className="mx-auto max-w-3xl bg-white text-[13.5px] text-charcoal shadow-sm print:shadow-none">
      <div className="no-print mb-4 flex justify-end"><PrintButton /></div>
      <header className="flex items-center justify-between bg-burgundy px-8 py-6 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
        <div className="w-[84px]"><Image src="/brand/ambr-logo-cream-720.png" alt="AMBR — Above Ordinary" width={720} height={612} className="h-auto w-full" /></div>
        <div className="text-right text-cream">
          <p className="font-serif text-2xl">Invoice</p>
          <p className="text-[12px] text-cream/80">{o.orderNumber}</p>
          <p className="text-[12px] text-cream/80">{formatDate(o.placedAt)}</p>
        </div>
      </header>
      <div className="grid gap-6 px-8 py-6 sm:grid-cols-2">
        <div>
          <p className="eyebrow mb-1 text-[10px] text-muted">Deliver to</p>
          <p className="font-medium">{o.customerName}</p>
          <p>{formatBDPhone(o.phone)}</p>
          <p>{o.addressLine}</p>
          <p>{[o.upazilaName, o.districtName].filter(Boolean).join(", ")}</p>
          {o.deliveryInstructions && <p className="mt-1 text-muted">Note: {o.deliveryInstructions}</p>}
        </div>
        <div className="sm:text-right">
          <p className="eyebrow mb-1 text-[10px] text-muted">From</p>
          <p className="font-medium">{store.legalName || "AMBR"}</p>
          {store.address && <p>{store.address}</p>}
          {store.phone && <p>{store.phone}</p>}
          {store.email && <p>{store.email}</p>}
          {store.tradeLicense && <p className="text-muted">Trade licence {store.tradeLicense}</p>}
        </div>
      </div>
      <table className="mx-8 mb-4 w-[calc(100%-4rem)] border-collapse">
        <thead>
          <tr className="border-b border-burgundy text-left text-[11px] uppercase tracking-[0.12em] text-muted">
            <th className="py-2">Item</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id} className="border-b border-beige">
              <td className="py-2">{i.productName} · {i.variantLabel}<div className="text-[11px] text-muted">{i.sku}</div></td>
              <td className="py-2 text-right tabular-nums">{formatBDT(i.unitPrice)}</td>
              <td className="py-2 text-right tabular-nums">{i.quantity}</td>
              <td className="py-2 text-right tabular-nums">{formatBDT(i.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mx-8 mb-6 ml-auto max-w-[260px] space-y-1 pr-8 sm:ml-auto">
        <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatBDT(o.subtotal)}</dd></div>
        {o.discountTotal > 0 && <div className="flex justify-between"><dt>Discount</dt><dd className="tabular-nums">−{formatBDT(o.discountTotal)}</dd></div>}
        <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{o.shippingFee ? formatBDT(o.shippingFee) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-burgundy pt-1 font-semibold text-burgundy"><dt>Total</dt><dd className="tabular-nums">{formatBDT(o.total)}</dd></div>
        <div className="flex justify-between text-[12.5px]"><dt>Payment</dt><dd>{PAYMENT_METHOD_LABEL[o.paymentMethod]} · {PAYMENT_STATUS_LABEL[o.paymentStatus]}</dd></div>
        <div className="flex justify-between font-semibold"><dt>Amount due</dt><dd className="tabular-nums">{formatBDT(due)}</dd></div>
      </dl>
      <footer className="border-t border-beige px-8 py-4 text-center text-[11.5px] text-muted">Thank you for choosing AMBR — Above Ordinary.</footer>
    </div>
  );
}
