import Link from "next/link";
import type { ReactNode } from "react";
import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/modules/orders/status";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[12px] uppercase tracking-[0.14em] text-muted hover:text-burgundy">
            <ChevronLeft className="size-3.5" /> {back.label}
          </Link>
        )}
        <h1 className="text-[28px] md:text-[34px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("min-w-0 border border-beige bg-white", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-beige px-4 py-3 md:px-5">
          {title && <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-burgundy">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={padded ? "p-4 md:p-5" : undefined}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <div className="h-full border border-beige bg-white p-4 transition-colors md:p-5 [a:hover>&]:border-burgundy">
      <p className="eyebrow text-[10px] text-muted">{label}</p>
      <p className="mt-2 font-serif text-[26px] leading-none text-burgundy tabular-nums md:text-[32px]">{value}</p>
      {hint && <p className="mt-2 text-[12.5px] text-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto border border-beige bg-white", className)}>
      <table className="w-full min-w-[640px] border-collapse text-[13.5px]">{children}</table>
    </div>
  );
}
export function Th({ children, className, align }: { children?: ReactNode; className?: string; align?: "right" | "center" }) {
  return (
    <th className={cn("border-b border-beige bg-cream-light px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted", align === "right" && "text-right", align === "center" && "text-center", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className, align }: { children?: ReactNode; className?: string; align?: "right" | "center" }) {
  return <td className={cn("border-b border-beige/70 px-3 py-2.5 align-middle", align === "right" && "text-right tabular-nums", align === "center" && "text-center", className)}>{children}</td>;
}
export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-muted">{children}</td>
    </tr>
  );
}

const ORDER_TONE: Record<OrderStatus, "beige" | "burgundy" | "outline" | "success" | "error" | "gold" | "rose"> = {
  PENDING: "gold",
  CONFIRMED: "beige",
  PROCESSING: "beige",
  SHIPPED: "outline",
  DELIVERED: "success",
  CANCELLED: "error",
  RETURNED: "rose",
};
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
const PAY_TONE: Record<PaymentStatus, "beige" | "success" | "error" | "gold" | "outline" | "rose"> = {
  UNPAID: "outline",
  PENDING: "gold",
  PAID: "success",
  FAILED: "error",
  REFUNDED: "rose",
  PARTIALLY_REFUNDED: "rose",
};
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAY_TONE[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>;
}

/** Preserves current search params while changing the page. */
export function Pagination({ page, pages, total, params, basePath }: { page: number; pages: number; total: number; params: Record<string, string | undefined>; basePath: string }) {
  if (pages <= 1) return <p className="mt-3 text-[12.5px] text-muted">{total} result{total === 1 ? "" : "s"}</p>;
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    sp.set("page", String(p));
    return `${basePath}?${sp.toString()}`;
  };
  return (
    <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
      <span>{total} results · page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className="inline-flex items-center gap-1 border border-beige bg-white px-3 py-1.5 hover:border-burgundy"><ChevronLeft className="size-3.5" />Prev</Link>}
        {page < pages && <Link href={href(page + 1)} className="inline-flex items-center gap-1 border border-beige bg-white px-3 py-1.5 hover:border-burgundy">Next<ChevronRight className="size-3.5" /></Link>}
      </div>
    </div>
  );
}

/** GET filter form — filter state lives in the URL. */
export function FilterBar({ children, basePath, resetLabel = "Reset" }: { children: ReactNode; basePath: string; resetLabel?: string }) {
  return (
    <form method="get" action={basePath} className="mb-4 flex flex-wrap items-end gap-3 border border-beige bg-white p-3">
      {children}
      <div className="flex gap-2">
        <button type="submit" className="h-10 bg-burgundy px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-cream hover:bg-burgundy-deep">Apply</button>
        <Link href={basePath} className="flex h-10 items-center border border-beige px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy hover:border-burgundy">{resetLabel}</Link>
      </div>
    </form>
  );
}

export function FilterInput({ label, name, defaultValue, type = "text", placeholder, className }: { label: string; name: string; defaultValue?: string; type?: string; placeholder?: string; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted", className)}>
      {label}
      <input name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} className="h-10 min-w-[140px] border border-beige bg-white px-3 text-[14px] normal-case tracking-normal text-charcoal focus:border-burgundy focus:outline-none" />
    </label>
  );
}

export function FilterSelect({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
      {label}
      <select name={name} defaultValue={defaultValue ?? ""} className="h-10 min-w-[140px] border border-beige bg-white px-2 text-[14px] normal-case tracking-normal text-charcoal focus:border-burgundy focus:outline-none">
        <option value="">All</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function DefinitionList({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2 text-[13.5px]">
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
