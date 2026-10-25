import type { OrderStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { PROGRESS, STATUS_LABEL } from "@/modules/orders/status";
import { cn, formatDateTime } from "@/lib/utils";

export function OrderTimeline({ status, history }: { status: OrderStatus; history: { toStatus: OrderStatus; createdAt: Date; note: string | null }[] }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    const last = [...history].reverse().find((h) => h.toStatus === status);
    return (
      <div className="border border-error/30 bg-error/5 p-4 text-[14px]">
        <p className="font-medium text-error">This order was {STATUS_LABEL[status].toLowerCase()}.</p>
        {last?.note && <p className="mt-1 text-muted">{last.note}</p>}
      </div>
    );
  }
  const reached = PROGRESS.indexOf(status);
  const when = (s: OrderStatus) => history.find((h) => h.toStatus === s)?.createdAt;
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
      {PROGRESS.map((s, i) => {
        const done = i <= reached;
        const t = when(s);
        return (
          <li key={s} className="flex flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-px flex-1", i === 0 ? "bg-transparent" : i <= reached ? "bg-burgundy" : "bg-beige")} />
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px]", done ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white text-muted")}>
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              <span className={cn("h-px flex-1", i === PROGRESS.length - 1 ? "bg-transparent" : i < reached ? "bg-burgundy" : "bg-beige")} />
            </div>
            <span className={cn("mt-2 text-[11px] font-medium uppercase tracking-wider md:text-[12px]", done ? "text-burgundy" : "text-muted")}>{STATUS_LABEL[s]}</span>
            {t && <span className="mt-0.5 hidden text-[11px] text-muted sm:block">{formatDateTime(t)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
