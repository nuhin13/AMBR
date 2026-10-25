import { formatBDT } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({ amount, compareAt, from, className }: { amount: number; compareAt?: number | null; from?: boolean; className?: string }) {
  const sale = compareAt && compareAt > amount;
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
      {from && <span className="text-[0.8em] text-muted">from</span>}
      <span className={cn("font-medium tabular-nums text-burgundy", sale && "text-error")}>{formatBDT(amount)}</span>
      {sale && (
        <span className="text-[0.85em] tabular-nums text-muted line-through">
          <span className="sr-only">was </span>
          {formatBDT(compareAt)}
        </span>
      )}
    </span>
  );
}
