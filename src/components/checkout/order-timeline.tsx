import type { OrderStatus } from "@prisma/client";
import { PROGRESS } from "@/modules/orders/status";
import { getT } from "@/i18n/server";
import { fmt } from "@/i18n/config";
import { formatDateTimeL } from "@/i18n/format";
import { cn } from "@/lib/utils";

export async function OrderTimeline({ status, history }: { status: OrderStatus; history: { toStatus: OrderStatus; createdAt: Date; note: string | null }[] }) {
  const { t, locale } = await getT();
  if (status === "CANCELLED" || status === "RETURNED") {
    return <p className="border-l-2 border-error pl-4 text-[15px] text-error">{fmt(t.order.cancelledOrReturned, { status: t.labels.orderStatus[status].toLowerCase() })}</p>;
  }
  const reached = PROGRESS.indexOf(status);
  const when = (s: OrderStatus) => history.find((h) => h.toStatus === s)?.createdAt;
  return (
    <ol className="grid grid-cols-5" aria-label={t.order.progress}>
      {PROGRESS.map((s, i) => {
        const done = i <= reached;
        const at = when(s);
        return (
          <li key={s} className="relative pr-2">
            <span className={cn("block h-px w-full", done ? "bg-burgundy" : "bg-burgundy/15")} aria-hidden />
            <span className={cn("absolute -top-[3px] left-0 size-[7px] rounded-full", done ? "bg-burgundy" : "bg-burgundy/20")} aria-hidden />
            <span className={cn("mt-4 block text-[11.5px] font-medium md:text-[13px]", done ? "text-burgundy" : "text-muted")}>{t.labels.orderStatus[s]}</span>
            {at && <span className="mt-0.5 hidden text-[11px] text-muted sm:block">{formatDateTimeL(at, locale)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
